import { createBatchPlan, isSupportedBatchUrl } from '../shared/batch-planner';
import type { BatchRunResponse, RunRecipeResponse, StartBatchRunMessage } from '../shared/messaging';
import { CONTENT_RUN_RECIPE } from '../shared/messaging';
import { generateOutputSchema } from '../shared/output-schema';
import { validateOutput } from '../shared/output-validation';
import { statusWithReviewResults } from '../shared/run-status';
import { getBatchRun, saveBatchRun, saveRun, updateBatchRun } from '../shared/storage';
import type { BatchRun, BatchRunEvent, BatchRunOptions, Recipe, RecipeRun, ScrapeResult } from '../shared/types';

type BatchController = {
  cancelled: boolean;
};

type RuntimeBatchResponse = BatchRunResponse;

const controllers = new Map<string, BatchController>();
const MAX_STORED_EVENTS = 200;
const PROCESSING_TAB_CLOSED_MESSAGE = 'Processing tab was closed';

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function nowIso(): string {
  return new Date().toISOString();
}

function autoBatchName(): string {
  return `Batch run · ${new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date())}`;
}

function createTab(createProperties: chrome.tabs.CreateProperties): Promise<chrome.tabs.Tab> {
  return new Promise((resolve, reject) => {
    chrome.tabs.create(createProperties, (tab) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }

      resolve(tab);
    });
  });
}

function getTab(tabId: number): Promise<chrome.tabs.Tab> {
  return new Promise((resolve, reject) => {
    chrome.tabs.get(tabId, (tab) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(PROCESSING_TAB_CLOSED_MESSAGE));
        return;
      }

      resolve(tab);
    });
  });
}

function updateTab(tabId: number, updateProperties: chrome.tabs.UpdateProperties): Promise<chrome.tabs.Tab> {
  return new Promise((resolve, reject) => {
    chrome.tabs.update(tabId, updateProperties, (tab) => {
      const error = chrome.runtime.lastError;
      if (error || !tab) {
        reject(new Error(error?.message ?? PROCESSING_TAB_CLOSED_MESSAGE));
        return;
      }

      resolve(tab);
    });
  });
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

function sendContentMessage(tabId: number, recipe: Recipe): Promise<RunRecipeResponse> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, { type: CONTENT_RUN_RECIPE, recipe }, (response: RunRecipeResponse | undefined) => {
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

function waitForTabComplete(tabId: number, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      chrome.tabs.onUpdated.removeListener(onUpdated);
      chrome.tabs.onRemoved.removeListener(onRemoved);
      clearTimeout(timeout);
    };

    const settle = (callback: () => void) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      callback();
    };

    const onUpdated = (updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        settle(resolve);
      }
    };

    const onRemoved = (removedTabId: number) => {
      if (removedTabId === tabId) {
        settle(() => reject(new Error(PROCESSING_TAB_CLOSED_MESSAGE)));
      }
    };

    const timeout = setTimeout(() => {
      settle(() => reject(new Error(`Page load timeout after ${Math.round(timeoutMs / 1000)}s.`)));
    }, timeoutMs);

    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.tabs.onRemoved.addListener(onRemoved);

    getTab(tabId)
      .then((tab) => {
        if (tab.status === 'complete') {
          settle(resolve);
        }
      })
      .catch((error) => {
        settle(() => reject(error));
      });
  });
}

async function mutateBatch(batchId: string, mutate: (batch: BatchRun) => BatchRun): Promise<BatchRun | undefined> {
  const batch = await getBatchRun(batchId);
  if (!batch) {
    return undefined;
  }

  const nextBatch = {
    ...mutate(batch),
    updatedAt: nowIso()
  };

  await saveBatchRun(nextBatch);
  return nextBatch;
}

function appendEvent(batch: BatchRun, event: BatchRunEvent): BatchRun {
  return {
    ...batch,
    events: [...batch.events, event].slice(-MAX_STORED_EVENTS)
  };
}

function replaceEvent(batch: BatchRun, eventId: string, patch: Partial<BatchRunEvent>): BatchRun {
  return {
    ...batch,
    events: batch.events.map((event) => (event.id === eventId ? { ...event, ...patch } : event))
  };
}

function shouldSaveRun(run: RecipeRun, options: BatchRunOptions): boolean {
  if (run.status === 'success') {
    return options.saveSuccessfulRuns;
  }

  if (run.status === 'partial') {
    return options.saveWarningRuns;
  }

  return options.saveFailedRuns;
}

function runCountPatch(
  run: RecipeRun
): Pick<BatchRun, 'completedRuns' | 'successfulRuns' | 'warningRuns' | 'failedRuns'> {
  return {
    completedRuns: 1,
    successfulRuns: run.status === 'success' ? 1 : 0,
    warningRuns: run.status === 'partial' ? 1 : 0,
    failedRuns: run.status === 'error' ? 1 : 0
  };
}

function addCounts(
  batch: BatchRun,
  counts: Partial<Pick<BatchRun, 'completedRuns' | 'successfulRuns' | 'warningRuns' | 'failedRuns' | 'skippedRuns'>>
): BatchRun {
  return {
    ...batch,
    completedRuns: batch.completedRuns + (counts.completedRuns ?? 0),
    successfulRuns: batch.successfulRuns + (counts.successfulRuns ?? 0),
    warningRuns: batch.warningRuns + (counts.warningRuns ?? 0),
    failedRuns: batch.failedRuns + (counts.failedRuns ?? 0),
    skippedRuns: batch.skippedRuns + (counts.skippedRuns ?? 0)
  };
}

function isProcessingTabClosedError(error: unknown): boolean {
  return toErrorMessage(error).includes(PROCESSING_TAB_CLOSED_MESSAGE);
}

async function navigateWithRetries(
  tabId: number,
  url: string,
  options: BatchRunOptions,
  controller: BatchController
): Promise<void> {
  const maxAttempts = options.onUrlError === 'retryThenSkip' ? options.retryFailedUrls + 1 : 1;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (controller.cancelled) {
      throw new Error('Batch cancelled.');
    }

    try {
      await updateTab(tabId, { url, active: false, pinned: true });
      await waitForTabComplete(tabId, options.pageLoadTimeoutMs);
      return;
    } catch (error) {
      lastError = error;
      if (isProcessingTabClosedError(error)) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Could not load URL.');
}

async function runRecipeInTab(
  tabId: number,
  recipe: Recipe,
  batch: BatchRun,
  batchUrlIndex: number
): Promise<RecipeRun> {
  await executeContentScript(tabId);
  const response = await sendContentMessage(tabId, recipe);
  if (!response.ok) {
    throw new Error(response.error);
  }

  const scrapeResult: ScrapeResult = response.data;
  const validation = validateOutput(scrapeResult.data, generateOutputSchema(recipe));
  const checks = scrapeResult.checks;

  return {
    id: crypto.randomUUID(),
    recipeId: recipe.id,
    recipeVersion: recipe.version,
    recipeName: recipe.name,
    batchId: batch.id,
    batchName: batch.name,
    batchUrlIndex,
    url: scrapeResult.url,
    domain: scrapeResult.domain,
    pageTitle: scrapeResult.pageTitle,
    status: statusWithReviewResults(scrapeResult.status, { validation, checks }),
    createdAt: nowIso(),
    durationMs: scrapeResult.durationMs,
    data: scrapeResult.data,
    validation,
    checks,
    warnings: scrapeResult.warnings,
    errors: scrapeResult.errors
  };
}

async function finishBatch(batchId: string, status: BatchRun['status'], message?: string): Promise<void> {
  await mutateBatch(batchId, (batch) => {
    const completedAt = nowIso();
    const nextBatch: BatchRun = {
      ...batch,
      status,
      completedAt
    };

    if (!message) {
      return nextBatch;
    }

    return appendEvent(nextBatch, {
      id: crypto.randomUUID(),
      batchId,
      url: '',
      status: status === 'cancelled' ? 'skipped' : 'failed',
      message,
      completedAt
    });
  });
}

async function runBatch(batchId: string, recipes: Recipe[], controller: BatchController): Promise<void> {
  const initialBatch = await getBatchRun(batchId);
  if (!initialBatch?.processingTabId) {
    return;
  }

  const plan = createBatchPlan(initialBatch.urls, recipes, initialBatch.options);
  const tabId = initialBatch.processingTabId;

  try {
    for (const mapping of plan.mappings) {
      if (controller.cancelled) {
        await finishBatch(batchId, 'cancelled', 'Batch stopped by user.');
        return;
      }

      if (mapping.recipes.length === 0) {
        await mutateBatch(batchId, (batch) =>
          appendEvent(batch, {
            id: crypto.randomUUID(),
            batchId,
            url: mapping.url,
            status: 'skipped',
            message: 'No compatible recipes.',
            completedAt: nowIso()
          })
        );
        continue;
      }

      try {
        await navigateWithRetries(tabId, mapping.url, initialBatch.options, controller);
        await sleep(initialBatch.options.waitAfterLoadMs);
        await getTab(tabId);
      } catch (error) {
        if (isProcessingTabClosedError(error)) {
          await finishBatch(batchId, 'cancelled', PROCESSING_TAB_CLOSED_MESSAGE);
          return;
        }

        await mutateBatch(batchId, (batch) =>
          addCounts(
            appendEvent(batch, {
              id: crypto.randomUUID(),
              batchId,
              url: mapping.url,
              status: 'failed',
              message: toErrorMessage(error),
              completedAt: nowIso()
            }),
            { skippedRuns: mapping.recipes.length }
          )
        );

        if (initialBatch.options.onUrlError === 'stop') {
          await finishBatch(batchId, 'failed', toErrorMessage(error));
          return;
        }

        continue;
      }

      for (const recipe of mapping.recipes) {
        if (controller.cancelled) {
          await finishBatch(batchId, 'cancelled', 'Batch stopped by user.');
          return;
        }

        const eventId = crypto.randomUUID();
        const startedAt = nowIso();
        await mutateBatch(batchId, (batch) =>
          appendEvent(batch, {
            id: eventId,
            batchId,
            url: mapping.url,
            recipeId: recipe.id,
            recipeName: recipe.name,
            status: 'running',
            startedAt
          })
        );

        try {
          const currentBatch = await getBatchRun(batchId);
          const run = await runRecipeInTab(tabId, recipe, currentBatch ?? initialBatch, mapping.urlIndex);
          const saved = shouldSaveRun(run, initialBatch.options);
          if (saved) {
            await saveRun(run);
          }

          const counts = runCountPatch(run);
          await mutateBatch(batchId, (batch) =>
            addCounts(
              replaceEvent(batch, eventId, {
                status: run.status === 'success' ? 'success' : run.status === 'partial' ? 'warning' : 'failed',
                message: saved ? undefined : 'Run completed but was not saved by batch options.',
                completedAt: nowIso(),
                runId: saved ? run.id : undefined
              }),
              counts
            )
          );
        } catch (error) {
          const message = toErrorMessage(error);
          await mutateBatch(batchId, (batch) =>
            addCounts(
              replaceEvent(batch, eventId, {
                status: 'failed',
                message,
                completedAt: nowIso()
              }),
              { completedRuns: 1, failedRuns: 1 }
            )
          );

          if (isProcessingTabClosedError(error)) {
            await finishBatch(batchId, 'cancelled', PROCESSING_TAB_CLOSED_MESSAGE);
            return;
          }

          if (initialBatch.options.onRecipeError === 'stop') {
            await finishBatch(batchId, 'failed', message);
            return;
          }
        }
      }

      if (initialBatch.options.delayBetweenUrlsMs > 0) {
        await sleep(initialBatch.options.delayBetweenUrlsMs);
      }
    }

    await finishBatch(batchId, controller.cancelled ? 'cancelled' : 'completed');
  } catch (error) {
    await finishBatch(
      batchId,
      isProcessingTabClosedError(error) || controller.cancelled ? 'cancelled' : 'failed',
      toErrorMessage(error)
    );
  } finally {
    controllers.delete(batchId);
  }
}

export async function startBatchRun(message: StartBatchRunMessage): Promise<RuntimeBatchResponse> {
  const urls = message.urls.filter(isSupportedBatchUrl).map((url) => new URL(url).toString());
  const recipes = message.recipes;
  const plan = createBatchPlan(urls, recipes, message.options);

  if (urls.length === 0) {
    return {
      ok: false,
      error: 'No valid URLs were provided.'
    };
  }

  if (recipes.length === 0) {
    return {
      ok: false,
      error: 'Select at least one recipe.'
    };
  }

  if (plan.totalPlannedRuns === 0) {
    return {
      ok: false,
      error: 'No compatible recipes for these URLs.'
    };
  }

  const tab = await createTab({ url: 'about:blank', active: false, pinned: true });
  if (!tab.id) {
    return {
      ok: false,
      error: 'Could not create the processing tab.'
    };
  }

  const createdAt = nowIso();
  const batch: BatchRun = {
    id: crypto.randomUUID(),
    name: message.name?.trim() || autoBatchName(),
    status: 'running',
    createdAt,
    updatedAt: createdAt,
    startedAt: createdAt,
    processingTabId: tab.id,
    urls,
    recipeIds: recipes.map((recipe) => recipe.id),
    options: message.options,
    totalPlannedRuns: plan.totalPlannedRuns,
    completedRuns: 0,
    successfulRuns: 0,
    warningRuns: 0,
    failedRuns: 0,
    skippedRuns: plan.skippedByCompatibility,
    events: []
  };

  await saveBatchRun(batch);

  const controller = { cancelled: false };
  controllers.set(batch.id, controller);
  void runBatch(batch.id, recipes, controller);

  return {
    ok: true,
    data: batch
  };
}

export async function stopBatchRun(batchId: string): Promise<RuntimeBatchResponse> {
  const controller = controllers.get(batchId);
  if (controller) {
    controller.cancelled = true;
  }

  const batch = await updateBatchRun(batchId, {
    status: 'cancelled',
    completedAt: nowIso()
  });

  if (!batch) {
    return {
      ok: false,
      error: 'Batch run not found.'
    };
  }

  return {
    ok: true,
    data: batch
  };
}

export async function viewBatchTab(batchId: string): Promise<RuntimeBatchResponse> {
  const batch = await getBatchRun(batchId);
  if (!batch?.processingTabId) {
    return {
      ok: false,
      error: 'Processing tab is not available.'
    };
  }

  try {
    await updateTab(batch.processingTabId, { active: true });
  } catch (error) {
    return {
      ok: false,
      error: toErrorMessage(error)
    };
  }

  return {
    ok: true,
    data: batch
  };
}
