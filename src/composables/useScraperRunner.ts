import { readonly, ref } from 'vue';
import { ensureHostPermissionForUrl } from '../shared/host-permissions';
import type { RunRecipeResponse } from '../shared/messaging';
import { MESSAGE_RUN_RECIPE } from '../shared/messaging';
import { generateOutputSchema } from '../shared/output-schema';
import { validateOutput } from '../shared/output-validation';
import { statusWithReviewResults } from '../shared/run-status';
import type { Recipe, RecipeRun } from '../shared/types';

const running = ref(false);
const error = ref<string | null>(null);

function hasRuntimeMessaging(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.runtime?.sendMessage);
}

export function useScraperRunner() {
  async function runRecipe(recipe: Recipe, tabUrl?: string): Promise<RecipeRun | null> {
    running.value = true;
    error.value = null;

    try {
      if (!hasRuntimeMessaging()) {
        throw new Error('Load the extension in Chrome to run recipes.');
      }

      await ensureHostPermissionForUrl(tabUrl);

      const response = (await chrome.runtime.sendMessage({
        type: MESSAGE_RUN_RECIPE,
        recipe
      })) as RunRecipeResponse;

      if (!response.ok) {
        throw new Error(response.error);
      }

      const outputSchema = generateOutputSchema(recipe);
      const validation = validateOutput(response.data.data, outputSchema);
      const checks = response.data.checks;

      return {
        id: crypto.randomUUID(),
        recipeId: recipe.id,
        recipeVersion: recipe.version,
        recipeName: recipe.name,
        url: response.data.url,
        domain: response.data.domain,
        pageTitle: response.data.pageTitle,
        status: statusWithReviewResults(response.data.status, { validation, checks }),
        createdAt: new Date().toISOString(),
        durationMs: response.data.durationMs,
        data: response.data.data,
        validation,
        checks,
        warnings: response.data.warnings,
        errors: response.data.errors
      };
    } catch (caughtError) {
      error.value = caughtError instanceof Error ? caughtError.message : 'Could not run the recipe.';
      return null;
    } finally {
      running.value = false;
    }
  }

  return {
    running: readonly(running),
    error: readonly(error),
    runRecipe
  };
}
