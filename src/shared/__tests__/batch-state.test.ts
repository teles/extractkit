import { describe, expect, it } from 'vitest';
import { activeBatchFromList, isBatchActive, isRecipeLockedByBatch } from '../batch-state';
import type { BatchRun } from '../types';

function batch(overrides: Partial<BatchRun> = {}): BatchRun {
  return {
    id: 'b1',
    name: 'b1',
    status: 'draft',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    urls: [],
    recipeIds: [],
    options: {} as BatchRun['options'],
    totalPlannedRuns: 0,
    completedRuns: 0,
    successfulRuns: 0,
    warningRuns: 0,
    failedRuns: 0,
    skippedRuns: 0,
    events: [],
    ...overrides
  };
}

describe('isBatchActive', () => {
  it('returns true for running and paused batches', () => {
    expect(isBatchActive(batch({ status: 'running' }))).toBe(true);
    expect(isBatchActive(batch({ status: 'paused' }))).toBe(true);
  });

  it('returns false for inactive states or missing batch', () => {
    expect(isBatchActive(batch({ status: 'draft' }))).toBe(false);
    expect(isBatchActive(batch({ status: 'completed' }))).toBe(false);
    expect(isBatchActive(null)).toBe(false);
    expect(isBatchActive(undefined)).toBe(false);
  });
});

describe('activeBatchFromList', () => {
  it('returns the first active batch', () => {
    const result = activeBatchFromList([
      batch({ id: 'a', status: 'completed' }),
      batch({ id: 'b', status: 'running' }),
      batch({ id: 'c', status: 'paused' })
    ]);
    expect(result?.id).toBe('b');
  });

  it('returns null when there are no active batches', () => {
    expect(activeBatchFromList([batch({ status: 'completed' })])).toBeNull();
  });
});

describe('isRecipeLockedByBatch', () => {
  it('locks recipes that belong to an active batch', () => {
    const active = batch({ status: 'running', recipeIds: ['r1', 'r2'] });
    expect(isRecipeLockedByBatch('r1', active)).toBe(true);
    expect(isRecipeLockedByBatch('r3', active)).toBe(false);
  });

  it('does not lock when batch is inactive or missing', () => {
    expect(isRecipeLockedByBatch('r1', batch({ status: 'completed', recipeIds: ['r1'] }))).toBe(false);
    expect(isRecipeLockedByBatch('r1', null)).toBe(false);
  });
});
