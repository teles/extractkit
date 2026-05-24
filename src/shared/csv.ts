import type { RecipeRun } from './types';

type CsvValue = string | number | boolean | null | undefined;

function csvEscape(value: unknown): string {
  const text =
    value === null || value === undefined
      ? ''
      : typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
        ? String(value)
        : (JSON.stringify(value) ?? '');
  const safeText = text ?? '';
  if (/[",\n\r]/.test(safeText)) {
    return `"${safeText.replace(/"/g, '""')}"`;
  }

  return safeText;
}

function createCsv(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isPrimitive(value: unknown): value is string | number | boolean | null | undefined {
  return value === null || value === undefined || ['string', 'number', 'boolean'].includes(typeof value);
}

function compactJson(value: unknown): string {
  return JSON.stringify(value) ?? '';
}

function cellValue(value: unknown): CsvValue {
  if (isPrimitive(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    if (value.every(isPrimitive)) {
      return value
        .filter((item) => item !== null && item !== undefined)
        .map(String)
        .join(' | ');
    }

    return compactJson(value);
  }

  return compactJson(value);
}

export function flattenObjectForCsv(value: unknown, prefix = ''): Record<string, CsvValue> {
  if (!isRecord(value)) {
    return prefix ? { [prefix]: cellValue(value) } : {};
  }

  const flattened: Record<string, CsvValue> = {};
  for (const [key, item] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (isRecord(item)) {
      const nested = flattenObjectForCsv(item, path);
      if (Object.keys(nested).length === 0) {
        flattened[path] = '';
      } else {
        Object.assign(flattened, nested);
      }
      continue;
    }

    flattened[path] = cellValue(item);
  }

  return flattened;
}

export function runsToCsv(runs: RecipeRun[]): string {
  const headers = [
    'id',
    'recipeId',
    'recipeName',
    'recipeVersion',
    'url',
    'domain',
    'pageTitle',
    'status',
    'createdAt',
    'durationMs',
    'checks',
    'warnings',
    'errors',
    'data'
  ];

  const rows = runs.map((run) => [
    run.id,
    run.recipeId,
    run.recipeName,
    run.recipeVersion,
    run.url,
    run.domain,
    run.pageTitle ?? '',
    run.status,
    run.createdAt,
    run.durationMs,
    run.checks ?? null,
    run.warnings,
    run.errors,
    run.data
  ]);

  return createCsv(headers, rows);
}

export function createRunsSummaryCsv(runs: RecipeRun[]): string {
  const headers = [
    'runId',
    'batchId',
    'batchName',
    'recipeId',
    'recipeName',
    'recipeVersion',
    'url',
    'domain',
    'status',
    'validationStatus',
    'checksStatus',
    'checksPassed',
    'checksWarnings',
    'checksErrors',
    'durationMs',
    'createdAt'
  ];

  const rows = runs.map((run) => [
    run.id,
    run.batchId ?? '',
    run.batchName ?? '',
    run.recipeId,
    run.recipeName,
    run.recipeVersion,
    run.url,
    run.domain,
    run.status,
    run.validation?.status ?? '',
    run.checks?.status ?? '',
    run.checks?.passed ?? '',
    run.checks?.warnings ?? '',
    run.checks?.errors ?? '',
    run.durationMs,
    run.createdAt
  ]);

  return createCsv(headers, rows);
}

export function createFlattenedRunsCsv(runs: RecipeRun[]): string {
  const metadataHeaders = ['runId', 'batchId', 'batchName', 'recipeName', 'url', 'domain', 'status', 'createdAt'];
  const flattenedRows = runs.map((run) => {
    const flattened = flattenObjectForCsv({
      recipeId: run.recipeId,
      recipeVersion: run.recipeVersion,
      pageTitle: run.pageTitle ?? '',
      durationMs: run.durationMs,
      validation: run.validation ?? null,
      checks: run.checks ?? null,
      warnings: run.warnings,
      errors: run.errors,
      data: run.data
    });

    return {
      metadata: {
        runId: run.id,
        batchId: run.batchId ?? '',
        batchName: run.batchName ?? '',
        recipeName: run.recipeName,
        url: run.url,
        domain: run.domain,
        status: run.status,
        createdAt: run.createdAt
      },
      flattened
    };
  });

  const flattenedHeaders = Array.from(new Set(flattenedRows.flatMap((row) => Object.keys(row.flattened)))).sort();
  const headers = [...metadataHeaders, ...flattenedHeaders];
  const rows = flattenedRows.map((row) => [
    ...metadataHeaders.map((header) => row.metadata[header as keyof typeof row.metadata]),
    ...flattenedHeaders.map((header) => row.flattened[header] ?? '')
  ]);

  return createCsv(headers, rows);
}

export function createRunsJsonl(runs: RecipeRun[]): string {
  return runs
    .map((run) =>
      JSON.stringify({
        id: run.id,
        batchId: run.batchId ?? null,
        batchName: run.batchName ?? null,
        recipeId: run.recipeId,
        recipeName: run.recipeName,
        url: run.url,
        domain: run.domain,
        status: run.status,
        createdAt: run.createdAt,
        durationMs: run.durationMs,
        validation: run.validation ?? null,
        checks: run.checks ?? null,
        data: run.data
      })
    )
    .join('\n');
}
