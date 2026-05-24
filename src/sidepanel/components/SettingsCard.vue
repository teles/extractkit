<script setup lang="ts">
import type { Component } from 'vue';
import IconBadge from './IconBadge.vue';
import type { IconTone } from './iconTone';

defineProps<{
  title: string;
  description?: string;
  icon?: Component;
  iconTone?: IconTone;
}>();
</script>

<template>
  <section class="rounded-lg border border-ink-200 bg-white p-3 dark:border-ink-700 dark:bg-ink-950">
    <div class="mb-3 flex items-start gap-2">
      <IconBadge v-if="icon" :icon="icon" :tone="iconTone ?? 'brand'" size="xs" />
      <div class="min-w-0">
        <h2 class="text-sm font-semibold text-ink-900 dark:text-ink-50">{{ title }}</h2>
        <p v-if="description" class="mt-1 text-xs leading-relaxed text-ink-500 dark:text-ink-300">{{ description }}</p>
      </div>
    </div>
    <slot />
  </section>
</template>
