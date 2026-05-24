<script setup lang="ts">
import { Shield, ShieldCheck, TriangleAlert } from '@lucide/vue';
import { computed } from 'vue';
import { useSettings } from '../../composables/useSettings';
import type { OutputValidationResult } from '../../shared/types';
import Badge from './Badge.vue';
import IconBadge from './IconBadge.vue';
import type { IconTone } from './iconTone';

const props = withDefaults(
  defineProps<{
    validation?: OutputValidationResult;
    compact?: boolean;
  }>(),
  {
    compact: false
  }
);

const { t } = useSettings();

const status = computed(() => props.validation?.status ?? 'skipped');
const issues = computed(() => props.validation?.issues ?? []);
const visibleIssues = computed(() => issues.value.slice(0, 3));
const remainingIssues = computed(() => Math.max(issues.value.length - visibleIssues.value.length, 0));

const variant = computed(() => {
  if (status.value === 'valid') {
    return 'success';
  }

  if (status.value === 'invalid') {
    return 'warning';
  }

  return 'neutral';
});

const label = computed(() => {
  if (status.value === 'valid') {
    return t('validation.valid');
  }

  if (status.value === 'invalid') {
    return t('validation.invalid');
  }

  return t('validation.skipped');
});

const compactLabel = computed(() => {
  if (status.value === 'valid') {
    return t('validation.validBadge');
  }

  if (status.value === 'invalid') {
    return t('validation.issuesBadge');
  }

  return t('validation.skippedBadge');
});

const icon = computed(() => {
  if (status.value === 'valid') {
    return ShieldCheck;
  }

  if (status.value === 'invalid') {
    return TriangleAlert;
  }

  return Shield;
});

const iconTone = computed<IconTone>(() => {
  if (status.value === 'valid') {
    return 'success';
  }

  if (status.value === 'invalid') {
    return 'warning';
  }

  return 'neutral';
});

function issuePath(path: string): string {
  return path || '/';
}
</script>

<template>
  <Badge v-if="compact" :variant="variant">
    <component :is="icon" class="mr-1 h-3 w-3" :stroke-width="2.1" aria-hidden="true" />
    {{ compactLabel }}
  </Badge>

  <div
    v-else
    class="rounded-md border border-ink-200 bg-ink-50/80 px-3 py-2 dark:border-ink-700 dark:bg-ink-950/60"
  >
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <IconBadge :icon="icon" :tone="iconTone" size="xs" />
        <p class="field-label">{{ t('validation.title') }}</p>
      </div>
      <Badge :variant="variant">{{ label }}</Badge>
    </div>

    <ul v-if="status === 'invalid' && visibleIssues.length > 0" class="mt-2 space-y-1 text-xs text-ink-700 dark:text-ink-100">
      <li v-for="issue in visibleIssues" :key="`${issue.path}-${issue.message}-${issue.keyword ?? 'issue'}`">
        <span class="font-mono text-ink-500 dark:text-ink-400">{{ issuePath(issue.path) }}:</span>
        {{ issue.message }}
      </li>
      <li v-if="remainingIssues > 0" class="font-semibold text-ink-500 dark:text-ink-400">
        +{{ remainingIssues }} {{ t('validation.moreIssues') }}
      </li>
    </ul>
  </div>
</template>
