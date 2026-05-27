import type { RunRecipeResponse } from '../shared/messaging';
import { runRecipe } from '../shared/scraper-engine';

declare global {
  interface Window {
    __EXTRACTKIT_CONTENT_READY__?: boolean;
  }
}

const CONTENT_RUN_RECIPE = 'extractkit:content-run-recipe';

function isContentRunRecipeMessage(
  value: unknown
): value is { type: typeof CONTENT_RUN_RECIPE; recipe: Parameters<typeof runRecipe>[0] } {
  return Boolean(value) && typeof value === 'object' && (value as { type?: unknown }).type === CONTENT_RUN_RECIPE;
}

function errorResponse(message: string): RunRecipeResponse {
  return {
    ok: false,
    error: message
  };
}

if (!window.__EXTRACTKIT_CONTENT_READY__) {
  window.__EXTRACTKIT_CONTENT_READY__ = true;

  chrome.runtime.onMessage.addListener(
    (message: unknown, _sender, sendResponse: (response: RunRecipeResponse) => void) => {
      if (!isContentRunRecipeMessage(message)) {
        return false;
      }

      try {
        const result = runRecipe(message.recipe, document, {
          url: window.location.href,
          pageTitle: document.title
        });

        sendResponse({
          ok: true,
          data: {
            ...result,
            viewport: { width: window.innerWidth, height: window.innerHeight }
          }
        });
      } catch (error) {
        sendResponse(errorResponse(error instanceof Error ? error.message : 'Unexpected error while running recipe.'));
      }

      return true;
    }
  );
}
