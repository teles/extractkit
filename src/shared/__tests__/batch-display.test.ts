import { describe, expect, it } from 'vitest';
import { batchDisplayName } from '../batch-display';

describe('batchDisplayName', () => {
  it('returns trimmed name when present', () => {
    expect(batchDisplayName({ name: '  My Run  ', createdAt: '2024-01-01T00:00:00Z' })).toBe('My Run');
  });

  it('falls back to fallback label when batch is missing', () => {
    expect(batchDisplayName(null, 'Fallback')).toBe('Fallback');
    expect(batchDisplayName(undefined, 'Fallback')).toBe('Fallback');
  });

  it('returns fallback when no createdAt', () => {
    expect(batchDisplayName({ name: '', createdAt: '' }, 'Fallback')).toBe('Fallback');
  });

  it('returns formatted name when only createdAt is present', () => {
    const result = batchDisplayName({ createdAt: '2024-05-12T10:00:00Z' }, 'Batch run', 'en-US');
    expect(result).toContain('Batch run');
    expect(result).toContain('·');
  });
});
