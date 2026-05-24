import { readonly, ref } from 'vue';
import type { BatchRunResponse } from '../shared/messaging';
import { MESSAGE_START_BATCH_RUN, MESSAGE_STOP_BATCH_RUN, MESSAGE_VIEW_BATCH_TAB } from '../shared/messaging';
import { deleteBatchRun as deleteStoredBatchRun, listBatchRuns as listStoredBatchRuns } from '../shared/storage';
import type { BatchRun, BatchRunOptions, Recipe } from '../shared/types';

type StartBatchRunInput = {
  name?: string;
  urls: string[];
  recipes: Recipe[];
  options: BatchRunOptions;
};

const batchRuns = ref<BatchRun[]>([]);
const loading = ref(false);
const running = ref(false);
const error = ref<string | null>(null);

function hasRuntimeMessaging(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.runtime?.sendMessage);
}

function hasPermissionsApi(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.permissions?.request);
}

function originPermissionFromUrl(url: string): string | null {
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

async function ensureHostPermissions(urls: string[]): Promise<void> {
  const origins = Array.from(
    new Set(urls.map(originPermissionFromUrl).filter((origin): origin is string => Boolean(origin)))
  );
  if (origins.length === 0) {
    return;
  }

  if (!hasPermissionsApi()) {
    throw new Error('The Chrome permissions API is not available.');
  }

  const granted = await requestPermission({ origins });
  if (!granted) {
    throw new Error('Permission to access the batch URLs was denied.');
  }
}

function sendBatchMessage(message: unknown): Promise<BatchRunResponse> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response: BatchRunResponse | undefined) => {
      const chromeError = chrome.runtime.lastError;
      if (chromeError) {
        reject(new Error(chromeError.message));
        return;
      }

      if (!response) {
        reject(new Error('The background worker did not return a response.'));
        return;
      }

      resolve(response);
    });
  });
}

export function useBatchRuns() {
  async function loadBatchRuns(): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      batchRuns.value = await listStoredBatchRuns();
    } catch (caughtError) {
      error.value = caughtError instanceof Error ? caughtError.message : 'Could not load batch runs.';
    } finally {
      loading.value = false;
    }
  }

  async function startBatchRun(input: StartBatchRunInput): Promise<BatchRun | null> {
    running.value = true;
    error.value = null;

    try {
      if (!hasRuntimeMessaging()) {
        throw new Error('Load the extension in Chrome to run batches.');
      }

      await ensureHostPermissions(input.urls);
      const response = await sendBatchMessage({
        type: MESSAGE_START_BATCH_RUN,
        ...input
      });

      if (!response.ok) {
        throw new Error(response.error);
      }

      await loadBatchRuns();
      return response.data;
    } catch (caughtError) {
      error.value = caughtError instanceof Error ? caughtError.message : 'Could not start the batch.';
      return null;
    } finally {
      running.value = false;
    }
  }

  async function stopBatchRun(batchId: string): Promise<BatchRun | null> {
    error.value = null;

    try {
      if (!hasRuntimeMessaging()) {
        throw new Error('Load the extension in Chrome to stop batches.');
      }

      const response = await sendBatchMessage({
        type: MESSAGE_STOP_BATCH_RUN,
        batchId
      });

      if (!response.ok) {
        throw new Error(response.error);
      }

      await loadBatchRuns();
      return response.data;
    } catch (caughtError) {
      error.value = caughtError instanceof Error ? caughtError.message : 'Could not stop the batch.';
      return null;
    }
  }

  async function viewProcessingTab(batchId: string): Promise<void> {
    error.value = null;

    try {
      if (!hasRuntimeMessaging()) {
        throw new Error('Load the extension in Chrome to view the processing tab.');
      }

      const response = await sendBatchMessage({
        type: MESSAGE_VIEW_BATCH_TAB,
        batchId
      });

      if (!response.ok) {
        throw new Error(response.error);
      }
    } catch (caughtError) {
      error.value = caughtError instanceof Error ? caughtError.message : 'Could not open the processing tab.';
    }
  }

  async function removeBatchRun(batchId: string): Promise<void> {
    await deleteStoredBatchRun(batchId);
    await loadBatchRuns();
  }

  return {
    batchRuns,
    loading: readonly(loading),
    running: readonly(running),
    error: readonly(error),
    loadBatchRuns,
    startBatchRun,
    stopBatchRun,
    viewProcessingTab,
    removeBatchRun
  };
}
