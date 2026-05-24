import type { BatchRunOptions, Recipe } from './types';
import { matchUrlPattern } from './url-pattern';

export type NormalizedUrlInput = {
  validUrls: string[];
  invalidUrls: string[];
  duplicateCount: number;
};

export type BatchPlanMapping = {
  url: string;
  urlIndex: number;
  recipes: Recipe[];
  skippedRecipeIds: string[];
};

export type BatchRunPlan = {
  mappings: BatchPlanMapping[];
  totalPlannedRuns: number;
  skippedByCompatibility: number;
  estimatedDurationMs: number;
};

export const DEFAULT_BATCH_RUN_OPTIONS: BatchRunOptions = {
  runOnlyCompatibleRecipes: true,
  delayBetweenUrlsMs: 3000,
  pageLoadTimeoutMs: 30000,
  waitAfterLoadMs: 2000,
  retryFailedUrls: 1,
  onUrlError: 'retryThenSkip',
  onRecipeError: 'continue',
  saveSuccessfulRuns: true,
  saveWarningRuns: true,
  saveFailedRuns: false,
  processingTabMode: 'dedicatedPinnedTab'
};

export function isSupportedBatchUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

export function normalizeUrlInput(value: string): NormalizedUrlInput {
  const seen = new Set<string>();
  const validUrls: string[] = [];
  const invalidUrls: string[] = [];
  let duplicateCount = 0;

  for (const rawLine of value.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    if (!isSupportedBatchUrl(line)) {
      invalidUrls.push(line);
      continue;
    }

    const normalizedUrl = new URL(line).toString();
    if (seen.has(normalizedUrl)) {
      duplicateCount += 1;
      continue;
    }

    seen.add(normalizedUrl);
    validUrls.push(normalizedUrl);
  }

  return {
    validUrls,
    invalidUrls,
    duplicateCount
  };
}

export function createBatchPlan(urls: string[], recipes: Recipe[], options: BatchRunOptions): BatchRunPlan {
  const mappings = urls.map((url, urlIndex) => {
    const compatibleRecipes = options.runOnlyCompatibleRecipes
      ? recipes.filter((recipe) => matchUrlPattern(url, recipe.urlPatterns))
      : recipes;
    const compatibleRecipeIds = new Set(compatibleRecipes.map((recipe) => recipe.id));

    return {
      url,
      urlIndex,
      recipes: compatibleRecipes,
      skippedRecipeIds: recipes.filter((recipe) => !compatibleRecipeIds.has(recipe.id)).map((recipe) => recipe.id)
    };
  });

  const totalPlannedRuns = mappings.reduce((total, mapping) => total + mapping.recipes.length, 0);
  const skippedByCompatibility = mappings.reduce((total, mapping) => total + mapping.skippedRecipeIds.length, 0);
  const estimatedDurationMs =
    urls.length * (options.pageLoadTimeoutMs + options.waitAfterLoadMs + options.delayBetweenUrlsMs);

  return {
    mappings,
    totalPlannedRuns,
    skippedByCompatibility,
    estimatedDurationMs
  };
}
