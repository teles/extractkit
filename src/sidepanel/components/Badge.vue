<script setup lang="ts">
import { computed } from 'vue';

type BadgeVariant = 'neutral' | 'primary' | 'info' | 'success' | 'warning' | 'danger' | 'accent' | 'category' | 'dark';
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
  neutral: 'border-ink-300 bg-ink-50 text-ink-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200',
  primary: 'border-brand-100 bg-brand-50 text-brand-700 dark:border-brand-500/35 dark:bg-brand-600/10 dark:text-brand-400',
  info: 'border-brand-100 bg-brand-50 text-brand-700 dark:border-brand-500/35 dark:bg-brand-600/10 dark:text-brand-400',
  success:
    'border-success-500/30 bg-success-50 text-success-500 dark:border-success-500/40 dark:bg-success-500/10 dark:text-[#81C995]',
  warning:
    'border-amberline-100 bg-amberline-50 text-amberline-500 dark:border-amberline-500/45 dark:bg-amberline-500/10 dark:text-[#FDD663]',
  danger: 'border-coral-100 bg-coral-50 text-coral-500 dark:border-coral-500/45 dark:bg-coral-500/10 dark:text-[#F28B82]',
  accent:
    'border-brand-100 bg-brand-50 text-brand-700 dark:border-brand-500/35 dark:bg-brand-600/10 dark:text-brand-400',
  category:
    'border-brand-100 bg-brand-50 text-brand-700 dark:border-brand-500/35 dark:bg-brand-600/10 dark:text-brand-400',
  dark: 'border-ink-700 bg-ink-900 text-ink-50 dark:border-ink-600 dark:bg-ink-800'
};

const sizeClasses: Record<BadgeSize, string> = {
  xs: 'h-[22px] px-2 text-xs',
  sm: 'h-6 px-2.5 text-xs'
};

const classes = computed(() => [
  'inline-flex min-w-0 max-w-full items-center gap-1 overflow-hidden whitespace-nowrap rounded-md border font-medium leading-none',
  variantClasses[props.variant],
  sizeClasses[props.size]
]);
</script>

<template>
  <span :class="classes">
    <slot />
  </span>
</template>
