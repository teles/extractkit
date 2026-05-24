<script setup lang="ts">
import { CircleCheck, CircleX, TriangleAlert } from '@lucide/vue';
import { computed } from 'vue';
import { useSettings } from '../../composables/useSettings';
import type { RecipeRun } from '../../shared/types';
import Badge from './Badge.vue';

const props = defineProps<{
  status: RecipeRun['status'];
}>();

const { t } = useSettings();

const variant = computed(() => {
  if (props.status === 'success') {
    return 'success';
  }

  if (props.status === 'partial') {
    return 'warning';
  }

  return 'danger';
});

const label = computed(() => {
  if (props.status === 'success') {
    return t('status.success');
  }

  if (props.status === 'partial') {
    return t('status.partial');
  }

  return t('status.error');
});

const icon = computed(() => {
  if (props.status === 'success') {
    return CircleCheck;
  }

  if (props.status === 'partial') {
    return TriangleAlert;
  }

  return CircleX;
});
</script>

<template>
  <Badge :variant="variant">
    <component :is="icon" class="mr-1 h-3 w-3" :stroke-width="2.1" aria-hidden="true" />
    {{ label }}
  </Badge>
</template>
