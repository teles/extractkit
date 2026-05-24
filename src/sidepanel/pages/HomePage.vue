<script setup lang="ts">
import { Braces, Copy, Eye, FileText, Globe, Play, RefreshCcw, Save } from '@lucide/vue';
import { computed, onMounted, ref, watch } from 'vue';
import { useCurrentTab } from '../../composables/useCurrentTab';
import { useRecipes } from '../../composables/useRecipes';
import { useRuns } from '../../composables/useRuns';
import { useScraperRunner } from '../../composables/useScraperRunner';
import { useSettings } from '../../composables/useSettings';
import { useToast } from '../../composables/useToast';
import type { Recipe, RecipeRun } from '../../shared/types';
import { matchUrlPattern } from '../../shared/url-pattern';
import Badge from '../components/Badge.vue';
import Button from '../components/Button.vue';
import Card from '../components/Card.vue';
import ChecksSummary from '../components/ChecksSummary.vue';
import EmptyState from '../components/EmptyState.vue';
import IconBadge from '../components/IconBadge.vue';
import JsonPreview from '../components/JsonPreview.vue';
import PageHeader from '../components/PageHeader.vue';
import StatusBadge from '../components/StatusBadge.vue';
import ValidationSummary from '../components/ValidationSummary.vue';

const { currentTab, loading: tabLoading, error: tabError, refreshCurrentTab } = useCurrentTab();
const { recipes, loading: recipesLoading, error: recipesError, loadRecipes } = useRecipes();
const { saveRun } = useRuns();
const { running, error: runnerError, runRecipe } = useScraperRunner();
const { t } = useSettings();
const { success: toastSuccess, error: toastError } = useToast();

const selectedRecipeId = ref('');
const latestRun = ref<RecipeRun | null>(null);
const showRunDetails = ref(false);

const compatibleRecipes = computed(() =>
  recipes.value.filter((recipe) => matchUrlPattern(currentTab.value?.url, recipe.urlPatterns))
);

const selectedRecipe = computed<Recipe | null>(
  () => recipes.value.find((recipe) => recipe.id === selectedRecipeId.value) ?? null
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

const selectedRecipeFieldCount = computed(() => (selectedRecipe.value ? countRecipeFields(selectedRecipe.value) : 0));

const resultItemCount = computed(() => {
  if (!latestRun.value) {
    return null;
  }

  const data = latestRun.value.data;
  if (Array.isArray(data)) {
    return data.length;
  }

  if (data && typeof data === 'object') {
    const arrayValues = Object.values(data as Record<string, unknown>).filter(Array.isArray);
    if (arrayValues.length === 1) {
      return arrayValues[0].length;
    }
  }

  return null;
});

watch(
  compatibleRecipes,
  (nextRecipes) => {
    if (!nextRecipes.some((recipe) => recipe.id === selectedRecipeId.value)) {
      selectedRecipeId.value = nextRecipes[0]?.id ?? '';
    }
  },
  { immediate: true }
);

onMounted(async () => {
  await Promise.all([refreshCurrentTab(), loadRecipes()]);
});

async function executeRecipe(): Promise<void> {
  if (!selectedRecipe.value) {
    return;
  }

  showRunDetails.value = false;
  latestRun.value = await runRecipe(selectedRecipe.value, currentTab.value?.url);
}

async function persistLatestRun(): Promise<void> {
  if (!latestRun.value) {
    return;
  }

  await saveRun(latestRun.value);
  toastSuccess(t('home.resultSaved'));
}

async function copyLatestJson(): Promise<void> {
  if (!latestRun.value) {
    return;
  }

  try {
    await navigator.clipboard.writeText(JSON.stringify(latestRun.value.data, null, 2));
    toastSuccess(t('home.jsonCopied'));
  } catch {
    toastError(t('home.copyError'));
  }
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

    <div v-if="tabError" class="rounded-md border border-amberline-100 bg-amberline-50 px-3 py-2 text-sm font-semibold text-amberline-500 dark:border-amberline-500/30 dark:bg-amberline-500/15">
      {{ tabError }}
    </div>

    <Card>
      <div class="flex items-start justify-between gap-3">
        <div class="flex min-w-0 items-center gap-2">
          <IconBadge :icon="Globe" tone="neutral" />
          <h2 class="text-base font-semibold text-ink-900 dark:text-ink-50">{{ t('home.currentPage') }}</h2>
        </div>
        <Badge v-if="currentTab" variant="accent" size="sm">{{ t('home.active') }}</Badge>
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
        <Badge :variant="selectedRecipe ? 'neutral' : 'accent'" size="sm">
          {{ selectedRecipe ? `v${selectedRecipe.version}` : compatibleRecipes.length }}
        </Badge>
      </div>

      <div v-if="compatibleRecipes.length > 0" class="space-y-2">
        <select v-model="selectedRecipeId" class="input font-medium">
          <option v-for="recipe in compatibleRecipes" :key="recipe.id" :value="recipe.id">
            {{ recipe.name }}
          </option>
        </select>

        <div v-if="selectedRecipe" class="rounded-lg border border-ink-200 bg-ink-100 p-3 dark:border-ink-700 dark:bg-ink-800">
          <p class="truncate text-sm font-semibold text-ink-900 dark:text-ink-50">{{ selectedRecipe.name }}</p>
          <div class="mt-2 flex flex-wrap gap-3 text-xs text-ink-500 dark:text-ink-300">
            <span>v{{ selectedRecipe.version }}</span>
            <span>{{ selectedRecipeFieldCount }} {{ t('home.fields') }}</span>
            <span>{{ selectedRecipe.urlPatterns.length }} URL {{ t('recipes.patterns') }}</span>
          </div>
        </div>
      </div>

      <EmptyState
        v-else
        compact
        :title="t('home.noCompatibleTitle')"
        :description="t('home.noCompatibleDesc')"
      />

      <p v-if="recipesError" class="mt-3 text-sm font-semibold text-coral-500">{{ recipesError }}</p>

      <div class="mt-3 flex justify-end">
        <Button variant="primary" :disabled="running || !selectedRecipe" @click="executeRecipe">
          <Play class="h-3.5 w-3.5" aria-hidden="true" />
          {{ running ? t('home.running') : t('home.runRecipe') }}
        </Button>
      </div>

      <p v-if="runnerError" class="mt-3 rounded-md border border-coral-100 bg-coral-50 px-3 py-2 text-sm font-semibold text-coral-500 dark:border-coral-500/30 dark:bg-coral-500/10">
        {{ runnerError }}
      </p>
    </Card>

    <Card v-if="latestRun" compact>
      <div class="mb-3 grid gap-3">
        <div class="flex min-w-0 items-center gap-2">
          <IconBadge :icon="Braces" tone="neutral" />
          <h2 class="min-w-0 text-base font-semibold text-ink-900 dark:text-ink-50">{{ t('home.result') }}</h2>
        </div>
        <div class="flex w-full flex-wrap gap-1.5">
          <Button size="xs" variant="primary" @click="persistLatestRun">
            <Save class="h-3.5 w-3.5" aria-hidden="true" />
            {{ t('home.save') }}
          </Button>
          <Button size="xs" @click="copyLatestJson">
            <Copy class="h-3.5 w-3.5" aria-hidden="true" />
            {{ t('home.copyJson') }}
          </Button>
          <Button size="xs" variant="ghost" @click="showRunDetails = !showRunDetails">
            <Eye class="h-3.5 w-3.5" aria-hidden="true" />
            {{ showRunDetails ? t('home.viewData') : t('home.viewDetails') }}
          </Button>
        </div>
      </div>

      <div class="mb-3 flex flex-wrap items-center gap-2 text-xs text-ink-500 dark:text-ink-300">
        <StatusBadge :status="latestRun.status" />
        <span>{{ formatDuration(latestRun.durationMs) }}</span>
        <span v-if="resultItemCount !== null">{{ resultItemCount }} {{ t('home.items') }}</span>
        <ValidationSummary compact :validation="latestRun.validation" />
        <Badge v-if="latestRun.warnings.length > 0" variant="warning">{{ latestRun.warnings.length }} {{ t('home.warnings') }}</Badge>
        <Badge v-if="latestRun.errors.length > 0" variant="danger">{{ latestRun.errors.length }} {{ t('home.errors') }}</Badge>
      </div>

      <ChecksSummary
        class="mb-2"
        :checks="latestRun.checks"
        :show-all-results="showRunDetails"
        :expandable="showRunDetails"
      />

      <div v-if="showRunDetails" class="mb-2">
        <ValidationSummary :validation="latestRun.validation" />
      </div>

      <div v-if="showRunDetails && latestRun.warnings.length > 0" class="mb-2 rounded-md border border-amberline-100 bg-amberline-50 px-3 py-2 dark:border-amberline-500/30 dark:bg-amberline-500/15">
        <h3 class="text-xs font-bold text-amberline-500">{{ t('home.warnings') }}</h3>
        <ul class="mt-1 space-y-1 text-xs text-ink-700 dark:text-ink-50">
          <li v-for="warning in latestRun.warnings" :key="`${warning.field}-${warning.message}`">
            <strong>{{ warning.field }}:</strong> {{ warning.message }}
          </li>
        </ul>
      </div>

      <div v-if="showRunDetails && latestRun.errors.length > 0" class="mb-2 rounded-md border border-coral-100 bg-coral-50 px-3 py-2 dark:border-coral-500/30 dark:bg-coral-500/10">
        <h3 class="text-xs font-bold text-coral-500">{{ t('home.errors') }}</h3>
        <ul class="mt-1 space-y-1 text-xs text-ink-700 dark:text-ink-50">
          <li v-for="error in latestRun.errors" :key="`${error.field ?? 'run'}-${error.message}`">
            <strong>{{ error.field ?? t('home.runField') }}:</strong> {{ error.message }}
          </li>
        </ul>
      </div>

      <JsonPreview :value="showRunDetails ? latestRun : latestRun.data" />
    </Card>

    <EmptyState v-else compact :title="t('home.readyTitle')" :description="t('home.readyDesc')" />
  </section>
</template>
