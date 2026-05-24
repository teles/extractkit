<script setup lang="ts">
import { ArchiveRestore, HardDrive, PackagePlus, Palette, Settings as SettingsIcon, ShieldCheck } from '@lucide/vue';
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useExport } from '../../composables/useExport';
import { useRecipes } from '../../composables/useRecipes';
import { useRuns } from '../../composables/useRuns';
import { useSettings } from '../../composables/useSettings';
import { useToast } from '../../composables/useToast';
import { restoreDefaultRecipes } from '../../shared/default-recipes';
import { resetOnboarding } from '../../shared/storage';
import type { LocalePreference, ThemePreference } from '../../shared/types';
import Button from '../components/Button.vue';
import PageHeader from '../components/PageHeader.vue';
import SegmentedControl from '../components/SegmentedControl.vue';
import SettingsCard from '../components/SettingsCard.vue';
import StatPill from '../components/StatPill.vue';

const { preferences, loading, error, recipeCount, runCount, loadPreferences, setTheme, setLocale, loadCounts, t } =
  useSettings();
const { recipes, loadRecipes } = useRecipes();
const { runs, clearRuns, loadRuns } = useRuns();
const { exporting, error: exportError, exportRuns } = useExport();
const { success: toastSuccess, info: toastInfo, error: toastError } = useToast();
const router = useRouter();

const themeOptions = computed<Array<{ value: ThemePreference; label: string }>>(() => [
  { value: 'system', label: t('settings.system') },
  { value: 'light', label: t('settings.light') },
  { value: 'dark', label: t('settings.dark') }
]);

onMounted(async () => {
  await Promise.all([loadPreferences(), loadRecipes(), loadRuns(), loadCounts()]);
});

async function refreshLocalData(): Promise<void> {
  await Promise.all([loadRecipes(), loadRuns(), loadCounts()]);
}

async function updateTheme(theme: ThemePreference): Promise<void> {
  await setTheme(theme);
}

async function updateLocale(locale: LocalePreference): Promise<void> {
  await setLocale(locale);
}

async function exportAllRuns(): Promise<void> {
  if (runs.value.length === 0) {
    toastInfo(t('settings.exportEmpty'));
    return;
  }

  await exportRuns(runs.value, recipes.value, 'extractkit-all-runs');
  if (exportError.value) {
    toastError(t('toast.exportFailed'), exportError.value);
  } else {
    toastSuccess(t('toast.exported'));
  }
}

async function clearSavedRuns(): Promise<void> {
  if (!confirm(t('settings.clearRunsConfirm'))) {
    return;
  }

  await clearRuns();
  await refreshLocalData();
  toastSuccess(t('settings.runsCleared'));
}

async function restoreDefaults(): Promise<void> {
  const restoredCount = await restoreDefaultRecipes();
  await refreshLocalData();
  toastSuccess(`${t('settings.defaultsRestored')} (${restoredCount})`);
}

async function runSetupAgain(): Promise<void> {
  await resetOnboarding();
  await router.push('/onboarding');
}
</script>

<template>
  <section class="panel-stack">
    <PageHeader :title="t('settings.title')" :description="t('settings.description')" :icon="SettingsIcon" icon-tone="brand" />

    <p v-if="error" class="rounded-md border border-coral-100 bg-coral-50 px-3 py-2 text-sm font-semibold text-coral-500 dark:border-coral-500/30 dark:bg-coral-500/10">
      {{ error }}
    </p>

    <SettingsCard :title="t('settings.appearance')" :description="t('settings.themeHelp')" :icon="Palette" icon-tone="brand">
      <div class="space-y-3">
        <label class="grid gap-1.5">
          <span class="field-label">{{ t("settings.theme") }}</span>
          <SegmentedControl
            :model-value="preferences.theme"
            :options="themeOptions"
            @update:model-value="updateTheme"
          />
        </label>

        <label class="grid gap-1.5">
          <span class="field-label">{{ t("settings.interfaceLanguage") }}</span>
          <select
            class="input"
            :value="preferences.locale"
            :disabled="loading"
            @change="updateLocale(($event.target as HTMLSelectElement).value as LocalePreference)"
          >
            <option value="en-US">{{ t("settings.english") }}</option>
            <option value="pt-BR">{{ t("settings.portuguese") }}</option>
          </select>
        </label>
      </div>
    </SettingsCard>

    <SettingsCard :title="t('settings.localData')" :icon="HardDrive" icon-tone="neutral">
      <div class="grid grid-cols-2 gap-2">
        <StatPill :label="t('settings.recipes')" :value="recipeCount" />
        <StatPill :label="t('settings.savedRuns')" :value="runCount" />
      </div>

      <div class="mt-3 flex flex-wrap gap-2">
        <Button size="xs" variant="primary" :disabled="exporting || runCount === 0" @click="exportAllRuns">
          {{ t("settings.exportAll") }}
        </Button>
        <Button size="xs" variant="danger" :disabled="runCount === 0" @click="clearSavedRuns">
          {{ t("settings.clearRuns") }}
        </Button>
      </div>
    </SettingsCard>

    <SettingsCard :title="t('settings.defaultRecipes')" :description="t('settings.defaultRecipesDescription')" :icon="ArchiveRestore" icon-tone="brand">
      <Button size="xs" @click="restoreDefaults">
        {{ t("settings.restoreDefaultRecipes") }}
      </Button>
    </SettingsCard>

    <SettingsCard :title="t('settings.starterSetup')" :description="t('settings.starterSetupDescription')" :icon="PackagePlus" icon-tone="brand">
      <Button size="xs" variant="primary" @click="runSetupAgain">
        {{ t("settings.runSetupAgain") }}
      </Button>
    </SettingsCard>

    <SettingsCard :title="t('settings.privacy')" :description="t('settings.privacyDescription')" :icon="ShieldCheck" icon-tone="success" />
  </section>
</template>
