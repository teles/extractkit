#!/usr/bin/env node
// @ts-check
/**
 * Validates all bundled default recipe JSON files.
 *
 * Checks performed:
 *  - File is valid JSON
 *  - Recipe has required top-level fields (id, name, fields)
 *  - Fields array is non-empty
 *  - All recipe IDs are unique
 *  - All field IDs are unique within a recipe
 *  - All sibling field keys are unique within the same object/group
 *  - All extract modes are supported
 *  - All transforms are supported
 *  - All check assertion types are supported
 *  - All check severities are supported
 *
 * Usage:
 *   node scripts/validate-recipes.mjs
 *   pnpm validate:recipes
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const recipesDir = resolve(__dirname, '../recipes/default');

const VALID_EXTRACT_MODES = new Set(['text', 'html', 'attribute', 'json', 'exists', 'count', 'tagName']);
const VALID_TRANSFORMS = new Set([
  'trim',
  'lowercase',
  'uppercase',
  'number',
  'currency',
  'absoluteUrl',
  'removeExtraSpaces',
  'jsonParse'
]);
const VALID_CATEGORIES = new Set([
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
const VALID_SOURCES = new Set(['default', 'user', 'imported', 'gallery']);
const VALID_ASSERTION_TYPES = new Set([
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
const VALID_SEVERITIES = new Set(['info', 'warning', 'error']);

/** @param {unknown} value @returns {value is Record<string, unknown>} */
function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * @param {unknown} field
 * @param {string} context
 * @returns {string[]} errors
 */
function validateSimpleField(field, context) {
  const errors = [];
  if (!isRecord(field)) return [`${context}: not an object`];

  if (typeof field.id !== 'string' || !field.id) errors.push(`${context}: missing id`);
  if (typeof field.key !== 'string' || !field.key) errors.push(`${context}: missing key`);
  if (typeof field.selector !== 'string' || !field.selector) errors.push(`${context}: missing selector`);
  if (!VALID_EXTRACT_MODES.has(/** @type {string} */ (field.extract))) {
    errors.push(`${context}: invalid extract mode "${field.extract}"`);
  }
  if (Array.isArray(field.transforms)) {
    for (const t of field.transforms) {
      if (!VALID_TRANSFORMS.has(t)) errors.push(`${context}: invalid transform "${t}"`);
    }
  }

  return errors;
}

/**
 * @param {unknown} field
 * @param {string} context
 * @returns {string[]} errors
 */
function validateField(field, context) {
  if (!isRecord(field)) return [`${context}: not an object`];

  if (field.kind === 'group') {
    const errors = [];
    if (typeof field.id !== 'string' || !field.id) errors.push(`${context}: missing id`);
    if (typeof field.key !== 'string' || !field.key) errors.push(`${context}: missing key`);
    if (typeof field.selector !== 'string' || !field.selector) errors.push(`${context}: missing selector`);
    if (field.multiple !== true) errors.push(`${context}: group field must have multiple: true`);
    if (!Array.isArray(field.fields) || field.fields.length === 0) {
      errors.push(`${context}: group must have at least one sub-field`);
    } else {
      const subKeys = new Set();
      for (const subField of field.fields) {
        const subErrors = validateSimpleField(subField, `${context}.fields[${subField?.key}]`);
        errors.push(...subErrors);
        if (typeof subField?.key === 'string') {
          if (subKeys.has(subField.key)) errors.push(`${context}: duplicate sub-field key "${subField.key}"`);
          subKeys.add(subField.key);
        }
      }
    }

    return errors;
  }

  return validateSimpleField(field, context);
}

/**
 * @param {unknown} check
 * @param {string} context
 * @returns {string[]} errors
 */
function validateCheck(check, context) {
  const errors = [];
  if (!isRecord(check)) return [`${context}: not an object`];

  if (typeof check.id !== 'string' || !check.id) errors.push(`${context}: missing id`);
  if (typeof check.name !== 'string' || !check.name) errors.push(`${context}: missing name`);
  if (typeof check.selector !== 'string' || !check.selector) errors.push(`${context}: missing selector`);
  if (!VALID_SEVERITIES.has(/** @type {string} */ (check.severity))) {
    errors.push(`${context}: invalid severity "${check.severity}"`);
  }

  if (!isRecord(check.assertion)) {
    errors.push(`${context}: missing assertion`);
  } else if (!VALID_ASSERTION_TYPES.has(/** @type {string} */ (check.assertion.type))) {
    errors.push(`${context}: invalid assertion type "${check.assertion.type}"`);
  }

  return errors;
}

/**
 * @param {unknown} recipe
 * @param {string} filename
 * @returns {string[]} errors
 */
function validateRecipe(recipe, filename) {
  const errors = [];
  if (!isRecord(recipe)) return [`${filename}: not an object`];

  if (typeof recipe.id !== 'string' || !recipe.id) errors.push(`${filename}: missing id`);
  if (typeof recipe.name !== 'string' || !recipe.name) errors.push(`${filename}: missing name`);
  if (!VALID_CATEGORIES.has(/** @type {string} */ (recipe.category))) {
    errors.push(`${filename}: invalid category "${recipe.category}"`);
  }
  if (!VALID_SOURCES.has(/** @type {string} */ (recipe.source))) {
    errors.push(`${filename}: invalid source "${recipe.source}"`);
  }
  if (!Array.isArray(recipe.urlPatterns) || recipe.urlPatterns.length === 0) {
    errors.push(`${filename}: urlPatterns must be a non-empty array`);
  }
  if (!Array.isArray(recipe.fields) || recipe.fields.length === 0) {
    errors.push(`${filename}: fields must be a non-empty array`);
  }

  if (Array.isArray(recipe.fields)) {
    const fieldIds = new Set();
    const topLevelKeys = new Set();

    for (const field of recipe.fields) {
      if (typeof field?.id === 'string') {
        if (fieldIds.has(field.id)) errors.push(`${filename}: duplicate field id "${field.id}"`);
        fieldIds.add(field.id);
      }
      if (typeof field?.key === 'string') {
        if (topLevelKeys.has(field.key)) errors.push(`${filename}: duplicate top-level field key "${field.key}"`);
        topLevelKeys.add(field.key);
      }
      errors.push(...validateField(field, `${filename}.fields[${field?.key}]`));
    }
  }

  if (Array.isArray(recipe.checks)) {
    const checkIds = new Set();
    for (const check of recipe.checks) {
      if (typeof check?.id === 'string') {
        if (checkIds.has(check.id)) errors.push(`${filename}: duplicate check id "${check.id}"`);
        checkIds.add(check.id);
      }
      errors.push(...validateCheck(check, `${filename}.checks[${check?.id}]`));
    }
  }

  return errors;
}

async function main() {
  let files;
  try {
    files = (await readdir(recipesDir)).filter((f) => f.endsWith('.recipe.json')).sort();
  } catch {
    console.error(`Could not read recipes directory: ${recipesDir}`);
    process.exit(1);
  }

  if (files.length === 0) {
    console.error('No .recipe.json files found in', recipesDir);
    process.exit(1);
  }

  const allErrors = [];
  const allIds = new Set();

  for (const file of files) {
    const filepath = join(recipesDir, file);
    let recipe;

    try {
      const text = await readFile(filepath, 'utf8');
      recipe = JSON.parse(text);
    } catch (err) {
      allErrors.push(`${file}: invalid JSON — ${err.message}`);
      continue;
    }

    if (isRecord(recipe) && typeof recipe.id === 'string') {
      if (allIds.has(recipe.id)) {
        allErrors.push(`${file}: duplicate recipe id "${recipe.id}" (collision with another file)`);
      }
      allIds.add(recipe.id);
    }

    const errors = validateRecipe(recipe, file);
    allErrors.push(...errors);
  }

  if (allErrors.length > 0) {
    console.error(`\nRecipe validation FAILED (${allErrors.length} error(s)):\n`);
    for (const err of allErrors) {
      console.error(`  ✗ ${err}`);
    }
    process.exit(1);
  }

  console.log(`Recipe validation passed — ${files.length} recipe(s) OK`);
  for (const file of files) {
    console.log(`  ✓ ${file}`);
  }
}

main();
