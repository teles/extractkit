<script setup lang="ts">
import {
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  ExternalLink,
  ListChecks,
  Play,
  RotateCcw,
  Square,
  Trash2
} from '@lucide/vue';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useBatchRuns } from '../../composables/useBatchRuns';
import { useExport } from '../../composables/useExport';
import { useRuns } from '../../composables/useRuns';
import { useSettings } from '../../composables/useSettings';
import { useToast } from '../../composables/useToast';
import { batchDisplayName } from '../../shared/batch-display';
import {
  createBatchPlan,
  DEFAULT_BATCH_RUN_OPTIONS,
  normalizeUrlInput
} from '../../shared/batch-planner';
import type { TranslationKey } from '../../shared/i18n';
import type { BatchRun, BatchRunEvent, BatchRunOptions, Recipe, RecipeCategory } from '../../shared/types';
import Badge from './Badge.vue';
import Button from './Button.vue';
import Card from './Card.vue';

const props = defineProps<{
  recipes: Recipe[];
}>();

const router = useRouter();
const { t, preferences } = useSettings();
const { success: toastSuccess, error: toastError } = useToast();
const { batchRuns, error, running, loadBatchRuns, startBatchRun, stopBatchRun, viewProcessingTab } = useBatchRuns();
const { runs, loadRuns } = useRuns();
const { exporting, error: exportError, exportRuns } = useExport();

const batchName = ref('');
const urlsText = ref('');
const selectedRecipeIds = ref<string[]>([]);
const advancedOpen = ref(false);
const activeBatchId = ref<string | null>(null);
const options = ref<BatchRunOptions>({ ...DEFAULT_BATCH_RUN_OPTIONS });

let pollingId: number | undefined;

const urlInput = computed(() => normalizeUrlInput(urlsText.value));
const selectedRecipes = computed(() => props.recipes.filter((recipe) => selectedRecipeIds.value.includes(recipe.id)));
const plan = computed(() => createBatchPlan(urlInput.value.validUrls, selectedRecipes.value, options.value));
const activeBatch = computed(() => batchRuns.value.find((batch) => batch.id === activeBatchId.value) ?? null);
const runningBatch = computed(() => batchRuns.value.find((batch) => batch.status === 'running') ?? null);
const currentEvent = computed(() => {
  const events = activeBatch.value?.events ?? [];
  return [...events].reverse().find((event) => event.status === 'running') ?? null;
});
const recentEvents = computed(() => [...(activeBatch.value?.events ?? [])].reverse().slice(0, 6));
const batchRunsForExport = computed(() =>
  activeBatch.value ? runs.value.filter((run) => run.batchId === activeBatch.value?.id) : []
);
const progressPercent = computed(() => {
  const batch = activeBatch.value;
  if (!batch || batch.totalPlannedRuns === 0) {
    return 0;
  }

  return Math.min(100, Math.round((batch.completedRuns / batch.totalPlannedRuns) * 100));
});
const hasProcessingTabClosed = computed(
  () => activeBatch.value?.events.some((event) => event.message === 'Processing tab was closed') ?? false
);
const canStart = computed(
  () =>
    urlInput.value.validUrls.length > 0 &&
    selectedRecipes.value.length > 0 &&
    plan.value.totalPlannedRuns > 0 &&
    !running.value
);

const delaySeconds = computed({
  get: () => Math.round(options.value.delayBetweenUrlsMs / 1000),
  set: (value: number) => {
    options.value.delayBetweenUrlsMs = Math.max(0, value) * 1000;
  }
});
const pageLoadTimeoutSeconds = computed({
  get: () => Math.round(options.value.pageLoadTimeoutMs / 1000),
  set: (value: number) => {
    options.value.pageLoadTimeoutMs = Math.max(1, value) * 1000;
  }
});
const waitAfterLoadSeconds = computed({
  get: () => Math.round(options.value.waitAfterLoadMs / 1000),
  set: (value: number) => {
    options.value.waitAfterLoadMs = Math.max(0, value) * 1000;
  }
});

const urlErrorOptions: Array<{ value: BatchRunOptions['onUrlError']; labelKey: TranslationKey }> = [
  { value: 'retryThenSkip', labelKey: 'batch.onUrlError.retryThenSkip' },
  { value: 'skip', labelKey: 'batch.onUrlError.skip' },
  { value: 'stop', labelKey: 'batch.onUrlError.stop' }
];
const recipeErrorOptions: Array<{ value: BatchRunOptions['onRecipeError']; labelKey: TranslationKey }> = [
  { value: 'continue', labelKey: 'batch.onRecipeError.continue' },
  { value: 'skipRecipe', labelKey: 'batch.onRecipeError.skipRecipe' },
  { value: 'stop', labelKey: 'batch.onRecipeError.stop' }
];

onMounted(async () => {
  await loadBatchRuns();
  activeBatchId.value = runningBatch.value?.id ?? null;
  pollingId = window.setInterval(loadBatchRuns, 1500);
});

onUnmounted(() => {
  if (pollingId) {
    window.clearInterval(pollingId);
  }
});

function countRecipeFields(recipe: Recipe): number {
  return recipe.fields.reduce((total, field) => total + (field.kind === 'group' ? field.fields.length + 1 : 1), 0);
}

function categoryLabel(category: RecipeCategory): string {
  return t(`recipe.category.${category}` as TranslationKey);
}

function patternSummary(recipe: Recipe): string {
  if (recipe.urlPatterns.length === 1 && recipe.urlPatterns[0] === '*') {
    return t('recipes.allWebsites');
  }

  return recipe.urlPatterns[0] ?? '*';
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

function displayBatchName(batch: Pick<BatchRun, 'name' | 'createdAt'> | null | undefined): string {
  return batchDisplayName(batch, t('batch.batchRun'), preferences.value.locale);
}

function eventDuration(event: BatchRunEvent): string | null {
  if (!event.startedAt || !event.completedAt) {
    return null;
  }

  return formatDuration(new Date(event.completedAt).getTime() - new Date(event.startedAt).getTime());
}

function eventVariant(event: BatchRunEvent): 'neutral' | 'success' | 'warning' | 'danger' | 'accent' {
  if (event.status === 'success') {
    return 'success';
  }

  if (event.status === 'warning') {
    return 'warning';
  }

  if (event.status === 'failed') {
    return 'danger';
  }

  if (event.status === 'running') {
    return 'accent';
  }

  return 'neutral';
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

function toggleRecipe(recipeId: string, checked: boolean): void {
  selectedRecipeIds.value = checked
    ? Array.from(new Set([...selectedRecipeIds.value, recipeId]))
    : selectedRecipeIds.value.filter((id) => id !== recipeId);
}

async function pasteUrls(): Promise<void> {
  try {
    const pastedText = await navigator.clipboard.readText();
    urlsText.value = [urlsText.value.trim(), pastedText.trim()].filter(Boolean).join('\n');
  } catch {
    toastError(t('home.copyError'));
  }
}

function removeDuplicates(): void {
  const normalized = normalizeUrlInput(urlsText.value);
  urlsText.value = [...normalized.validUrls, ...normalized.invalidUrls].join('\n');
}

function clearUrls(): void {
  urlsText.value = '';
}

async function start(): Promise<void> {
  const batch = await startBatchRun({
    name: batchName.value,
    urls: urlInput.value.validUrls,
    recipes: selectedRecipes.value,
    options: options.value
  });

  if (!batch) {
    if (error.value) {
      toastError(t('batch.batchRun'), error.value);
    }
    return;
  }

  activeBatchId.value = batch.id;
  toastSuccess(t('batch.running'));
}

async function stop(): Promise<void> {
  if (!activeBatch.value) {
    return;
  }

  await stopBatchRun(activeBatch.value.id);
}

async function exportBatch(): Promise<void> {
  if (!activeBatch.value) {
    return;
  }

  await loadRuns();
  await exportRuns(batchRunsForExport.value, props.recipes, `extractkit-${displayBatchName(activeBatch.value)}`, [
    activeBatch.value
  ]);
  if (exportError.value) {
    toastError(t('toast.exportFailed'), exportError.value);
  } else {
    toastSuccess(t('toast.exported'));
  }
}

function viewRuns(): void {
  router.push('/runs');
}

function startNewBatch(): void {
  activeBatchId.value = null;
  batchName.value = '';
}

function runStatusLabel(batch: BatchRun): string {
  return t(`batch.status.${batch.status}` as TranslationKey);
}
</script>

<template>
  <div class="space-y-3">
    <template v-if="activeBatch?.status === 'running'">
      <div class="rounded-md border border-amberline-100 bg-amberline-50 px-3 py-2 text-sm text-amberline-600 dark:border-amberline-500/30 dark:bg-amberline-500/15 dark:text-amberline-100">
        <div class="flex items-start gap-2">
          <AlertTriangle class="mt-0.5 h-4 w-4 shrink-0" :stroke-width="2.1" aria-hidden="true" />
          <p><strong>{{ t('batch.keepTabOpen') }}</strong> {{ t('batch.browsingNote') }}</p>
        </div>
      </div>

      <Card>
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="field-label">{{ t('batch.running') }}</p>
            <h2 class="truncate text-lg font-semibold text-ink-900 dark:text-ink-50">{{ displayBatchName(activeBatch) }}</h2>
          </div>
          <Badge variant="primary" size="sm">{{ progressPercent }}%</Badge>
        </div>

        <div class="mt-4 h-2 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
          <div class="h-full rounded-full bg-brand-600 transition-all" :style="{ width: `${progressPercent}%` }" />
        </div>

        <div class="mt-4 grid grid-cols-4 gap-2 text-center">
          <div>
            <p class="field-label">{{ t('batch.plannedRuns') }}</p>
            <p class="text-sm font-semibold text-ink-900 dark:text-ink-50">{{ activeBatch.completedRuns }} / {{ activeBatch.totalPlannedRuns }}</p>
          </div>
          <div>
            <p class="field-label">{{ t('batch.successful') }}</p>
            <p class="text-sm font-semibold text-success-500">{{ activeBatch.successfulRuns }}</p>
          </div>
          <div>
            <p class="field-label">{{ t('batch.warningRuns') }}</p>
            <p class="text-sm font-semibold text-amberline-500">{{ activeBatch.warningRuns }}</p>
          </div>
          <div>
            <p class="field-label">{{ t('batch.failedRuns') }}</p>
            <p class="text-sm font-semibold text-coral-500">{{ activeBatch.failedRuns }}</p>
          </div>
        </div>

        <div class="mt-4 grid gap-2">
          <div>
            <p class="field-label">{{ t('batch.currentUrl') }}</p>
            <p class="meta-line mt-1 truncate rounded-md border border-ink-200 bg-ink-100 px-2.5 py-2 dark:border-ink-700 dark:bg-ink-800">
              {{ currentEvent?.url ?? activeBatch.urls[0] }}
            </p>
          </div>
          <div>
            <p class="field-label">{{ t('batch.currentRecipe') }}</p>
            <p class="mt-1 text-sm font-semibold text-ink-900 dark:text-ink-50">{{ currentEvent?.recipeName ?? '—' }}</p>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <Button size="xs" @click="viewProcessingTab(activeBatch.id)">
            <ExternalLink class="h-3.5 w-3.5" aria-hidden="true" />
            {{ t('batch.viewProcessingTab') }}
          </Button>
          <Button size="xs" variant="danger" @click="stop">
            <Square class="h-3.5 w-3.5" aria-hidden="true" />
            {{ t('batch.stop') }}
          </Button>
        </div>
      </Card>

      <Card compact>
        <p class="field-label">{{ t('batch.recentEvents') }}</p>
        <ul class="mt-2 divide-y divide-ink-200 dark:divide-ink-700">
          <li v-for="event in recentEvents" :key="event.id" class="flex items-start gap-2 py-2">
            <Badge :variant="eventVariant(event)">{{ event.status }}</Badge>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-ink-900 dark:text-ink-50">{{ event.recipeName ?? event.message ?? t('batch.batchRun') }}</p>
              <p class="meta-line mt-0.5 truncate">{{ event.url }}</p>
            </div>
            <span v-if="eventDuration(event)" class="text-xs text-ink-500 dark:text-ink-300">{{ eventDuration(event) }}</span>
          </li>
        </ul>
      </Card>
    </template>

    <template v-else-if="activeBatch">
      <Card>
        <div class="text-center">
          <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-600/15 dark:text-brand-400">
            <CheckCircle2 v-if="activeBatch.status === 'completed'" class="h-7 w-7" :stroke-width="2.2" aria-hidden="true" />
            <AlertTriangle v-else class="h-7 w-7" :stroke-width="2.2" aria-hidden="true" />
          </div>
          <h2 class="mt-3 text-lg font-semibold text-ink-900 dark:text-ink-50">
            {{ activeBatch.status === 'completed' ? t('batch.complete') : activeBatch.status === 'cancelled' ? t('batch.cancelled') : runStatusLabel(activeBatch) }}
          </h2>
          <p class="mt-1 text-sm text-ink-500 dark:text-ink-300">{{ displayBatchName(activeBatch) }}</p>
          <Badge class="mt-3" :variant="batchVariant(activeBatch.status)">{{ runStatusLabel(activeBatch) }}</Badge>
        </div>

        <div v-if="hasProcessingTabClosed" class="mt-4 rounded-md border border-coral-100 bg-coral-50 px-3 py-2 text-sm font-medium text-coral-500 dark:border-coral-500/30 dark:bg-coral-500/10">
          {{ t('batch.processingTabClosed') }}
        </div>

        <div class="mt-4 grid grid-cols-2 gap-2">
          <div class="rounded-md border border-ink-200 bg-ink-50 p-3 dark:border-ink-700 dark:bg-ink-900">
            <p class="field-label">{{ t('batch.plannedRuns') }}</p>
            <p class="mt-1 text-lg font-semibold text-ink-900 dark:text-ink-50">{{ activeBatch.totalPlannedRuns }}</p>
          </div>
          <div class="rounded-md border border-ink-200 bg-ink-50 p-3 dark:border-ink-700 dark:bg-ink-900">
            <p class="field-label">{{ t('batch.duration') }}</p>
            <p class="mt-1 text-lg font-semibold text-ink-900 dark:text-ink-50">{{ batchDuration(activeBatch) }}</p>
          </div>
          <div class="rounded-md border border-success-500/20 bg-success-50 p-3 dark:bg-success-500/15">
            <p class="field-label text-success-500">{{ t('batch.successful') }}</p>
            <p class="mt-1 text-lg font-semibold text-success-500">{{ activeBatch.successfulRuns }}</p>
          </div>
          <div class="rounded-md border border-amberline-100 bg-amberline-50 p-3 dark:border-amberline-500/30 dark:bg-amberline-500/15">
            <p class="field-label text-amberline-500">{{ t('batch.warningRuns') }}</p>
            <p class="mt-1 text-lg font-semibold text-amberline-500">{{ activeBatch.warningRuns }}</p>
          </div>
          <div class="rounded-md border border-coral-100 bg-coral-50 p-3 dark:border-coral-500/30 dark:bg-coral-500/10">
            <p class="field-label text-coral-500">{{ t('batch.failedRuns') }}</p>
            <p class="mt-1 text-lg font-semibold text-coral-500">{{ activeBatch.failedRuns }}</p>
          </div>
          <div class="rounded-md border border-ink-200 bg-ink-50 p-3 dark:border-ink-700 dark:bg-ink-900">
            <p class="field-label">{{ t('batch.skippedRuns') }}</p>
            <p class="mt-1 text-lg font-semibold text-ink-900 dark:text-ink-50">{{ activeBatch.skippedRuns }}</p>
          </div>
        </div>

        <div class="mt-4 grid gap-2">
          <Button variant="primary" :disabled="exporting" @click="exportBatch">
            {{ t('batch.export') }}
          </Button>
          <div class="grid grid-cols-2 gap-2">
            <Button @click="startNewBatch">
              <RotateCcw class="h-3.5 w-3.5" aria-hidden="true" />
              {{ t('batch.startNew') }}
            </Button>
            <Button @click="viewRuns">{{ t('batch.viewRuns') }}</Button>
          </div>
        </div>
      </Card>
    </template>

    <template v-else>
      <Card>
        <label class="grid gap-1">
          <span class="field-label">{{ t('batch.name') }}</span>
          <input v-model="batchName" class="input" :placeholder="t('batch.namePlaceholder')" />
        </label>
      </Card>

      <Card>
        <div class="mb-2 flex items-center justify-between gap-2">
          <label class="field-label" for="batch-urls">{{ t('batch.urls') }}</label>
          <div class="flex gap-1">
            <Button size="xs" variant="ghost" @click="pasteUrls">
              <Clipboard class="h-3.5 w-3.5" aria-hidden="true" />
              {{ t('batch.paste') }}
            </Button>
          </div>
        </div>
        <textarea
          id="batch-urls"
          v-model="urlsText"
          class="input min-h-36 resize-y font-mono text-xs"
          :placeholder="t('batch.urlsPlaceholder')"
        />
        <div class="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge variant="success">{{ urlInput.validUrls.length }} {{ t('batch.validUrls') }}</Badge>
          <Badge :variant="urlInput.invalidUrls.length > 0 ? 'danger' : 'neutral'">
            {{ urlInput.invalidUrls.length }} {{ t('batch.invalidUrls') }}
          </Badge>
          <Badge v-if="urlInput.duplicateCount > 0" variant="neutral">
            {{ urlInput.duplicateCount }} {{ t('batch.duplicatesRemoved') }}
          </Badge>
        </div>
        <ul v-if="urlInput.invalidUrls.length > 0" class="mt-2 space-y-1 text-xs text-coral-500">
          <li v-for="url in urlInput.invalidUrls.slice(0, 3)" :key="url" class="truncate font-mono">{{ url }}</li>
        </ul>
        <div class="mt-3 flex flex-wrap gap-2">
          <Button size="xs" @click="removeDuplicates">{{ t('batch.removeDuplicates') }}</Button>
          <Button size="xs" variant="ghost" @click="clearUrls">
            <Trash2 class="h-3.5 w-3.5" aria-hidden="true" />
            {{ t('batch.clear') }}
          </Button>
        </div>
      </Card>

      <Card>
        <div class="mb-3 flex items-start justify-between gap-2">
          <div>
            <p class="field-label">{{ t('batch.recipes') }}</p>
            <h2 class="text-sm font-semibold text-ink-900 dark:text-ink-50">
              {{ selectedRecipes.length }} {{ t('batch.selectedRecipes') }}
            </h2>
          </div>
          <Badge variant="neutral">{{ props.recipes.length }}</Badge>
        </div>

        <label class="mb-3 flex items-start gap-2 rounded-md border border-ink-200 bg-ink-50 p-2 text-sm font-medium text-ink-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100">
          <input v-model="options.runOnlyCompatibleRecipes" class="mt-1 h-4 w-4 rounded border-ink-300 text-brand-600" type="checkbox" />
          <span>{{ t('batch.runOnlyCompatible') }}</span>
        </label>

        <div class="max-h-72 space-y-2 overflow-y-auto pr-1">
          <label
            v-for="recipe in props.recipes"
            :key="recipe.id"
            class="flex cursor-pointer items-start gap-2 rounded-lg border border-ink-200 bg-white p-2 transition hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-950 dark:hover:bg-ink-900"
          >
            <input
              class="mt-1 h-4 w-4 rounded border-ink-300 text-brand-600"
              type="checkbox"
              :checked="selectedRecipeIds.includes(recipe.id)"
              @change="toggleRecipe(recipe.id, ($event.target as HTMLInputElement).checked)"
            />
            <div class="min-w-0 flex-1">
              <div class="flex min-w-0 items-center gap-1.5">
                <p class="truncate text-sm font-semibold text-ink-900 dark:text-ink-50">{{ recipe.name }}</p>
                <Badge variant="neutral">v{{ recipe.version }}</Badge>
              </div>
              <div class="mt-1 flex flex-wrap gap-1">
                <Badge variant="category">{{ categoryLabel(recipe.category) }}</Badge>
                <Badge variant="neutral">{{ t(`recipe.source.${recipe.source}` as TranslationKey) }}</Badge>
                <Badge variant="neutral">{{ countRecipeFields(recipe) }} {{ t('recipes.fields') }}</Badge>
                <Badge variant="neutral">{{ recipe.checks?.length ?? 0 }} {{ t('checks.title') }}</Badge>
              </div>
              <p class="meta-line mt-1 truncate">{{ patternSummary(recipe) }}</p>
            </div>
          </label>
        </div>
      </Card>

      <Card compact>
        <button
          type="button"
          class="flex w-full items-center justify-between gap-2 text-left"
          @click="advancedOpen = !advancedOpen"
        >
          <span class="text-sm font-semibold text-ink-900 dark:text-ink-50">{{ t('batch.advancedOptions') }}</span>
          <Badge variant="neutral">{{ advancedOpen ? '−' : '+' }}</Badge>
        </button>

        <div v-if="advancedOpen" class="mt-3 grid gap-3">
          <div class="grid grid-cols-2 gap-2">
            <label class="grid gap-1">
              <span class="field-label">{{ t('batch.delayBetweenUrls') }}</span>
              <input v-model.number="delaySeconds" class="input" min="0" type="number" />
            </label>
            <label class="grid gap-1">
              <span class="field-label">{{ t('batch.pageLoadTimeout') }}</span>
              <input v-model.number="pageLoadTimeoutSeconds" class="input" min="1" type="number" />
            </label>
            <label class="grid gap-1">
              <span class="field-label">{{ t('batch.waitAfterLoad') }}</span>
              <input v-model.number="waitAfterLoadSeconds" class="input" min="0" type="number" />
            </label>
            <label class="grid gap-1">
              <span class="field-label">{{ t('batch.retryFailedUrls') }}</span>
              <input v-model.number="options.retryFailedUrls" class="input" min="0" type="number" />
            </label>
          </div>

          <label class="grid gap-1">
            <span class="field-label">{{ t('batch.whenUrlFails') }}</span>
            <select v-model="options.onUrlError" class="input">
              <option v-for="option in urlErrorOptions" :key="option.value" :value="option.value">
                {{ t(option.labelKey) }}
              </option>
            </select>
          </label>
          <label class="grid gap-1">
            <span class="field-label">{{ t('batch.whenRecipeFails') }}</span>
            <select v-model="options.onRecipeError" class="input">
              <option v-for="option in recipeErrorOptions" :key="option.value" :value="option.value">
                {{ t(option.labelKey) }}
              </option>
            </select>
          </label>

          <div class="grid gap-2">
            <label class="flex items-center gap-2 text-sm font-medium text-ink-700 dark:text-ink-100">
              <input v-model="options.saveSuccessfulRuns" class="h-4 w-4 rounded border-ink-300 text-brand-600" type="checkbox" />
              {{ t('batch.saveSuccessfulRuns') }}
            </label>
            <label class="flex items-center gap-2 text-sm font-medium text-ink-700 dark:text-ink-100">
              <input v-model="options.saveWarningRuns" class="h-4 w-4 rounded border-ink-300 text-brand-600" type="checkbox" />
              {{ t('batch.saveWarningRuns') }}
            </label>
            <label class="flex items-center gap-2 text-sm font-medium text-ink-700 dark:text-ink-100">
              <input v-model="options.saveFailedRuns" class="h-4 w-4 rounded border-ink-300 text-brand-600" type="checkbox" />
              {{ t('batch.saveFailedRuns') }}
            </label>
            <label class="flex items-center gap-2 text-sm font-medium text-ink-700 dark:text-ink-100">
              <input checked class="h-4 w-4 rounded border-ink-300 text-brand-600" disabled type="checkbox" />
              {{ t('batch.processingTabMode') }}
            </label>
          </div>
        </div>
      </Card>

      <Card>
        <div class="flex items-start gap-2">
          <ListChecks class="mt-0.5 h-4 w-4 text-brand-700" :stroke-width="2.1" aria-hidden="true" />
          <div class="min-w-0 flex-1">
            <p class="field-label">{{ t('batch.plan') }}</p>
            <h2 class="text-base font-semibold text-ink-900 dark:text-ink-50">
              {{ plan.totalPlannedRuns }} {{ t('batch.plannedRuns') }}
            </h2>
          </div>
        </div>

        <div class="mt-3 grid grid-cols-2 gap-2">
          <Badge variant="neutral">{{ urlInput.validUrls.length }} {{ t('batch.validUrls') }}</Badge>
          <Badge variant="neutral">{{ selectedRecipes.length }} {{ t('batch.recipes') }}</Badge>
          <Badge variant="info">{{ plan.skippedByCompatibility }} {{ t('batch.skippedByCompatibility') }}</Badge>
          <Badge variant="neutral">~{{ formatDuration(plan.estimatedDurationMs) }}</Badge>
        </div>

        <div v-if="plan.mappings.length > 0" class="mt-3 space-y-2">
          <div v-for="mapping in plan.mappings.slice(0, 3)" :key="mapping.url" class="rounded-md border border-ink-200 bg-ink-50 p-2 dark:border-ink-700 dark:bg-ink-900">
            <p class="meta-line truncate">{{ mapping.url }}</p>
            <p class="mt-1 text-xs text-ink-500 dark:text-ink-300">
              {{ mapping.recipes.length > 0 ? mapping.recipes.map((recipe) => recipe.name).join(', ') : t('batch.noCompatibleRecipes') }}
            </p>
          </div>
        </div>

        <p class="mt-3 text-xs text-ink-500 dark:text-ink-300">{{ t('batch.browsingNote') }}</p>

        <p v-if="error" class="mt-3 rounded-md border border-coral-100 bg-coral-50 px-3 py-2 text-sm font-semibold text-coral-500 dark:border-coral-500/30 dark:bg-coral-500/10">
          {{ error }}
        </p>

        <div class="mt-3 grid gap-2">
          <p v-if="urlInput.validUrls.length === 0" class="text-xs font-medium text-coral-500">{{ t('batch.noValidUrls') }}</p>
          <p v-else-if="selectedRecipes.length === 0" class="text-xs font-medium text-coral-500">{{ t('batch.noRecipesSelected') }}</p>
          <p v-else-if="plan.totalPlannedRuns === 0" class="text-xs font-medium text-coral-500">{{ t('batch.noPlannedRuns') }}</p>
          <Button variant="primary" :disabled="!canStart" @click="start">
            <Play class="h-3.5 w-3.5" aria-hidden="true" />
            {{ running ? t('home.running') : t('batch.start') }}
          </Button>
        </div>
      </Card>
    </template>
  </div>
</template>
