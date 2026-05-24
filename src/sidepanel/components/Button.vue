<script setup lang="ts">
import { computed } from 'vue';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'xs' | 'sm';
type ButtonType = 'button' | 'submit' | 'reset';

defineOptions({
  inheritAttrs: false
});

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant;
    size?: ButtonSize;
    type?: ButtonType;
    block?: boolean;
  }>(),
  {
    variant: 'secondary',
    size: 'sm',
    type: 'button',
    block: false
  }
);

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border-brand-600 bg-brand-600 text-white hover:border-brand-700 hover:bg-brand-700 dark:border-brand-500 dark:bg-brand-500 dark:hover:border-brand-400 dark:hover:bg-brand-400 dark:hover:text-ink-950',
  secondary:
    'border-ink-200 bg-white text-ink-700 hover:bg-ink-100 hover:text-ink-900 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-50 dark:hover:bg-ink-800',
  ghost:
    'border-transparent bg-transparent text-ink-500 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-ink-50',
  danger:
    'border-coral-100 bg-white text-coral-500 hover:bg-coral-50 dark:border-coral-500/30 dark:bg-coral-500/10 dark:hover:bg-coral-500/15'
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'px-2.5 py-1.5 text-xs',
  sm: 'px-3 py-2 text-sm'
};

const classes = computed(() => [
  'inline-flex items-center justify-center gap-1.5 rounded-lg border font-medium transition focus-ring disabled:pointer-events-none disabled:opacity-45',
  variantClasses[props.variant],
  sizeClasses[props.size],
  props.block ? 'w-full' : ''
]);
</script>

<template>
  <button v-bind="$attrs" :type="type" :class="classes">
    <slot />
  </button>
</template>
