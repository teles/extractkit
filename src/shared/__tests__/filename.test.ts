import { describe, expect, it } from 'vitest';
import { safeFilename } from '../filename';

describe('safeFilename', () => {
  it('removes accents and replaces unsafe characters with dashes', () => {
    expect(safeFilename('Olá, Mundo! Café')).toBe('Ola-Mundo-Cafe');
  });

  it('preserves dots, dashes and underscores', () => {
    expect(safeFilename('my-file_v1.0.json')).toBe('my-file_v1.0.json');
  });

  it('strips leading and trailing dashes', () => {
    expect(safeFilename('---hello---')).toBe('hello');
  });

  it('truncates to 120 characters', () => {
    const long = 'a'.repeat(200);
    expect(safeFilename(long)).toHaveLength(120);
  });

  it('returns the fallback for empty values', () => {
    expect(safeFilename('')).toBe('arquivo');
    expect(safeFilename('   ', 'fallback')).toBe('fallback');
    expect(safeFilename('!!!')).toBe('arquivo');
  });
});
