<script setup lang="ts">
import { Braces, Copy, Eye, FileText, Globe, Play, RefreshCcw, Save } from '@lucide/vue';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useCurrentTab } from '../../composables/useCurrentTab';
import { useRecipes } from '../../composables/useRecipes';
import { useRuns } from '../../composables/useRuns';
import { useScraperRunner } from '../../composables/useScraperRunner';
import { useSettings } from '../../composables/useSettings';
import { useToast } from '../../composables/useToast';
import type { TranslationKey } from '../../shared/i18n';
import type { Recipe, RecipeRun } from '../../shared/types';
import { matchUrlPattern } from '../../shared/url-pattern';
import Badge from '../components/Badge.vue';
import BatchRunPanel from '../components/BatchRunPanel.vue';
import Button from '../components/Button.vue';
import Card from '../components/Card.vue';
import ChecksSummary from '../components/ChecksSummary.vue';
import EmptyState from '../components/EmptyState.vue';
import IconBadge from '../components/IconBadge.vue';
import JsonPreview from '../components/JsonPreview.vue';
import PageHeader from '../components/PageHeader.vue';
import SegmentedControl from '../components/SegmentedControl.vue';
import StatusBadge from '../components/StatusBadge.vue';
import ValidationSummary from '../components/ValidationSummary.vue';

type RunMode = 'single' | 'batch';

const { currentTab, loading: tabLoading, error: tabError, refreshCurrentTab } = useCurrentTab();
const { recipes, loading: recipesLoading, error: recipesError, loadRecipes } = useRecipes();
const { saveRun } = useRuns();
const { running, error: runnerError, runRecipe } = useScraperRunner();
const { t } = useSettings();
const { success: toastSuccess, error: toastError } = useToast();
const route = useRoute();

const selectedRecipeIds = ref<string[]>([]);
const latestRuns = ref<RecipeRun[]>([]);
const expandedRunIds = ref<Set<string>>(new Set());
const runMode = ref<RunMode>('single');

const runModeOptions = computed<Array<{ value: RunMode; label: string }>>(() => [
  { value: 'single', label: t('batch.single') },
  { value: 'batch', label: t('batch.batch') }
]);

const compatibleRecipes = computed(() =>
  recipes.value.filter((recipe) => matchUrlPattern(currentTab.value?.url, recipe.urlPatterns))
);

const selectedRecipes = computed<Recipe[]>(
  () => compatibleRecipes.value.filter((r) => selectedRecipeIds.value.includes(r.id))
);

const currentUrl = computed(() => currentTab.value?.url ?? '');

const currentDomain = computed(() => {
  if (!currentTab.value?.url) {
    return '—';
  }

  try {
    return new URL(currentTab.value.url).hostname;
  } catch {
    return '—';
  }
});

watch(
  compatibleRecipes,
  (nextRecipes) => {
    const validIds = new Set(nextRecipes.map((r) => r.id));
    const filtered = selectedRecipeIds.value.filter((id) => validIds.has(id));
    if (filtered.length === 0 && nextRecipes.length > 0) {
      selectedRecipeIds.value = [nextRecipes[0].id];
    } else {
      selectedRecipeIds.value = filtered;
    }
  },
  { immediate: true }
);

function toggleRecipeSelection(id: string, checked: boolean): void {
  selectedRecipeIds.value = checked
    ? Array.from(new Set([...selectedRecipeIds.value, id]))
    : selectedRecipeIds.value.filter((rid) => rid !== id);
}

watch(
  () => route.query.mode,
  (mode) => {
    if (mode === 'batch') {
      runMode.value = 'batch';
    }
  },
  { immediate: true }
);

onMounted(async () => {
  await Promise.all([refreshCurrentTab(), loadRecipes()]);
});

async function executeRecipe(): Promise<void> {
  if (selectedRecipes.value.length === 0) {
    return;
  }

  expandedRunIds.value = new Set();
  latestRuns.value = [];

  for (const recipe of selectedRecipes.value) {
    const run = await runRecipe(recipe, currentTab.value?.url);
    if (run) {
      latestRuns.value = [...latestRuns.value, run];
    }
  }
}

async function persistRun(run: RecipeRun): Promise<void> {
  await saveRun(run);
  toastSuccess(t('home.resultSaved'));
}

async function copyRunJson(run: RecipeRun): Promise<void> {
  try {
    await navigator.clipboard.writeText(JSON.stringify(run.data, null, 2));
    toastSuccess(t('home.jsonCopied'));
  } catch {
    toastError(t('home.copyError'));
  }
}

function toggleRunDetails(runId: string): void {
  const next = new Set(expandedRunIds.value);
  if (next.has(runId)) {
    next.delete(runId);
  } else {
    next.add(runId);
  }
  expandedRunIds.value = next;
}

function getRunItemCount(run: RecipeRun): number | null {
  const data = run.data;
  if (Array.isArray(data)) {
    return data.length;
  }
  if (data && typeof data === 'object') {
    const arrayValues = Object.values(data as Record<string, unknown>).filter(Array.isArray);
    if (arrayValues.length === 1) {
      return (arrayValues[0] as unknown[]).length;
    }
  }
  return null;
}

function countRecipeFields(recipe: Recipe): number {
  return recipe.fields.reduce((total, field) => total + (field.kind === 'group' ? field.fields.length + 1 : 1), 0);
}

function formatDuration(milliseconds: number): string {
  if (milliseconds >= 1000) {
    return `${(milliseconds / 1000).toFixed(1)}s`;
  }

  return `${milliseconds}ms`;
}
</script>

<template>
  <section class="panel-stack">
    <PageHeader :title="t('home.title')" :description="t('home.description')" :icon="Play" icon-tone="brand">
      <template #actions>
        <Button size="xs" :disabled="tabLoading || recipesLoading" @click="refreshCurrentTab">
          <RefreshCcw class="h-3.5 w-3.5" aria-hidden="true" />
          {{ t('home.refresh') }}
        </Button>
      </template>
    </PageHeader>

    <SegmentedControl v-model="runMode" :options="runModeOptions" />

    <template v-if="runMode === 'single'">
      <div v-if="tabError" class="rounded-md border border-amberline-100 bg-amberline-50 px-3 py-2 text-sm font-semibold text-amberline-500 dark:border-amberline-500/30 dark:bg-amberline-500/15">
        {{ tabError }}
      </div>

      <Card>
        <div class="flex items-start justify-between gap-3">
          <div class="flex min-w-0 items-center gap-2">
            <IconBadge :icon="Globe" tone="neutral" />
            <h2 class="text-base font-semibold text-ink-900 dark:text-ink-50">{{ t('home.currentPage') }}</h2>
          </div>
          <Badge v-if="currentTab" variant="primary" size="sm">{{ t('home.active') }}</Badge>
        </div>

        <div class="mt-4 grid gap-3">
          <div>
            <p class="field-label">{{ t('data.domain') }}</p>
            <p class="mt-1 truncate text-sm font-semibold text-ink-900 dark:text-ink-50">{{ currentDomain }}</p>
          </div>
          <div>
            <p class="field-label">{{ t('data.url') }}</p>
            <p class="mt-1 truncate rounded-md border border-ink-200 bg-ink-100 px-2.5 py-2 font-mono text-xs text-ink-700 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100">
              {{ currentUrl || '—' }}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <div class="mb-2 flex items-start justify-between gap-3">
          <div class="flex min-w-0 items-center gap-2">
            <IconBadge :icon="FileText" tone="brand" />
            <div>
              <h2 class="text-base font-semibold text-ink-900 dark:text-ink-50">{{ t('home.compatibleRecipe') }}</h2>
              <p class="mt-1 text-xs text-ink-500 dark:text-ink-300">{{ compatibleRecipes.length }} {{ t('home.compatibleCount') }}</p>
            </div>
          </div>
          <Badge variant="neutral" size="sm">{{ compatibleRecipes.length }}</Badge>
        </div>

        <div v-if="compatibleRecipes.length > 0" class="space-y-1.5">
          <label
            v-for="recipe in compatibleRecipes"
            :key="recipe.id"
            class="flex cursor-pointer items-start gap-2 rounded-lg border border-ink-200 bg-white p-2 transition hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-950 dark:hover:bg-ink-900"
          >
            <input
              class="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-600"
              type="checkbox"
              :checked="selectedRecipeIds.includes(recipe.id)"
              @change="toggleRecipeSelection(recipe.id, ($event.target as HTMLInputElement).checked)"
            />
            <div class="min-w-0 flex-1">
              <div class="flex min-w-0 items-center gap-1.5">
                <p class="truncate text-sm font-semibold text-ink-900 dark:text-ink-50">{{ recipe.name }}</p>
                <Badge variant="neutral">v{{ recipe.version }}</Badge>
              </div>
              <div class="mt-1 flex flex-wrap gap-1">
                <Badge variant="category">{{ t(`recipe.category.${recipe.category}` as TranslationKey) }}</Badge>
                <Badge variant="neutral">{{ countRecipeFields(recipe) }} {{ t('home.fields') }}</Badge>
              </div>
            </div>
          </label>
        </div>

        <EmptyState
          v-else
          compact
          :title="t('home.noCompatibleTitle')"
          :description="t('home.noCompatibleDesc')"
        />

        <p v-if="recipesError" class="mt-3 text-sm font-semibold text-coral-500">{{ recipesError }}</p>

        <div class="mt-3 grid gap-2">
          <Button variant="primary" block :disabled="running || selectedRecipes.length === 0" @click="executeRecipe">
            <Play class="h-3.5 w-3.5" aria-hidden="true" />
            {{ running ? t('home.running') : t('home.runRecipe') }}
          </Button>
        </div>

        <p v-if="runnerError" class="mt-3 rounded-md border border-coral-100 bg-coral-50 px-3 py-2 text-sm font-semibold text-coral-500 dark:border-coral-500/30 dark:bg-coral-500/10">
          {{ runnerError }}
        </p>
      </Card>

      <template v-if="latestRuns.length > 0">
        <Card v-for="run in latestRuns" :key="run.id" compact>
          <div class="mb-3 grid gap-3">
            <div class="flex min-w-0 items-center gap-2">
              <IconBadge :icon="Braces" tone="neutral" />
              <h2 class="min-w-0 flex-1 truncate text-base font-semibold text-ink-900 dark:text-ink-50">{{ run.recipeName }}</h2>
            </div>
            <div class="flex w-full flex-wrap gap-1.5">
              <Button size="xs" variant="primary" @click="persistRun(run)">
                <Save class="h-3.5 w-3.5" aria-hidden="true" />
                {{ t('home.save') }}
              </Button>
              <Button size="xs" @click="copyRunJson(run)">
                <Copy class="h-3.5 w-3.5" aria-hidden="true" />
                {{ t('home.copyJson') }}
              </Button>
              <Button size="xs" variant="ghost" @click="toggleRunDetails(run.id)">
                <Eye class="h-3.5 w-3.5" aria-hidden="true" />
                {{ expandedRunIds.has(run.id) ? t('home.viewData') : t('home.viewDetails') }}
              </Button>
            </div>
          </div>

          <div class="mb-3 flex flex-wrap items-center gap-2 text-xs text-ink-500 dark:text-ink-300">
            <StatusBadge :status="run.status" />
            <span>{{ formatDuration(run.durationMs) }}</span>
            <span v-if="getRunItemCount(run) !== null">{{ getRunItemCount(run) }} {{ t('home.items') }}</span>
            <ValidationSummary compact :validation="run.validation" />
            <Badge v-if="run.warnings.length > 0" variant="warning">{{ run.warnings.length }} {{ t('home.warnings') }}</Badge>
            <Badge v-if="run.errors.length > 0" variant="danger">{{ run.errors.length }} {{ t('home.errors') }}</Badge>
          </div>

          <ChecksSummary
            class="mb-2"
            :checks="run.checks"
            :show-all-results="expandedRunIds.has(run.id)"
            :expandable="expandedRunIds.has(run.id)"
          />

          <div v-if="expandedRunIds.has(run.id)" class="mb-2">
            <ValidationSummary :validation="run.validation" />
          </div>

          <div v-if="expandedRunIds.has(run.id) && run.warnings.length > 0" class="mb-2 rounded-md border border-amberline-100 bg-amberline-50 px-3 py-2 dark:border-amberline-500/30 dark:bg-amberline-500/15">
            <h3 class="text-xs font-bold text-amberline-500">{{ t('home.warnings') }}</h3>
            <ul class="mt-1 space-y-1 text-xs text-ink-700 dark:text-ink-50">
              <li v-for="warning in run.warnings" :key="`${warning.field}-${warning.message}`">
                <strong>{{ warning.field }}:</strong> {{ warning.message }}
              </li>
            </ul>
          </div>

          <div v-if="expandedRunIds.has(run.id) && run.errors.length > 0" class="mb-2 rounded-md border border-coral-100 bg-coral-50 px-3 py-2 dark:border-coral-500/30 dark:bg-coral-500/10">
            <h3 class="text-xs font-bold text-coral-500">{{ t('home.errors') }}</h3>
            <ul class="mt-1 space-y-1 text-xs text-ink-700 dark:text-ink-50">
              <li v-for="error in run.errors" :key="`${error.field ?? 'run'}-${error.message}`">
                <strong>{{ error.field ?? t('home.runField') }}:</strong> {{ error.message }}
              </li>
            </ul>
          </div>

          <JsonPreview :value="expandedRunIds.has(run.id) ? run : run.data" />
        </Card>
      </template>

      <EmptyState v-else compact :title="t('home.readyTitle')" :description="t('home.readyDesc')" />
    </template>

    <BatchRunPanel v-else :recipes="recipes" />
  </section>
</template>
