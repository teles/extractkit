import { describe, expect, it } from 'vitest';
import type { RawDiscoveredLink, UrlDiscoveryOptions } from '../types';
import { createUrlDiscoveryResult, DEFAULT_URL_DISCOVERY_OPTIONS, isDiscoverableSourceUrl } from '../url-discovery';

function link(index: number, href: string, absoluteUrl = href, text?: string): RawDiscoveredLink {
  return { index, href, absoluteUrl, text };
}

const baseOptions: UrlDiscoveryOptions = { ...DEFAULT_URL_DISCOVERY_OPTIONS };

describe('isDiscoverableSourceUrl', () => {
  it('returns true for http(s)', () => {
    expect(isDiscoverableSourceUrl('https://example.com')).toBe(true);
    expect(isDiscoverableSourceUrl('http://example.com')).toBe(true);
  });

  it('returns false otherwise', () => {
    expect(isDiscoverableSourceUrl(undefined)).toBe(false);
    expect(isDiscoverableSourceUrl('chrome://extensions')).toBe(false);
    expect(isDiscoverableSourceUrl('garbage')).toBe(false);
  });
});

describe('createUrlDiscoveryResult', () => {
  it('discovers, deduplicates and removes fragments by default', () => {
    const result = createUrlDiscoveryResult(
      [
        link(0, 'https://example.com/a'),
        link(1, 'https://example.com/a#section'),
        link(2, 'https://example.com/b/'),
        link(3, '')
      ],
      { url: 'https://example.com' },
      baseOptions
    );

    expect(result.counts.discovered).toBe(2);
    expect(result.counts.duplicates).toBe(1);
    expect(result.counts.invalid).toBe(1);
    expect(result.items.find((item) => item.status === 'invalid')).toBeDefined();
  });

  it('excludes external links when sameDomainOnly is on', () => {
    const result = createUrlDiscoveryResult(
      [link(0, 'https://other.com/a'), link(1, 'https://example.com/a')],
      { url: 'https://example.com' },
      baseOptions
    );

    expect(result.counts.externalExcluded).toBe(1);
    expect(result.counts.discovered).toBe(1);
  });

  it('marks unsupported protocols', () => {
    const result = createUrlDiscoveryResult(
      [link(0, 'mailto:me@example.com', 'mailto:me@example.com')],
      { url: 'https://example.com' },
      baseOptions
    );
    expect(result.counts.unsupported).toBe(1);
  });

  it('respects include and exclude patterns', () => {
    const includeOnly = createUrlDiscoveryResult(
      [link(0, 'https://example.com/blog/1'), link(1, 'https://example.com/about')],
      { url: 'https://example.com' },
      { ...baseOptions, includePattern: '/blog/' }
    );
    expect(includeOnly.counts.discovered).toBe(1);
    expect(includeOnly.counts.patternExcluded).toBe(1);

    const excluded = createUrlDiscoveryResult(
      [link(0, 'https://example.com/blog/1'), link(1, 'https://example.com/about')],
      { url: 'https://example.com' },
      { ...baseOptions, excludePattern: '/blog/' }
    );
    expect(excluded.counts.discovered).toBe(1);
    expect(excluded.counts.patternExcluded).toBe(1);
  });

  it('caps results at maxUrls', () => {
    const links = Array.from({ length: 5 }, (_, index) => link(index, `https://example.com/p${index}`));
    const result = createUrlDiscoveryResult(links, { url: 'https://example.com' }, { ...baseOptions, maxUrls: 2 });
    expect(result.counts.discovered).toBe(2);
  });

  it('marks invalid URLs that cannot be parsed', () => {
    const result = createUrlDiscoveryResult(
      [link(0, 'http://[invalid', 'http://[invalid')],
      { url: 'https://example.com' },
      baseOptions
    );
    expect(result.counts.invalid).toBe(1);
  });

  it('normalizes trailing slashes when enabled', () => {
    const result = createUrlDiscoveryResult(
      [link(0, 'https://example.com/a/'), link(1, 'https://example.com/a')],
      { url: 'https://example.com' },
      { ...baseOptions, normalizeTrailingSlash: true }
    );
    expect(result.counts.discovered).toBe(1);
    expect(result.counts.duplicates).toBe(1);
  });
});
