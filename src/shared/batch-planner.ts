import type { BatchRunOptions, Recipe } from './types';
import { matchUrlPattern } from './url-pattern';

export type NormalizedUrlInput = {
  validUrls: string[];
  invalidUrls: string[];
  unsupportedUrls: string[];
  invalidItems: UrlValidationIssue[];
  duplicateCount: number;
};

export type UrlValidationReason = 'invalid' | 'unsupported';

export type UrlValidationIssue = {
  value: string;
  reason: UrlValidationReason;
  message: string;
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
  urlsWithNoCompatibleRecipes: string[];
  estimatedDurationMs: number;
};

export const DEFAULT_BATCH_RUN_OPTIONS: BatchRunOptions = {
  runOnlyCompatibleRecipes: true,
  skipHttpErrorPages: true,
  skipHttpStatusCodes: [400, 401, 403, 404, 410, 429, 500, 502, 503, 504],
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

function cleanUrlCandidate(value: string): string {
  return value.trim().replace(/^["']|["']$/g, '');
}

export function validateBatchUrl(value: string): { ok: true; url: string } | { ok: false; issue: UrlValidationIssue } {
  const candidate = cleanUrlCandidate(value);

  if (!candidate) {
    return {
      ok: false,
      issue: {
        value,
        reason: 'invalid',
        message: 'Empty URL.'
      }
    };
  }

  try {
    const parsedUrl = new URL(candidate);
    if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
      return {
        ok: true,
        url: parsedUrl.toString()
      };
    }

    return {
      ok: false,
      issue: {
        value: candidate,
        reason: 'unsupported',
        message: `Unsupported URL scheme: ${parsedUrl.protocol}`
      }
    };
  } catch {
    return {
      ok: false,
      issue: {
        value: candidate,
        reason: 'invalid',
        message: 'Invalid URL format.'
      }
    };
  }
}

export function isSupportedBatchUrl(url: string): boolean {
  return validateBatchUrl(url).ok;
}

export function normalizeUrlInput(value: string): NormalizedUrlInput {
  const seen = new Set<string>();
  const validUrls: string[] = [];
  const invalidUrls: string[] = [];
  const unsupportedUrls: string[] = [];
  const invalidItems: UrlValidationIssue[] = [];
  let duplicateCount = 0;

  for (const rawLine of value.split(/\r?\n/)) {
    const line = cleanUrlCandidate(rawLine);
    if (!line) {
      continue;
    }

    const validation = validateBatchUrl(line);
    if (!validation.ok) {
      invalidItems.push(validation.issue);
      if (validation.issue.reason === 'unsupported') {
        unsupportedUrls.push(validation.issue.value);
      } else {
        invalidUrls.push(validation.issue.value);
      }
      continue;
    }

    const normalizedUrl = validation.url;
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
    unsupportedUrls,
    invalidItems,
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
  const urlsWithNoCompatibleRecipes = mappings
    .filter((mapping) => mapping.recipes.length === 0)
    .map((mapping) => mapping.url);
  const estimatedDurationMs =
    urls.length * (Math.min(options.pageLoadTimeoutMs, 5000) + options.waitAfterLoadMs) +
    Math.max(0, urls.length - 1) * options.delayBetweenUrlsMs +
    totalPlannedRuns * 750;

  return {
    mappings,
    totalPlannedRuns,
    skippedByCompatibility,
    urlsWithNoCompatibleRecipes,
    estimatedDurationMs
  };
}
