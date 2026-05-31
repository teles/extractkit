import { describe, expect, it } from 'vitest';
import { statusWithReviewResults } from '../run-status';
import type { RecipeRun } from '../types';

function reviewable(
  overrides: Partial<Pick<RecipeRun, 'validation' | 'checks'>> = {}
): Pick<RecipeRun, 'validation' | 'checks'> {
  return { validation: undefined, checks: undefined, ...overrides };
}

describe('statusWithReviewResults', () => {
  it('keeps the error status untouched', () => {
    expect(statusWithReviewResults('error', reviewable())).toBe('error');
  });

  it('downgrades success to partial when validation is invalid', () => {
    expect(
      statusWithReviewResults(
        'success',
        reviewable({ validation: { status: 'invalid', issues: [{ path: '/', message: 'x' }] } })
      )
    ).toBe('partial');
  });

  it('downgrades success to partial when checks have warnings or errors', () => {
    expect(
      statusWithReviewResults(
        'success',
        reviewable({ checks: { status: 'warning', passed: 0, warnings: 1, errors: 0, skipped: 0, results: [] } })
      )
    ).toBe('partial');
    expect(
      statusWithReviewResults(
        'success',
        reviewable({ checks: { status: 'error', passed: 0, warnings: 0, errors: 1, skipped: 0, results: [] } })
      )
    ).toBe('partial');
  });

  it('preserves the response status when there are no review issues', () => {
    expect(statusWithReviewResults('success', reviewable())).toBe('success');
    expect(statusWithReviewResults('partial', reviewable())).toBe('partial');
  });
});
