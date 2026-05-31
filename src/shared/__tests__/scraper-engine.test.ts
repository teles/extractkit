import { describe, expect, it } from 'vitest';
import { runRecipe } from '../scraper-engine';
import type { Recipe, RecipeField } from '../types';

function recipeWith(fields: RecipeField[], overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 'r',
    name: 'Test',
    category: 'custom',
    tags: [],
    source: 'user',
    urlPatterns: ['*'],
    version: '1.0.0',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    fields,
    ...overrides
  };
}

function html(body: string): Document {
  return new DOMParser().parseFromString(`<!DOCTYPE html><html><body>${body}</body></html>`, 'text/html');
}

const ctx = { url: 'https://example.com/page' };

describe('runRecipe', () => {
  it('extracts simple text fields', () => {
    const result = runRecipe(
      recipeWith([{ id: '1', kind: 'field', key: 'title', selector: 'h1', extract: 'text' }]),
      html('<h1> Hello </h1>'),
      ctx
    );
    expect(result.data.title).toBe(' Hello ');
    expect(result.status).toBe('success');
    expect(result.domain).toBe('example.com');
  });

  it('applies trim, lowercase, uppercase and removeExtraSpaces transforms', () => {
    const result = runRecipe(
      recipeWith([
        {
          id: '1',
          kind: 'field',
          key: 'title',
          selector: 'h1',
          extract: 'text',
          transforms: ['trim', 'removeExtraSpaces', 'lowercase']
        },
        { id: '2', kind: 'field', key: 'upper', selector: 'h1', extract: 'text', transforms: ['trim', 'uppercase'] }
      ]),
      html('<h1>  Hello   World  </h1>'),
      ctx
    );
    expect(result.data.title).toBe('hello world');
    expect(result.data.upper).toBe('HELLO   WORLD');
  });

  it('parses numbers and currency', () => {
    const result = runRecipe(
      recipeWith([
        { id: '1', kind: 'field', key: 'price', selector: '.price', extract: 'text', transforms: ['currency'] },
        { id: '2', kind: 'field', key: 'count', selector: '.count', extract: 'text', transforms: ['number'] }
      ]),
      html('<span class="price">R$ 1.234,56</span><span class="count">42</span>'),
      ctx
    );
    expect(result.data.price).toBe(1234.56);
    expect(result.data.count).toBe(42);
  });

  it('resolves absolute URLs', () => {
    const result = runRecipe(
      recipeWith([
        {
          id: '1',
          kind: 'field',
          key: 'href',
          selector: 'a',
          extract: 'attribute',
          attribute: 'href',
          transforms: ['absoluteUrl']
        }
      ]),
      html('<a href="/about">x</a>'),
      ctx
    );
    expect(result.data.href).toBe('https://example.com/about');
  });

  it('handles attribute extraction without attribute name as an error', () => {
    const result = runRecipe(
      recipeWith([{ id: '1', kind: 'field', key: 'x', selector: 'a', extract: 'attribute' }]),
      html('<a href="/a">x</a>'),
      ctx
    );
    expect(result.errors.length).toBe(1);
    expect(result.data.x).toBeNull();
  });

  it('extracts html, json, exists, count, tagName modes', () => {
    const result = runRecipe(
      recipeWith([
        { id: '1', kind: 'field', key: 'html', selector: 'div', extract: 'html' },
        { id: '2', kind: 'field', key: 'data', selector: 'script', extract: 'json' },
        { id: '3', kind: 'field', key: 'has_main', selector: 'main', extract: 'exists' },
        { id: '4', kind: 'field', key: 'li_count', selector: 'li', extract: 'count' },
        { id: '5', kind: 'field', key: 'tag', selector: 'h1', extract: 'tagName' }
      ]),
      html('<div><b>x</b></div><script type="application/json">{"a":1}</script><main></main><ul><li/><li/></ul><h1></h1>'),
      ctx
    );

    expect(result.data.html).toBe('<b>x</b>');
    expect(result.data.data).toEqual({ a: 1 });
    expect(result.data.has_main).toBe(true);
    expect(result.data.li_count).toBe(2);
    expect(result.data.tag).toBe('h1');
  });

  it('records errors when JSON parsing fails', () => {
    const result = runRecipe(
      recipeWith([{ id: '1', kind: 'field', key: 'data', selector: 'script', extract: 'json' }]),
      html('<script>not json</script>'),
      ctx
    );
    expect(result.errors.length).toBe(1);
  });

  it('warns on required missing values', () => {
    const result = runRecipe(
      recipeWith([
        { id: '1', kind: 'field', key: 'title', selector: 'h1', extract: 'text', required: true }
      ]),
      html(''),
      ctx
    );
    expect(result.warnings.length).toBe(1);
    expect(result.status).toBe('partial');
  });

  it('extracts multiple values and groups', () => {
    const result = runRecipe(
      recipeWith([
        { id: '1', kind: 'field', key: 'links', selector: 'a', extract: 'text', multiple: true },
        {
          id: '2',
          kind: 'group',
          key: 'items',
          selector: '.item',
          multiple: true,
          fields: [{ id: '3', kind: 'field', key: 'label', selector: 'span', extract: 'text' }]
        }
      ]),
      html('<a>1</a><a>2</a><div class="item"><span>A</span></div><div class="item"><span>B</span></div>'),
      ctx
    );
    expect(result.data.links).toEqual(['1', '2']);
    expect(result.data.items).toEqual([{ label: 'A' }, { label: 'B' }]);
  });

  it('reports invalid selectors as errors and returns error status when no data', () => {
    const result = runRecipe(
      recipeWith([{ id: '1', kind: 'field', key: 'x', selector: '<<bad', extract: 'text' }]),
      html(''),
      ctx
    );
    expect(result.errors.length).toBe(1);
    expect(result.status).toBe('error');
  });

  it('captures jsonParse transform errors', () => {
    const result = runRecipe(
      recipeWith([
        { id: '1', kind: 'field', key: 'json', selector: 'h1', extract: 'text', transforms: ['jsonParse'] }
      ]),
      html('<h1>not-json</h1>'),
      ctx
    );
    expect(result.errors.length).toBe(1);
  });
});
