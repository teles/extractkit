<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue';
import type { Component } from 'vue';
import Badge from './Badge.vue';
import type { IconTone } from './iconTone';

defineProps<{
  title: string;
  description?: string;
  meta?: string;
  icon?: Component;
  iconTone?: IconTone;
  backLabel?: string;
  backAriaLabel?: string;
}>();

defineEmits<{
  back: [];
}>();
</script>

<template>
  <header class="space-y-3">
    <button
      v-if="backLabel"
      type="button"
      class="focus-ring -ml-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-ink-600 transition hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-ink-50"
      :aria-label="backAriaLabel ?? backLabel"
      @click="$emit('back')"
    >
      <ArrowLeft class="h-4 w-4" :stroke-width="2.2" aria-hidden="true" />
      <span>{{ backLabel }}</span>
    </button>

    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <h1 class="truncate text-2xl font-semibold leading-tight text-ink-900 dark:text-ink-50">{{ title }}</h1>
          <Badge v-if="meta" variant="neutral" size="sm">{{ meta }}</Badge>
        </div>
        <p v-if="description" class="mt-2 text-sm leading-relaxed text-ink-500 dark:text-ink-300">{{ description }}</p>
      </div>
      <div v-if="$slots.actions" class="flex shrink-0 flex-wrap items-center justify-end gap-2">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>
