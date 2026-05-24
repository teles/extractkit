import { batchDisplayName } from '../shared/batch-display';
import { createBatchPlan, DEFAULT_BATCH_RUN_OPTIONS, isSupportedBatchUrl } from '../shared/batch-planner';
import { activeBatchFromList, isBatchActive } from '../shared/batch-state';
import type { BatchRunResponse, RunRecipeResponse, StartBatchRunMessage } from '../shared/messaging';
import { CONTENT_RUN_RECIPE } from '../shared/messaging';
import { generateOutputSchema } from '../shared/output-schema';
import { validateOutput } from '../shared/output-validation';
import { statusWithReviewResults } from '../shared/run-status';
import { getBatchRun, listBatchRuns, listRecipes, saveBatchRun, saveRun, updateBatchRun } from '../shared/storage';
import type { BatchRun, BatchRunEvent, BatchRunOptions, Recipe, RecipeRun, ScrapeResult } from '../shared/types';

type BatchController = {
  cancelled: boolean;
  pauseRequested: boolean;
};

type RuntimeBatchResponse = BatchRunResponse;
type BatchEventErrorKind = NonNullable<BatchRunEvent['errorKind']>;
type NavigationResult = {
  httpStatus?: number;
};

const controllers = new Map<string, BatchController>();
const MAX_STORED_EVENTS = 200;
const PROCESSING_TAB_CLOSED_MESSAGE = 'Processing tab was closed';
const HTTP_ERROR_SKIPPED_MESSAGE = 'Page skipped because HTTP error pages are disabled';

class BatchRunnerError extends Error {
  constructor(
    message: string,
    readonly errorKind: BatchEventErrorKind
  ) {
    super(message);
    this.name = 'BatchRunnerError';
  }
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

function errorKindFromError(error: unknown, fallback: BatchEventErrorKind): BatchEventErrorKind {
  return error instanceof BatchRunnerError ? error.errorKind : fallback;
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function nowIso(): string {
  return new Date().toISOString();
}

function autoBatchName(): string {
  return batchDisplayName({ name: undefined, createdAt: nowIso() });
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
        reject(new BatchRunnerError(PROCESSING_TAB_CLOSED_MESSAGE, 'processing-tab-closed'));
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
        reject(new BatchRunnerError(error?.message ?? PROCESSING_TAB_CLOSED_MESSAGE, 'navigation-error'));
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
        settle(() => reject(new BatchRunnerError(PROCESSING_TAB_CLOSED_MESSAGE, 'processing-tab-closed')));
      }
    };

    const timeout = setTimeout(() => {
      settle(() =>
        reject(new BatchRunnerError(`Page load timeout after ${Math.round(timeoutMs / 1000)}s.`, 'timeout'))
      );
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

function createHttpStatusTracker(tabId: number): { getStatus: () => number | undefined; stop: () => void } {
  let httpStatus: number | undefined;

  if (!chrome.webRequest?.onHeadersReceived) {
    return {
      getStatus: () => httpStatus,
      stop: () => undefined
    };
  }

  const listener = (details: chrome.webRequest.WebResponseHeadersDetails) => {
    if (details.tabId === tabId && details.frameId === 0 && typeof details.statusCode === 'number') {
      httpStatus = details.statusCode;
    }
  };

  try {
    chrome.webRequest.onHeadersReceived.addListener(listener, {
      tabId,
      types: ['main_frame'],
      urls: ['http://*/*', 'https://*/*']
    });
  } catch {
    return {
      getStatus: () => httpStatus,
      stop: () => undefined
    };
  }

  return {
    getStatus: () => httpStatus,
    stop: () => chrome.webRequest.onHeadersReceived.removeListener(listener)
  };
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

async function pauseBatchAtCheckpoint(
  batchId: string,
  reason: NonNullable<BatchRun['pauseReason']>,
  message?: string
): Promise<void> {
  const pausedAt = nowIso();
  await mutateBatch(batchId, (batch) => {
    const nextBatch: BatchRun = {
      ...batch,
      status: 'paused',
      pauseReason: reason,
      pausedAt,
      pauseRequested: false,
      stopRequested: false
    };

    if (!message) {
      return nextBatch;
    }

    return appendEvent(nextBatch, {
      id: crypto.randomUUID(),
      batchId,
      url: '',
      status: 'skipped',
      errorKind: reason === 'processing-tab-closed' ? 'processing-tab-closed' : undefined,
      message,
      completedAt: pausedAt
    });
  });
}

async function pauseIfRequested(batchId: string, controller: BatchController): Promise<boolean> {
  const batch = await getBatchRun(batchId);
  if (!batch || (!controller.pauseRequested && !batch.pauseRequested)) {
    return false;
  }

  await pauseBatchAtCheckpoint(batchId, 'user');
  return true;
}

async function updateBatchProgress(
  batchId: string,
  currentUrlIndex: number,
  currentRecipeIndex: number
): Promise<void> {
  await updateBatchRun(batchId, {
    currentUrlIndex,
    currentRecipeIndex
  });
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
  const message = toErrorMessage(error).toLowerCase();
  return message.includes(PROCESSING_TAB_CLOSED_MESSAGE.toLowerCase()) || message.includes('no tab with id');
}

async function navigateWithRetries(
  tabId: number,
  url: string,
  options: BatchRunOptions,
  controller: BatchController
): Promise<NavigationResult> {
  const maxAttempts = options.onUrlError === 'retryThenSkip' ? options.retryFailedUrls + 1 : 1;
  let lastError: unknown;
  let lastResult: NavigationResult = {};

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (controller.cancelled) {
      throw new Error('Batch cancelled.');
    }

    const statusTracker = createHttpStatusTracker(tabId);
    try {
      await updateTab(tabId, { url, active: false, pinned: true });
      await waitForTabComplete(tabId, options.pageLoadTimeoutMs);
      lastResult = {
        httpStatus: statusTracker.getStatus()
      };

      if (lastResult.httpStatus === 429 && attempt < maxAttempts) {
        continue;
      }

      return lastResult;
    } catch (error) {
      lastError = error;
      if (isProcessingTabClosedError(error)) {
        throw error;
      }
    } finally {
      statusTracker.stop();
    }
  }

  if (lastResult.httpStatus === 429) {
    return lastResult;
  }

  throw lastError instanceof Error ? lastError : new BatchRunnerError('Could not load URL.', 'navigation-error');
}

function shouldSkipHttpStatus(status: number | undefined, options: BatchRunOptions): boolean {
  if (!options.skipHttpErrorPages || typeof status !== 'number') {
    return false;
  }

  return (options.skipHttpStatusCodes ?? []).includes(status);
}

async function runRecipeInTab(
  tabId: number,
  recipe: Recipe,
  batch: BatchRun,
  batchUrlIndex: number
): Promise<RecipeRun> {
  try {
    await executeContentScript(tabId);
  } catch (error) {
    throw new BatchRunnerError(toErrorMessage(error), 'injection-error');
  }

  const response = await sendContentMessage(tabId, recipe);
  if (!response.ok) {
    throw new BatchRunnerError(response.error, 'recipe-error');
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
      errorKind: message === PROCESSING_TAB_CLOSED_MESSAGE ? 'processing-tab-closed' : undefined,
      message,
      completedAt
    });
  });
}

async function ensureProcessingTab(batch: BatchRun): Promise<number> {
  if (batch.processingTabId) {
    try {
      await getTab(batch.processingTabId);
      return batch.processingTabId;
    } catch {
      // Fall through and create a new processing tab.
    }
  }

  const tab = await createTab({ url: 'about:blank', active: false, pinned: true });
  if (!tab.id) {
    throw new Error('Could not create the processing tab.');
  }

  await updateBatchRun(batch.id, {
    processingTabId: tab.id
  });
  return tab.id;
}

async function runBatch(batchId: string, recipes: Recipe[], controller: BatchController): Promise<void> {
  const initialBatch = await getBatchRun(batchId);
  if (!initialBatch?.processingTabId) {
    return;
  }

  const plan = createBatchPlan(initialBatch.urls, recipes, initialBatch.options);
  const tabId = initialBatch.processingTabId;
  const startUrlIndex = initialBatch.currentUrlIndex ?? 0;
  const startRecipeIndex = initialBatch.currentRecipeIndex ?? 0;

  try {
    for (const mapping of plan.mappings) {
      if (mapping.urlIndex < startUrlIndex) {
        continue;
      }

      if (controller.cancelled) {
        await finishBatch(batchId, 'cancelled', 'Batch stopped by user.');
        return;
      }

      if (await pauseIfRequested(batchId, controller)) {
        return;
      }

      const firstRecipeIndex = mapping.urlIndex === startUrlIndex ? startRecipeIndex : 0;
      if (firstRecipeIndex >= mapping.recipes.length && mapping.recipes.length > 0) {
        await updateBatchProgress(batchId, mapping.urlIndex + 1, 0);
        continue;
      }

      if (mapping.recipes.length === 0) {
        await mutateBatch(batchId, (batch) =>
          appendEvent(batch, {
            id: crypto.randomUUID(),
            batchId,
            url: mapping.url,
            status: 'skipped',
            message: 'No compatible recipes.',
            errorKind: 'no-compatible-recipes',
            completedAt: nowIso()
          })
        );
        await updateBatchProgress(batchId, mapping.urlIndex + 1, 0);
        continue;
      }

      let navigationResult: NavigationResult = {};
      try {
        navigationResult = await navigateWithRetries(tabId, mapping.url, initialBatch.options, controller);
        if (shouldSkipHttpStatus(navigationResult.httpStatus, initialBatch.options)) {
          await mutateBatch(batchId, (batch) =>
            addCounts(
              appendEvent(batch, {
                id: crypto.randomUUID(),
                batchId,
                url: mapping.url,
                status: 'skipped',
                httpStatus: navigationResult.httpStatus,
                errorKind: 'http-error',
                message: HTTP_ERROR_SKIPPED_MESSAGE,
                completedAt: nowIso()
              }),
              { completedRuns: mapping.recipes.length, skippedRuns: mapping.recipes.length }
            )
          );
          await updateBatchProgress(batchId, mapping.urlIndex + 1, 0);
          continue;
        }

        await sleep(initialBatch.options.waitAfterLoadMs);
        await getTab(tabId);
      } catch (error) {
        if (isProcessingTabClosedError(error)) {
          await pauseBatchAtCheckpoint(batchId, 'processing-tab-closed', PROCESSING_TAB_CLOSED_MESSAGE);
          return;
        }

        await mutateBatch(batchId, (batch) =>
          addCounts(
            appendEvent(batch, {
              id: crypto.randomUUID(),
              batchId,
              url: mapping.url,
              status: 'failed',
              errorKind: errorKindFromError(error, 'navigation-error'),
              message: toErrorMessage(error),
              completedAt: nowIso()
            }),
            { completedRuns: mapping.recipes.length, skippedRuns: mapping.recipes.length }
          )
        );
        await updateBatchProgress(batchId, mapping.urlIndex + 1, 0);

        if (initialBatch.options.onUrlError === 'stop') {
          await finishBatch(batchId, 'failed', toErrorMessage(error));
          return;
        }

        continue;
      }

      for (let recipeIndex = firstRecipeIndex; recipeIndex < mapping.recipes.length; recipeIndex += 1) {
        const recipe = mapping.recipes[recipeIndex];
        if (controller.cancelled) {
          await finishBatch(batchId, 'cancelled', 'Batch stopped by user.');
          return;
        }

        if (await pauseIfRequested(batchId, controller)) {
          return;
        }

        const eventId = crypto.randomUUID();
        const startedAt = nowIso();
        await updateBatchProgress(batchId, mapping.urlIndex, recipeIndex);
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
                httpStatus: navigationResult.httpStatus,
                message: saved ? undefined : 'Run completed but was not saved by batch options.',
                completedAt: nowIso(),
                runId: saved ? run.id : undefined
              }),
              counts
            )
          );
          await updateBatchProgress(batchId, mapping.urlIndex, recipeIndex + 1);
        } catch (error) {
          const message = toErrorMessage(error);
          await mutateBatch(batchId, (batch) =>
            addCounts(
              replaceEvent(batch, eventId, {
                status: 'failed',
                httpStatus: navigationResult.httpStatus,
                errorKind: errorKindFromError(error, 'recipe-error'),
                message,
                completedAt: nowIso()
              }),
              { completedRuns: 1, failedRuns: 1 }
            )
          );
          await updateBatchProgress(batchId, mapping.urlIndex, recipeIndex + 1);

          if (isProcessingTabClosedError(error)) {
            await pauseBatchAtCheckpoint(batchId, 'processing-tab-closed', PROCESSING_TAB_CLOSED_MESSAGE);
            return;
          }

          if (initialBatch.options.onRecipeError === 'stop') {
            await finishBatch(batchId, 'failed', message);
            return;
          }
        }

        if (await pauseIfRequested(batchId, controller)) {
          return;
        }
      }

      await updateBatchProgress(batchId, mapping.urlIndex + 1, 0);
      if (initialBatch.options.delayBetweenUrlsMs > 0) {
        await sleep(initialBatch.options.delayBetweenUrlsMs);
      }
    }

    await finishBatch(batchId, controller.cancelled ? 'cancelled' : 'completed');
  } catch (error) {
    if (isProcessingTabClosedError(error)) {
      await pauseBatchAtCheckpoint(batchId, 'processing-tab-closed', PROCESSING_TAB_CLOSED_MESSAGE);
    } else {
      await finishBatch(batchId, controller.cancelled ? 'cancelled' : 'failed', toErrorMessage(error));
    }
  } finally {
    controllers.delete(batchId);
  }
}

export async function startBatchRun(message: StartBatchRunMessage): Promise<RuntimeBatchResponse> {
  const activeBatch = activeBatchFromList(await listBatchRuns());
  if (activeBatch) {
    return {
      ok: false,
      error: 'A batch is already running or paused. Finish, resume, or stop it before starting another one.'
    };
  }

  const urls = message.urls.filter(isSupportedBatchUrl).map((url) => new URL(url).toString());
  const recipes = message.recipes;
  const options: BatchRunOptions = {
    ...DEFAULT_BATCH_RUN_OPTIONS,
    ...message.options,
    skipHttpStatusCodes: message.options.skipHttpStatusCodes?.length
      ? message.options.skipHttpStatusCodes
      : DEFAULT_BATCH_RUN_OPTIONS.skipHttpStatusCodes
  };
  const plan = createBatchPlan(urls, recipes, options);

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
    options,
    totalPlannedRuns: plan.totalPlannedRuns,
    completedRuns: 0,
    successfulRuns: 0,
    warningRuns: 0,
    failedRuns: 0,
    skippedRuns: plan.skippedByCompatibility,
    currentUrlIndex: 0,
    currentRecipeIndex: 0,
    pauseRequested: false,
    stopRequested: false,
    events: []
  };

  await saveBatchRun(batch);

  const controller = { cancelled: false, pauseRequested: false };
  controllers.set(batch.id, controller);
  void runBatch(batch.id, recipes, controller);

  return {
    ok: true,
    data: batch
  };
}

export async function pauseBatchRun(batchId: string): Promise<RuntimeBatchResponse> {
  const batch = await getBatchRun(batchId);
  if (!batch || !isBatchActive(batch)) {
    return {
      ok: false,
      error: 'Batch run not found.'
    };
  }

  if (batch.status === 'paused') {
    return {
      ok: true,
      data: batch
    };
  }

  const controller = controllers.get(batchId);
  if (controller) {
    controller.pauseRequested = true;
  }

  const nextBatch = await updateBatchRun(batchId, {
    pauseRequested: true
  });

  return nextBatch
    ? {
        ok: true,
        data: nextBatch
      }
    : {
        ok: false,
        error: 'Batch run not found.'
      };
}

export async function resumeBatchRun(batchId: string): Promise<RuntimeBatchResponse> {
  const batch = await getBatchRun(batchId);
  if (!batch || batch.status !== 'paused') {
    return {
      ok: false,
      error: 'Batch run is not paused.'
    };
  }

  const activeBatch = activeBatchFromList((await listBatchRuns()).filter((candidate) => candidate.id !== batchId));
  if (activeBatch) {
    return {
      ok: false,
      error: 'A batch is already running or paused. Finish, resume, or stop it before starting another one.'
    };
  }

  const processingTabId = await ensureProcessingTab(batch);
  const resumedAt = nowIso();
  const nextBatch = await updateBatchRun(batchId, {
    status: 'running',
    resumedAt,
    pauseReason: undefined,
    pausedAt: undefined,
    pauseRequested: false,
    stopRequested: false,
    processingTabId
  });

  if (!nextBatch) {
    return {
      ok: false,
      error: 'Batch run not found.'
    };
  }

  const recipes = (await listRecipes()).filter((recipe) => nextBatch.recipeIds.includes(recipe.id));
  const controller = { cancelled: false, pauseRequested: false };
  controllers.set(nextBatch.id, controller);
  void runBatch(nextBatch.id, recipes, controller);

  return {
    ok: true,
    data: nextBatch
  };
}

export async function stopBatchRun(batchId: string): Promise<RuntimeBatchResponse> {
  const controller = controllers.get(batchId);
  if (controller) {
    controller.cancelled = true;
  }

  const batch = await updateBatchRun(batchId, {
    status: 'cancelled',
    completedAt: nowIso(),
    stopRequested: true,
    pauseRequested: false
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
