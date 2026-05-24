<script setup lang="ts">
import { ChevronDown, ChevronUp, Download, Eye, Trash2 } from '@lucide/vue';
import { computed, ref } from 'vue';
import { useSettings } from '../../composables/useSettings';
import type { RecipeRun } from '../../shared/types';
import Badge from './Badge.vue';
import Button from './Button.vue';
import ChecksSummary from './ChecksSummary.vue';
import JsonPreview from './JsonPreview.vue';
import StatusBadge from './StatusBadge.vue';
import ValidationSummary from './ValidationSummary.vue';

const props = defineProps<{
  run: RecipeRun;
  batchName?: string;
  deleteDisabled?: boolean;
  deleteTitle?: string;
}>();

const emit = defineEmits<{
  export: [run: RecipeRun];
  delete: [id: string];
}>();

const { preferences, t } = useSettings();
const expanded = ref(false);
const visibleBatchName = computed(() => props.batchName ?? props.run.batchName ?? t('batch.batchRun'));
const hasConfiguredChecks = computed(() => Boolean(props.run.checks && props.run.checks.results.length > 0 && props.run.checks.status !== 'skipped'));

const validationLabel = computed(() => {
  if (props.run.validation?.status === 'valid') {
    return t('validation.valid');
  }

  if (props.run.validation?.status === 'invalid') {
    return t('validation.invalid');
  }

  return t('validation.skipped');
});

const validationVariant = computed(() => {
  if (props.run.validation?.status === 'valid') {
    return 'success';
  }

  if (props.run.validation?.status === 'invalid') {
    return 'warning';
  }

  return 'neutral';
});

const checksVariant = computed(() => {
  if (!hasConfiguredChecks.value) {
    return 'neutral';
  }

  if (props.run.checks?.status === 'passed') {
    return 'success';
  }

  if (props.run.checks?.status === 'warning') {
    return 'warning';
  }

  return 'danger';
});

const checksLabel = computed(() => {
  if (!hasConfiguredChecks.value) {
    return t('checks.noChecksBadge');
  }

  const errors = props.run.checks?.errors ?? 0;
  if (errors > 0) {
    return errors === 1 ? `1 ${t('checks.error').toLocaleLowerCase(preferences.value.locale)}` : `${errors} ${t('checks.errors')}`;
  }

  const warnings = props.run.checks?.warnings ?? 0;
  if (warnings > 0) {
    return warnings === 1
      ? `1 ${t('checks.warning').toLocaleLowerCase(preferences.value.locale)}`
      : `${warnings} ${t('checks.warnings')}`;
  }

  return t('checks.passedBadge');
});

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(preferences.value.locale, {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

function formatDuration(milliseconds: number): string {
  if (milliseconds >= 1000) {
    return `${(milliseconds / 1000).toFixed(1)}s`;
  }

  return `${milliseconds}ms`;
}
</script>

<template>
  <article class="rounded-lg border border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-950">
    <div class="p-3">
      <div class="flex items-start gap-2">
        <div class="flex min-w-0 flex-1 items-center gap-2">
          <StatusBadge :status="run.status" />
          <h3 class="min-w-0 flex-1 truncate text-sm font-semibold text-ink-900 dark:text-ink-50" :title="run.recipeName">
            {{ run.recipeName }}
          </h3>
        </div>

        <button
          type="button"
          class="focus-ring inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-ink-50"
          :aria-expanded="expanded"
          @click="expanded = !expanded"
        >
          <ChevronUp v-if="expanded" class="h-4 w-4" :stroke-width="2.2" aria-hidden="true" />
          <ChevronDown v-else class="h-4 w-4" :stroke-width="2.2" aria-hidden="true" />
        </button>
      </div>

      <div class="mt-2 flex min-w-0 flex-wrap items-center gap-1.5">
        <Badge variant="neutral" class="shrink-0">v{{ run.recipeVersion }}</Badge>
        <Badge v-if="run.batchId" variant="primary" class="max-w-[220px]" :title="`${t('batch.batchBadge')}: ${visibleBatchName}`">
          <span class="min-w-0 truncate">{{ t('batch.batchBadge') }}: {{ visibleBatchName }}</span>
        </Badge>
        <Badge :variant="validationVariant" class="shrink-0">{{ validationLabel }}</Badge>
      </div>

      <div class="mt-2">
        <Badge :variant="checksVariant">{{ checksLabel }}</Badge>
      </div>

      <div class="mt-2 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] leading-5 text-ink-500 dark:text-ink-300">
        <span class="min-w-0 truncate">{{ run.domain }}</span>
        <span class="shrink-0 text-ink-300 dark:text-ink-600">·</span>
        <span class="shrink-0">{{ formatDate(run.createdAt) }}</span>
        <span class="shrink-0 text-ink-300 dark:text-ink-600">·</span>
        <span class="shrink-0">{{ formatDuration(run.durationMs) }}</span>
      </div>

      <p class="mt-2 truncate rounded-md border border-ink-200 bg-ink-50 px-2 py-1 font-mono text-[11px] leading-5 text-ink-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200">
        {{ run.url }}
      </p>

      <div class="mt-3 flex flex-wrap gap-1.5">
        <Button size="xs" @click="expanded = !expanded">
          <Eye class="h-3.5 w-3.5" aria-hidden="true" />
          {{ t('data.viewJson') }}
        </Button>
        <Button size="xs" @click="emit('export', run)">
          <Download class="h-3.5 w-3.5" aria-hidden="true" />
          {{ t('recipes.export') }}
        </Button>
        <Button
          size="xs"
          variant="ghost"
          class="ml-auto text-coral-500 hover:bg-coral-50 hover:text-coral-500"
          :disabled="deleteDisabled"
          :title="deleteTitle"
          @click="emit('delete', run.id)"
        >
          <Trash2 class="h-3.5 w-3.5" aria-hidden="true" />
          {{ t('recipes.delete') }}
        </Button>
      </div>
    </div>

    <div v-if="expanded" class="space-y-3 border-t border-ink-200 bg-ink-50 p-3 dark:border-ink-700 dark:bg-ink-900">
      <ValidationSummary :validation="run.validation" />
      <ChecksSummary :checks="run.checks" show-all-results />
      <JsonPreview :value="run.data" />
    </div>
  </article>
</template>
