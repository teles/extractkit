import type { CurrentTabInfo, Recipe, ScrapeResult } from './types';

export const MESSAGE_GET_CURRENT_TAB = 'extractkit:get-current-tab';
export const MESSAGE_RUN_RECIPE = 'extractkit:run-recipe';
export const CONTENT_RUN_RECIPE = 'extractkit:content-run-recipe';

export type GetCurrentTabMessage = {
  type: typeof MESSAGE_GET_CURRENT_TAB;
};

export type RunRecipeMessage = {
  type: typeof MESSAGE_RUN_RECIPE;
  recipe: Recipe;
};

export type ContentRunRecipeMessage = {
  type: typeof CONTENT_RUN_RECIPE;
  recipe: Recipe;
};

export type PanelMessage = GetCurrentTabMessage | RunRecipeMessage;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

export function isPanelMessage(value: unknown): value is PanelMessage {
  if (!isRecord(value) || typeof value.type !== 'string') {
    return false;
  }

  return value.type === MESSAGE_GET_CURRENT_TAB || value.type === MESSAGE_RUN_RECIPE;
}

export function isContentMessage(value: unknown): value is ContentMessage {
  return isRecord(value) && value.type === CONTENT_RUN_RECIPE;
}
