import type { BatchRunResponse, CurrentTabResponse, PanelMessage, RunRecipeResponse } from '../shared/messaging';
import {
  CONTENT_RUN_RECIPE,
  isPanelMessage,
  MESSAGE_GET_CURRENT_TAB,
  MESSAGE_RUN_RECIPE,
  MESSAGE_START_BATCH_RUN,
  MESSAGE_STOP_BATCH_RUN,
  MESSAGE_VIEW_BATCH_TAB
} from '../shared/messaging';
import type { CurrentTabInfo, ScrapeResult } from '../shared/types';
import { startBatchRun, stopBatchRun, viewBatchTab } from './batch-runner';

type RuntimeResponse = CurrentTabResponse | RunRecipeResponse | BatchRunResponse;

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

function queryTabs(queryInfo: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab[]> {
  return new Promise((resolve, reject) => {
    chrome.tabs.query(queryInfo, (tabs) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }

      resolve(tabs);
    });
  });
}

async function queryActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  const currentWindowTabs = await queryTabs({ active: true, currentWindow: true });
  if (currentWindowTabs[0]?.id) {
    return currentWindowTabs[0];
  }

  const lastFocusedWindowTabs = await queryTabs({ active: true, lastFocusedWindow: true });
  if (lastFocusedWindowTabs[0]?.id) {
    return lastFocusedWindowTabs[0];
  }

  const activeTabs = await queryTabs({ active: true, windowType: 'normal' });
  return activeTabs.find((tab) => Boolean(tab.id));
}

function executeContentScript(tabId: number): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript(
      {
        target: { tabId },
        files: ['content/scraper-runner.js']
      },
      () => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(error.message));
          return;
        }

        resolve();
      }
    );
  });
}

function sendContentMessage(tabId: number, message: unknown): Promise<RunRecipeResponse> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response: RunRecipeResponse | undefined) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }

      if (!response) {
        reject(new Error('The page did not return a response.'));
        return;
      }

      resolve(response);
    });
  });
}

function toCurrentTabInfo(tab: chrome.tabs.Tab | undefined): CurrentTabInfo | null {
  if (!tab?.id) {
    return null;
  }

  return {
    id: tab.id,
    url: tab.url,
    title: tab.title
  };
}

async function getCurrentTab(): Promise<CurrentTabResponse> {
  const tab = await queryActiveTab();
  return {
    ok: true,
    data: toCurrentTabInfo(tab)
  };
}

async function runRecipeInCurrentTab(
  message: Extract<PanelMessage, { type: typeof MESSAGE_RUN_RECIPE }>
): Promise<RunRecipeResponse> {
  const tab = await queryActiveTab();
  if (!tab?.id) {
    return {
      ok: false,
      error: 'No active tab found.'
    };
  }

  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    return {
      ok: false,
      error: 'This page does not allow extension scripts to run.'
    };
  }

  await executeContentScript(tab.id);
  const response = await sendContentMessage(tab.id, {
    type: CONTENT_RUN_RECIPE,
    recipe: message.recipe
  });

  if (!response.ok) {
    return response;
  }

  const data: ScrapeResult = {
    ...response.data,
    url: response.data.url || tab.url,
    pageTitle: response.data.pageTitle || tab.title
  };

  return {
    ok: true,
    data
  };
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => undefined);
});

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse: (response: RuntimeResponse) => void) => {
  if (!isPanelMessage(message)) {
    return false;
  }

  const execute = async (): Promise<RuntimeResponse> => {
    try {
      if (message.type === MESSAGE_GET_CURRENT_TAB) {
        return await getCurrentTab();
      }

      if (message.type === MESSAGE_RUN_RECIPE) {
        return await runRecipeInCurrentTab(message);
      }

      if (message.type === MESSAGE_START_BATCH_RUN) {
        return await startBatchRun(message);
      }

      if (message.type === MESSAGE_STOP_BATCH_RUN) {
        return await stopBatchRun(message.batchId);
      }

      if (message.type === MESSAGE_VIEW_BATCH_TAB) {
        return await viewBatchTab(message.batchId);
      }

      return {
        ok: false,
        error: 'Unsupported message.'
      };
    } catch (error) {
      return {
        ok: false,
        error: toErrorMessage(error)
      };
    }
  };

  execute().then(sendResponse);
  return true;
});
