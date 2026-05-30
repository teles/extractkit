function hasPermissionsApi(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.permissions?.request);
}

export function hostPermissionOriginFromUrl(url: string | undefined): string | null {
  if (!url) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return null;
    }

    return `${parsedUrl.protocol}//${parsedUrl.hostname}/*`;
  } catch {
    return null;
  }
}

function requestPermission(permissions: chrome.permissions.Permissions): Promise<boolean> {
  return new Promise((resolve, reject) => {
    chrome.permissions.request(permissions, (granted) => {
      const chromeError = chrome.runtime.lastError;
      if (chromeError) {
        reject(new Error(chromeError.message));
        return;
      }

      resolve(granted);
    });
  });
}

async function requestHostPermissions(origins: string[]): Promise<boolean> {
  if (origins.length === 0) {
    return true;
  }

  if (!hasPermissionsApi()) {
    throw new Error('The Chrome permissions API is not available.');
  }

  return await requestPermission({ origins });
}

export async function ensureHostPermissionForUrl(url: string | undefined, deniedMessage?: string): Promise<void> {
  const origin = hostPermissionOriginFromUrl(url);
  if (!origin) {
    return;
  }

  const granted = await requestHostPermissions([origin]);
  if (!granted) {
    throw new Error(deniedMessage ?? `Permission to access ${origin} was denied.`);
  }
}

export async function ensureHostPermissionsForUrls(
  urls: Array<string | undefined>,
  deniedMessage: string
): Promise<void> {
  const origins = Array.from(
    new Set(urls.map(hostPermissionOriginFromUrl).filter((origin): origin is string => Boolean(origin)))
  );

  const granted = await requestHostPermissions(origins);
  if (!granted) {
    throw new Error(deniedMessage);
  }
}
