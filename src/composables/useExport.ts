import { readonly, ref } from 'vue';
import { exportRunsToZip } from '../shared/export';
import { safeFilename } from '../shared/filename';
import type { BatchRun, Recipe, RecipeRun } from '../shared/types';

const exporting = ref(false);
const error = ref<string | null>(null);

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function useExport() {
  async function exportRuns(
    runs: RecipeRun[],
    recipes: Recipe[],
    label = 'extractkit',
    batches: BatchRun[] = []
  ): Promise<void> {
    exporting.value = true;
    error.value = null;

    try {
      if (runs.length === 0) {
        throw new Error('No saved runs selected for export.');
      }

      const zip = await exportRunsToZip(runs, recipes, batches);
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      downloadBlob(zip, `${safeFilename(`${label}-${stamp}`, 'extractkit-export')}.zip`);
    } catch (caughtError) {
      error.value = caughtError instanceof Error ? caughtError.message : 'Could not export data.';
    } finally {
      exporting.value = false;
    }
  }

  return {
    exporting: readonly(exporting),
    error: readonly(error),
    exportRuns
  };
}
