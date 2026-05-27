/**
 * Vitest test setup — chrome API stubs so composables that use chrome.* don't throw.
 */
const storageMock = (() => {
  const store: Record<string, unknown> = {};
  return {
    get: (keys: string | string[] | Record<string, unknown>, cb: (result: Record<string, unknown>) => void) => {
      const result: Record<string, unknown> = {};
      const keyArr = typeof keys === 'string' ? [keys] : Array.isArray(keys) ? keys : Object.keys(keys);
      for (const k of keyArr) result[k] = store[k];
      cb(result);
    },
    set: (items: Record<string, unknown>, cb?: () => void) => {
      Object.assign(store, items);
      cb?.();
    },
    remove: (keys: string | string[], cb?: () => void) => {
      for (const k of Array.isArray(keys) ? keys : [keys]) delete store[k];
      cb?.();
    },
    clear: (cb?: () => void) => {
      for (const k in store) delete store[k];
      cb?.();
    },
    onChanged: { addListener: () => {}, removeListener: () => {} }
  };
})();

Object.defineProperty(globalThis, 'chrome', {
  value: {
    storage: { local: storageMock },
    runtime: {
      lastError: undefined,
      sendMessage: () => {},
      onMessage: { addListener: () => {}, removeListener: () => {} }
    },
    tabs: { query: (_q: unknown, cb: (tabs: unknown[]) => void) => cb([]) }
  },
  writable: true
});
