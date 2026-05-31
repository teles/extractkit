import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearRuns,
  completeOnboarding,
  deleteBatchRun,
  deleteRecipe,
  deleteRun,
  getBatchRun,
  getOnboardingState,
  getPreferences,
  getRecipe,
  getRun,
  listBatchRuns,
  listRecipes,
  listRuns,
  resetOnboarding,
  saveBatchRun,
  savePreferences,
  saveRecipe,
  saveRun,
  skipOnboarding,
  updateBatchRun,
  updatePreferences
} from '../storage';
import type { BatchRun, Recipe, RecipeRun } from '../types';

function recipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 'r1',
    name: 'Recipe',
    category: 'custom',
    tags: [],
    source: 'user',
    urlPatterns: ['*'],
    version: '1.0.0',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    fields: [],
    ...overrides
  };
}

function run(overrides: Partial<RecipeRun> = {}): RecipeRun {
  return {
    id: 'run-1',
    recipeId: 'r1',
    recipeVersion: '1.0.0',
    recipeName: 'Recipe',
    url: 'https://example.com',
    domain: 'example.com',
    status: 'success',
    createdAt: '2024-05-01T00:00:00Z',
    durationMs: 1,
    data: {},
    warnings: [],
    errors: [],
    ...overrides
  };
}

function batchRun(overrides: Partial<BatchRun> = {}): BatchRun {
  return {
    id: 'b1',
    name: 'Batch',
    status: 'draft',
    createdAt: '2024-05-01T00:00:00Z',
    updatedAt: '2024-05-01T00:00:00Z',
    urls: ['https://example.com'],
    recipeIds: ['r1'],
    options: {} as BatchRun['options'],
    totalPlannedRuns: 0,
    completedRuns: 0,
    successfulRuns: 0,
    warningRuns: 0,
    failedRuns: 0,
    skippedRuns: 0,
    events: [],
    ...overrides
  };
}

beforeEach(async () => {
  await new Promise<void>((resolve) => chrome.storage.local.clear(resolve));
});

afterEach(async () => {
  await new Promise<void>((resolve) => chrome.storage.local.clear(resolve));
});

describe('storage: recipes', () => {
  it('saves and lists recipes alphabetically', async () => {
    await saveRecipe(recipe({ id: 'b', name: 'Bravo' }));
    await saveRecipe(recipe({ id: 'a', name: 'Alpha' }));
    const recipes = await listRecipes();
    expect(recipes.map((r) => r.id)).toEqual(['a', 'b']);
  });

  it('returns undefined for missing recipe', async () => {
    expect(await getRecipe('missing')).toBeUndefined();
  });

  it('deletes recipes', async () => {
    await saveRecipe(recipe());
    await deleteRecipe('r1');
    expect(await getRecipe('r1')).toBeUndefined();
  });
});

describe('storage: runs', () => {
  it('saves, lists and deletes runs', async () => {
    await saveRun(run({ id: '1', createdAt: '2024-05-01T00:00:00Z' }));
    await saveRun(run({ id: '2', createdAt: '2024-05-02T00:00:00Z' }));
    const runs = await listRuns();
    expect(runs.map((r) => r.id)).toEqual(['2', '1']);
    expect(await getRun('1')).toBeDefined();

    await deleteRun('1');
    expect(await getRun('1')).toBeUndefined();

    await clearRuns();
    expect(await listRuns()).toEqual([]);
  });
});

describe('storage: batch runs', () => {
  it('saves and updates batch runs', async () => {
    await saveBatchRun(batchRun());
    expect((await listBatchRuns()).length).toBe(1);

    const updated = await updateBatchRun('b1', { status: 'running' });
    expect(updated?.status).toBe('running');

    expect(await updateBatchRun('missing', {})).toBeUndefined();
  });

  it('deletes batch runs', async () => {
    await saveBatchRun(batchRun());
    await deleteBatchRun('b1');
    expect(await getBatchRun('b1')).toBeUndefined();
  });
});

describe('storage: preferences', () => {
  it('returns defaults when nothing is stored', async () => {
    const prefs = await getPreferences();
    expect(prefs.theme).toBe('system');
    expect(prefs.locale).toBe('en-US');
  });

  it('persists and merges partial updates', async () => {
    await savePreferences({ ...(await getPreferences()), theme: 'dark' });
    expect((await getPreferences()).theme).toBe('dark');

    const updated = await updatePreferences({ locale: 'pt-BR' });
    expect(updated.locale).toBe('pt-BR');
    expect(updated.theme).toBe('dark');
  });

  it('normalizes invalid custom viewport sizes', async () => {
    await updatePreferences({
      processingViewport: { preset: 'custom', customWidth: 10, customHeight: 200 }
    });
    const prefs = await getPreferences();
    expect(prefs.processingViewport).toMatchObject({ preset: 'custom' });
    expect(prefs.processingViewport?.customWidth).toBeUndefined();
  });
});

describe('storage: onboarding', () => {
  it('returns the default state when none is stored', async () => {
    const state = await getOnboardingState();
    expect(state.completed).toBe(false);
  });

  it('completes and resets onboarding', async () => {
    await completeOnboarding(['a', 'b']);
    let state = await getOnboardingState();
    expect(state.completed).toBe(true);
    expect(state.skipped).toBe(false);
    expect(state.selectedStarterRecipeIds).toEqual(['a', 'b']);

    await resetOnboarding();
    state = await getOnboardingState();
    expect(state.completed).toBe(false);
  });

  it('marks onboarding as skipped', async () => {
    await skipOnboarding();
    const state = await getOnboardingState();
    expect(state.completed).toBe(true);
    expect(state.skipped).toBe(true);
  });
});
