import type { ContentUrlDiscoveryResponse, RunRecipeResponse } from '../shared/messaging';
import { CONTENT_DISCOVER_URLS, CONTENT_RUN_RECIPE, isContentMessage } from '../shared/messaging';
import { runRecipe } from '../shared/scraper-engine';
import type { RawDiscoveredLink } from '../shared/types';

declare global {
  interface Window {
    __EXTRACTKIT_CONTENT_READY__?: boolean;
    __EXTRACTKIT_CONTENT_STATE__?: {
      listener?: Parameters<typeof chrome.runtime.onMessage.addListener>[0];
      version?: number;
    };
  }
}

const CONTENT_SCRIPT_VERSION = 2;

function errorResponse(message: string): { ok: false; error: string } {
  return {
    ok: false,
    error: message
  };
}

function linkText(anchor: HTMLAnchorElement): string | undefined {
  const text = anchor.textContent?.replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, 180) : undefined;
}

function discoverLinks(): RawDiscoveredLink[] {
  return Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]')).map((anchor, index) => ({
    index,
    href: anchor.getAttribute('href') ?? '',
    absoluteUrl: anchor.href,
    text: linkText(anchor)
  }));
}

function registerMessageListener(): void {
  const previousListener = window.__EXTRACTKIT_CONTENT_STATE__?.listener;
  if (previousListener) {
    try {
      chrome.runtime.onMessage.removeListener(previousListener);
    } catch {
      // The previous listener can belong to an invalidated extension context after reload.
    }
  }

  const listener: Parameters<typeof chrome.runtime.onMessage.addListener>[0] = (
    message: unknown,
    _sender,
    sendResponse: (response: RunRecipeResponse | ContentUrlDiscoveryResponse) => void
  ) => {
    if (!isContentMessage(message)) {
      return false;
    }

    try {
      if (message.type === CONTENT_DISCOVER_URLS) {
        sendResponse({
          ok: true,
          data: discoverLinks()
        });
        return true;
      }

      if (message.type !== CONTENT_RUN_RECIPE) {
        sendResponse(errorResponse('Unsupported content message.'));
        return true;
      }

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
  };

  chrome.runtime.onMessage.addListener(listener);
  window.__EXTRACTKIT_CONTENT_READY__ = true;
  window.__EXTRACTKIT_CONTENT_STATE__ = {
    listener,
    version: CONTENT_SCRIPT_VERSION
  };
}

registerMessageListener();
