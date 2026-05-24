function escapeRegex(value: string): string {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

function wildcardToRegex(pattern: string): RegExp {
  const parts = pattern.split('*').map(escapeRegex);
  return new RegExp(`^${parts.join('.*')}$`, 'i');
}

function matchesPattern(url: URL, pattern: string): boolean {
  const trimmedPattern = pattern.trim();
  if (!trimmedPattern || trimmedPattern === '*') {
    return true;
  }

  if (trimmedPattern.startsWith('/') && trimmedPattern.endsWith('/') && trimmedPattern.length > 2) {
    try {
      return new RegExp(trimmedPattern.slice(1, -1), 'i').test(url.href);
    } catch {
      return false;
    }
  }

  if (trimmedPattern.includes('*')) {
    const withProtocol = trimmedPattern.includes('://') ? trimmedPattern : `*://${trimmedPattern}`;
    return wildcardToRegex(withProtocol).test(url.href);
  }

  if (trimmedPattern.includes('://')) {
    return url.href.toLowerCase().startsWith(trimmedPattern.toLowerCase());
  }

  return url.hostname.toLowerCase().includes(trimmedPattern.toLowerCase());
}

export function matchUrlPattern(url: string | undefined, patterns: string[]): boolean {
  if (!url) {
    return false;
  }

  if (patterns.length === 0) {
    return true;
  }

  try {
    const parsedUrl = new URL(url);
    return patterns.some((pattern) => matchesPattern(parsedUrl, pattern));
  } catch {
    return false;
  }
}
