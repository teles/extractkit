<script setup lang="ts">
import { Download, History, Search, SlidersHorizontal } from '@lucide/vue';
import { computed, onMounted, ref } from 'vue';
import { useExport } from '../../composables/useExport';
import { useRecipes } from '../../composables/useRecipes';
import { useRuns } from '../../composables/useRuns';
import { useSettings } from '../../composables/useSettings';
import { useToast } from '../../composables/useToast';
import type { RecipeRun } from '../../shared/types';
import Button from '../components/Button.vue';
import Card from '../components/Card.vue';
import EmptyState from '../components/EmptyState.vue';
import PageHeader from '../components/PageHeader.vue';
import RunCard from '../components/RunCard.vue';

const { runs, loading, error, loadRuns, removeRun } = useRuns();
const { recipes, loadRecipes } = useRecipes();
const { exporting, error: exportError, exportRuns } = useExport();
const { t } = useSettings();
const { success: toastSuccess, error: toastError } = useToast();

const recipeFilter = ref('');
const domainFilter = ref('');
const urlFilter = ref('');

const domains = computed(() => Array.from(new Set(runs.value.map((run) => run.domain))).sort());

const filteredRuns = computed(() =>
  runs.value.filter((run) => {
    const matchesRecipe = !recipeFilter.value || run.recipeId === recipeFilter.value;
    const matchesDomain = !domainFilter.value || run.domain === domainFilter.value;
    const matchesUrl = !urlFilter.value || run.url.toLowerCase().includes(urlFilter.value.toLowerCase());
    return matchesRecipe && matchesDomain && matchesUrl;
  })
);

onMounted(async () => {
  await Promise.all([loadRuns(), loadRecipes()]);
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
        @export="exportRun"
        @delete="handleDelete"
      />
    </div>
  </section>
</template>
