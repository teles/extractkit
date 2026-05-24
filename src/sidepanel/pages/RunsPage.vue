<script setup lang="ts">
import { ChevronDown, ChevronUp, Download, History, Plus, Search, SlidersHorizontal, Trash2 } from '@lucide/vue';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useBatchRuns } from '../../composables/useBatchRuns';
import { useExport } from '../../composables/useExport';
import { useRecipes } from '../../composables/useRecipes';
import { useRuns } from '../../composables/useRuns';
import { useSettings } from '../../composables/useSettings';
import { useToast } from '../../composables/useToast';
import { batchDisplayName } from '../../shared/batch-display';
import type { TranslationKey } from '../../shared/i18n';
import type { BatchRun, RecipeRun } from '../../shared/types';
import Badge from '../components/Badge.vue';
import Button from '../components/Button.vue';
import Card from '../components/Card.vue';
import EmptyState from '../components/EmptyState.vue';
import PageHeader from '../components/PageHeader.vue';
import RunCard from '../components/RunCard.vue';
import SegmentedControl from '../components/SegmentedControl.vue';

const { runs, loading, error, loadRuns, removeRun } = useRuns();
const { batchRuns, loadBatchRuns, removeBatchRun } = useBatchRuns();
const { recipes, loadRecipes } = useRecipes();
const { exporting, error: exportError, exportRuns } = useExport();
const { t, preferences } = useSettings();
const { success: toastSuccess, error: toastError } = useToast();
const router = useRouter();

const recipeFilter = ref('');
const domainFilter = ref('');
const urlFilter = ref('');
const viewMode = ref<'all' | 'batches'>('all');
const expandedBatchIds = ref<string[]>([]);

const viewModeOptions = computed<Array<{ value: 'all' | 'batches'; label: string }>>(() => [
  { value: 'all', label: t('batch.allRuns') },
  { value: 'batches', label: t('batch.batches') }
]);

const domains = computed(() => Array.from(new Set(runs.value.map((run) => run.domain))).sort());
const runsByBatchId = computed(() =>
  runs.value.reduce<Record<string, RecipeRun[]>>((groups, run) => {
    if (!run.batchId) {
      return groups;
    }

    groups[run.batchId] = [...(groups[run.batchId] ?? []), run];
    return groups;
  }, {})
);
const batchNamesById = computed(() =>
  batchRuns.value.reduce<Record<string, string>>((names, batch) => {
    names[batch.id] = displayBatchName(batch);
    return names;
  }, {})
);

const filteredRuns = computed(() =>
  runs.value.filter((run) => {
    const matchesRecipe = !recipeFilter.value || run.recipeId === recipeFilter.value;
    const matchesDomain = !domainFilter.value || run.domain === domainFilter.value;
    const matchesUrl = !urlFilter.value || run.url.toLowerCase().includes(urlFilter.value.toLowerCase());
    return matchesRecipe && matchesDomain && matchesUrl;
  })
);

onMounted(async () => {
  await Promise.all([loadRuns(), loadRecipes(), loadBatchRuns()]);
});

async function handleDelete(id: string): Promise<void> {
  if (!confirm(t('data.deleteConfirm'))) {
    return;
  }

  await removeRun(id);
}

async function exportAll(): Promise<void> {
  await exportRuns(runs.value, recipes.value, 'extractkit-all');
  if (exportError.value) {
    toastError(t('toast.exportFailed'), exportError.value);
  } else {
    toastSuccess(t('toast.exported'));
  }
}

async function exportRun(run: RecipeRun): Promise<void> {
  await exportRuns([run], recipes.value, `extractkit-${run.recipeName}`);
  if (exportError.value) {
    toastError(t('toast.exportFailed'), exportError.value);
  } else {
    toastSuccess(t('toast.exported'));
  }
}

async function exportBatch(batch: BatchRun): Promise<void> {
  const batchRunsToExport = runs.value.filter((run) => run.batchId === batch.id);
  await exportRuns(batchRunsToExport, recipes.value, `extractkit-${displayBatchName(batch)}`, [batch]);
  if (exportError.value) {
    toastError(t('toast.exportFailed'), exportError.value);
  } else {
    toastSuccess(t('toast.exported'));
  }
}

async function deleteBatch(batchId: string): Promise<void> {
  if (!confirm(t('batch.deleteConfirm'))) {
    return;
  }

  await removeBatchRun(batchId);
}

function toggleBatch(batchId: string): void {
  expandedBatchIds.value = expandedBatchIds.value.includes(batchId)
    ? expandedBatchIds.value.filter((id) => id !== batchId)
    : [...expandedBatchIds.value, batchId];
}

function isBatchExpanded(batchId: string): boolean {
  return expandedBatchIds.value.includes(batchId);
}

function batchVariant(status: BatchRun['status']): 'neutral' | 'success' | 'warning' | 'danger' | 'accent' {
  if (status === 'completed') {
    return 'success';
  }

  if (status === 'running') {
    return 'accent';
  }

  if (status === 'cancelled') {
    return 'warning';
  }

  if (status === 'failed') {
    return 'danger';
  }

  return 'neutral';
}

function batchStatusLabel(status: BatchRun['status']): string {
  return t(`batch.status.${status}` as TranslationKey);
}

function displayBatchName(batch: Pick<BatchRun, 'name' | 'createdAt'> | null | undefined): string {
  return batchDisplayName(batch, t('batch.batchRun'), preferences.value.locale);
}

function batchNameForRun(run: RecipeRun): string | undefined {
  if (!run.batchId) {
    return undefined;
  }

  return run.batchName?.trim() || batchNamesById.value[run.batchId] || t('batch.batchRun');
}

function formatDate(value: string | undefined): string {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat(preferences.value.locale, {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }

  const totalSeconds = Math.round(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) {
    return `${seconds}s`;
  }

  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

function batchDuration(batch: BatchRun): string {
  const end = batch.completedAt ? new Date(batch.completedAt).getTime() : Date.now();
  const start = new Date(batch.startedAt ?? batch.createdAt).getTime();
  return formatDuration(Math.max(0, end - start));
}

function createBatchRun(): void {
  router.push({ path: '/', query: { mode: 'batch' } });
}
</script>

<template>
  <section class="panel-stack">
    <PageHeader :title="t('data.title')" :meta="`${runs.length} ${t('data.saved')}`" :icon="History" icon-tone="brand">
      <template #actions>
        <Button size="xs" :disabled="exporting || runs.length === 0" @click="exportAll">
          <Download class="h-3.5 w-3.5" aria-hidden="true" />
          {{ t('data.exportAll') }}
        </Button>
      </template>
    </PageHeader>

    <SegmentedControl v-model="viewMode" :options="viewModeOptions" />

    <template v-if="viewMode === 'all'">
      <Card>
        <div class="mb-3 flex items-center gap-2 text-sm font-medium text-ink-500 dark:text-ink-300">
          <SlidersHorizontal class="h-4 w-4" :stroke-width="2.1" aria-hidden="true" />
          <span>{{ t('data.filters') }}</span>
        </div>

        <div class="grid gap-2 sm:grid-cols-2">
          <label class="grid gap-1">
            <span class="field-label">{{ t('data.recipe') }}</span>
            <select v-model="recipeFilter" class="input">
              <option value="">{{ t('common.all') }}</option>
              <option v-for="recipe in recipes" :key="recipe.id" :value="recipe.id">{{ recipe.name }}</option>
            </select>
          </label>

          <label class="grid gap-1">
            <span class="field-label">{{ t('data.domain') }}</span>
            <select v-model="domainFilter" class="input">
              <option value="">{{ t('common.all') }}</option>
              <option v-for="domain in domains" :key="domain" :value="domain">{{ domain }}</option>
            </select>
          </label>

          <label class="relative block sm:col-span-2">
            <span class="field-label mb-1 block">{{ t('data.url') }}</span>
            <Search class="pointer-events-none absolute left-3 top-[34px] h-4 w-4 text-ink-500" :stroke-width="2.1" aria-hidden="true" />
            <input v-model="urlFilter" class="input indent-5 pl-9 font-mono text-xs" :placeholder="t('data.filterUrl')" />
          </label>
        </div>
      </Card>

      <p v-if="error" class="rounded-md border border-coral-100 bg-coral-50 px-3 py-2 text-sm font-semibold text-coral-500 dark:border-coral-500/30 dark:bg-coral-500/10">{{ error }}</p>

      <EmptyState v-if="!loading && filteredRuns.length === 0" compact :title="t('data.emptyTitle')" :description="t('data.emptyDesc')" />

      <div class="space-y-2">
        <RunCard
          v-for="run in filteredRuns"
          :key="run.id"
          :run="run"
          :batch-name="batchNameForRun(run)"
          @export="exportRun"
          @delete="handleDelete"
        />
      </div>
    </template>

    <template v-else>
      <EmptyState
        v-if="batchRuns.length === 0"
        compact
        :title="t('batch.noBatches')"
        :description="t('batch.browsingNote')"
      >
        <template #action>
          <Button size="xs" @click="createBatchRun">
            <Plus class="h-3.5 w-3.5" aria-hidden="true" />
            {{ t('batch.createBatch') }}
          </Button>
        </template>
      </EmptyState>

      <div v-else class="space-y-2">
        <article
          v-for="batch in batchRuns"
          :key="batch.id"
          class="overflow-hidden rounded-lg border border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-950"
        >
          <div class="p-3">
            <div class="flex items-start justify-between gap-2">
              <button
                type="button"
                class="focus-ring -ml-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800"
                :aria-expanded="isBatchExpanded(batch.id)"
                @click="toggleBatch(batch.id)"
              >
                <ChevronUp v-if="isBatchExpanded(batch.id)" class="h-4 w-4" :stroke-width="2.2" aria-hidden="true" />
                <ChevronDown v-else class="h-4 w-4" :stroke-width="2.2" aria-hidden="true" />
              </button>

              <div class="min-w-0 flex-1">
                <div class="flex min-w-0 flex-wrap items-center gap-1.5">
                  <h2 class="min-w-0 flex-1 truncate text-sm font-semibold text-ink-900 dark:text-ink-50">{{ displayBatchName(batch) }}</h2>
                  <Badge :variant="batchVariant(batch.status)">{{ batchStatusLabel(batch.status) }}</Badge>
                  <Badge variant="neutral">{{ runsByBatchId[batch.id]?.length ?? 0 }} {{ t('data.saved') }}</Badge>
                </div>
                <div class="mt-2 flex flex-wrap gap-2 text-[11px] text-ink-500 dark:text-ink-300">
                  <span>{{ t('batch.created') }} {{ formatDate(batch.createdAt) }}</span>
                  <span v-if="batch.completedAt">{{ t('batch.completed') }} {{ formatDate(batch.completedAt) }}</span>
                  <span>{{ batch.urls.length }} {{ t('batch.urls') }}</span>
                  <span>{{ batch.recipeIds.length }} {{ t('batch.recipes') }}</span>
                  <span>{{ batch.totalPlannedRuns }} {{ t('batch.plannedRuns') }}</span>
                  <span>{{ batchDuration(batch) }}</span>
                </div>
                <div class="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant="success">{{ batch.successfulRuns }} {{ t('batch.successful') }}</Badge>
                  <Badge variant="warning">{{ batch.warningRuns }} {{ t('batch.warningRuns') }}</Badge>
                  <Badge variant="danger">{{ batch.failedRuns }} {{ t('batch.failedRuns') }}</Badge>
                  <Badge variant="neutral">{{ batch.skippedRuns }} {{ t('batch.skippedRuns') }}</Badge>
                </div>
              </div>
            </div>

            <div class="mt-3 flex flex-wrap gap-1.5">
              <Button size="xs" :disabled="exporting || (runsByBatchId[batch.id]?.length ?? 0) === 0" @click="exportBatch(batch)">
                <Download class="h-3.5 w-3.5" aria-hidden="true" />
                {{ t('batch.export') }}
              </Button>
              <Button size="xs" @click="viewMode = 'all'">{{ t('batch.viewRuns') }}</Button>
              <Button size="xs" variant="ghost" class="ml-auto text-coral-500 hover:bg-coral-50 hover:text-coral-500" @click="deleteBatch(batch.id)">
                <Trash2 class="h-3.5 w-3.5" aria-hidden="true" />
                {{ t('batch.delete') }}
              </Button>
            </div>
          </div>

          <div v-if="isBatchExpanded(batch.id)" class="space-y-2 border-t border-ink-200 bg-ink-50 p-3 dark:border-ink-700 dark:bg-ink-900">
            <RunCard
              v-for="run in (runsByBatchId[batch.id] ?? []).slice(0, 10)"
              :key="run.id"
              :run="run"
              :batch-name="displayBatchName(batch)"
              @export="exportRun"
              @delete="handleDelete"
            />
            <div v-if="(runsByBatchId[batch.id]?.length ?? 0) === 0" class="rounded-md border border-ink-200 bg-white p-3 text-sm text-ink-500 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-300">
              {{ t('data.emptyTitle') }}
            </div>
          </div>
        </article>
      </div>
    </template>
  </section>
</template>
