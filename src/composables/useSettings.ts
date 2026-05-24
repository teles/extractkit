import { readonly, ref } from 'vue';
import { type TranslationKey, translate } from '../shared/i18n';
import { getPreferences, listRecipes, listRuns, savePreferences, updatePreferences } from '../shared/storage';
import type { LocalePreference, ThemePreference, UserPreferences } from '../shared/types';

const preferences = ref<UserPreferences>({
  theme: 'system',
  locale: 'en-US',
  batchDefaults: {
    skipHttpErrorPages: true
  },
  exportOptions: {
    includeRecipes: true,
    includeCsv: true,
    includeManifest: true
  }
});
const loading = ref(false);
const error = ref<string | null>(null);
const recipeCount = ref(0);
const runCount = ref(0);

let mediaQuery: MediaQueryList | null = null;
let themeListenerAttached = false;

function prefersDark(): boolean {
  return Boolean(globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches);
}

function shouldUseDarkTheme(theme: ThemePreference): boolean {
  if (theme === 'dark') {
    return true;
  }

  if (theme === 'light') {
    return false;
  }

  return prefersDark();
}

function applyTheme(): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.classList.toggle('dark', shouldUseDarkTheme(preferences.value.theme));
}

function attachSystemThemeListener(): void {
  if (themeListenerAttached || typeof globalThis.matchMedia !== 'function') {
    return;
  }

  mediaQuery = globalThis.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', applyTheme);
  themeListenerAttached = true;
}

export function useSettings() {
  async function loadPreferences(): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      preferences.value = await getPreferences();
      attachSystemThemeListener();
      applyTheme();
    } catch (caughtError) {
      error.value = caughtError instanceof Error ? caughtError.message : 'Unable to load preferences.';
    } finally {
      loading.value = false;
    }
  }

  async function setTheme(theme: ThemePreference): Promise<void> {
    preferences.value = {
      ...preferences.value,
      theme
    };
    applyTheme();
    await savePreferences(preferences.value);
  }

  async function setLocale(locale: LocalePreference): Promise<void> {
    preferences.value = await updatePreferences({ locale });
  }

  async function setSkipHttpErrorPagesDefault(skipHttpErrorPages: boolean): Promise<void> {
    preferences.value = await updatePreferences({
      batchDefaults: {
        skipHttpErrorPages
      }
    });
  }

  async function loadCounts(): Promise<void> {
    const [recipes, runs] = await Promise.all([listRecipes(), listRuns()]);
    recipeCount.value = recipes.length;
    runCount.value = runs.length;
  }

  function t(key: TranslationKey): string {
    return translate(preferences.value.locale, key);
  }

  return {
    preferences,
    loading: readonly(loading),
    error: readonly(error),
    recipeCount: readonly(recipeCount),
    runCount: readonly(runCount),
    loadPreferences,
    setTheme,
    setLocale,
    setSkipHttpErrorPagesDefault,
    applyTheme,
    loadCounts,
    t
  };
}
