import { readonly, ref } from 'vue';
import {
  clearRuns as clearStoredRuns,
  deleteRun as deleteStoredRun,
  listRuns as listStoredRuns,
  saveRun as saveStoredRun
} from '../shared/storage';
import type { RecipeRun } from '../shared/types';

const runs = ref<RecipeRun[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

export function useRuns() {
  async function loadRuns(): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      runs.value = await listStoredRuns();
    } catch (caughtError) {
      error.value = caughtError instanceof Error ? caughtError.message : 'Could not load saved runs.';
    } finally {
      loading.value = false;
    }
  }

  async function saveRun(run: RecipeRun): Promise<void> {
    await saveStoredRun(run);
    await loadRuns();
  }

  async function removeRun(id: string): Promise<void> {
    await deleteStoredRun(id);
    await loadRuns();
  }

  async function clearRuns(): Promise<void> {
    await clearStoredRuns();
    await loadRuns();
  }

  return {
    runs,
    loading: readonly(loading),
    error: readonly(error),
    loadRuns,
    saveRun,
    removeRun,
    clearRuns
  };
}
