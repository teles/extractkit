<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    description?: string;
    compact?: boolean;
  }>(),
  {
    compact: false
  }
);
</script>

<template>
  <div
    class="rounded-lg border border-dashed border-ink-300 bg-white text-center dark:border-ink-700 dark:bg-ink-950"
    :class="compact ? 'px-3 py-5' : 'px-4 py-8'"
  >
    <p class="text-base font-semibold text-ink-900 dark:text-ink-50">{{ title }}</p>
    <p v-if="description" class="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500 dark:text-ink-300">{{ description }}</p>
    <div v-if="$slots.action" class="mt-3">
      <slot name="action" />
    </div>
  </div>
</template>
