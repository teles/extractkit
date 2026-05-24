import type { RecipeRun } from './types';

function csvEscape(value: unknown): string {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  const safeText = text ?? '';
  if (/[",\n\r]/.test(safeText)) {
    return `"${safeText.replace(/"/g, '""')}"`;
  }

  return safeText;
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

  return [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
}
