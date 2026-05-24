import JSZip from 'jszip';
import { runsToCsv } from './csv';
import { safeFilename } from './filename';
import type { BatchRun, Recipe, RecipeRun } from './types';

type ExportManifest = {
  app: 'ExtractKit';
  formatVersion: '1';
  exportedAt: string;
  runCount: number;
  recipeCount: number;
  batchCount?: number;
};

function jsonFile(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function recipeName(recipe: Recipe): string {
  return safeFilename(`${recipe.name}-${recipe.version}-${recipe.id}`, recipe.id);
}

function runName(run: RecipeRun): string {
  const date = safeFilename(run.createdAt.replace(/[:.]/g, '-'), 'run');
  return safeFilename(`${date}-${run.recipeName}-${run.id}`, run.id);
}

export async function exportRunsToZip(runs: RecipeRun[], recipes: Recipe[], batches: BatchRun[] = []): Promise<Blob> {
  const zip = new JSZip();
  const recipeIds = new Set(runs.map((run) => run.recipeId));
  const includedRecipes = recipes.filter((recipe) => recipeIds.has(recipe.id));
  const manifest: ExportManifest = {
    app: 'ExtractKit',
    formatVersion: '1',
    exportedAt: new Date().toISOString(),
    runCount: runs.length,
    recipeCount: includedRecipes.length,
    batchCount: batches.length || undefined
  };

  zip.file('manifest.json', jsonFile(manifest));

  for (const recipe of includedRecipes) {
    zip.file(`recipes/${recipeName(recipe)}.recipe.json`, jsonFile(recipe));
  }

  for (const run of runs) {
    zip.file(`runs/${runName(run)}.json`, jsonFile(run));
  }

  zip.file('data/all-runs.json', jsonFile(runs));
  zip.file('data/all-runs.csv', runsToCsv(runs));
  if (batches.length > 0) {
    zip.file('data/batches.json', jsonFile(batches));
  }

  return zip.generateAsync({ type: 'blob' });
}
