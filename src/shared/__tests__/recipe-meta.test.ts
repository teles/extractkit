import { describe, expect, it } from 'vitest';
import { recipeCategories, recipeSources } from '../recipe-meta';

describe('recipe-meta', () => {
  it('exposes the full list of categories', () => {
    expect(recipeCategories).toContain('seo');
    expect(recipeCategories).toContain('custom');
    expect(recipeCategories.length).toBeGreaterThanOrEqual(10);
  });

  it('exposes the full list of sources', () => {
    expect(recipeSources).toEqual(['default', 'user', 'imported', 'gallery']);
  });
});
