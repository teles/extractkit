<script setup lang="ts">
import { computed, ref, toRaw, watch } from 'vue';
import { useSettings } from '../../composables/useSettings';
import type { TranslationKey } from '../../shared/i18n';
import { recipeCategories } from '../../shared/recipe-meta';
import type { Recipe, RecipeCategory, RecipeCheck, RecipeField } from '../../shared/types';
import RecipeChecksEditor from './RecipeChecksEditor.vue';
import RecipeFieldEditor from './RecipeFieldEditor.vue';

const props = defineProps<{
  recipe: Recipe | null;
}>();

const emit = defineEmits<{
  save: [recipe: Recipe];
  cancel: [];
}>();

const form = ref<Recipe>(createRecipe());
const patternText = ref('');
const tagsText = ref('');
const validationErrorKey = ref<TranslationKey | null>(null);
const { t } = useSettings();

const validationError = computed(() => (validationErrorKey.value ? t(validationErrorKey.value) : null));

function createRecipe(): Recipe {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: '',
    description: '',
    category: 'custom',
    tags: [],
    source: 'user',
    urlPatterns: ['*'],
    version: '1.0.0',
    createdAt: now,
    updatedAt: now,
    checks: [],
    fields: [
      {
        id: crypto.randomUUID(),
        kind: 'field',
        key: 'title',
        selector: 'title',
        extract: 'text',
        multiple: false,
        transforms: ['trim']
      }
    ]
  };
}

function cloneRecipe(recipe: Recipe): Recipe {
  return {
    ...structuredClone(toRaw(recipe)),
    checks: recipe.checks ?? []
  };
}

watch(
  () => props.recipe,
  (recipe) => {
    form.value = recipe ? cloneRecipe(recipe) : createRecipe();
    patternText.value = form.value.urlPatterns.join('\n');
    tagsText.value = form.value.tags.join(', ');
    validationErrorKey.value = null;
  },
  { immediate: true }
);

function updateFields(fields: RecipeField[]): void {
  form.value = {
    ...form.value,
    fields
  };
}

function updateChecks(checks: RecipeCheck[]): void {
  form.value = {
    ...form.value,
    checks
  };
}

function normalizedPatterns(): string[] {
  return patternText.value
    .split('\n')
    .map((pattern) => pattern.trim())
    .filter(Boolean);
}

function normalizedTags(): string[] {
  return Array.from(
    new Set(
      tagsText.value
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

function categoryLabel(category: RecipeCategory): string {
  return t(`recipe.category.${category}` as TranslationKey);
}

function submit(): void {
  const name = form.value.name.trim();
  if (!name) {
    validationErrorKey.value = 'form.nameRequired';
    return;
  }

  if (form.value.fields.length === 0 && (form.value.checks ?? []).length === 0) {
    validationErrorKey.value = 'form.fieldsOrChecksRequired';
    return;
  }

  const now = new Date().toISOString();
  emit('save', {
    ...form.value,
    name,
    description: form.value.description?.trim() || undefined,
    version: form.value.version.trim() || '1.0.0',
    category: form.value.category,
    tags: normalizedTags(),
    source: form.value.source ?? 'user',
    urlPatterns: normalizedPatterns(),
    checks: form.value.checks ?? [],
    updatedAt: now
  });
}
</script>

<template>
  <form class="space-y-3" @submit.prevent="submit">
    <div class="rounded-lg border border-ink-200 bg-white p-3 dark:border-ink-700 dark:bg-ink-950">
      <div class="mb-3 flex items-center justify-between gap-2">
        <div>
          <p class="field-label">{{ t('form.definition') }}</p>
          <h2 class="text-sm font-semibold text-ink-900 dark:text-ink-50">
            {{ recipe ? t('form.editRecipe') : t('form.newRecipe') }}
          </h2>
        </div>
      </div>

      <div class="grid gap-3">
        <label class="grid gap-1">
          <span class="field-label">{{ t('form.name') }}</span>
          <input v-model="form.name" class="input" :placeholder="t('form.namePlaceholder')" />
        </label>

        <label class="grid gap-1">
          <span class="field-label">{{ t('form.description') }}</span>
          <textarea v-model="form.description" class="input min-h-20 resize-y" />
        </label>

        <label class="grid gap-1">
          <span class="field-label">{{ t('form.version') }}</span>
          <input v-model="form.version" class="input font-mono text-xs" placeholder="1.0.0" />
        </label>

        <label class="grid gap-1">
          <span class="field-label">{{ t("recipes.category") }}</span>
          <select v-model="form.category" class="input">
            <option v-for="category in recipeCategories" :key="category" :value="category">
              {{ categoryLabel(category) }}
            </option>
          </select>
        </label>

        <label class="grid gap-1">
          <span class="field-label">{{ t("recipes.tags") }}</span>
          <input v-model="tagsText" class="input font-mono text-xs" placeholder="seo, metadata, links" />
        </label>

        <label class="grid gap-1">
          <span class="field-label">{{ t('form.urlPatterns') }}</span>
          <textarea v-model="patternText" class="input min-h-20 resize-y font-mono text-xs" placeholder="*.example.com/*" />
        </label>
      </div>
    </div>

    <RecipeFieldEditor :model-value="form.fields" @update:model-value="updateFields" />

    <div class="rounded-lg border border-ink-200 bg-white p-3 dark:border-ink-700 dark:bg-ink-950">
      <RecipeChecksEditor :model-value="form.checks ?? []" @update:model-value="updateChecks" />
    </div>

    <p v-if="validationError" class="rounded-md border border-coral-100 bg-coral-50 px-3 py-2 text-sm font-semibold text-coral-500 dark:border-coral-500/30 dark:bg-coral-500/10">
      {{ validationError }}
    </p>

    <div class="sticky bottom-[72px] flex gap-2 rounded-lg border border-ink-200 bg-white/95 p-2 backdrop-blur dark:border-ink-700 dark:bg-ink-950/95">
      <button class="btn-primary flex-1" type="submit">{{ t('form.save') }}</button>
      <button class="btn-secondary" type="button" @click="emit('cancel')">{{ t('form.cancel') }}</button>
    </div>
  </form>
</template>
