import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { importRecipesFromFiles, normalizeRecipe } from '../recipe-import';

function jsonFile(name: string, value: unknown): File {
  return new File([JSON.stringify(value)], name, { type: 'application/json' });
}

const validRecipeJson = {
  name: 'My Recipe',
  category: 'seo',
  source: 'user',
  tags: ['Foo', 'foo', 'bar'],
  fields: [
    {
      kind: 'field',
      key: 'title',
      selector: 'h1',
      extract: 'text',
      transforms: ['trim', 'invalid']
    }
  ],
  checks: [
    {
      name: 'has h1',
      selector: 'h1',
      assertion: { type: 'exists' },
      severity: 'error'
    }
  ]
};

describe('normalizeRecipe', () => {
  it('returns null for non-records', () => {
    expect(normalizeRecipe(null)).toBeNull();
    expect(normalizeRecipe('x')).toBeNull();
  });

  it('returns null when name or fields are missing', () => {
    expect(normalizeRecipe({ name: 'x' })).toBeNull();
  });

  it('normalizes a recipe and dedupes/cleans tags', () => {
    const recipe = normalizeRecipe(validRecipeJson);
    expect(recipe).not.toBeNull();
    expect(recipe?.fields).toHaveLength(1);
    expect(recipe?.tags.sort()).toEqual(['bar', 'foo']);
    expect(recipe?.checks).toHaveLength(1);
    const field = recipe?.fields[0];
    expect(field?.kind).toBe('field');
    if (field?.kind === 'field') {
      expect(field.transforms).toEqual(['trim']);
    }
  });

  it('rewrites source "default" to "imported"', () => {
    const recipe = normalizeRecipe({ ...validRecipeJson, source: 'default' });
    expect(recipe?.source).toBe('imported');
  });

  it('falls back to "custom" for unknown categories', () => {
    const recipe = normalizeRecipe({ ...validRecipeJson, category: 'nope' });
    expect(recipe?.category).toBe('custom');
  });

  it('keeps recipes that only have valid checks', () => {
    const recipe = normalizeRecipe({ ...validRecipeJson, fields: [] });
    expect(recipe?.fields).toHaveLength(0);
    expect(recipe?.checks?.length).toBe(1);
  });

  it('returns null when neither valid fields nor checks remain', () => {
    expect(normalizeRecipe({ ...validRecipeJson, fields: [{ kind: 'field' }], checks: [] })).toBeNull();
  });

  it('normalizes group fields and drops invalid children', () => {
    const recipe = normalizeRecipe({
      name: 'g',
      fields: [
        {
          kind: 'group',
          key: 'items',
          selector: '.item',
          fields: [{ kind: 'field', key: 'a', selector: 'a', extract: 'text' }, { kind: 'field' }]
        }
      ]
    });
    const group = recipe?.fields[0];
    expect(group?.kind).toBe('group');
    if (group?.kind === 'group') {
      expect(group.fields).toHaveLength(1);
    }
  });

  it('normalizes a variety of check assertions', () => {
    const recipe = normalizeRecipe({
      name: 'r',
      fields: [{ kind: 'field', key: 'a', selector: 'a', extract: 'text' }],
      checks: [
        { name: 'a', selector: 'a', assertion: { type: 'countEquals', value: 3 } },
        { name: 'b', selector: 'a', assertion: { type: 'countEquals' } },
        { name: 'c', selector: 'a', assertion: { type: 'missingAttributeCountEquals', attribute: 'alt', value: 1 } },
        { name: 'd', selector: 'a', assertion: { type: 'eachElementMustHave', selector: 'span' } },
        { name: 'e', selector: 'a', assertion: { type: 'unknown' } }
      ]
    });
    expect(recipe?.checks?.map((check) => check.name).sort()).toEqual(['a', 'c', 'd']);
  });
});

describe('importRecipesFromFiles', () => {
  it('imports a single JSON file with one recipe', async () => {
    const result = await importRecipesFromFiles([jsonFile('r.json', validRecipeJson)]);
    expect(result.recipes).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  it('imports an array of recipes', async () => {
    const result = await importRecipesFromFiles([jsonFile('r.json', [validRecipeJson, validRecipeJson])]);
    expect(result.recipes).toHaveLength(2);
  });

  it('imports recipes from a recipesById map', async () => {
    const result = await importRecipesFromFiles([
      jsonFile('r.json', { recipesById: { a: validRecipeJson, b: validRecipeJson } })
    ]);
    expect(result.recipes).toHaveLength(2);
  });

  it('reports skipped files when no recipes are found', async () => {
    const result = await importRecipesFromFiles([jsonFile('empty.json', { foo: 'bar' })]);
    expect(result.recipes).toHaveLength(0);
    expect(result.skipped).toHaveLength(1);
  });

  it('reports errors for invalid JSON', async () => {
    const file = new File(['not-json'], 'bad.json', { type: 'application/json' });
    const result = await importRecipesFromFiles([file]);
    expect(result.errors).toHaveLength(1);
  });

  it('imports recipes from a zip with recipes/ entries', async () => {
    const zip = new JSZip();
    zip.file('recipes/one.json', JSON.stringify(validRecipeJson));
    zip.file('other.json', JSON.stringify({ foo: 'bar' }));
    const blob = await zip.generateAsync({ type: 'blob' });
    const file = new File([blob], 'pack.zip', { type: 'application/zip' });

    const result = await importRecipesFromFiles([file]);
    expect(result.recipes).toHaveLength(1);
  });

  it('falls back to all JSON entries when no recipes/ folder exists', async () => {
    const zip = new JSZip();
    zip.file('one.json', JSON.stringify(validRecipeJson));
    const blob = await zip.generateAsync({ type: 'blob' });
    const file = new File([blob], 'pack.zip', { type: 'application/zip' });

    const result = await importRecipesFromFiles([file]);
    expect(result.recipes).toHaveLength(1);
  });
});
