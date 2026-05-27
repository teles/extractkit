import type { BatchRun, RecipeRun } from './types';

export type MarkdownOptions = {
  noItemsLabel?: string;
  notAvailableLabel?: string;
};

const defaultMarkdownOptions: Required<MarkdownOptions> = {
  noItemsLabel: 'No items.',
  notAvailableLabel: 'Not available'
};

const acronymWords = new Set([
  'css',
  'faq',
  'gtin',
  'h1',
  'h2',
  'html',
  'http',
  'https',
  'id',
  'json',
  'ld',
  'qa',
  'seo',
  'sku',
  'url'
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isPrimitive(value: unknown): value is string | number | boolean | null | undefined {
  return value === null || value === undefined || ['string', 'number', 'boolean'].includes(typeof value);
}

function markdownOptions(options?: MarkdownOptions): Required<MarkdownOptions> {
  return {
    ...defaultMarkdownOptions,
    ...options
  };
}

function decodeCommonHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'");
}

function stripHtmlTags(value: string): string {
  if (!/<\/?[a-z][\s\S]*>/i.test(value)) {
    return value;
  }

  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '');
}

function textValue(value: unknown, options?: MarkdownOptions): string {
  const resolvedOptions = markdownOptions(options);
  if (value === null || value === undefined || value === '') {
    return resolvedOptions.notAvailableLabel;
  }

  const text = decodeCommonHtmlEntities(stripHtmlTags(String(value)))
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .trim();

  return text || resolvedOptions.notAvailableLabel;
}

function escapeMarkdown(value: unknown, options?: MarkdownOptions): string {
  const text = textValue(value, options);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/[\\`*_{}[\]()#+!|]/g, '\\$&');
}

export function titleFromKey(key: string): string {
  const title = key
    .replace(/^@/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => {
      const lowerWord = word.toLocaleLowerCase('en-US');
      return acronymWords.has(lowerWord)
        ? lowerWord.toLocaleUpperCase('en-US')
        : word.replace(/^./, (letter) => letter.toUpperCase());
    })
    .join(' ');

  return title.replace(/\bJSON LD\b/g, 'JSON-LD');
}

function heading(level: number, text: string, options?: MarkdownOptions): string {
  return `${'#'.repeat(Math.min(Math.max(level, 1), 6))} ${escapeMarkdown(text, options)}`;
}

function genericItemTitle(index: number): string {
  return `${index + 1}. Item`;
}

function primitiveToMarkdown(value: unknown, options?: MarkdownOptions): string {
  return escapeMarkdown(value, options);
}

function isLongTextField(value: unknown): boolean {
  return typeof value === 'string' && (value.length > 160 || value.includes('\n'));
}

export function jsonToMarkdown(value: unknown, level = 3, options?: MarkdownOptions): string {
  const resolvedOptions = markdownOptions(options);

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return resolvedOptions.noItemsLabel;
    }

    if (value.every(isPrimitive)) {
      return value.map((item) => `- ${primitiveToMarkdown(item, options)}`).join('\n');
    }

    if (value.every(isRecord)) {
      return value
        .map(
          (item, index) =>
            `${heading(level, genericItemTitle(index), options)}\n\n${jsonToMarkdown(item, level + 1, options)}`
        )
        .join('\n\n');
    }

    return value
      .map(
        (item, index) =>
          `${heading(level, `${index + 1}. Item`, options)}\n\n${jsonToMarkdown(item, level + 1, options)}`
      )
      .join('\n\n');
  }

  if (isRecord(value)) {
    const entries = Object.entries(value).filter(([, item]) => item !== undefined);
    if (entries.length === 0) {
      return resolvedOptions.noItemsLabel;
    }

    return entries
      .map(([key, item]) => {
        if (isPrimitive(item)) {
          if (isLongTextField(item)) {
            return `${heading(level, titleFromKey(key), options)}\n\n${primitiveToMarkdown(item, options)}`;
          }

          return `**${escapeMarkdown(titleFromKey(key), options)}**: ${primitiveToMarkdown(item, options)}`;
        }

        return `${heading(level, titleFromKey(key), options)}\n\n${jsonToMarkdown(item, level + 1, options)}`;
      })
      .join('\n\n');
  }

  return primitiveToMarkdown(value, options);
}

export function runDataToMarkdown(data: unknown, options?: MarkdownOptions): string {
  return jsonToMarkdown(data, 2, options);
}

function validationSummary(run: RecipeRun): string {
  if (!run.validation) {
    return 'Not available';
  }

  const issueCount = run.validation.issues.length;
  return `Status: ${escapeMarkdown(run.validation.status)}${issueCount > 0 ? `\n\nIssues: ${issueCount}` : ''}`;
}

function checksSummary(run: RecipeRun): string {
  if (!run.checks) {
    return 'No checks configured';
  }

  return [
    `- Passed: ${run.checks.passed}`,
    `- Warnings: ${run.checks.warnings}`,
    `- Errors: ${run.checks.errors}`,
    `- Skipped: ${run.checks.skipped}`
  ].join('\n');
}

export function createRunMarkdown(run: RecipeRun): string {
  return [
    heading(1, run.recipeName),
    heading(2, 'Source'),
    [
      `- URL: ${escapeMarkdown(run.url)}`,
      `- Domain: ${escapeMarkdown(run.domain)}`,
      `- Recipe: ${escapeMarkdown(run.recipeName)}`,
      `- Recipe version: ${escapeMarkdown(run.recipeVersion)}`,
      `- Status: ${escapeMarkdown(run.status)}`,
      `- Created at: ${escapeMarkdown(run.createdAt)}`,
      `- Duration: ${run.durationMs}ms`,
      `- Batch: ${escapeMarkdown(run.batchName ?? 'Not available')}`
    ].join('\n'),
    heading(2, 'Validation'),
    validationSummary(run),
    heading(2, 'Checks'),
    checksSummary(run),
    heading(2, 'Data'),
    jsonToMarkdown(run.data, 3)
  ].join('\n\n');
}

function batchMarkdown(batch: BatchRun): string {
  return [
    `- Name: ${escapeMarkdown(batch.name)}`,
    `- Status: ${escapeMarkdown(batch.status)}`,
    `- URLs: ${batch.urls.length}`,
    `- Planned runs: ${batch.totalPlannedRuns}`,
    `- Successful: ${batch.successfulRuns}`,
    `- Warnings: ${batch.warningRuns}`,
    `- Failed: ${batch.failedRuns}`,
    `- Skipped: ${batch.skippedRuns}`
  ].join('\n');
}

export function createAllRunsMarkdown(runs: RecipeRun[], batches: BatchRun[] = []): string {
  const recipeCount = new Set(runs.map((run) => run.recipeId)).size;
  const sections = [
    heading(1, 'ExtractKit export'),
    heading(2, 'Summary'),
    [
      `- Exported at: ${escapeMarkdown(new Date().toISOString())}`,
      `- Runs: ${runs.length}`,
      `- Recipes: ${recipeCount}`,
      `- Batches: ${batches.length}`
    ].join('\n')
  ];

  if (batches.length === 1) {
    sections.push(heading(2, 'Batch'), batchMarkdown(batches[0]));
  } else if (batches.length > 1) {
    sections.push(
      heading(2, 'Batches'),
      batches
        .map((batch, index) => `${heading(3, `${index + 1}. ${batch.name}`)}\n\n${batchMarkdown(batch)}`)
        .join('\n\n')
    );
  }

  sections.push(
    heading(2, 'Runs'),
    runs
      .map((run, index) =>
        [
          heading(3, `${index + 1}. ${run.recipeName}`),
          [
            `- URL: ${escapeMarkdown(run.url)}`,
            `- Status: ${escapeMarkdown(run.status)}`,
            `- Created at: ${escapeMarkdown(run.createdAt)}`,
            `- Duration: ${run.durationMs}ms`,
            `- Batch: ${escapeMarkdown(run.batchName ?? 'Not available')}`
          ].join('\n'),
          heading(4, 'Data'),
          jsonToMarkdown(run.data, 5)
        ].join('\n\n')
      )
      .join('\n\n')
  );

  return sections.join('\n\n');
}
