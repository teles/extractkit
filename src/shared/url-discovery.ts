import type {
  RawDiscoveredLink,
  UrlDiscoveryCounts,
  UrlDiscoveryItem,
  UrlDiscoveryOptions,
  UrlDiscoveryResult,
  UrlDiscoveryStatus
} from './types';

const unsupportedProtocols = new Set(['javascript:', 'mailto:', 'tel:', 'chrome:', 'chrome-extension:', 'about:']);

export const DEFAULT_URL_DISCOVERY_OPTIONS: UrlDiscoveryOptions = {
  sameDomainOnly: true,
  removeDuplicates: true,
  removeFragments: true,
  maxUrls: 100
};

function normalizeDiscoveryOptions(options: UrlDiscoveryOptions): UrlDiscoveryOptions {
  return {
    sameDomainOnly: Boolean(options.sameDomainOnly),
    removeDuplicates: Boolean(options.removeDuplicates),
    removeFragments: Boolean(options.removeFragments),
    maxUrls: Math.min(1000, Math.max(1, Math.round(Number(options.maxUrls) || DEFAULT_URL_DISCOVERY_OPTIONS.maxUrls)))
  };
}

export function isDiscoverableSourceUrl(url: string | undefined): url is string {
  if (!url) {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

function itemFromLink(link: RawDiscoveredLink, url: string, status: UrlDiscoveryStatus): UrlDiscoveryItem {
  return {
    id: `${link.index}-${status}-${url}`,
    url,
    text: link.text,
    status,
    rawHref: link.href
  };
}

function countSkipped(counts: UrlDiscoveryCounts): number {
  return counts.duplicates + counts.unsupported + counts.externalExcluded + counts.invalid;
}

export function createUrlDiscoveryResult(
  rawLinks: RawDiscoveredLink[],
  source: { url: string; title?: string },
  rawOptions: UrlDiscoveryOptions
): UrlDiscoveryResult {
  const options = normalizeDiscoveryOptions(rawOptions);
  const sourceUrl = new URL(source.url);
  const seen = new Set<string>();
  const discoveredItems: UrlDiscoveryItem[] = [];
  const skippedPreviewItems: UrlDiscoveryItem[] = [];
  const skippedPreviewLimit = Math.min(25, options.maxUrls);
  const counts: UrlDiscoveryCounts = {
    discovered: 0,
    duplicates: 0,
    unsupported: 0,
    externalExcluded: 0,
    invalid: 0,
    skipped: 0
  };

  for (const link of rawLinks) {
    if (counts.discovered >= options.maxUrls) {
      break;
    }

    const rawHref = link.href.trim();
    const candidate = (link.absoluteUrl || link.href).trim();
    if (!rawHref || !candidate) {
      counts.invalid += 1;
      if (skippedPreviewItems.length < skippedPreviewLimit) {
        skippedPreviewItems.push(itemFromLink(link, rawHref || candidate || '(empty)', 'invalid'));
      }
      continue;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(candidate, source.url);
    } catch {
      counts.invalid += 1;
      if (skippedPreviewItems.length < skippedPreviewLimit) {
        skippedPreviewItems.push(itemFromLink(link, candidate, 'invalid'));
      }
      continue;
    }

    if (
      unsupportedProtocols.has(parsedUrl.protocol) ||
      (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:')
    ) {
      counts.unsupported += 1;
      if (skippedPreviewItems.length < skippedPreviewLimit) {
        skippedPreviewItems.push(itemFromLink(link, parsedUrl.toString(), 'unsupported'));
      }
      continue;
    }

    if (options.removeFragments) {
      parsedUrl.hash = '';
    }

    const normalizedUrl = parsedUrl.toString();
    if (options.sameDomainOnly && parsedUrl.hostname !== sourceUrl.hostname) {
      counts.externalExcluded += 1;
      if (skippedPreviewItems.length < skippedPreviewLimit) {
        skippedPreviewItems.push(itemFromLink(link, normalizedUrl, 'external'));
      }
      continue;
    }

    if (options.removeDuplicates && seen.has(normalizedUrl)) {
      counts.duplicates += 1;
      if (skippedPreviewItems.length < skippedPreviewLimit) {
        skippedPreviewItems.push(itemFromLink(link, normalizedUrl, 'duplicate'));
      }
      continue;
    }

    seen.add(normalizedUrl);
    counts.discovered += 1;
    discoveredItems.push(itemFromLink(link, normalizedUrl, 'discovered'));
  }

  counts.skipped = countSkipped(counts);

  return {
    sourceUrl: source.url,
    sourceTitle: source.title,
    items: [...discoveredItems, ...skippedPreviewItems],
    counts
  };
}
