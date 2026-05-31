import { describe, expect, it } from 'vitest';
import { generateOutputSchema } from '../output-schema';
import type { Recipe } from '../types';

function makeRecipe(fields: Recipe['fields']): Recipe {
  return {
    id: 'r',
    name: 'r',
    category: 'custom',
    tags: [],
    source: 'user',
    urlPatterns: ['*'],
    version: '1.0.0',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    fields
  };
}

describe('generateOutputSchema', () => {
  it('builds a schema for simple fields based on extract mode', () => {
    const schema = generateOutputSchema(
      makeRecipe([
        { id: '1', kind: 'field', key: 'title', selector: 'h1', extract: 'text', required: true },
        { id: '2', kind: 'field', key: 'has_main', selector: 'main', extract: 'exists' },
        { id: '3', kind: 'field', key: 'count', selector: 'li', extract: 'count' },
        { id: '4', kind: 'field', key: 'data', selector: 'script', extract: 'json' }
      ])
    );

    expect(schema.required).toEqual(['title']);
    const props = schema.properties as Record<string, { type: unknown }>;
    expect(props.title.type).toEqual(['string', 'null']);
    expect(props.has_main.type).toBe('boolean');
    expect(props.count.type).toBe('number');
    expect(Array.isArray(props.data.type)).toBe(true);
  });

  it('wraps multiple-field schemas in arrays', () => {
    const schema = generateOutputSchema(
      makeRecipe([{ id: '1', kind: 'field', key: 'links', selector: 'a', extract: 'text', multiple: true }])
    );
    const props = schema.properties as Record<string, { type: string; items: { type: unknown } }>;
    expect(props.links.type).toBe('array');
    expect(props.links.items.type).toEqual(['string', 'null']);
  });

  it('builds group field schemas with required children', () => {
    const schema = generateOutputSchema(
      makeRecipe([
        {
          id: '1',
          kind: 'group',
          key: 'items',
          selector: '.item',
          multiple: true,
          fields: [
            { id: '2', kind: 'field', key: 'title', selector: 'h2', extract: 'text', required: true },
            { id: '3', kind: 'field', key: 'description', selector: 'p', extract: 'text' }
          ]
        }
      ])
    );

    const props = schema.properties as Record<string, { type: string; items: { required: string[] } }>;
    expect(props.items.type).toBe('array');
    expect(props.items.items.required).toEqual(['title']);
  });
});
