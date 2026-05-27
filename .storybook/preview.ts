import type { Preview } from '@storybook/vue3-vite';
import '../src/sidepanel/style.css';

// ---------------------------------------------------------------------------
// Chrome extension API mock — prevents import-time crashes in Storybook.
// The composables (useSettings, useRuns, etc.) call chrome.storage.local
// lazily (inside async functions), so a no-op mock is enough to unblock
// rendering without triggering any actual storage reads.
// ---------------------------------------------------------------------------
if (typeof globalThis.chrome === 'undefined') {
  (globalThis as unknown as Record<string, unknown>).chrome = {
    storage: {
      local: {
        get: (_keys: unknown) => Promise.resolve({}),
        set: (_items: unknown) => Promise.resolve(),
        remove: (_keys: unknown) => Promise.resolve(),
        clear: () => Promise.resolve()
      }
    },
    runtime: {
      sendMessage: () => Promise.resolve(),
      onMessage: {
        addListener: () => {},
        removeListener: () => {}
      }
    },
    tabs: {
      query: () => Promise.resolve([]),
      create: () => Promise.resolve({}),
      update: () => Promise.resolve({})
    }
  };
}

const preview: Preview = {
  // Global dark-mode toggle exposed as a toolbar button.
  globalTypes: {
    darkMode: {
      description: 'Dark mode',
      defaultValue: false,
      toolbar: {
        title: 'Theme',
        icon: 'moon',
        items: [
          { value: false, title: 'Light', icon: 'sun' },
          { value: true, title: 'Dark', icon: 'moon' }
        ],
        dynamicTitle: true
      }
    }
  },

  decorators: [
    (story, context) => {
      // Sync Tailwind dark-mode class with the global toggle.
      const isDark = Boolean(context.globals.darkMode);
      document.documentElement.classList.toggle('dark', isDark);
      document.body.style.background = isDark ? '#202124' : '#F8F9FA';
      document.body.style.color = isDark ? '#F8F9FA' : '#202124';
      return story();
    }
  ],

  parameters: {
    // Disable the default backgrounds addon; we drive theme via the toolbar.
    backgrounds: { disable: true },
    layout: 'padded',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    }
  }
};

export default preview;
