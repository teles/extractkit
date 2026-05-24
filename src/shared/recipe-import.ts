import JSZip from 'jszip';
import type {
  CheckSeverity,
  ExtractMode,
  GroupField,
  JsonSchema,
  Recipe,
  RecipeCategory,
  RecipeCheck,
  RecipeCheckAssertion,
  RecipeField,
  RecipeSource,
  SimpleField,
  Transform
} from './types';

type UnknownRecord = Record<string, unknown>;

export type RecipeImportResult = {
  recipes: Recipe[];
  skipped: string[];
  errors: string[];
};

const extractModes = new Set<string>(['text', 'html', 'attribute', 'json', 'exists', 'count', 'tagName']);
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
const transforms = new Set<string>([
  'trim',
  'lowercase',
  'uppercase',
  'number',
  'currency',
  'absoluteUrl',
  'removeExtraSpaces',
  'jsonParse'
]);

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function optionalJsonSchema(value: unknown): JsonSchema | undefined {
  return isRecord(value) ? value : undefined;
}

function isExtractMode(value: unknown): value is ExtractMode {
  return typeof value === 'string' && extractModes.has(value);
}

function isTransform(value: unknown): value is Transform {
  return typeof value === 'string' && transforms.has(value);
}

function isRecipeCategory(value: unknown): value is RecipeCategory {
  return typeof value === 'string' && recipeCategories.has(value);
}

function isRecipeSource(value: unknown): value is RecipeSource {
  return typeof value === 'string' && recipeSources.has(value);
}

function isCheckSeverity(value: unknown): value is CheckSeverity {
  return typeof value === 'string' && checkSeverities.has(value);
}

function normalizeTransforms(value: unknown): Transform[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const validTransforms = value.filter(isTransform);
  return validTransforms.length > 0 ? validTransforms : undefined;
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
        id: stringValue(check.id) ?? crypto.randomUUID(),
        name: check.name.trim(),
        description: optionalString(check.description),
        selector: check.selector.trim(),
        assertion,
        severity: isCheckSeverity(check.severity) ? check.severity : 'warning'
      };
    })
    .filter((check): check is RecipeCheck => Boolean(check));
}

function normalizeSource(value: unknown): RecipeSource {
  if (value === 'default') {
    return 'imported';
  }

  return isRecipeSource(value) ? value : 'user';
}

function normalizeSimpleField(value: unknown): SimpleField | null {
  if (!isRecord(value) || value.kind !== 'field') {
    return null;
  }

  const key = stringValue(value.key);
  const selector = stringValue(value.selector);
  if (!key || !selector || !isExtractMode(value.extract)) {
    return null;
  }

  return {
    id: stringValue(value.id) ?? crypto.randomUUID(),
    kind: 'field',
    key,
    selector,
    required: optionalBoolean(value.required),
    extract: value.extract,
    attribute: optionalString(value.attribute),
    multiple: typeof value.multiple === 'boolean' ? value.multiple : false,
    transforms: normalizeTransforms(value.transforms)
  };
}

function normalizeGroupField(value: unknown): GroupField | null {
  if (!isRecord(value) || value.kind !== 'group' || !Array.isArray(value.fields)) {
    return null;
  }

  const key = stringValue(value.key);
  const selector = stringValue(value.selector);
  const fields = value.fields.map(normalizeSimpleField).filter((field): field is SimpleField => Boolean(field));
  if (!key || !selector || fields.length === 0) {
    return null;
  }

  return {
    id: stringValue(value.id) ?? crypto.randomUUID(),
    kind: 'group',
    key,
    selector,
    required: optionalBoolean(value.required),
    multiple: true,
    fields
  };
}

function normalizeRecipeField(value: unknown): RecipeField | null {
  const simpleField = normalizeSimpleField(value);
  if (simpleField) {
    return simpleField;
  }

  return normalizeGroupField(value);
}

function normalizeStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const strings = value.map(stringValue).filter((item): item is string => Boolean(item));
  return strings.length > 0 ? strings : fallback;
}

function normalizeRecipe(value: unknown): Recipe | null {
  if (!isRecord(value)) {
    return null;
  }

  const name = stringValue(value.name);
  if (!name || !Array.isArray(value.fields)) {
    return null;
  }

  const fields = value.fields.map(normalizeRecipeField).filter((field): field is RecipeField => Boolean(field));
  const checks = normalizeRecipeChecks(value.checks);
  if (fields.length === 0 && checks.length === 0) {
    return null;
  }

  const now = new Date().toISOString();

  return {
    id: stringValue(value.id) ?? crypto.randomUUID(),
    name,
    description: optionalString(value.description),
    category: isRecipeCategory(value.category) ? value.category : 'custom',
    tags: normalizeTags(value.tags),
    source: normalizeSource(value.source),
    urlPatterns: normalizeStringArray(value.urlPatterns, ['*']),
    version: stringValue(value.version) ?? '1.0.0',
    createdAt: stringValue(value.createdAt) ?? now,
    updatedAt: stringValue(value.updatedAt) ?? now,
    outputSchema: optionalJsonSchema(value.outputSchema),
    fields,
    checks
  };
}

function recipesFromUnknown(value: unknown): Recipe[] {
  const directRecipe = normalizeRecipe(value);
  if (directRecipe) {
    return [directRecipe];
  }

  if (Array.isArray(value)) {
    return value.map(normalizeRecipe).filter((recipe): recipe is Recipe => Boolean(recipe));
  }

  if (!isRecord(value)) {
    return [];
  }

  if (Array.isArray(value.recipes)) {
    return value.recipes.map(normalizeRecipe).filter((recipe): recipe is Recipe => Boolean(recipe));
  }

  if (isRecord(value.recipesById)) {
    return Object.values(value.recipesById)
      .map(normalizeRecipe)
      .filter((recipe): recipe is Recipe => Boolean(recipe));
  }

  return [];
}

async function importJsonText(text: string, source: string): Promise<RecipeImportResult> {
  try {
    const parsed: unknown = JSON.parse(text);
    const recipes = recipesFromUnknown(parsed);
    return {
      recipes,
      skipped: recipes.length > 0 ? [] : [`${source}: no valid recipe object found.`],
      errors: []
    };
  } catch (error) {
    return {
      recipes: [],
      skipped: [],
      errors: [`${source}: ${error instanceof Error ? error.message : 'Invalid JSON.'}`]
    };
  }
}

async function importZipFile(file: File): Promise<RecipeImportResult> {
  const zip = await JSZip.loadAsync(file);
  const jsonEntries = Object.values(zip.files).filter(
    (entry) => !entry.dir && entry.name.toLowerCase().endsWith('.json')
  );
  const recipeEntries = jsonEntries.filter((entry) => entry.name.startsWith('recipes/'));
  const entries = recipeEntries.length > 0 ? recipeEntries : jsonEntries;
  const result: RecipeImportResult = {
    recipes: [],
    skipped: [],
    errors: []
  };

  for (const entry of entries) {
    const text = await entry.async('string');
    const entryResult = await importJsonText(text, `${file.name}:${entry.name}`);
    result.recipes.push(...entryResult.recipes);
    result.skipped.push(...entryResult.skipped);
    result.errors.push(...entryResult.errors);
  }

  return result;
}

async function importSingleFile(file: File): Promise<RecipeImportResult> {
  if (file.name.toLowerCase().endsWith('.zip')) {
    return importZipFile(file);
  }

  return importJsonText(await file.text(), file.name);
}

export async function importRecipesFromFiles(files: File[]): Promise<RecipeImportResult> {
  const result: RecipeImportResult = {
    recipes: [],
    skipped: [],
    errors: []
  };

  for (const file of files) {
    try {
      const fileResult = await importSingleFile(file);
      result.recipes.push(...fileResult.recipes);
      result.skipped.push(...fileResult.skipped);
      result.errors.push(...fileResult.errors);
    } catch (error) {
      result.errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Could not read file.'}`);
    }
  }

  return result;
}
