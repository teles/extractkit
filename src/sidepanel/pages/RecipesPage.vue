<script setup lang="ts">
import { Copy, Download, Pencil, Plus, ScrollText, Search, Trash2, Upload } from '@lucide/vue';
import { computed, onMounted, ref } from 'vue';
import { useBatchRuns } from '../../composables/useBatchRuns';
import { useRecipes } from '../../composables/useRecipes';
import { useSettings } from '../../composables/useSettings';
import { useToast } from '../../composables/useToast';
import { activeBatchFromList, isRecipeLockedByBatch } from '../../shared/batch-state';
import { safeFilename } from '../../shared/filename';
import type { TranslationKey } from '../../shared/i18n';
import { importRecipesFromFiles } from '../../shared/recipe-import';
import { recipeCategories } from '../../shared/recipe-meta';
import type { Recipe, RecipeCategory, RecipeSource } from '../../shared/types';
import Badge from '../components/Badge.vue';
import Button from '../components/Button.vue';
import Card from '../components/Card.vue';
import EmptyState from '../components/EmptyState.vue';
import PageHeader from '../components/PageHeader.vue';
import RecipeForm from '../components/RecipeForm.vue';

const { recipes, loading, error, loadRecipes, saveRecipe, removeRecipe, duplicateRecipe } = useRecipes();
const { batchRuns, loadBatchRuns } = useBatchRuns();
const { t } = useSettings();
const { success: toastSuccess, warning: toastWarning, error: toastError } = useToast();

const editingRecipe = ref<Recipe | null>(null);
const formOpen = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const importing = ref(false);
const importErrors = ref<string[]>([]);
const searchText = ref('');
const categoryFilter = ref<RecipeCategory | 'all'>('all');
const activeBatch = computed(() => activeBatchFromList(batchRuns.value));
const pageTitle = computed(() => {
  if (!formOpen.value) {
    return t('recipes.title');
  }

  return editingRecipe.value ? t('form.editRecipe') : t('form.newRecipe');
});

const filteredRecipes = computed(() => {
  const search = searchText.value.trim().toLowerCase();
  return recipes.value.filter((recipe) => {
    const matchesCategory = categoryFilter.value === 'all' || recipe.category === categoryFilter.value;
    const matchesSearch =
      !search ||
      recipe.name.toLowerCase().includes(search) ||
      (recipe.description ?? '').toLowerCase().includes(search) ||
      recipe.tags.some((tag) => tag.includes(search));

    return matchesCategory && matchesSearch;
  });
});

onMounted(async () => {
  await Promise.all([loadRecipes(), loadBatchRuns()]);
});

function openNewRecipe(): void {
  editingRecipe.value = null;
  formOpen.value = true;
}

function closeRecipeForm(): void {
  formOpen.value = false;
  editingRecipe.value = null;
}

function categoryLabel(category: RecipeCategory): string {
  return t(`recipe.category.${category}` as TranslationKey);
}

function sourceLabel(source: RecipeSource): string {
  return t(`recipe.source.${source}` as TranslationKey);
}

function visibleTags(recipe: Recipe): string[] {
  return recipe.tags.slice(0, 2);
}

function hiddenTagCount(recipe: Recipe): number {
  return Math.max(recipe.tags.length - 2, 0);
}

function countRecipeFields(recipe: Recipe): number {
  return recipe.fields.reduce((total, field) => total + (field.kind === 'group' ? field.fields.length + 1 : 1), 0);
}

function patternLabel(recipe: Recipe): string {
  if (recipe.urlPatterns.length === 0 || (recipe.urlPatterns.length === 1 && recipe.urlPatterns[0] === '*')) {
    return t('recipes.allWebsites');
  }

  return recipe.urlPatterns.join('  ');
}

function openEditRecipe(recipe: Recipe): void {
  if (isRecipeLockedByBatch(recipe.id, activeBatch.value)) {
    toastError(t('batch.usedByActiveBatch'), t('batch.recipeLockedDescription'));
    return;
  }

  editingRecipe.value = recipe;
  formOpen.value = true;
}

async function handleSave(recipe: Recipe): Promise<void> {
  if (editingRecipe.value && isRecipeLockedByBatch(recipe.id, activeBatch.value)) {
    toastError(t('batch.usedByActiveBatch'), t('batch.recipeLockedDescription'));
    return;
  }

  await saveRecipe(recipe);
  closeRecipeForm();
  toastSuccess(t('toast.recipeSaved'));
}

async function handleDelete(recipe: Recipe): Promise<void> {
  if (isRecipeLockedByBatch(recipe.id, activeBatch.value)) {
    toastError(t('batch.usedByActiveBatch'), t('batch.recipeLockedDescription'));
    return;
  }

  if (!confirm(`${t('recipes.deleteConfirm')} "${recipe.name}"?`)) {
    return;
  }

  await removeRecipe(recipe.id);
  toastSuccess(t('toast.recipeDeleted'));
}

function openImportDialog(): void {
  fileInput.value?.click();
}

async function handleDuplicate(recipe: Recipe): Promise<void> {
  await duplicateRecipe(recipe);
  toastSuccess(t('toast.recipeDuplicated'));
}

function exportRecipe(recipe: Recipe): void {
  const blob = new Blob([JSON.stringify(recipe, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${safeFilename(recipe.name, 'extractkit-recipe')}.recipe.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function prepareImportedRecipe(recipe: Recipe, usedIds: Set<string>): Recipe {
  const hasIdCollision = usedIds.has(recipe.id);
  const now = new Date().toISOString();
  return {
    ...recipe,
    id: hasIdCollision ? crypto.randomUUID() : recipe.id,
    name: hasIdCollision ? `${recipe.name} (imported)` : recipe.name,
    source: 'imported',
    updatedAt: now
  };
}

async function handleImport(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = '';

  if (files.length === 0) {
    return;
  }

  importing.value = true;
  importErrors.value = [];

  try {
    const result = await importRecipesFromFiles(files);
    const usedIds = new Set(recipes.value.map((recipe) => recipe.id));
    let importedCount = 0;

    for (const recipe of result.recipes) {
      const importedRecipe = prepareImportedRecipe(recipe, usedIds);
      usedIds.add(importedRecipe.id);
      await saveRecipe(importedRecipe);
      importedCount += 1;
    }

    if (importedCount > 0) {
      toastSuccess(`${importedCount} ${t('recipes.importedCount')}`);
    } else {
      toastWarning(t('recipes.noneImported'));
    }
    importErrors.value = [...result.errors, ...result.skipped];
  } catch (caughtError) {
    importErrors.value = [caughtError instanceof Error ? caughtError.message : t('recipes.someNotImported')];
  } finally {
    importing.value = false;
  }
}
</script>

<template>
  <section class="panel-stack">
    <PageHeader
      :title="pageTitle"
      :meta="formOpen ? undefined : `${recipes.length} ${t('common.local')}`"
      :icon="ScrollText"
      icon-tone="brand"
      :back-label="formOpen ? t('nav.recipes') : undefined"
      :back-aria-label="formOpen ? t('nav.backToRecipes') : undefined"
      @back="closeRecipeForm"
    >
      <template v-if="!formOpen" #actions>
        <Button size="xs" :disabled="importing" @click="openImportDialog">
          <Upload class="h-3.5 w-3.5" aria-hidden="true" />
          {{ importing ? t('recipes.importing') : t('recipes.import') }}
        </Button>
        <Button size="xs" variant="primary" @click="openNewRecipe">
          <Plus class="h-3.5 w-3.5" aria-hidden="true" />
          {{ t('recipes.new') }}
        </Button>
      </template>
    </PageHeader>

    <input
      ref="fileInput"
      class="hidden"
      type="file"
      accept=".json,.recipe.json,.zip,application/json,application/zip"
      multiple
      @change="handleImport"
    />

    <p v-if="error" class="rounded-md border border-coral-100 bg-coral-50 px-3 py-2 text-sm font-semibold text-coral-500 dark:border-coral-500/30 dark:bg-coral-500/10">{{ error }}</p>
    <div v-if="importErrors.length > 0" class="rounded-md border border-amberline-100 bg-amberline-50 px-3 py-2 text-sm text-amberline-500 dark:border-amberline-500/30 dark:bg-amberline-500/15">
      <p class="font-semibold">{{ t('recipes.someNotImported') }}</p>
      <ul class="mt-1 space-y-1">
        <li v-for="message in importErrors" :key="message">{{ message }}</li>
      </ul>
    </div>

    <RecipeForm
      v-if="formOpen"
      :recipe="editingRecipe"
      @save="handleSave"
      @cancel="closeRecipeForm"
    />

    <div v-else class="space-y-3">
      <div v-if="recipes.length > 0" class="grid gap-2 rounded-lg border border-ink-200 bg-white p-3 dark:border-ink-700 dark:bg-ink-950">
        <label class="relative block">
          <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" :stroke-width="2.1" aria-hidden="true" />
          <input v-model="searchText" class="input pl-9 indent-5" :placeholder="t('recipes.search')" />
        </label>
        <label class="grid gap-1">
          <span class="field-label">{{ t("recipes.category") }}</span>
          <select v-model="categoryFilter" class="input">
            <option value="all">{{ t("common.all") }}</option>
            <option v-for="category in recipeCategories" :key="category" :value="category">
              {{ categoryLabel(category) }}
            </option>
          </select>
        </label>
      </div>

      <EmptyState v-if="!loading && recipes.length === 0" :title="t('recipes.emptyTitle')" :description="t('recipes.emptyDesc')">
        <template #action>
          <Button size="xs" variant="primary" @click="openNewRecipe">{{ t('recipes.create') }}</Button>
        </template>
      </EmptyState>

      <EmptyState v-else-if="!loading && filteredRecipes.length === 0" compact :title="t('recipes.noMatchTitle')" :description="t('recipes.noMatchDesc')" />

      <Card v-for="recipe in filteredRecipes" :key="recipe.id">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex min-w-0 flex-wrap items-center gap-2">
              <h2 class="truncate text-base font-semibold text-ink-900 dark:text-ink-50">{{ recipe.name }}</h2>
              <Badge variant="neutral" size="sm">v{{ recipe.version }}</Badge>
              <Badge v-if="isRecipeLockedByBatch(recipe.id, activeBatch)" variant="warning">{{ t('batch.usedByActiveBatch') }}</Badge>
            </div>
            <p class="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-500 dark:text-ink-300">{{ recipe.description || t('recipes.noDesc') }}</p>
          </div>
        </div>

        <div class="mt-3 flex flex-wrap gap-1.5">
          <Badge variant="category">{{ categoryLabel(recipe.category) }}</Badge>
          <Badge variant="neutral">{{ sourceLabel(recipe.source) }}</Badge>
          <Badge v-for="tag in visibleTags(recipe)" :key="tag" variant="neutral">#{{ tag }}</Badge>
          <Badge v-if="hiddenTagCount(recipe) > 0" variant="neutral">+{{ hiddenTagCount(recipe) }}</Badge>
        </div>

        <div class="mt-3 grid grid-cols-2 gap-2 border-t border-ink-200 pt-3 text-xs text-ink-500 dark:border-ink-700 dark:text-ink-300">
          <span>{{ countRecipeFields(recipe) }} {{ t('recipes.fields') }}</span>
          <span>{{ recipe.urlPatterns.length }} {{ t('recipes.patterns') }}</span>
        </div>

        <div class="mt-3 rounded-md border border-ink-200 bg-ink-100 px-2.5 py-2 dark:border-ink-700 dark:bg-ink-800">
          <p class="meta-line truncate">{{ patternLabel(recipe) }}</p>
        </div>

        <div class="mt-3 flex flex-wrap gap-1.5">
          <Button size="xs" :disabled="isRecipeLockedByBatch(recipe.id, activeBatch)" :title="isRecipeLockedByBatch(recipe.id, activeBatch) ? t('batch.recipeLockedDescription') : undefined" @click="openEditRecipe(recipe)">
            <Pencil class="h-3.5 w-3.5" aria-hidden="true" />
            {{ t('recipes.edit') }}
          </Button>
          <Button size="xs" @click="handleDuplicate(recipe)">
            <Copy class="h-3.5 w-3.5" aria-hidden="true" />
            {{ t('recipes.duplicate') }}
          </Button>
          <Button size="xs" @click="exportRecipe(recipe)">
            <Download class="h-3.5 w-3.5" aria-hidden="true" />
            {{ t('recipes.export') }}
          </Button>
          <Button size="xs" variant="ghost" class="ml-auto text-coral-500 hover:bg-coral-50 hover:text-coral-500" :disabled="isRecipeLockedByBatch(recipe.id, activeBatch)" :title="isRecipeLockedByBatch(recipe.id, activeBatch) ? t('batch.recipeLockedDescription') : undefined" @click="handleDelete(recipe)">
            <Trash2 class="h-3.5 w-3.5" aria-hidden="true" />
            {{ t('recipes.delete') }}
          </Button>
        </div>
      </Card>
    </div>
  </section>
</template>
