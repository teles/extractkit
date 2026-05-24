<script setup lang="ts">
import { ChevronDown, ChevronUp, CircleCheck, CircleX, ListChecks, TriangleAlert } from '@lucide/vue';
import { computed, ref } from 'vue';
import { useSettings } from '../../composables/useSettings';
import type { TranslationKey } from '../../shared/i18n';
import type { RecipeCheckResult, RecipeChecksResult } from '../../shared/types';
import Badge from './Badge.vue';
import IconBadge from './IconBadge.vue';
import type { IconTone } from './iconTone';

const props = withDefaults(
  defineProps<{
    checks?: RecipeChecksResult;
    compact?: boolean;
    showAllResults?: boolean;
    expandable?: boolean;
  }>(),
  {
    compact: false,
    showAllResults: false,
    expandable: false
  }
);

const { t } = useSettings();
const resultsOpen = ref(false);

const hasConfiguredChecks = computed(() => Boolean(props.checks && props.checks.results.length > 0));
const failedResults = computed(() => props.checks?.results.filter((result) => result.status === 'failed') ?? []);
const listedResults = computed(() => (props.showAllResults ? (props.checks?.results ?? []) : failedResults.value));
const visibleResults = computed(() => listedResults.value.slice(0, props.showAllResults ? listedResults.value.length : 3));
const remainingResults = computed(() => Math.max(listedResults.value.length - visibleResults.value.length, 0));
const canToggleResults = computed(() => props.expandable && listedResults.value.length > 0);
const shouldShowResults = computed(() => visibleResults.value.length > 0 && (!props.expandable || resultsOpen.value));

const badgeVariant = computed(() => {
  if (!hasConfiguredChecks.value || props.checks?.status === 'skipped') {
    return 'neutral';
  }

  if (props.checks?.status === 'passed') {
    return 'success';
  }

  if (props.checks?.status === 'warning') {
    return 'warning';
  }

  return 'danger';
});

const icon = computed(() => {
  if (!hasConfiguredChecks.value || props.checks?.status === 'skipped') {
    return ListChecks;
  }

  if (props.checks?.status === 'passed') {
    return CircleCheck;
  }

  if (props.checks?.status === 'warning') {
    return TriangleAlert;
  }

  return CircleX;
});

const iconTone = computed<IconTone>(() => {
  if (!hasConfiguredChecks.value || props.checks?.status === 'skipped') {
    return 'neutral';
  }

  if (props.checks?.status === 'passed') {
    return 'success';
  }

  if (props.checks?.status === 'warning') {
    return 'warning';
  }

  return 'danger';
});

const headline = computed(() => {
  if (!hasConfiguredChecks.value || props.checks?.status === 'skipped') {
    return t('checks.noConfigured');
  }

  if (props.checks?.status === 'passed') {
    return t('checks.allPassed');
  }

  if (props.checks?.status === 'warning') {
    return t('checks.needAttention');
  }

  return t('checks.failed');
});

const compactLabel = computed(() => {
  if (!hasConfiguredChecks.value || props.checks?.status === 'skipped') {
    return t('checks.noChecksBadge');
  }

  if ((props.checks?.errors ?? 0) > 0) {
    return `${props.checks?.errors ?? 0} ${t('checks.errors')}`;
  }

  if ((props.checks?.warnings ?? 0) > 0) {
    return `${props.checks?.warnings ?? 0} ${t('checks.warnings')}`;
  }

  return t('checks.passedBadge');
});

const summary = computed(() => {
  if (!hasConfiguredChecks.value) {
    return t('checks.noConfigured');
  }

  return [
    `${props.checks?.passed ?? 0} ${t('checks.passed')}`,
    `${props.checks?.warnings ?? 0} ${t('checks.warnings')}`,
    `${props.checks?.errors ?? 0} ${t('checks.errors')}`
  ].join(' · ');
});

function formatActual(result: RecipeCheckResult): string | null {
  if (result.actual === undefined) {
    return null;
  }

  if (typeof result.actual === 'string' || typeof result.actual === 'number' || typeof result.actual === 'boolean') {
    return String(result.actual);
  }

  return JSON.stringify(result.actual);
}

function severityLabel(severity: RecipeCheckResult['severity']): string {
  return t(`checks.${severity}` as TranslationKey);
}

function resultBadgeLabel(result: RecipeCheckResult): string {
  if (result.status === 'passed') {
    return t('checks.passed');
  }

  if (result.status === 'skipped') {
    return t('checks.skipped');
  }

  return severityLabel(result.severity);
}
</script>

<template>
  <Badge v-if="compact" :variant="badgeVariant">
    <component :is="icon" class="h-3.5 w-3.5 shrink-0" :stroke-width="2.1" aria-hidden="true" />
    {{ compactLabel }}
  </Badge>

  <section v-else class="rounded-md border border-ink-200 bg-ink-50/80 px-3 py-2 dark:border-ink-700 dark:bg-ink-950/60">
    <div class="flex items-center justify-between gap-2">
      <div class="flex min-w-0 items-center gap-2">
        <IconBadge :icon="icon" :tone="iconTone" size="xs" />
        <div class="min-w-0">
          <p class="field-label">{{ t('checks.title') }}</p>
          <p class="mt-0.5 text-xs text-ink-500 dark:text-ink-300">{{ summary }}</p>
        </div>
      </div>
      <Badge :variant="badgeVariant">{{ headline }}</Badge>
    </div>

    <button
      v-if="canToggleResults"
      type="button"
      class="focus-ring mt-3 inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-xs font-medium text-brand-700 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-600/15"
      :aria-expanded="resultsOpen"
      @click="resultsOpen = !resultsOpen"
    >
      <ChevronUp v-if="resultsOpen" class="h-3.5 w-3.5" :stroke-width="2.2" aria-hidden="true" />
      <ChevronDown v-else class="h-3.5 w-3.5" :stroke-width="2.2" aria-hidden="true" />
      {{ resultsOpen ? t('checks.hideDetails') : t('checks.showDetails') }}
    </button>

    <ul v-if="shouldShowResults" class="mt-3 space-y-2 text-xs text-ink-700 dark:text-ink-100">
      <li v-for="result in visibleResults" :key="result.id" class="rounded-md border border-ink-200 bg-white p-2 dark:border-ink-700 dark:bg-ink-900">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="font-semibold text-ink-900 dark:text-ink-50">{{ result.name }}</p>
            <p v-if="result.message || result.description" class="mt-1 text-ink-500 dark:text-ink-300">
              {{ result.message || result.description }}
            </p>
          </div>
          <Badge
            :variant="result.status === 'passed'
              ? 'success'
              : result.status === 'skipped'
                ? 'neutral'
                : result.severity === 'error'
                  ? 'danger'
                  : result.severity === 'warning'
                    ? 'warning'
                    : 'neutral'"
          >
            {{ resultBadgeLabel(result) }}
          </Badge>
        </div>
        <p class="meta-line mt-2 truncate">{{ result.selector }}</p>
        <p v-if="result.expected" class="mt-1 text-ink-500 dark:text-ink-300">
          {{ t('checks.expected') }}: {{ result.expected }}
        </p>
        <p v-if="formatActual(result)" class="mt-1 text-ink-500 dark:text-ink-300">
          {{ t('checks.actual') }}: {{ formatActual(result) }}
        </p>
      </li>
      <li v-if="remainingResults > 0" class="font-semibold text-ink-500 dark:text-ink-300">
        +{{ remainingResults }} {{ t('checks.moreChecks') }}
      </li>
    </ul>
  </section>
</template>
