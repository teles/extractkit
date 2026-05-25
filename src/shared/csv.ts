import type { RecipeRun } from './types';

type CsvValue = string | number | boolean | null | undefined;
export type CsvFile = {
  recipeId: string;
  fieldKey?: string;
  csv: string;
};

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

function runMetadataRow(run: RecipeRun): CsvValue[] {
  return [
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
  ];
}

function isObjectArray(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value) && value.some(isRecord);
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

export function groupRunsByRecipe(runs: RecipeRun[]): Map<string, RecipeRun[]> {
  return runs.reduce<Map<string, RecipeRun[]>>((groups, run) => {
    groups.set(run.recipeId, [...(groups.get(run.recipeId) ?? []), run]);
    return groups;
  }, new Map());
}

export function createRecipeCsv(runs: RecipeRun[]): string {
  const metadataHeaders = [
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
  const flattenedRows = runs.map((run) => flattenObjectForCsv(run.data, 'data'));
  const dataHeaders = Array.from(new Set(flattenedRows.flatMap((row) => Object.keys(row)))).sort();
  const headers = [...metadataHeaders, ...dataHeaders];
  const rows = runs.map((run, index) => [
    ...runMetadataRow(run),
    ...dataHeaders.map((header) => flattenedRows[index]?.[header] ?? '')
  ]);

  return createCsv(headers, rows);
}

export function createNestedCollectionCsvs(runs: RecipeRun[]): CsvFile[] {
  const files: CsvFile[] = [];

  for (const [recipeId, recipeRuns] of groupRunsByRecipe(runs)) {
    const fieldKeys = Array.from(
      new Set(
        recipeRuns.flatMap((run) =>
          isRecord(run.data)
            ? Object.entries(run.data)
                .filter(([, value]) => isObjectArray(value))
                .map(([key]) => key)
            : []
        )
      )
    ).sort();

    for (const fieldKey of fieldKeys) {
      const itemRows = recipeRuns.flatMap((run) => {
        if (!isRecord(run.data) || !isObjectArray(run.data[fieldKey])) {
          return [];
        }

        return run.data[fieldKey].filter(isRecord).map((item, itemIndex) => ({
          run,
          itemIndex,
          flattened: flattenObjectForCsv(item)
        }));
      });

      if (itemRows.length === 0) {
        continue;
      }

      const metadataHeaders = [
        'runId',
        'batchId',
        'batchName',
        'recipeId',
        'recipeName',
        'url',
        'domain',
        'parentCreatedAt',
        'itemIndex'
      ];
      const itemHeaders = Array.from(new Set(itemRows.flatMap((row) => Object.keys(row.flattened)))).sort();
      const rows = itemRows.map(({ run, itemIndex, flattened }) => [
        run.id,
        run.batchId ?? '',
        run.batchName ?? '',
        run.recipeId,
        run.recipeName,
        run.url,
        run.domain,
        run.createdAt,
        itemIndex,
        ...itemHeaders.map((header) => flattened[header] ?? '')
      ]);

      files.push({
        recipeId,
        fieldKey,
        csv: createCsv([...metadataHeaders, ...itemHeaders], rows)
      });
    }
  }

  return files;
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
