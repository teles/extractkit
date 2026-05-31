import { describe, expect, it } from 'vitest';
import {
  createFlattenedRunsCsv,
  createNestedCollectionCsvs,
  createRecipeCsv,
  createRunsJsonl,
  createRunsSummaryCsv,
  flattenObjectForCsv,
  groupRunsByRecipe,
  runsToCsv
} from '../csv';
import type { RecipeRun } from '../types';

function makeRun(overrides: Partial<RecipeRun> = {}): RecipeRun {
  return {
    id: 'run-1',
    recipeId: 'recipe-1',
    recipeVersion: '1.0.0',
    recipeName: 'Recipe One',
    url: 'https://example.com/p',
    domain: 'example.com',
    status: 'success',
    createdAt: '2024-05-01T00:00:00Z',
    durationMs: 120,
    data: { title: 'Hello, world', tags: ['a', 'b'] },
    warnings: [],
    errors: [],
    ...overrides
  };
}

describe('flattenObjectForCsv', () => {
  it('flattens nested records and joins primitive arrays', () => {
    const result = flattenObjectForCsv({ a: { b: 1 }, list: ['x', 'y'], deep: {} });
    expect(result).toMatchObject({ 'a.b': 1, list: 'x | y', deep: '' });
  });

  it('returns empty object for non-records without prefix', () => {
    expect(flattenObjectForCsv('x')).toEqual({});
  });

  it('returns scalar at the prefix when given a primitive with prefix', () => {
    expect(flattenObjectForCsv('x', 'p')).toEqual({ p: 'x' });
  });
});

describe('CSV exports', () => {
  it('runsToCsv quotes values containing commas and newlines', () => {
    const csv = runsToCsv([makeRun()]);
    expect(csv.split('\n')[0]).toContain('id,recipeId');
    expect(csv).toContain('"Hello, world"');
  });

  it('createRunsSummaryCsv exposes summary columns', () => {
    const csv = createRunsSummaryCsv([
      makeRun({
        validation: { status: 'valid', issues: [] },
        checks: { status: 'passed', passed: 3, warnings: 0, errors: 0, skipped: 0, results: [] }
      })
    ]);
    expect(csv).toContain('validationStatus,checksStatus');
    expect(csv).toContain('valid');
    expect(csv).toContain('passed');
  });

  it('createRecipeCsv merges metadata with flattened data columns', () => {
    const csv = createRecipeCsv([
      makeRun({ data: { title: 'A' } }),
      makeRun({ id: 'run-2', data: { title: 'B', extra: 1 } })
    ]);
    expect(csv).toContain('data.title');
    expect(csv).toContain('data.extra');
  });

  it('groupRunsByRecipe groups by recipeId', () => {
    const map = groupRunsByRecipe([makeRun(), makeRun({ id: 'r2', recipeId: 'recipe-2' })]);
    expect([...map.keys()].sort()).toEqual(['recipe-1', 'recipe-2']);
  });

  it('createNestedCollectionCsvs emits one file per object-array field', () => {
    const files = createNestedCollectionCsvs([
      makeRun({ data: { items: [{ a: 1 }, { a: 2 }] } })
    ]);
    expect(files).toHaveLength(1);
    expect(files[0].fieldKey).toBe('items');
    expect(files[0].csv).toContain('itemIndex');
  });

  it('createNestedCollectionCsvs returns nothing when no nested object arrays', () => {
    const files = createNestedCollectionCsvs([makeRun({ data: { name: 'x' } })]);
    expect(files).toHaveLength(0);
  });

  it('createFlattenedRunsCsv flattens nested run data', () => {
    const csv = createFlattenedRunsCsv([makeRun({ data: { foo: { bar: 1 } } })]);
    expect(csv).toContain('data.foo.bar');
  });

  it('createRunsJsonl produces one JSON line per run', () => {
    const out = createRunsJsonl([makeRun(), makeRun({ id: 'r2' })]);
    const lines = out.split('\n');
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]).id).toBe('run-1');
  });
});
