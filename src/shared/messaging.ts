import type { BatchRun, BatchRunOptions, CurrentTabInfo, Recipe, ScrapeResult } from './types';

export const MESSAGE_GET_CURRENT_TAB = 'extractkit:get-current-tab';
export const MESSAGE_RUN_RECIPE = 'extractkit:run-recipe';
export const MESSAGE_START_BATCH_RUN = 'extractkit:start-batch-run';
export const MESSAGE_PAUSE_BATCH_RUN = 'extractkit:pause-batch-run';
export const MESSAGE_RESUME_BATCH_RUN = 'extractkit:resume-batch-run';
export const MESSAGE_STOP_BATCH_RUN = 'extractkit:stop-batch-run';
export const MESSAGE_VIEW_BATCH_TAB = 'extractkit:view-batch-tab';
export const CONTENT_RUN_RECIPE = 'extractkit:content-run-recipe';

export type GetCurrentTabMessage = {
  type: typeof MESSAGE_GET_CURRENT_TAB;
};

export type RunRecipeMessage = {
  type: typeof MESSAGE_RUN_RECIPE;
  recipe: Recipe;
};

export type StartBatchRunMessage = {
  type: typeof MESSAGE_START_BATCH_RUN;
  name?: string;
  urls: string[];
  recipes: Recipe[];
  options: BatchRunOptions;
};

export type StopBatchRunMessage = {
  type: typeof MESSAGE_STOP_BATCH_RUN;
  batchId: string;
};

export type PauseBatchRunMessage = {
  type: typeof MESSAGE_PAUSE_BATCH_RUN;
  batchId: string;
};

export type ResumeBatchRunMessage = {
  type: typeof MESSAGE_RESUME_BATCH_RUN;
  batchId: string;
};

export type ViewBatchTabMessage = {
  type: typeof MESSAGE_VIEW_BATCH_TAB;
  batchId: string;
};

export type ContentRunRecipeMessage = {
  type: typeof CONTENT_RUN_RECIPE;
  recipe: Recipe;
};

export type PanelMessage =
  | GetCurrentTabMessage
  | RunRecipeMessage
  | StartBatchRunMessage
  | PauseBatchRunMessage
  | ResumeBatchRunMessage
  | StopBatchRunMessage
  | ViewBatchTabMessage;
export type ContentMessage = ContentRunRecipeMessage;

export type MessageResponse<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: string;
    };

export type CurrentTabResponse = MessageResponse<CurrentTabInfo | null>;
export type RunRecipeResponse = MessageResponse<ScrapeResult>;
export type BatchRunResponse = MessageResponse<BatchRun>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

export function isPanelMessage(value: unknown): value is PanelMessage {
  if (!isRecord(value) || typeof value.type !== 'string') {
    return false;
  }

  return (
    value.type === MESSAGE_GET_CURRENT_TAB ||
    value.type === MESSAGE_RUN_RECIPE ||
    value.type === MESSAGE_START_BATCH_RUN ||
    value.type === MESSAGE_PAUSE_BATCH_RUN ||
    value.type === MESSAGE_RESUME_BATCH_RUN ||
    value.type === MESSAGE_STOP_BATCH_RUN ||
    value.type === MESSAGE_VIEW_BATCH_TAB
  );
}

export function isContentMessage(value: unknown): value is ContentMessage {
  return isRecord(value) && value.type === CONTENT_RUN_RECIPE;
}
