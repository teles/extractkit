<script setup lang="ts">
import { ArrowLeft, History, MoreVertical, ScrollText, Settings, Zap } from '@lucide/vue';
import type { Component } from 'vue';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSettings } from '../../composables/useSettings';
import type { TranslationKey } from '../../shared/i18n';

type NavLink = {
  to: string;
  labelKey: 'nav.home' | 'nav.recipes' | 'nav.data' | 'nav.settings';
  icon: Component;
};

const mainLinks = [
  { to: '/', labelKey: 'nav.home', icon: Zap },
  { to: '/recipes', labelKey: 'nav.recipes', icon: ScrollText },
  { to: '/runs', labelKey: 'nav.data', icon: History }
] satisfies NavLink[];

const { t } = useSettings();
const route = useRoute();
const router = useRouter();

const targetLabels: Array<{
  match: (path: string) => boolean;
  labelKey: TranslationKey;
  ariaLabelKey: TranslationKey;
}> = [
  {
    match: (path) => path === '/',
    labelKey: 'nav.home',
    ariaLabelKey: 'nav.backToRun'
  },
  {
    match: (path) => path.startsWith('/recipes'),
    labelKey: 'nav.recipes',
    ariaLabelKey: 'nav.backToRecipes'
  },
  {
    match: (path) => path.startsWith('/runs') || path.startsWith('/data'),
    labelKey: 'nav.data',
    ariaLabelKey: 'nav.backToHistory'
  },
  {
    match: (path) => path.startsWith('/settings'),
    labelKey: 'nav.settings',
    ariaLabelKey: 'nav.backToSettings'
  }
];

function internalPath(value: unknown): string | null {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
    return null;
  }

  return value;
}

function pathWithoutQuery(path: string): string {
  return path.split('?')[0] || '/';
}

function labelForPath(path: string | null): (typeof targetLabels)[number] | null {
  if (!path) {
    return null;
  }

  const normalizedPath = pathWithoutQuery(path);
  return targetLabels.find((target) => target.match(normalizedPath)) ?? null;
}

const backTarget = computed(() => {
  if (route.meta.root) {
    return null;
  }

  return internalPath(route.query.returnTo) ?? internalPath(route.meta.backTo) ?? null;
});

const backTargetLabel = computed(() => labelForPath(backTarget.value));
const backLabel = computed(() => {
  const labelKey = backTargetLabel.value?.labelKey ?? route.meta.backLabelKey;
  return labelKey ? t(labelKey) : (route.meta.backLabel ?? t('nav.back'));
});
const backAriaLabel = computed(() => {
  const labelKey = backTargetLabel.value?.ariaLabelKey;
  return labelKey ? t(labelKey) : t('nav.back');
});
const settingsTarget = computed(() => {
  if (route.path === '/settings') {
    return '/settings';
  }

  return {
    path: '/settings',
    query: {
      returnTo: route.meta.root ? route.fullPath : (backTarget.value ?? route.fullPath)
    }
  };
});

async function navigateBack(): Promise<void> {
  if (backTarget.value) {
    await router.push(backTarget.value);
  }
}
</script>

<template>
  <header class="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-ink-200 bg-white px-4 dark:border-ink-800 dark:bg-ink-950">
    <button
      v-if="backTarget"
      type="button"
      class="focus-ring -ml-2 inline-flex min-w-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-ink-700 transition hover:bg-ink-100 hover:text-ink-900 dark:text-ink-100 dark:hover:bg-ink-800 dark:hover:text-ink-50"
      :aria-label="backAriaLabel"
      @click="navigateBack"
    >
      <ArrowLeft class="h-4 w-4 shrink-0" :stroke-width="2.2" aria-hidden="true" />
      <span class="truncate">{{ backLabel }}</span>
    </button>

    <RouterLink v-else to="/" class="focus-ring -ml-1 flex min-w-0 items-center gap-2 rounded-lg px-1 py-1">
      <img src="/icons/extractkit-icon.svg" alt="" class="h-7 w-7" />
      <span class="truncate text-lg font-semibold">
        <span class="text-ink-900 dark:text-ink-50">Extract</span><span class="text-brand-700 dark:text-brand-400">Kit</span>
      </span>
    </RouterLink>

    <div class="flex items-center gap-1">
      <RouterLink
        :to="settingsTarget"
        :title="t('nav.settings')"
        :aria-label="t('nav.settings')"
        class="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-500 transition hover:bg-ink-100 hover:text-brand-700 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-brand-400"
        active-class="bg-brand-50 text-brand-700 dark:bg-brand-600/15 dark:text-brand-400"
      >
        <Settings class="h-5 w-5" :stroke-width="2.2" aria-hidden="true" />
      </RouterLink>
      <button
        type="button"
        :title="t('nav.more')"
        :aria-label="t('nav.more')"
        class="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-500 transition hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-ink-50"
      >
        <MoreVertical class="h-5 w-5" :stroke-width="2.2" aria-hidden="true" />
      </button>
    </div>
  </header>

  <nav class="fixed inset-x-0 bottom-0 z-40 grid h-[64px] grid-cols-3 border-t border-ink-200 bg-white px-3 pb-[max(env(safe-area-inset-bottom),0px)] pt-1 dark:border-ink-800 dark:bg-ink-950">
    <RouterLink
      v-for="link in mainLinks"
      :key="link.to"
      :to="link.to"
      :aria-label="t(link.labelKey)"
      class="group flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[11px] font-medium text-ink-500 transition focus:text-brand-700 active:text-brand-700 hover:text-brand-700 dark:text-ink-300 dark:hover:text-brand-400"
      active-class="is-active text-brand-700 dark:text-brand-400"
    >
      <span class="inline-flex h-7 w-10 items-center justify-center rounded-lg transition group-[.is-active]:bg-brand-100/60 dark:group-[.is-active]:bg-brand-600/15">
        <component
          :is="link.icon"
          class="h-5 w-5 text-current transition-colors group-[.is-active]:text-brand-700 dark:group-[.is-active]:text-brand-400"
          :stroke-width="2.2"
          aria-hidden="true"
        />
      </span>
      <span class="truncate">{{ t(link.labelKey) }}</span>
    </RouterLink>
  </nav>
</template>
