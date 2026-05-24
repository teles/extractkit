<script setup lang="ts">
import { History, MoreVertical, Play, ScrollText, Settings } from '@lucide/vue';
import type { Component } from 'vue';
import { useSettings } from '../../composables/useSettings';

type NavLink = {
  to: string;
  labelKey: 'nav.home' | 'nav.recipes' | 'nav.data' | 'nav.settings';
  icon: Component;
};

const mainLinks = [
  { to: '/', labelKey: 'nav.home', icon: Play },
  { to: '/recipes', labelKey: 'nav.recipes', icon: ScrollText },
  { to: '/runs', labelKey: 'nav.data', icon: History }
] satisfies NavLink[];

const { t } = useSettings();
</script>

<template>
  <header class="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-ink-200 bg-white px-4 dark:border-ink-800 dark:bg-ink-950">
    <RouterLink to="/" class="focus-ring -ml-1 flex min-w-0 items-center gap-2 rounded-lg px-1 py-1">
      <img src="/icons/extractkit-icon.svg" alt="" class="h-7 w-7" />
      <span class="truncate text-lg font-semibold">
        <span class="text-ink-900 dark:text-ink-50">Extract</span><span class="text-brand-700 dark:text-brand-400">Kit</span>
      </span>
    </RouterLink>

    <div class="flex items-center gap-1">
      <RouterLink
        to="/settings"
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
      <span class="inline-flex h-8 min-w-14 items-center justify-center rounded-2xl transition group-[.is-active]:bg-brand-50 dark:group-[.is-active]:bg-brand-600/15">
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
