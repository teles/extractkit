import { describe, expect, it } from 'vitest';
import { runRecipeChecks } from '../checks-engine';
import type { RecipeCheck } from '../types';

function html(body: string): Document {
  return new DOMParser().parseFromString(`<!DOCTYPE html><html><body>${body}</body></html>`, 'text/html');
}

function check(overrides: Partial<RecipeCheck>): RecipeCheck {
  return {
    id: overrides.id ?? 'c1',
    name: overrides.name ?? 'check',
    selector: overrides.selector ?? 'h1',
    severity: overrides.severity ?? 'error',
    assertion: overrides.assertion ?? { type: 'exists' },
    description: overrides.description
  };
}

describe('runRecipeChecks', () => {
  it('returns skipped result when no checks are provided', () => {
    expect(runRecipeChecks(undefined, html('')).status).toBe('skipped');
    expect(runRecipeChecks([], html('')).status).toBe('skipped');
  });

  it('handles exists and notExists', () => {
    const doc = html('<h1>x</h1>');
    expect(runRecipeChecks([check({ assertion: { type: 'exists' } })], doc).status).toBe('passed');
    expect(
      runRecipeChecks([check({ id: 'c2', selector: 'h2', assertion: { type: 'notExists' } })], doc).status
    ).toBe('passed');
    expect(
      runRecipeChecks([check({ id: 'c3', selector: 'h2', assertion: { type: 'exists' }, severity: 'warning' })], doc)
        .status
    ).toBe('warning');
  });

  it('handles count assertions', () => {
    const doc = html('<li>1</li><li>2</li><li>3</li>');
    expect(runRecipeChecks([check({ selector: 'li', assertion: { type: 'countEquals', value: 3 } })], doc).status).toBe(
      'passed'
    );
    expect(runRecipeChecks([check({ selector: 'li', assertion: { type: 'countGreaterThan', value: 1 } })], doc).status).toBe(
      'passed'
    );
    expect(
      runRecipeChecks([check({ selector: 'li', assertion: { type: 'countLessThanOrEqual', value: 3 } })], doc).status
    ).toBe('passed');
    expect(
      runRecipeChecks([check({ selector: 'li', assertion: { type: 'countLessThan', value: 1 }, severity: 'error' })], doc)
        .status
    ).toBe('error');
    expect(
      runRecipeChecks(
        [check({ selector: 'li', assertion: { type: 'countGreaterThanOrEqual', value: 3 } })],
        doc
      ).status
    ).toBe('passed');
  });

  it('reports invalid selectors as failed', () => {
    const doc = html('<h1>x</h1>');
    const result = runRecipeChecks([check({ selector: '<<bad', assertion: { type: 'exists' } })], doc);
    expect(result.status).toBe('error');
    expect(result.results[0].message).toMatch(/Invalid selector/);
  });

  it('handles missingAttributeCountEquals', () => {
    const doc = html('<img src="a"/><img/>');
    expect(
      runRecipeChecks(
        [
          check({
            selector: 'img',
            assertion: { type: 'missingAttributeCountEquals', attribute: 'alt', value: 2 }
          })
        ],
        doc
      ).status
    ).toBe('passed');
  });

  it('handles emptyAttributeCountEquals', () => {
    const doc = html('<img alt=""/><img alt="ok"/>');
    expect(
      runRecipeChecks(
        [
          check({
            selector: 'img',
            assertion: { type: 'emptyAttributeCountEquals', attribute: 'alt', value: 1 }
          })
        ],
        doc
      ).status
    ).toBe('passed');
  });

  it('handles eachElementMustHave and eachElementShouldHave', () => {
    const doc = html('<article><h2>a</h2></article><article><h2>b</h2></article>');
    expect(
      runRecipeChecks(
        [check({ selector: 'article', assertion: { type: 'eachElementMustHave', selector: 'h2' } })],
        doc
      ).status
    ).toBe('passed');

    const failing = runRecipeChecks(
      [check({ selector: 'article', assertion: { type: 'eachElementMustHave', selector: 'p' } })],
      doc
    );
    expect(failing.status).toBe('error');

    const skipped = runRecipeChecks(
      [check({ selector: 'section', assertion: { type: 'eachElementShouldHave', selector: 'h2' }, severity: 'warning' })],
      doc
    );
    expect(skipped.results[0].status).toBe('skipped');
  });

  it('supports :scope when running against an Element', () => {
    const doc = html('<section><h1>x</h1></section>');
    const root = doc.querySelector('section') as Element;
    expect(runRecipeChecks([check({ selector: ':scope', assertion: { type: 'exists' } })], root).status).toBe('passed');
  });
});
