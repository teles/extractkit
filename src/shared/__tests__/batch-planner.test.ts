import { describe, expect, it } from 'vitest';
import {
  createBatchPlan,
  DEFAULT_BATCH_RUN_OPTIONS,
  isSupportedBatchUrl,
  normalizeUrlInput,
  validateBatchUrl
} from '../batch-planner';
import type { Recipe } from '../types';

function makeRecipe(id: string, urlPatterns: string[]): Recipe {
  return {
    id,
    name: id,
    category: 'custom',
    tags: [],
    source: 'user',
    urlPatterns,
    version: '1.0.0',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    fields: []
  };
}

describe('validateBatchUrl', () => {
  it('accepts http and https urls', () => {
    expect(validateBatchUrl('https://example.com')).toMatchObject({ ok: true });
    expect(validateBatchUrl(' "http://example.com" ')).toMatchObject({ ok: true });
  });

  it('rejects empty values', () => {
    const result = validateBatchUrl('');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issue.reason).toBe('invalid');
    }
  });

  it('rejects invalid URLs', () => {
    const result = validateBatchUrl('not a url');
    expect(result.ok).toBe(false);
  });

  it('rejects unsupported schemes', () => {
    const result = validateBatchUrl('ftp://example.com');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issue.reason).toBe('unsupported');
    }
  });
});

describe('isSupportedBatchUrl', () => {
  it('proxies validateBatchUrl', () => {
    expect(isSupportedBatchUrl('https://example.com')).toBe(true);
    expect(isSupportedBatchUrl('ftp://example.com')).toBe(false);
  });
});

describe('normalizeUrlInput', () => {
  it('parses, deduplicates and partitions URLs', () => {
    const result = normalizeUrlInput(
      [
        'https://example.com/a',
        '"https://example.com/a"',
        '  ',
        'https://example.com/b',
        'ftp://example.com',
        'not a url'
      ].join('\n')
    );

    expect(result.validUrls).toHaveLength(2);
    expect(result.duplicateCount).toBe(1);
    expect(result.unsupportedUrls).toEqual(['ftp://example.com']);
    expect(result.invalidUrls).toEqual(['not a url']);
    expect(result.invalidItems.length).toBe(2);
  });
});

describe('createBatchPlan', () => {
  const recipeA = makeRecipe('a', ['example.com']);
  const recipeB = makeRecipe('b', ['other.org']);

  it('only assigns compatible recipes when the option is enabled', () => {
    const plan = createBatchPlan(['https://example.com/x', 'https://other.org/y'], [recipeA, recipeB], {
      ...DEFAULT_BATCH_RUN_OPTIONS,
      runOnlyCompatibleRecipes: true
    });

    expect(plan.totalPlannedRuns).toBe(2);
    expect(plan.skippedByCompatibility).toBe(2);
    expect(plan.urlsWithNoCompatibleRecipes).toEqual([]);
    expect(plan.mappings[0].recipes.map((r) => r.id)).toEqual(['a']);
  });

  it('assigns every recipe when filter is disabled', () => {
    const plan = createBatchPlan(['https://example.com/x'], [recipeA, recipeB], {
      ...DEFAULT_BATCH_RUN_OPTIONS,
      runOnlyCompatibleRecipes: false
    });

    expect(plan.totalPlannedRuns).toBe(2);
    expect(plan.skippedByCompatibility).toBe(0);
  });

  it('reports urls with no compatible recipes', () => {
    const plan = createBatchPlan(['https://nope.com/x'], [recipeA], {
      ...DEFAULT_BATCH_RUN_OPTIONS,
      runOnlyCompatibleRecipes: true
    });

    expect(plan.urlsWithNoCompatibleRecipes).toEqual(['https://nope.com/x']);
  });

  it('estimates duration as a positive number', () => {
    const plan = createBatchPlan(
      ['https://example.com/x', 'https://example.com/y'],
      [recipeA],
      DEFAULT_BATCH_RUN_OPTIONS
    );
    expect(plan.estimatedDurationMs).toBeGreaterThan(0);
  });
});
