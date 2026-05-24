import { batchDisplayName } from './batch-display';
import { DEFAULT_BATCH_RUN_OPTIONS } from './batch-planner';
import type {
  BatchRun,
  BatchRunOptions,
  BatchRunsById,
  CheckSeverity,
  LocalePreference,
  OnboardingState,
  Recipe,
  RecipeCategory,
  RecipeCheck,
  RecipeCheckAssertion,
  RecipeRun,
  RecipeSource,
  RecipesById,
  RunsById,
  ThemePreference,
  UserPreferences
} from './types';

const RECIPES_KEY = 'recipesById';
const RUNS_KEY = 'runsById';
const BATCH_RUNS_KEY = 'batchRunsById';
const PREFERENCES_KEY = 'preferences';
const ONBOARDING_KEY = 'onboarding';

type StorageKey =
  | typeof RECIPES_KEY
  | typeof RUNS_KEY
  | typeof BATCH_RUNS_KEY
  | typeof PREFERENCES_KEY
  | typeof ONBOARDING_KEY;

type StorageShape = {
  [RECIPES_KEY]: RecipesById;
  [RUNS_KEY]: RunsById;
  [BATCH_RUNS_KEY]: BatchRunsById;
  [PREFERENCES_KEY]: UserPreferences;
  [ONBOARDING_KEY]: OnboardingState;
};

function defaultOnboardingState(): OnboardingState {
  return {
    completed: false,
    selectedStarterRecipeIds: []
  };
}

function defaultValue<K extends StorageKey>(key: K): StorageShape[K] {
  if (key === PREFERENCES_KEY) {
    return defaultPreferences() as StorageShape[K];
  }

  if (key === ONBOARDING_KEY) {
    return defaultOnboardingState() as StorageShape[K];
  }

  return {} as StorageShape[K];
}

function hasChromeStorage(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);
}

function fallbackRead<K extends StorageKey>(key: K): StorageShape[K] {
  const rawValue = globalThis.localStorage?.getItem(key);
  if (!rawValue) {
    return defaultValue(key);
  }

  try {
    const parsed: unknown = JSON.parse(rawValue);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as StorageShape[K];
    }
  } catch {
    globalThis.localStorage?.removeItem(key);
  }

  return defaultValue(key);
}

function fallbackWrite<K extends StorageKey>(key: K, value: StorageShape[K]): void {
  globalThis.localStorage?.setItem(key, JSON.stringify(value));
}

function defaultPreferences(): UserPreferences {
  return {
    theme: 'system',
    locale: 'en-US',
    exportOptions: {
      includeRecipes: true,
      includeCsv: true,
      includeManifest: true
    }
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

function isLocalePreference(value: unknown): value is LocalePreference {
  return value === 'en-US' || value === 'pt-BR';
}

function normalizePreferences(value: unknown): UserPreferences {
  const defaults = defaultPreferences();
  if (!isRecord(value)) {
    return defaults;
  }

  const exportOptions = isRecord(value.exportOptions)
    ? {
        includeRecipes:
          typeof value.exportOptions.includeRecipes === 'boolean'
            ? value.exportOptions.includeRecipes
            : (defaults.exportOptions?.includeRecipes ?? true),
        includeCsv:
          typeof value.exportOptions.includeCsv === 'boolean'
            ? value.exportOptions.includeCsv
            : (defaults.exportOptions?.includeCsv ?? true),
        includeManifest:
          typeof value.exportOptions.includeManifest === 'boolean'
            ? value.exportOptions.includeManifest
            : (defaults.exportOptions?.includeManifest ?? true)
      }
    : defaults.exportOptions;

  return {
    theme: isThemePreference(value.theme) ? value.theme : defaults.theme,
    locale: isLocalePreference(value.locale) ? value.locale : defaults.locale,
    exportOptions
  };
}

const recipeCategories = new Set<string>([
  'seo',
  'metadata',
  'structured-data',
  'content',
  'ecommerce',
  'links',
  'images',
  'social',
  'qa',
  'custom'
]);

const recipeSources = new Set<string>(['default', 'user', 'imported', 'gallery']);
const checkSeverities = new Set<string>(['info', 'warning', 'error']);
const batchRunStatuses = new Set<string>(['draft', 'running', 'completed', 'cancelled', 'failed']);
const batchRunEventStatuses = new Set<string>(['pending', 'running', 'success', 'warning', 'failed', 'skipped']);
const onUrlErrorOptions = new Set<string>(['stop', 'skip', 'retryThenSkip']);
const onRecipeErrorOptions = new Set<string>(['stop', 'skipRecipe', 'continue']);
const checkAssertionTypes = new Set<string>([
  'exists',
  'notExists',
  'countEquals',
  'countGreaterThan',
  'countGreaterThanOrEqual',
  'countLessThan',
  'countLessThanOrEqual',
  'missingAttributeCountEquals',
  'emptyAttributeCountEquals',
  'eachElementMustHave',
  'eachElementShouldHave'
]);

function isRecipeCategory(value: unknown): value is RecipeCategory {
  return typeof value === 'string' && recipeCategories.has(value);
}

function isRecipeSource(value: unknown): value is RecipeSource {
  return typeof value === 'string' && recipeSources.has(value);
}

function isCheckSeverity(value: unknown): value is CheckSeverity {
  return typeof value === 'string' && checkSeverities.has(value);
}

function normalizeCheckAssertion(value: unknown): RecipeCheckAssertion | null {
  if (!isRecord(value) || typeof value.type !== 'string' || !checkAssertionTypes.has(value.type)) {
    return null;
  }

  if (value.type === 'exists' || value.type === 'notExists') {
    return {
      type: value.type
    };
  }

  if (
    value.type === 'countEquals' ||
    value.type === 'countGreaterThan' ||
    value.type === 'countGreaterThanOrEqual' ||
    value.type === 'countLessThan' ||
    value.type === 'countLessThanOrEqual'
  ) {
    return typeof value.value === 'number' && Number.isFinite(value.value)
      ? {
          type: value.type,
          value: value.value
        }
      : null;
  }

  if (value.type === 'missingAttributeCountEquals' || value.type === 'emptyAttributeCountEquals') {
    return typeof value.attribute === 'string' &&
      value.attribute.trim() &&
      typeof value.value === 'number' &&
      Number.isFinite(value.value)
      ? {
          type: value.type,
          attribute: value.attribute.trim(),
          value: value.value
        }
      : null;
  }

  if (value.type === 'eachElementMustHave' || value.type === 'eachElementShouldHave') {
    return typeof value.selector === 'string' && value.selector.trim()
      ? {
          type: value.type,
          selector: value.selector.trim()
        }
      : null;
  }

  return null;
}

function normalizeRecipeChecks(value: unknown): RecipeCheck[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((check): RecipeCheck | null => {
      const assertion = normalizeCheckAssertion(check.assertion);
      if (
        typeof check.name !== 'string' ||
        !check.name.trim() ||
        typeof check.selector !== 'string' ||
        !check.selector.trim() ||
        !assertion
      ) {
        return null;
      }

      return {
        id: typeof check.id === 'string' && check.id.trim() ? check.id.trim() : crypto.randomUUID(),
        name: check.name.trim(),
        description:
          typeof check.description === 'string' && check.description.trim() ? check.description.trim() : undefined,
        selector: check.selector.trim(),
        assertion,
        severity: isCheckSeverity(check.severity) ? check.severity : 'warning'
      };
    })
    .filter((check): check is RecipeCheck => Boolean(check));
}

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter((tag): tag is string => typeof tag === 'string')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

function normalizeRecipe(recipe: Recipe): Recipe {
  const value = recipe as Recipe & {
    category?: unknown;
    tags?: unknown;
    source?: unknown;
  };

  return {
    ...recipe,
    category: isRecipeCategory(value.category) ? value.category : 'custom',
    tags: normalizeTags(value.tags),
    source: isRecipeSource(value.source) ? value.source : 'user',
    checks: normalizeRecipeChecks(value.checks)
  };
}

function normalizeNumber(value: unknown, fallback: number, minimum = 0): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= minimum ? value : fallback;
}

function normalizeBatchOptions(value: unknown): BatchRunOptions {
  if (!isRecord(value)) {
    return DEFAULT_BATCH_RUN_OPTIONS;
  }

  return {
    runOnlyCompatibleRecipes:
      typeof value.runOnlyCompatibleRecipes === 'boolean'
        ? value.runOnlyCompatibleRecipes
        : DEFAULT_BATCH_RUN_OPTIONS.runOnlyCompatibleRecipes,
    delayBetweenUrlsMs: normalizeNumber(value.delayBetweenUrlsMs, DEFAULT_BATCH_RUN_OPTIONS.delayBetweenUrlsMs),
    pageLoadTimeoutMs: normalizeNumber(value.pageLoadTimeoutMs, DEFAULT_BATCH_RUN_OPTIONS.pageLoadTimeoutMs, 1000),
    waitAfterLoadMs: normalizeNumber(value.waitAfterLoadMs, DEFAULT_BATCH_RUN_OPTIONS.waitAfterLoadMs),
    retryFailedUrls: normalizeNumber(value.retryFailedUrls, DEFAULT_BATCH_RUN_OPTIONS.retryFailedUrls),
    onUrlError:
      typeof value.onUrlError === 'string' && onUrlErrorOptions.has(value.onUrlError)
        ? (value.onUrlError as BatchRunOptions['onUrlError'])
        : DEFAULT_BATCH_RUN_OPTIONS.onUrlError,
    onRecipeError:
      typeof value.onRecipeError === 'string' && onRecipeErrorOptions.has(value.onRecipeError)
        ? (value.onRecipeError as BatchRunOptions['onRecipeError'])
        : DEFAULT_BATCH_RUN_OPTIONS.onRecipeError,
    saveSuccessfulRuns:
      typeof value.saveSuccessfulRuns === 'boolean'
        ? value.saveSuccessfulRuns
        : DEFAULT_BATCH_RUN_OPTIONS.saveSuccessfulRuns,
    saveWarningRuns:
      typeof value.saveWarningRuns === 'boolean' ? value.saveWarningRuns : DEFAULT_BATCH_RUN_OPTIONS.saveWarningRuns,
    saveFailedRuns:
      typeof value.saveFailedRuns === 'boolean' ? value.saveFailedRuns : DEFAULT_BATCH_RUN_OPTIONS.saveFailedRuns,
    processingTabMode: 'dedicatedPinnedTab'
  };
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim());
}

function normalizeBatchRun(value: unknown): BatchRun | null {
  if (!isRecord(value) || typeof value.id !== 'string') {
    return null;
  }

  const batchId = value.id;
  const events = Array.isArray(value.events)
    ? value.events.filter(isRecord).map((event) => ({
        id: typeof event.id === 'string' && event.id.trim() ? event.id.trim() : crypto.randomUUID(),
        batchId: typeof event.batchId === 'string' && event.batchId.trim() ? event.batchId.trim() : batchId,
        url: typeof event.url === 'string' ? event.url : '',
        recipeId: typeof event.recipeId === 'string' ? event.recipeId : undefined,
        recipeName: typeof event.recipeName === 'string' ? event.recipeName : undefined,
        status:
          typeof event.status === 'string' && batchRunEventStatuses.has(event.status)
            ? (event.status as BatchRun['events'][number]['status'])
            : 'skipped',
        message: typeof event.message === 'string' ? event.message : undefined,
        startedAt: typeof event.startedAt === 'string' ? event.startedAt : undefined,
        completedAt: typeof event.completedAt === 'string' ? event.completedAt : undefined,
        runId: typeof event.runId === 'string' ? event.runId : undefined
      }))
    : [];

  const createdAt = typeof value.createdAt === 'string' ? value.createdAt : new Date().toISOString();
  const updatedAt = typeof value.updatedAt === 'string' ? value.updatedAt : createdAt;
  const name =
    typeof value.name === 'string' && value.name.trim()
      ? value.name.trim()
      : batchDisplayName({ name: undefined, createdAt });

  return {
    id: value.id,
    name,
    status:
      typeof value.status === 'string' && batchRunStatuses.has(value.status)
        ? (value.status as BatchRun['status'])
        : 'draft',
    createdAt,
    updatedAt,
    startedAt: typeof value.startedAt === 'string' ? value.startedAt : undefined,
    completedAt: typeof value.completedAt === 'string' ? value.completedAt : undefined,
    processingTabId: typeof value.processingTabId === 'number' ? value.processingTabId : undefined,
    urls: normalizeStringArray(value.urls),
    recipeIds: normalizeStringArray(value.recipeIds),
    options: normalizeBatchOptions(value.options),
    totalPlannedRuns: normalizeNumber(value.totalPlannedRuns, 0),
    completedRuns: normalizeNumber(value.completedRuns, 0),
    successfulRuns: normalizeNumber(value.successfulRuns, 0),
    warningRuns: normalizeNumber(value.warningRuns, 0),
    failedRuns: normalizeNumber(value.failedRuns, 0),
    skippedRuns: normalizeNumber(value.skippedRuns, 0),
    events
  };
}

function getStorageValue<K extends StorageKey>(key: K): Promise<StorageShape[K]> {
  if (!hasChromeStorage()) {
    return Promise.resolve(fallbackRead(key));
  }

  return new Promise((resolve, reject) => {
    chrome.storage.local.get([key], (result) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }

      const value = result[key] as StorageShape[K] | undefined;
      resolve(value ?? defaultValue(key));
    });
  });
}

function setStorageValue<K extends StorageKey>(key: K, value: StorageShape[K]): Promise<void> {
  if (!hasChromeStorage()) {
    fallbackWrite(key, value);
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [key]: value }, () => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }

      resolve();
    });
  });
}

export async function listRecipes(): Promise<Recipe[]> {
  const recipesById = await getStorageValue(RECIPES_KEY);
  return Object.values(recipesById)
    .map(normalizeRecipe)
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function getRecipe(id: string): Promise<Recipe | undefined> {
  const recipesById = await getStorageValue(RECIPES_KEY);
  const recipe = recipesById[id];
  return recipe ? normalizeRecipe(recipe) : undefined;
}

export async function saveRecipe(recipe: Recipe): Promise<void> {
  const recipesById = await getStorageValue(RECIPES_KEY);
  await setStorageValue(RECIPES_KEY, {
    ...recipesById,
    [recipe.id]: normalizeRecipe(recipe)
  });
}

export async function deleteRecipe(id: string): Promise<void> {
  const recipesById = await getStorageValue(RECIPES_KEY);
  const nextRecipesById = { ...recipesById };
  delete nextRecipesById[id];
  await setStorageValue(RECIPES_KEY, nextRecipesById);
}

export async function listRuns(): Promise<RecipeRun[]> {
  const runsById = await getStorageValue(RUNS_KEY);
  return Object.values(runsById).sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function getRun(id: string): Promise<RecipeRun | undefined> {
  const runsById = await getStorageValue(RUNS_KEY);
  return runsById[id];
}

export async function saveRun(run: RecipeRun): Promise<void> {
  const runsById = await getStorageValue(RUNS_KEY);
  await setStorageValue(RUNS_KEY, {
    ...runsById,
    [run.id]: run
  });
}

export async function deleteRun(id: string): Promise<void> {
  const runsById = await getStorageValue(RUNS_KEY);
  const nextRunsById = { ...runsById };
  delete nextRunsById[id];
  await setStorageValue(RUNS_KEY, nextRunsById);
}

export async function clearRuns(): Promise<void> {
  await setStorageValue(RUNS_KEY, {});
}

export async function listBatchRuns(): Promise<BatchRun[]> {
  const batchRunsById = await getStorageValue(BATCH_RUNS_KEY);
  return Object.values(batchRunsById)
    .map(normalizeBatchRun)
    .filter((batchRun): batchRun is BatchRun => Boolean(batchRun))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function getBatchRun(id: string): Promise<BatchRun | undefined> {
  const batchRunsById = await getStorageValue(BATCH_RUNS_KEY);
  const batchRun = normalizeBatchRun(batchRunsById[id]);
  return batchRun ?? undefined;
}

export async function saveBatchRun(batchRun: BatchRun): Promise<void> {
  const batchRunsById = await getStorageValue(BATCH_RUNS_KEY);
  const normalizedBatchRun = normalizeBatchRun(batchRun) ?? batchRun;
  await setStorageValue(BATCH_RUNS_KEY, {
    ...batchRunsById,
    [normalizedBatchRun.id]: normalizedBatchRun
  });
}

export async function updateBatchRun(id: string, patch: Partial<BatchRun>): Promise<BatchRun | undefined> {
  const batchRunsById = await getStorageValue(BATCH_RUNS_KEY);
  const currentBatchRun = normalizeBatchRun(batchRunsById[id]);
  if (!currentBatchRun) {
    return undefined;
  }

  const nextBatchRun = {
    ...currentBatchRun,
    ...patch,
    id,
    updatedAt: patch.updatedAt ?? new Date().toISOString()
  };

  await setStorageValue(BATCH_RUNS_KEY, {
    ...batchRunsById,
    [id]: nextBatchRun
  });

  return nextBatchRun;
}

export async function deleteBatchRun(id: string): Promise<void> {
  const batchRunsById = await getStorageValue(BATCH_RUNS_KEY);
  const nextBatchRunsById = { ...batchRunsById };
  delete nextBatchRunsById[id];
  await setStorageValue(BATCH_RUNS_KEY, nextBatchRunsById);
}

export async function getPreferences(): Promise<UserPreferences> {
  const preferences = await getStorageValue(PREFERENCES_KEY);
  return normalizePreferences(preferences);
}

export async function savePreferences(preferences: UserPreferences): Promise<void> {
  await setStorageValue(PREFERENCES_KEY, normalizePreferences(preferences));
}

export async function updatePreferences(partialPreferences: Partial<UserPreferences>): Promise<UserPreferences> {
  const currentPreferences = await getPreferences();
  const nextPreferences = normalizePreferences({
    ...currentPreferences,
    ...partialPreferences,
    exportOptions: partialPreferences.exportOptions
      ? {
          ...currentPreferences.exportOptions,
          ...partialPreferences.exportOptions
        }
      : currentPreferences.exportOptions
  });

  await savePreferences(nextPreferences);
  return nextPreferences;
}

export async function getOnboardingState(): Promise<OnboardingState> {
  const raw = await getStorageValue(ONBOARDING_KEY);
  if (typeof raw?.completed !== 'boolean') {
    return defaultOnboardingState();
  }
  return {
    completed: raw.completed,
    completedAt: typeof raw.completedAt === 'string' ? raw.completedAt : undefined,
    skipped: typeof raw.skipped === 'boolean' ? raw.skipped : undefined,
    selectedStarterRecipeIds: Array.isArray(raw.selectedStarterRecipeIds)
      ? (raw.selectedStarterRecipeIds as string[]).filter((id): id is string => typeof id === 'string')
      : []
  };
}

export async function saveOnboardingState(state: OnboardingState): Promise<void> {
  await setStorageValue(ONBOARDING_KEY, state);
}

export async function completeOnboarding(selectedStarterRecipeIds: string[]): Promise<void> {
  await saveOnboardingState({
    completed: true,
    completedAt: new Date().toISOString(),
    skipped: false,
    selectedStarterRecipeIds
  });
}

export async function skipOnboarding(): Promise<void> {
  await saveOnboardingState({
    completed: true,
    completedAt: new Date().toISOString(),
    skipped: true,
    selectedStarterRecipeIds: []
  });
}

export async function resetOnboarding(): Promise<void> {
  await saveOnboardingState(defaultOnboardingState());
}
