<script setup lang="ts">
import { computed } from 'vue';

type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'accent' | 'dark';
type BadgeSize = 'xs' | 'sm';

const props = withDefaults(
  defineProps<{
    variant?: BadgeVariant;
    size?: BadgeSize;
  }>(),
  {
    variant: 'neutral',
    size: 'xs'
  }
);

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'border-ink-200 bg-ink-100 text-ink-500 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200',
  success: 'border-success-500/20 bg-success-50 text-success-500 dark:bg-success-500/15',
  warning:
    'border-amberline-100 bg-amberline-50 text-amberline-500 dark:border-amberline-500/30 dark:bg-amberline-500/15',
  danger: 'border-coral-100 bg-coral-50 text-coral-500 dark:border-coral-500/30 dark:bg-coral-500/15',
  accent:
    'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-500/35 dark:bg-brand-600/15 dark:text-brand-400',
  dark: 'border-ink-700 bg-ink-900 text-ink-50'
};

const sizeClasses: Record<BadgeSize, string> = {
  xs: 'px-2 py-0.5 text-[10px]',
  sm: 'px-2.5 py-1 text-[11px]'
};

const classes = computed(() => [
  'inline-flex items-center rounded-full border font-medium leading-none',
  variantClasses[props.variant],
  sizeClasses[props.size]
]);
</script>

<template>
  <span :class="classes">
    <slot />
  </span>
</template>
