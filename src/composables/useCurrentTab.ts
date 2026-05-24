import { readonly, ref } from 'vue';
import type { CurrentTabResponse } from '../shared/messaging';
import { MESSAGE_GET_CURRENT_TAB } from '../shared/messaging';
import type { CurrentTabInfo } from '../shared/types';

const currentTab = ref<CurrentTabInfo | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

function hasRuntimeMessaging(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.runtime?.sendMessage);
}

export function useCurrentTab() {
  async function refreshCurrentTab(): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      if (!hasRuntimeMessaging()) {
        currentTab.value = null;
        error.value = 'Chrome APIs are only available inside the loaded extension.';
        return;
      }

      const response = (await chrome.runtime.sendMessage({ type: MESSAGE_GET_CURRENT_TAB })) as CurrentTabResponse;
      if (!response.ok) {
        throw new Error(response.error);
      }

      currentTab.value = response.data;
    } catch (caughtError) {
      error.value = caughtError instanceof Error ? caughtError.message : 'Could not get the current tab.';
      currentTab.value = null;
    } finally {
      loading.value = false;
    }
  }

  return {
    currentTab: readonly(currentTab),
    loading: readonly(loading),
    error: readonly(error),
    refreshCurrentTab
  };
}
