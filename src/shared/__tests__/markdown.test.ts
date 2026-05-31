import { describe, expect, it } from 'vitest';
import { createAllRunsMarkdown, createRunMarkdown, jsonToMarkdown, runDataToMarkdown, titleFromKey } from '../markdown';
import type { BatchRun, RecipeRun } from '../types';

describe('titleFromKey', () => {
  it('humanizes camelCase and snake_case keys', () => {
    expect(titleFromKey('helloWorld')).toBe('Hello World');
    expect(titleFromKey('hello_world')).toBe('Hello World');
  });

  it('uppercases known acronyms', () => {
    expect(titleFromKey('seoTitle')).toBe('SEO Title');
    expect(titleFromKey('jsonLdData')).toBe('JSON-LD Data');
  });
});

describe('jsonToMarkdown', () => {
  it('renders empty arrays and objects with a fallback label', () => {
    expect(jsonToMarkdown([])).toContain('No items');
    expect(jsonToMarkdown({})).toContain('No items');
  });

  it('renders primitive arrays as bullet lists', () => {
    expect(jsonToMarkdown(['a', 'b'])).toBe('- a\n- b');
  });

  it('renders objects with bold key labels', () => {
    expect(jsonToMarkdown({ title: 'Hello' })).toContain('**Title**');
  });

  it('treats long values as their own headings', () => {
    const longValue = 'x'.repeat(200);
    expect(jsonToMarkdown({ description: longValue })).toContain('### Description');
  });

  it('decodes html entities and strips tags', () => {
    expect(jsonToMarkdown({ title: '<p>Hello&nbsp;world</p>' })).toContain('Hello world');
  });

  it('renders object arrays with item headings', () => {
    expect(jsonToMarkdown([{ a: 1 }, { a: 2 }])).toContain('### 1. Item');
  });
});

describe('runDataToMarkdown', () => {
  it('proxies to jsonToMarkdown with level 2', () => {
    expect(runDataToMarkdown({ title: 'Hello' })).toContain('**Title**');
  });
});

function makeRun(overrides: Partial<RecipeRun> = {}): RecipeRun {
  return {
    id: 'run-1',
    recipeId: 'recipe-1',
    recipeVersion: '1.0.0',
    recipeName: 'Recipe',
    url: 'https://example.com/p',
    domain: 'example.com',
    status: 'success',
    createdAt: '2024-05-01T00:00:00Z',
    durationMs: 100,
    data: { title: 'Hello' },
    warnings: [],
    errors: [],
    ...overrides
  };
}

function makeBatch(overrides: Partial<BatchRun> = {}): BatchRun {
  return {
    id: 'b1',
    name: 'Batch',
    status: 'completed',
    createdAt: '2024-05-01T00:00:00Z',
    updatedAt: '2024-05-01T00:00:00Z',
    urls: ['https://example.com'],
    recipeIds: [],
    options: {} as BatchRun['options'],
    totalPlannedRuns: 1,
    completedRuns: 1,
    successfulRuns: 1,
    warningRuns: 0,
    failedRuns: 0,
    skippedRuns: 0,
    events: [],
    ...overrides
  };
}

describe('createRunMarkdown', () => {
  it('emits a structured markdown report', () => {
    const md = createRunMarkdown(
      makeRun({
        validation: { status: 'invalid', issues: [{ path: '/', message: 'bad' }] },
        checks: { status: 'passed', passed: 1, warnings: 0, errors: 0, skipped: 0, results: [] }
      })
    );
    expect(md).toContain('# Recipe');
    expect(md).toContain('## Source');
    expect(md).toContain('## Validation');
    expect(md).toContain('Issues: 1');
    expect(md).toContain('## Checks');
    expect(md).toContain('Passed: 1');
  });

  it('handles missing validation and checks', () => {
    const md = createRunMarkdown(makeRun());
    expect(md).toContain('Not available');
    expect(md).toContain('No checks configured');
  });
});

describe('createAllRunsMarkdown', () => {
  it('summarizes a single batch', () => {
    expect(createAllRunsMarkdown([makeRun()], [makeBatch()])).toContain('## Batch');
  });

  it('summarizes multiple batches', () => {
    expect(
      createAllRunsMarkdown([makeRun()], [makeBatch({ id: 'b1' }), makeBatch({ id: 'b2', name: 'Batch 2' })])
    ).toContain('## Batches');
  });

  it('builds a header and runs section', () => {
    const md = createAllRunsMarkdown([makeRun()], []);
    expect(md).toContain('# ExtractKit export');
    expect(md).toContain('## Runs');
  });
});
