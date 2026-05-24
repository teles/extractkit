import { runRecipeChecks } from './checks-engine';
import type {
  FieldError,
  FieldWarning,
  GroupField,
  Recipe,
  RecipeField,
  ScrapeResult,
  SimpleField,
  Transform
} from './types';

type SelectorScope = Document | Element;

type ScraperContext = {
  url: string;
  pageTitle?: string;
};

type Issues = {
  warnings: FieldWarning[];
  errors: FieldError[];
};

function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

function selectorError(field: string, selector: string, error: unknown): FieldError {
  return {
    field,
    message: `Invalid selector "${selector}": ${messageFromError(error)}`
  };
}

function isSelfSelector(selector: string): boolean {
  return selector.trim() === ':scope';
}

function queryOne(scope: SelectorScope, selector: string, fieldPath: string, issues: Issues): Element | null {
  if (scope instanceof Element && isSelfSelector(selector)) {
    return scope;
  }

  try {
    return scope.querySelector(selector);
  } catch (error) {
    issues.errors.push(selectorError(fieldPath, selector, error));
    return null;
  }
}

function queryMany(scope: SelectorScope, selector: string, fieldPath: string, issues: Issues): Element[] {
  if (scope instanceof Element && isSelfSelector(selector)) {
    return [scope];
  }

  try {
    return Array.from(scope.querySelectorAll(selector));
  } catch (error) {
    issues.errors.push(selectorError(fieldPath, selector, error));
    return [];
  }
}

function parseNumber(value: string): number | null {
  const normalized = value
    .replace(/\s/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.');
  const parsed = Number.parseFloat(normalized.replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseCurrency(value: string): number | null {
  return parseNumber(value);
}

function applyTransform(value: unknown, transform: Transform, baseUrl: string): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => applyTransform(item, transform, baseUrl));
  }

  if (typeof value !== 'string') {
    return value;
  }

  if (transform === 'trim') {
    return value.trim();
  }

  if (transform === 'lowercase') {
    return value.toLowerCase();
  }

  if (transform === 'uppercase') {
    return value.toUpperCase();
  }

  if (transform === 'removeExtraSpaces') {
    return value.replace(/\s+/g, ' ').trim();
  }

  if (transform === 'number') {
    return parseNumber(value);
  }

  if (transform === 'currency') {
    return parseCurrency(value);
  }

  if (transform === 'absoluteUrl') {
    try {
      return new URL(value, baseUrl).href;
    } catch {
      return value;
    }
  }

  if (transform === 'jsonParse') {
    return JSON.parse(value);
  }

  return value;
}

function applyTransforms(
  value: unknown,
  transforms: Transform[] | undefined,
  baseUrl: string,
  fieldPath: string,
  issues: Issues
): unknown {
  if (!transforms || transforms.length === 0) {
    return value;
  }

  return transforms.reduce<unknown>((currentValue, transform) => {
    try {
      return applyTransform(currentValue, transform, baseUrl);
    } catch (error) {
      issues.errors.push({
        field: fieldPath,
        message: `Failed to apply transform "${transform}": ${messageFromError(error)}`
      });
      return currentValue;
    }
  }, value);
}

function extractElementValue(element: Element, field: SimpleField, fieldPath: string, issues: Issues): unknown {
  if (field.extract === 'text') {
    return element.textContent ?? '';
  }

  if (field.extract === 'html') {
    return element.innerHTML;
  }

  if (field.extract === 'attribute') {
    if (!field.attribute?.trim()) {
      issues.errors.push({
        field: fieldPath,
        message: 'Field is configured as an attribute, but no attribute name was provided.'
      });
      return null;
    }

    return element.getAttribute(field.attribute);
  }

  if (field.extract === 'json') {
    try {
      return JSON.parse(element.textContent ?? '');
    } catch (error) {
      issues.errors.push({
        field: fieldPath,
        message: `Could not parse JSON: ${messageFromError(error)}`
      });
      return null;
    }
  }

  if (field.extract === 'tagName') {
    return element.tagName.toLowerCase();
  }

  if (field.extract === 'exists') {
    return true;
  }

  return element.textContent ?? '';
}

function isEmptyForRequired(value: unknown, field: SimpleField | GroupField): boolean {
  if (field.kind === 'field' && field.extract === 'exists') {
    return value === false || value === null || value === undefined;
  }

  if (field.kind === 'field' && field.extract === 'count') {
    return value === 0 || value === null || value === undefined;
  }

  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === 'string') {
    return value.trim().length === 0;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return false;
}

function warnIfRequiredEmpty(value: unknown, field: SimpleField | GroupField, fieldPath: string, issues: Issues): void {
  if (field.required && isEmptyForRequired(value, field)) {
    issues.warnings.push({
      field: fieldPath,
      message: 'Required field did not return a value.'
    });
  }
}

function extractSimpleField(
  scope: SelectorScope,
  field: SimpleField,
  baseUrl: string,
  fieldPath: string,
  issues: Issues
): unknown {
  if (field.extract === 'count') {
    const count = queryMany(scope, field.selector, fieldPath, issues).length;
    warnIfRequiredEmpty(count, field, fieldPath, issues);
    return count;
  }

  if (field.extract === 'exists' && !field.multiple) {
    const exists = queryOne(scope, field.selector, fieldPath, issues) !== null;
    warnIfRequiredEmpty(exists, field, fieldPath, issues);
    return exists;
  }

  if (field.multiple) {
    const elements = queryMany(scope, field.selector, fieldPath, issues);
    const values = elements.map((element) => extractElementValue(element, field, fieldPath, issues));
    const transformedValues = applyTransforms(values, field.transforms, baseUrl, fieldPath, issues);
    warnIfRequiredEmpty(transformedValues, field, fieldPath, issues);
    return transformedValues;
  }

  const element = queryOne(scope, field.selector, fieldPath, issues);
  const value = element ? extractElementValue(element, field, fieldPath, issues) : null;
  const transformedValue = applyTransforms(value, field.transforms, baseUrl, fieldPath, issues);
  warnIfRequiredEmpty(transformedValue, field, fieldPath, issues);
  return transformedValue;
}

function extractGroupField(
  scope: SelectorScope,
  field: GroupField,
  baseUrl: string,
  fieldPath: string,
  issues: Issues
): unknown[] {
  const containers = queryMany(scope, field.selector, fieldPath, issues);
  const items = containers.map((container, itemIndex) => {
    const item: Record<string, unknown> = {};
    for (const childField of field.fields) {
      const childPath = `${fieldPath}[${itemIndex}].${childField.key}`;
      item[childField.key] = extractSimpleField(container, childField, baseUrl, childPath, issues);
    }
    return item;
  });

  warnIfRequiredEmpty(items, field, fieldPath, issues);
  return items;
}

function extractField(scope: SelectorScope, field: RecipeField, baseUrl: string, issues: Issues): unknown {
  if (field.kind === 'group') {
    return extractGroupField(scope, field, baseUrl, field.key, issues);
  }

  return extractSimpleField(scope, field, baseUrl, field.key, issues);
}

function hasUsefulValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === 'object') {
    return Object.values(value).some(hasUsefulValue);
  }

  return true;
}

export function runRecipe(recipe: Recipe, root: SelectorScope, context: ScraperContext): ScrapeResult {
  const startedAt = performance.now();
  const issues: Issues = {
    warnings: [],
    errors: []
  };
  const data: Record<string, unknown> = {};

  for (const field of recipe.fields) {
    data[field.key] = extractField(root, field, context.url, issues);
  }

  const checks = runRecipeChecks(recipe.checks, root);
  const hasData = Object.values(data).some(hasUsefulValue);
  const status =
    issues.errors.length > 0 && !hasData
      ? 'error'
      : issues.errors.length > 0 || issues.warnings.length > 0
        ? 'partial'
        : 'success';

  return {
    url: context.url,
    domain: new URL(context.url).hostname,
    pageTitle: context.pageTitle,
    status,
    durationMs: Math.round(performance.now() - startedAt),
    data,
    checks,
    warnings: issues.warnings,
    errors: issues.errors
  };
}
