import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ensureHostPermissionForUrl, ensureHostPermissionsForUrls, hostPermissionOriginFromUrl } from '../host-permissions';

describe('hostPermissionOriginFromUrl', () => {
  it('returns null for empty or invalid input', () => {
    expect(hostPermissionOriginFromUrl(undefined)).toBeNull();
    expect(hostPermissionOriginFromUrl('not-a-url')).toBeNull();
  });

  it('returns null for non-http schemes', () => {
    expect(hostPermissionOriginFromUrl('chrome://extensions')).toBeNull();
  });

  it('returns the origin pattern for http(s)', () => {
    expect(hostPermissionOriginFromUrl('https://example.com/page')).toBe('https://example.com/*');
    expect(hostPermissionOriginFromUrl('http://example.com')).toBe('http://example.com/*');
  });
});

type ChromeStub = {
  permissions?: {
    request: (
      _permissions: chrome.permissions.Permissions,
      callback: (granted: boolean) => void
    ) => void;
  };
  runtime: { lastError: { message: string } | undefined };
};

const originalChrome = (globalThis as unknown as { chrome: ChromeStub }).chrome;

function setChrome(stub: ChromeStub | undefined): void {
  (globalThis as unknown as { chrome: ChromeStub | undefined }).chrome = stub;
}

afterEach(() => {
  setChrome(originalChrome);
});

describe('ensureHostPermissionForUrl', () => {
  it('does nothing for unsupported urls', async () => {
    setChrome({ runtime: { lastError: undefined } });
    await expect(ensureHostPermissionForUrl(undefined)).resolves.toBeUndefined();
  });

  it('throws when the api is unavailable', async () => {
    setChrome({ runtime: { lastError: undefined } });
    await expect(ensureHostPermissionForUrl('https://example.com')).rejects.toThrow(/Chrome permissions API/);
  });

  it('throws when the user denies the permission', async () => {
    const request = vi.fn(
      (_p: chrome.permissions.Permissions, cb: (granted: boolean) => void) => cb(false)
    );
    setChrome({ permissions: { request }, runtime: { lastError: undefined } });
    await expect(ensureHostPermissionForUrl('https://example.com', 'denied')).rejects.toThrow('denied');
    expect(request).toHaveBeenCalledWith({ origins: ['https://example.com/*'] }, expect.any(Function));
  });

  it('resolves when the user accepts the permission', async () => {
    setChrome({
      permissions: {
        request: (_p, cb) => cb(true)
      },
      runtime: { lastError: undefined }
    });
    await expect(ensureHostPermissionForUrl('https://example.com')).resolves.toBeUndefined();
  });

  it('rejects when chrome reports a lastError', async () => {
    setChrome({
      permissions: {
        request: (_p, cb) => {
          (globalThis as unknown as { chrome: ChromeStub }).chrome.runtime.lastError = { message: 'boom' };
          cb(false);
          (globalThis as unknown as { chrome: ChromeStub }).chrome.runtime.lastError = undefined;
        }
      },
      runtime: { lastError: undefined }
    });
    await expect(ensureHostPermissionForUrl('https://example.com')).rejects.toThrow('boom');
  });
});

describe('ensureHostPermissionsForUrls', () => {
  it('skips when there are no valid origins', async () => {
    setChrome({ runtime: { lastError: undefined } });
    await expect(ensureHostPermissionsForUrls([undefined, 'chrome://x'], 'denied')).resolves.toBeUndefined();
  });

  it('requests deduplicated origins', async () => {
    const request = vi.fn((_p: chrome.permissions.Permissions, cb: (granted: boolean) => void) => cb(true));
    setChrome({ permissions: { request }, runtime: { lastError: undefined } });
    await ensureHostPermissionsForUrls(
      ['https://a.com/x', 'https://a.com/y', 'https://b.com'],
      'denied'
    );
    expect(request).toHaveBeenCalledTimes(1);
    const arg = request.mock.calls[0][0] as { origins: string[] };
    expect(arg.origins.sort()).toEqual(['https://a.com/*', 'https://b.com/*']);
  });

  it('throws when permissions are denied', async () => {
    setChrome({
      permissions: { request: (_p, cb) => cb(false) },
      runtime: { lastError: undefined }
    });
    await expect(ensureHostPermissionsForUrls(['https://a.com'], 'no go')).rejects.toThrow('no go');
  });
});
