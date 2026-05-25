import JSZip from 'jszip';
import {
  createFlattenedRunsCsv,
  createNestedCollectionCsvs,
  createRecipeCsv,
  createRunsJsonl,
  createRunsSummaryCsv,
  groupRunsByRecipe,
  runsToCsv
} from './csv';
import { safeFilename } from './filename';
import { createAllRunsMarkdown, createRunMarkdown } from './markdown';
import type { BatchRun, Recipe, RecipeRun } from './types';

type ExportManifest = {
  app: 'ExtractKit';
  formatVersion: '1';
  exportedAt: string;
  runCount: number;
  recipeCount: number;
  batchCount?: number;
  formats: {
    json: true;
    csv: true;
    csvSummary: true;
    csvFlattened: true;
    jsonl: true;
    csvByRecipe: true;
    csvNestedCollections: true;
    markdown: true;
  };
  fileCounts?: {
    recipeCsv: number;
    nestedCsv: number;
    markdownRuns: number;
  };
  batchSummary?: {
    batchName: string;
    status: BatchRun['status'];
    urlCount: number;
    totalPlannedRuns: number;
    successfulRuns: number;
    warningRuns: number;
    failedRuns: number;
    skippedRuns: number;
  };
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

function batchSummary(batch: BatchRun): ExportManifest['batchSummary'] {
  return {
    batchName: batch.name,
    status: batch.status,
    urlCount: batch.urls.length,
    totalPlannedRuns: batch.totalPlannedRuns,
    successfulRuns: batch.successfulRuns,
    warningRuns: batch.warningRuns,
    failedRuns: batch.failedRuns,
    skippedRuns: batch.skippedRuns
  };
}

export async function exportRunsToZip(runs: RecipeRun[], recipes: Recipe[], batches: BatchRun[] = []): Promise<Blob> {
  const zip = new JSZip();
  const recipeIds = new Set(runs.map((run) => run.recipeId));
  const includedRecipes = recipes.filter((recipe) => recipeIds.has(recipe.id));
  const runsByRecipe = groupRunsByRecipe(runs);
  const nestedCollectionCsvs = createNestedCollectionCsvs(runs);
  const manifest: ExportManifest = {
    app: 'ExtractKit',
    formatVersion: '1',
    exportedAt: new Date().toISOString(),
    runCount: runs.length,
    recipeCount: includedRecipes.length,
    batchCount: batches.length || undefined,
    formats: {
      json: true,
      csv: true,
      csvSummary: true,
      csvFlattened: true,
      jsonl: true,
      csvByRecipe: true,
      csvNestedCollections: true,
      markdown: true
    },
    fileCounts: {
      recipeCsv: runsByRecipe.size,
      nestedCsv: nestedCollectionCsvs.length,
      markdownRuns: runs.length
    },
    batchSummary: batches.length === 1 ? batchSummary(batches[0]) : undefined
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
  zip.file('data/runs-summary.csv', createRunsSummaryCsv(runs));
  zip.file('data/runs-flattened.csv', createFlattenedRunsCsv(runs));
  zip.file('data/all-runs.jsonl', createRunsJsonl(runs));

  for (const [recipeId, recipeRuns] of runsByRecipe) {
    zip.file(`data/by-recipe/${safeFilename(recipeId, 'recipe')}.csv`, createRecipeCsv(recipeRuns));
  }

  for (const nestedCsv of nestedCollectionCsvs) {
    const recipeFileName = safeFilename(nestedCsv.recipeId, 'recipe');
    const fieldFileName = safeFilename(nestedCsv.fieldKey ?? 'items', 'items');
    zip.file(`data/by-recipe/nested/${recipeFileName}--${fieldFileName}.csv`, nestedCsv.csv);
  }

  zip.file('data/markdown/all-runs.md', createAllRunsMarkdown(runs, batches));
  for (const run of runs) {
    zip.file(`data/markdown/runs/${safeFilename(run.id, 'run')}.md`, createRunMarkdown(run));
  }

  if (batches.length > 0) {
    zip.file('data/batches.json', jsonFile(batches));
  }

  return zip.generateAsync({ type: 'blob' });
}
