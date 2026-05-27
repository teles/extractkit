import headingsOutlineJson from '../../recipes/default/headings-outline.recipe.json';
import imageSeOQaJson from '../../recipes/default/image-seo-qa.recipe.json';
import jsonLdStructuredDataJson from '../../recipes/default/json-ld-structured-data.recipe.json';
import openGraphTagsJson from '../../recipes/default/open-graph-tags.recipe.json';
import pageImagesJson from '../../recipes/default/page-images.recipe.json';
import pageLinksJson from '../../recipes/default/page-links.recipe.json';
import pageMetadataJson from '../../recipes/default/page-metadata.recipe.json';
import seoSnapshotJson from '../../recipes/default/seo-snapshot.recipe.json';
import { normalizeRecipe } from './recipe-import';
import { listRecipes, saveRecipe } from './storage';
import type { Recipe } from './types';

/**
 * Normalizes a bundled default recipe JSON and enforces source: 'default'.
 * Throws loudly if the JSON is structurally invalid so broken recipe files
 * are caught at startup rather than silently ignored.
 */
function loadDefaultRecipe(json: unknown, filename: string): Recipe {
  const normalized = normalizeRecipe(json);
  if (!normalized) {
    throw new Error(`[ExtractKit] Invalid bundled default recipe: ${filename}`);
  }

  return { ...normalized, source: 'default' };
}

// Explicit order determines display order in the UI.
const defaultRecipeJsons: Array<[unknown, string]> = [
  [pageMetadataJson, 'page-metadata'],
  [openGraphTagsJson, 'open-graph-tags'],
  [headingsOutlineJson, 'headings-outline'],
  [pageLinksJson, 'page-links'],
  [pageImagesJson, 'page-images'],
  [jsonLdStructuredDataJson, 'json-ld-structured-data'],
  [seoSnapshotJson, 'seo-snapshot'],
  [imageSeOQaJson, 'image-seo-qa']
];

export function getDefaultRecipes(): Recipe[] {
  return defaultRecipeJsons.map(([json, filename]) => loadDefaultRecipe(json, filename));
}

function isDefaultRecipeRecord(existingRecipe: Recipe, defaultRecipe: Recipe): boolean {
  return (
    existingRecipe.source === 'default' ||
    (existingRecipe.id === defaultRecipe.id &&
      existingRecipe.name === defaultRecipe.name &&
      existingRecipe.version === defaultRecipe.version)
  );
}

function mergeMissingDefaultChecks(existingRecipe: Recipe, defaultRecipe: Recipe): Recipe | null {
  const defaultChecks = defaultRecipe.checks ?? [];
  if (defaultChecks.length === 0 || !isDefaultRecipeRecord(existingRecipe, defaultRecipe)) {
    return null;
  }

  const existingCheckIds = new Set((existingRecipe.checks ?? []).map((check) => check.id));
  const missingChecks = defaultChecks.filter((check) => !existingCheckIds.has(check.id));
  if (missingChecks.length === 0) {
    return null;
  }

  return {
    ...existingRecipe,
    source: 'default',
    checks: [...(existingRecipe.checks ?? []), ...structuredClone(missingChecks)]
  };
}

async function restoreMissingDefaultChecks(existingRecipes: Recipe[], defaultRecipes: Recipe[]): Promise<number> {
  const defaultsById = new Map(defaultRecipes.map((recipe) => [recipe.id, recipe]));
  let restoredCount = 0;

  for (const existingRecipe of existingRecipes) {
    const defaultRecipe = defaultsById.get(existingRecipe.id);
    if (!defaultRecipe) {
      continue;
    }

    const mergedRecipe = mergeMissingDefaultChecks(existingRecipe, defaultRecipe);
    if (!mergedRecipe) {
      continue;
    }

    await saveRecipe(mergedRecipe);
    restoredCount += 1;
  }

  return restoredCount;
}

export async function restoreDefaultRecipes(): Promise<number> {
  const existingRecipes = await listRecipes();
  const existingIds = new Set(existingRecipes.map((recipe) => recipe.id));
  const defaultRecipes = getDefaultRecipes();
  let restoredCount = 0;

  for (const recipe of defaultRecipes) {
    if (existingIds.has(recipe.id)) {
      continue;
    }

    await saveRecipe(recipe);
    restoredCount += 1;
  }

  return restoredCount + (await restoreMissingDefaultChecks(existingRecipes, defaultRecipes));
}

export async function ensureDefaultRecipes(): Promise<void> {
  const recipes = await listRecipes();
  if (recipes.length === 0) {
    await restoreDefaultRecipes();
    return;
  }

  await restoreMissingDefaultChecks(recipes, getDefaultRecipes());
}

export async function ensureSelectedDefaultRecipes(recipeIds: string[]): Promise<void> {
  const defaultRecipesById = new Map(getDefaultRecipes().map((r) => [r.id, r]));
  const existingIds = new Set((await listRecipes()).map((r) => r.id));

  for (const id of recipeIds) {
    const recipe = defaultRecipesById.get(id);
    if (recipe && !existingIds.has(id)) {
      await saveRecipe(recipe);
    }
  }
}
