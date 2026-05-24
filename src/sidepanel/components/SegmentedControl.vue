<script setup lang="ts" generic="TValue extends string">
type SegmentOption<T extends string> = {
  value: T;
  label: string;
};

defineProps<{
  modelValue: TValue;
  options: Array<SegmentOption<TValue>>;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: TValue];
}>();
</script>

<template>
  <div
    class="grid gap-1 rounded-lg border border-ink-200 bg-ink-100 p-1 dark:border-ink-700 dark:bg-ink-800"
    :style="{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }"
  >
    <button
      v-for="option in options"
      :key="option.value"
      class="focus-ring rounded-md px-2 py-1.5 text-xs font-medium transition"
      :class="option.value === modelValue
        ? 'bg-white text-brand-700 ring-1 ring-brand-200 dark:bg-brand-600/15 dark:text-brand-400 dark:ring-brand-500/35'
        : 'text-ink-500 hover:bg-white/70 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-ink-50'"
      type="button"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
