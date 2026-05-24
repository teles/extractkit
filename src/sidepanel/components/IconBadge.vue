<script setup lang="ts">
import { type Component, computed } from 'vue';
import type { IconTone } from './iconTone';

const props = withDefaults(
  defineProps<{
    icon: Component;
    tone?: IconTone;
    size?: 'xs' | 'sm';
  }>(),
  {
    tone: 'neutral',
    size: 'sm'
  }
);

const toneClasses: Record<IconTone, string> = {
  neutral: 'border-transparent bg-transparent text-ink-500 dark:text-ink-300',
  brand: 'border-transparent bg-transparent text-brand-700 dark:text-brand-400',
  cyan: 'border-transparent bg-transparent text-ink-500 dark:text-ink-300',
  violet: 'border-transparent bg-transparent text-ink-500 dark:text-ink-300',
  success: 'border-success-500/20 bg-success-50 text-success-500 dark:bg-success-500/15',
  warning:
    'border-amberline-100 bg-amberline-50 text-amberline-500 dark:border-amberline-500/30 dark:bg-amberline-500/15',
  danger: 'border-coral-100 bg-coral-50 text-coral-500 dark:border-coral-500/30 dark:bg-coral-500/15'
};

const sizeClasses = computed(() => (props.size === 'xs' ? 'h-5 w-5 [&_svg]:h-3 [&_svg]:w-3' : 'h-6 w-6 [&_svg]:h-3.5 [&_svg]:w-3.5'));
</script>

<template>
  <span :class="['inline-flex shrink-0 items-center justify-center rounded-md border', toneClasses[tone], sizeClasses]">
    <component :is="icon" :stroke-width="2.1" aria-hidden="true" />
  </span>
</template>
