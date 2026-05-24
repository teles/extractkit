import type { RecipeRun } from './types';

export function statusWithReviewResults(
  responseStatus: RecipeRun['status'],
  run: Pick<RecipeRun, 'validation' | 'checks'>
): RecipeRun['status'] {
  if (responseStatus === 'error') {
    return 'error';
  }

  if (run.validation?.status === 'invalid') {
    return 'partial';
  }

  if (run.checks?.status === 'warning' || run.checks?.status === 'error') {
    return 'partial';
  }

  return responseStatus;
}
