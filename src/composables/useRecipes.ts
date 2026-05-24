import { readonly, ref, toRaw } from 'vue';
import {
  deleteRecipe as deleteStoredRecipe,
  listRecipes as listStoredRecipes,
  saveRecipe as saveStoredRecipe
} from '../shared/storage';
import type { Recipe } from '../shared/types';

const recipes = ref<Recipe[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

function cloneRecipe(recipe: Recipe): Recipe {
  return structuredClone(toRaw(recipe));
}

export function useRecipes() {
  async function loadRecipes(): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      recipes.value = await listStoredRecipes();
    } catch (caughtError) {
      error.value = caughtError instanceof Error ? caughtError.message : 'Could not load recipes.';
    } finally {
      loading.value = false;
    }
  }

  async function saveRecipe(recipe: Recipe): Promise<void> {
    await saveStoredRecipe(recipe);
    await loadRecipes();
  }

  async function removeRecipe(id: string): Promise<void> {
    await deleteStoredRecipe(id);
    await loadRecipes();
  }

  async function duplicateRecipe(recipe: Recipe): Promise<void> {
    const now = new Date().toISOString();
    const copy: Recipe = {
      ...cloneRecipe(recipe),
      id: crypto.randomUUID(),
      name: `${recipe.name} Copy`,
      source: 'user',
      createdAt: now,
      updatedAt: now
    };

    await saveRecipe(copy);
  }

  return {
    recipes,
    loading: readonly(loading),
    error: readonly(error),
    loadRecipes,
    saveRecipe,
    removeRecipe,
    duplicateRecipe
  };
}
