import { readonly, ref } from 'vue';
import type { RunRecipeResponse } from '../shared/messaging';
import { MESSAGE_RUN_RECIPE } from '../shared/messaging';
import { generateOutputSchema } from '../shared/output-schema';
import { validateOutput } from '../shared/output-validation';
import type { Recipe, RecipeRun } from '../shared/types';

const running = ref(false);
const error = ref<string | null>(null);

function hasRuntimeMessaging(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.runtime?.sendMessage);
}

function hasPermissionsApi(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.permissions?.request);
}

function originPermissionFromUrl(url: string | undefined): string | null {
  if (!url) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return null;
    }

    return `${parsedUrl.protocol}//${parsedUrl.hostname}/*`;
  } catch {
    return null;
  }
}

function requestPermission(permissions: chrome.permissions.Permissions): Promise<boolean> {
  return new Promise((resolve, reject) => {
    chrome.permissions.request(permissions, (granted) => {
      const chromeError = chrome.runtime.lastError;
      if (chromeError) {
        reject(new Error(chromeError.message));
        return;
      }

      resolve(granted);
    });
  });
}

function statusWithReviewResults(
  responseStatus: RecipeRun['status'],
  run: Pick<RecipeRun, 'validation' | 'checks'>
): RecipeRun['status'] {
  if (responseStatus === 'error') {
    return 'error';
  }

  if (run.validation?.status === 'invalid') {
    return 'partial';
  }

  if (run.checks?.status === 'warning' || run.checks?.status === 'error') {
    return 'partial';
  }

  return responseStatus;
}

async function ensureHostPermission(tabUrl: string | undefined): Promise<void> {
  const origin = originPermissionFromUrl(tabUrl);
  if (!origin) {
    return;
  }

  if (!hasPermissionsApi()) {
    throw new Error('The Chrome permissions API is not available.');
  }

  const permissions = { origins: [origin] };
  const granted = await requestPermission(permissions);
  if (!granted) {
    throw new Error(`Permission to access ${origin} was denied.`);
  }
}

export function useScraperRunner() {
  async function runRecipe(recipe: Recipe, tabUrl?: string): Promise<RecipeRun | null> {
    running.value = true;
    error.value = null;

    try {
      if (!hasRuntimeMessaging()) {
        throw new Error('Load the extension in Chrome to run recipes.');
      }

      await ensureHostPermission(tabUrl);

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
