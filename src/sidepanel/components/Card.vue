<script setup lang="ts">
import { computed } from 'vue';
import type { IconTone } from './iconTone';

const props = withDefaults(
  defineProps<{
    compact?: boolean;
    accent?: IconTone;
  }>(),
  {
    compact: true,
    accent: 'neutral'
  }
);

const accentClasses: Record<IconTone, string> = {
  neutral: '',
  brand: '',
  cyan: '',
  violet: '',
  success: '',
  warning: '',
  danger: ''
};

const classes = computed(() => [
  'rounded-lg border border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-950',
  props.compact ? 'p-3' : 'p-4',
  accentClasses[props.accent]
]);
</script>

<template>
  <section :class="classes">
    <slot />
  </section>
</template>
