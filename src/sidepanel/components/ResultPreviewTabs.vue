<script setup lang="ts">
import { Copy } from '@lucide/vue';
import { computed, ref, watch } from 'vue';
import { useSettings } from '../../composables/useSettings';
import { useToast } from '../../composables/useToast';
import { runDataToMarkdown } from '../../shared/markdown';
import type { RecipeRun } from '../../shared/types';
import Button from './Button.vue';
import ChecksSummary from './ChecksSummary.vue';
import JsonPreview from './JsonPreview.vue';
import MarkdownPreview from './MarkdownPreview.vue';
import SegmentedControl from './SegmentedControl.vue';
import ValidationSummary from './ValidationSummary.vue';

type ResultTab = 'readable' | 'json' | 'checks';

const props = defineProps<{
  run: RecipeRun;
}>();

const { t } = useSettings();
const { success: toastSuccess, error: toastError } = useToast();
const activeTab = ref<ResultTab>('readable');

const tabOptions = computed<Array<{ value: ResultTab; label: string }>>(() => [
  { value: 'readable', label: t('preview.readable') },
  { value: 'json', label: t('preview.json') },
  { value: 'checks', label: t('preview.checks') }
]);

const markdown = computed(() =>
  runDataToMarkdown(props.run.data, {
    noItemsLabel: t('preview.noItems'),
    notAvailableLabel: t('preview.notAvailable')
  })
);

watch(
  () => props.run.id,
  () => {
    activeTab.value = 'readable';
  }
);

async function copyMarkdown(): Promise<void> {
  try {
    await navigator.clipboard.writeText(markdown.value);
    toastSuccess(t('preview.markdownCopied'));
  } catch {
    toastError(t('home.copyError'));
  }
}

async function copyJson(): Promise<void> {
  try {
    await navigator.clipboard.writeText(JSON.stringify(props.run.data, null, 2));
    toastSuccess(t('home.jsonCopied'));
  } catch {
    toastError(t('home.copyError'));
  }
}
</script>

<template>
  <section class="space-y-3">
    <SegmentedControl v-model="activeTab" :options="tabOptions" />

    <div v-if="activeTab === 'readable'" class="space-y-2">
      <div class="flex justify-end">
        <Button size="xs" @click="copyMarkdown">
          <Copy class="h-3.5 w-3.5" aria-hidden="true" />
          {{ t('preview.copyMarkdown') }}
        </Button>
      </div>
      <MarkdownPreview :markdown="markdown" />
    </div>

    <div v-else-if="activeTab === 'json'" class="space-y-2">
      <div class="flex justify-end">
        <Button size="xs" @click="copyJson">
          <Copy class="h-3.5 w-3.5" aria-hidden="true" />
          {{ t('home.copyJson') }}
        </Button>
      </div>
      <JsonPreview :value="run.data" />
    </div>

    <div v-else class="space-y-2">
      <ValidationSummary :validation="run.validation" />
      <ChecksSummary :checks="run.checks" show-all-results />

      <div v-if="run.warnings.length > 0" class="rounded-md border border-amberline-100 bg-amberline-50 px-3 py-2 dark:border-amberline-500/30 dark:bg-amberline-500/15">
        <h3 class="text-xs font-bold text-amberline-500">{{ t('home.warnings') }}</h3>
        <ul class="mt-1 space-y-1 text-xs text-ink-700 dark:text-ink-50">
          <li v-for="warning in run.warnings" :key="`${warning.field}-${warning.message}`">
            <strong>{{ warning.field }}:</strong> {{ warning.message }}
          </li>
        </ul>
      </div>

      <div v-if="run.errors.length > 0" class="rounded-md border border-coral-100 bg-coral-50 px-3 py-2 dark:border-coral-500/30 dark:bg-coral-500/10">
        <h3 class="text-xs font-bold text-coral-500">{{ t('home.errors') }}</h3>
        <ul class="mt-1 space-y-1 text-xs text-ink-700 dark:text-ink-50">
          <li v-for="error in run.errors" :key="`${error.field ?? 'run'}-${error.message}`">
            <strong>{{ error.field ?? t('home.runField') }}:</strong> {{ error.message }}
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
