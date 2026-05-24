<script setup lang="ts">
defineProps<{
  label: string;
  value: number;
}>();
</script>

<template>
  <div class="rounded-lg border border-ink-200 bg-ink-100 px-3 py-2 dark:border-ink-700 dark:bg-ink-800">
    <p class="text-xs font-medium text-ink-500 dark:text-ink-300">{{ label }}</p>
    <p class="mt-1 font-mono text-lg font-semibold text-ink-900 dark:text-ink-50">{{ value }}</p>
  </div>
</template>
