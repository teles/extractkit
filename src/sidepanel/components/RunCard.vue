<script setup lang="ts">
import { Calendar, ChevronDown, ChevronUp, Download, Eye, Globe, Timer, Trash2 } from '@lucide/vue';
import { ref } from 'vue';
import { useSettings } from '../../composables/useSettings';
import type { RecipeRun } from '../../shared/types';
import Badge from './Badge.vue';
import Button from './Button.vue';
import ChecksSummary from './ChecksSummary.vue';
import JsonPreview from './JsonPreview.vue';
import StatusBadge from './StatusBadge.vue';
import ValidationSummary from './ValidationSummary.vue';

defineProps<{
  run: RecipeRun;
}>();

const emit = defineEmits<{
  export: [run: RecipeRun];
  delete: [id: string];
}>();

const { preferences, t } = useSettings();
const expanded = ref(false);

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
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0 flex-1">
          <div class="flex min-w-0 flex-wrap items-center gap-1.5">
            <StatusBadge :status="run.status" />
            <h3 class="min-w-0 flex-1 truncate text-sm font-semibold text-ink-900 dark:text-ink-50">{{ run.recipeName }}</h3>
            <Badge variant="neutral">v{{ run.recipeVersion }}</Badge>
            <Badge v-if="run.batchId" variant="accent">{{ t('batch.batchBadge') }}: {{ run.batchName ?? run.batchId }}</Badge>
            <ValidationSummary compact :validation="run.validation" />
            <ChecksSummary compact :checks="run.checks" />
          </div>
          <div class="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-ink-500 dark:text-ink-300">
            <span class="inline-flex min-w-0 items-center gap-1">
              <Globe class="h-3.5 w-3.5 text-ink-500" :stroke-width="2.1" aria-hidden="true" />
              <span class="truncate">{{ run.domain }}</span>
            </span>
            <span class="inline-flex items-center gap-1">
              <Calendar class="h-3.5 w-3.5 text-ink-500" :stroke-width="2.1" aria-hidden="true" />
              {{ formatDate(run.createdAt) }}
            </span>
            <span class="inline-flex items-center gap-1">
              <Timer class="h-3.5 w-3.5 text-ink-500" :stroke-width="2.1" aria-hidden="true" />
              {{ formatDuration(run.durationMs) }}
            </span>
          </div>
          <p class="meta-line mt-2 truncate">{{ run.url }}</p>
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

      <div class="mt-3 flex flex-wrap gap-1.5">
        <Button size="xs" @click="expanded = !expanded">
          <Eye class="h-3.5 w-3.5" aria-hidden="true" />
          {{ t('data.viewDetails') }}
        </Button>
        <Button size="xs" @click="emit('export', run)">
          <Download class="h-3.5 w-3.5" aria-hidden="true" />
          {{ t('recipes.export') }}
        </Button>
        <Button size="xs" variant="ghost" class="ml-auto text-coral-500 hover:bg-coral-50 hover:text-coral-500" @click="emit('delete', run.id)">
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
