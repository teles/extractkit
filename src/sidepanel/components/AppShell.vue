<script setup lang="ts">
import { Pause, Play, Square } from '@lucide/vue';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBatchRuns } from '../../composables/useBatchRuns';
import { useSettings } from '../../composables/useSettings';
import { useToast } from '../../composables/useToast';
import { batchDisplayName } from '../../shared/batch-display';
import { ensureDefaultRecipes } from '../../shared/default-recipes';
import { getOnboardingState } from '../../shared/storage';
import AppNavigation from './AppNavigation.vue';
import Badge from './Badge.vue';
import Button from './Button.vue';
import ToastHost from './ToastHost.vue';

const { loadPreferences, preferences, t } = useSettings();
const { batchRuns, error: batchError, loadBatchRuns, pauseBatchRun, resumeBatchRun, stopBatchRun } = useBatchRuns();
const { success: toastSuccess, error: toastError } = useToast();
const ready = ref(false);
const router = useRouter();
const route = useRoute();
let pollingId: number | undefined;

const isOnboarding = computed(() => route.name === 'onboarding');
const activeBatch = computed(() => batchRuns.value.find((batch) => batch.status === 'running' || batch.status === 'paused') ?? null);
const activeBatchEvent = computed(() => {
  const events = activeBatch.value?.events ?? [];
  return [...events].reverse().find((event) => event.status === 'running') ?? null;
});
const activeBatchProgress = computed(() => {
  if (!activeBatch.value) {
    return '';
  }

  return `${activeBatch.value.completedRuns}/${activeBatch.value.totalPlannedRuns}`;
});
const activeBatchProgressPercent = computed(() => {
  if (!activeBatch.value || activeBatch.value.totalPlannedRuns === 0) {
    return 0;
  }

  return Math.min(100, Math.round((activeBatch.value.completedRuns / activeBatch.value.totalPlannedRuns) * 100));
});
const activeBatchUrl = computed(() => {
  const batch = activeBatch.value;
  if (!batch) {
    return '';
  }

  return activeBatchEvent.value?.url ?? batch.urls[batch.currentUrlIndex ?? 0] ?? batch.urls[0] ?? '';
});
const activeBatchDomain = computed(() => domainFromUrl(activeBatchUrl.value));
const processingTabClosed = computed(() => activeBatch.value?.pauseReason === 'processing-tab-closed');
const activeBatchSummary = computed(() => {
  if (!activeBatch.value) {
    return '';
  }

  if (processingTabClosed.value) {
    return `${t('batch.processingTabClosed')}. ${t('batch.resumeToContinueInNewTab')}`;
  }

  if (activeBatch.value.status === 'paused') {
    return t('batch.pausedCurrentItem');
  }

  const currentParts = [activeBatchEvent.value?.recipeName, activeBatchDomain.value || activeBatchUrl.value].filter(Boolean);
  return currentParts.length > 0 ? `${t('batch.currentItem')}: ${currentParts.join(' · ')}` : t('batch.currentItem');
});

onMounted(async () => {
  const [, onboardingState] = await Promise.all([loadPreferences(), getOnboardingState()]);

  if (!onboardingState.completed) {
    await router.replace('/onboarding');
    ready.value = true;
    return;
  }

  await ensureDefaultRecipes();
  await loadBatchRuns();
  pollingId = window.setInterval(loadBatchRuns, 1500);
  ready.value = true;
});

onUnmounted(() => {
  if (pollingId) {
    window.clearInterval(pollingId);
  }
});

function displayBatchName(): string {
  return batchDisplayName(activeBatch.value, t('batch.batchRun'), preferences.value.locale);
}

function domainFromUrl(value: string): string {
  try {
    return new URL(value).hostname;
  } catch {
    return value;
  }
}

async function viewProgress(): Promise<void> {
  await router.push({ path: '/', query: { mode: 'batch' } });
}

async function pauseActiveBatch(): Promise<void> {
  if (!activeBatch.value) {
    return;
  }

  const batch = await pauseBatchRun(activeBatch.value.id);
  if (batch) {
    toastSuccess(t('batch.pauseRequested'));
  } else {
    toastError(t('batch.pause'), batchError.value ?? undefined);
  }
}

async function resumeActiveBatch(): Promise<void> {
  if (!activeBatch.value) {
    return;
  }

  const batch = await resumeBatchRun(activeBatch.value.id);
  if (batch) {
    toastSuccess(t('batch.resumed'));
  } else {
    toastError(t('batch.resume'), batchError.value ?? undefined);
  }
}

async function stopActiveBatch(): Promise<void> {
  if (!activeBatch.value) {
    return;
  }

  const batch = await stopBatchRun(activeBatch.value.id);
  if (batch) {
    toastSuccess(t('batch.stopped'));
  }
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 text-ink-900 dark:bg-ink-900 dark:text-ink-50">
    <ToastHost />
    <template v-if="!isOnboarding">
      <AppNavigation />
    </template>
    <div :class="isOnboarding ? 'min-h-screen' : 'min-h-screen pt-14 pb-[72px]'">
      <div
        v-if="!isOnboarding && activeBatch"
        class="sticky top-14 z-30 border-b border-ink-200 bg-white/95 px-4 py-2.5 shadow-sm backdrop-blur dark:border-ink-700 dark:bg-ink-950/95"
      >
        <div class="space-y-2 text-xs">
          <div class="flex min-w-0 items-center gap-2">
            <Badge :variant="activeBatch.status === 'paused' ? 'warning' : 'primary'" size="xs">
              {{ activeBatch.status === 'paused' ? t('batch.paused') : t('batch.running') }}
            </Badge>
            <span class="min-w-0 flex-1 truncate text-sm font-semibold text-ink-900 dark:text-ink-50">
              {{ displayBatchName() }}
            </span>
            <span class="shrink-0 font-medium text-ink-500 dark:text-ink-300">{{ activeBatchProgress }}</span>
          </div>

          <div class="min-w-0">
            <p class="truncate text-ink-600 dark:text-ink-300">{{ activeBatchSummary }}</p>
            <div class="mt-1.5 h-1 overflow-hidden rounded-sm bg-ink-100 dark:bg-ink-800">
              <div
                class="h-full transition-all"
                :class="activeBatch.status === 'paused' ? 'bg-amberline-500' : 'bg-brand-600'"
                :style="{ width: `${activeBatchProgressPercent}%` }"
              />
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-1.5">
            <Button v-if="!processingTabClosed" size="xs" variant="secondary" @click="viewProgress">
              {{ t('batch.viewProgress') }}
            </Button>
            <Button
              v-if="activeBatch.status === 'running'"
              size="xs"
              variant="ghost"
              :disabled="activeBatch.pauseRequested"
              @click="pauseActiveBatch"
            >
              <Pause class="h-3.5 w-3.5" aria-hidden="true" />
              {{ activeBatch.pauseRequested ? t('batch.pausingAfterCurrentItem') : t('batch.pauseAction') }}
            </Button>
            <Button v-else size="xs" variant="secondary" @click="resumeActiveBatch">
              <Play class="h-3.5 w-3.5" aria-hidden="true" />
              {{ t('batch.resumeAction') }}
            </Button>
            <Button size="xs" variant="ghost" class="text-coral-500 hover:bg-coral-50 hover:text-coral-500" @click="stopActiveBatch">
              <Square class="h-3.5 w-3.5" aria-hidden="true" />
              {{ t('batch.stopAction') }}
            </Button>
          </div>
        </div>
      </div>
      <main v-if="ready" :class="isOnboarding ? '' : 'mx-auto min-w-0 max-w-full px-4 py-5'">
        <RouterView />
      </main>
      <main v-else class="mx-auto min-w-0 max-w-full px-4 py-5">
        <div class="rounded-lg border border-ink-200 bg-white p-3 text-sm font-medium text-ink-500 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-300">
          Loading ExtractKit...
        </div>
      </main>
    </div>
  </div>
</template>
