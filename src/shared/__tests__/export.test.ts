import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { exportRunsToZip } from '../export';
import type { BatchRun, Recipe, RecipeRun } from '../types';

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 'recipe-1',
    name: 'My Recipe',
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

function makeRun(overrides: Partial<RecipeRun> = {}): RecipeRun {
  return {
    id: 'run-1',
    recipeId: 'recipe-1',
    recipeVersion: '1.0.0',
    recipeName: 'My Recipe',
    url: 'https://example.com/p',
    domain: 'example.com',
    status: 'success',
    createdAt: '2024-05-01T00:00:00Z',
    durationMs: 50,
    data: { title: 'A', items: [{ id: 1 }] },
    warnings: [],
    errors: [],
    ...overrides
  };
}

function makeBatch(): BatchRun {
  return {
    id: 'b1',
    name: 'B1',
    status: 'completed',
    createdAt: '2024-05-01T00:00:00Z',
    updatedAt: '2024-05-01T00:00:00Z',
    urls: ['https://example.com'],
    recipeIds: ['recipe-1'],
    options: {} as BatchRun['options'],
    totalPlannedRuns: 1,
    completedRuns: 1,
    successfulRuns: 1,
    warningRuns: 0,
    failedRuns: 0,
    skippedRuns: 0,
    events: []
  };
}

describe('exportRunsToZip', () => {
  it('produces a zip with manifest, recipes, runs and aggregated CSVs', async () => {
    const blob = await exportRunsToZip([makeRun()], [makeRecipe()], []);
    const buffer = await blob.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);

    expect(zip.file('manifest.json')).not.toBeNull();
    expect(Object.keys(zip.files).some((name) => name.startsWith('recipes/'))).toBe(true);
    expect(Object.keys(zip.files).some((name) => name.startsWith('runs/'))).toBe(true);
    expect(zip.file('data/all-runs.csv')).not.toBeNull();
    expect(zip.file('data/runs-summary.csv')).not.toBeNull();
    expect(zip.file('data/runs-flattened.csv')).not.toBeNull();
    expect(zip.file('data/all-runs.jsonl')).not.toBeNull();
    expect(zip.file('data/markdown/all-runs.md')).not.toBeNull();
  });

  it('includes batch summary when one batch is provided', async () => {
    const blob = await exportRunsToZip([makeRun()], [makeRecipe()], [makeBatch()]);
    const buffer = await blob.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);
    const manifest = JSON.parse((await zip.file('manifest.json')?.async('string')) ?? '{}');
    expect(manifest.batchSummary?.batchName).toBe('B1');
    expect(zip.file('data/batches.json')).not.toBeNull();
  });
});
