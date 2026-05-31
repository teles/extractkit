import { describe, expect, it } from 'vitest';
import { validateOutput } from '../output-validation';

describe('validateOutput', () => {
  it('returns skipped when no schema is provided', () => {
    expect(validateOutput({ a: 1 }, undefined)).toEqual({ status: 'skipped', issues: [] });
  });

  it('flags type mismatches', () => {
    const result = validateOutput(
      { a: 'x' },
      {
        type: 'object',
        properties: { a: { type: 'number' } }
      }
    );
    expect(result.status).toBe('invalid');
    expect(result.issues[0]).toMatchObject({ path: '/a', keyword: 'type' });
  });

  it('accepts type unions', () => {
    expect(
      validateOutput({ a: null }, { type: 'object', properties: { a: { type: ['string', 'null'] } } }).status
    ).toBe('valid');
  });

  it('reports missing required properties', () => {
    const result = validateOutput({}, { type: 'object', required: ['a'], properties: { a: { type: 'string' } } });
    expect(result.issues[0]).toMatchObject({ path: '/a', keyword: 'required' });
  });

  it('validates enum values', () => {
    expect(validateOutput('ok', { enum: ['ok', 'ko'] }).status).toBe('valid');
    const invalid = validateOutput('nope', { enum: ['ok', 'ko'] });
    expect(invalid.issues[0]).toMatchObject({ keyword: 'enum' });
  });

  it('walks array items recursively', () => {
    const result = validateOutput([1, 'two'], { type: 'array', items: { type: 'number' } });
    expect(result.status).toBe('invalid');
    expect(result.issues[0].path).toBe('/1');
  });

  it('walks nested object properties', () => {
    const result = validateOutput(
      { outer: { inner: 1 } },
      {
        type: 'object',
        properties: { outer: { type: 'object', properties: { inner: { type: 'string' } } } }
      }
    );
    expect(result.issues[0].path).toBe('/outer/inner');
  });

  it('returns valid when there are no issues', () => {
    expect(validateOutput({ a: 1 }, { type: 'object', properties: { a: { type: 'number' } } })).toEqual({
      status: 'valid',
      issues: []
    });
  });
});
