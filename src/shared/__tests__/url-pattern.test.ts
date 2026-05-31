import { describe, expect, it } from 'vitest';
import { matchUrlPattern } from '../url-pattern';

describe('matchUrlPattern', () => {
  it('matches when patterns are empty', () => {
    expect(matchUrlPattern('https://example.com/page', [])).toBe(true);
  });

  it('returns false when url is missing', () => {
    expect(matchUrlPattern(undefined, ['*'])).toBe(false);
  });

  it('returns false for invalid url', () => {
    expect(matchUrlPattern('not a url', ['*'])).toBe(false);
  });

  it('matches the wildcard pattern', () => {
    expect(matchUrlPattern('https://example.com/p', ['*'])).toBe(true);
  });

  it('matches host substring patterns', () => {
    expect(matchUrlPattern('https://shop.example.com/p', ['example.com'])).toBe(true);
    expect(matchUrlPattern('https://other.org/p', ['example.com'])).toBe(false);
  });

  it('matches protocol prefix patterns', () => {
    expect(matchUrlPattern('https://example.com/posts/1', ['https://example.com/'])).toBe(true);
    expect(matchUrlPattern('http://example.com/p', ['https://example.com/'])).toBe(false);
  });

  it('supports wildcard patterns', () => {
    expect(matchUrlPattern('https://example.com/posts/123', ['*://example.com/posts/*'])).toBe(true);
    expect(matchUrlPattern('https://example.com/about', ['*://example.com/posts/*'])).toBe(false);
  });

  it('supports wildcard patterns without explicit protocol', () => {
    expect(matchUrlPattern('https://example.com/x', ['example.com/*'])).toBe(true);
  });

  it('supports regex patterns wrapped in /.../', () => {
    expect(matchUrlPattern('https://example.com/posts/42', ['/posts\\/\\d+/'])).toBe(true);
    expect(matchUrlPattern('https://example.com/about', ['/posts\\/\\d+/'])).toBe(false);
  });

  it('returns false for invalid regex patterns', () => {
    expect(matchUrlPattern('https://example.com', ['/[a-/'])).toBe(false);
  });

  it('treats whitespace-only patterns as wildcard', () => {
    expect(matchUrlPattern('https://example.com', ['   '])).toBe(true);
  });
});
