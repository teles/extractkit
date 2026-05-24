import type { BatchRun } from './types';

export function isBatchActive(batch?: BatchRun | null): boolean {
  return batch?.status === 'running' || batch?.status === 'paused';
}

export function activeBatchFromList(batches: BatchRun[]): BatchRun | null {
  return batches.find(isBatchActive) ?? null;
}

export function isRecipeLockedByBatch(recipeId: string, activeBatch?: BatchRun | null): boolean {
  return Boolean(activeBatch && isBatchActive(activeBatch) && activeBatch.recipeIds.includes(recipeId));
}
