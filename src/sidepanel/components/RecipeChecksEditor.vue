<script setup lang="ts">
import { Copy, Plus, Trash2 } from '@lucide/vue';
import { toRaw } from 'vue';
import { useSettings } from '../../composables/useSettings';
import type { TranslationKey } from '../../shared/i18n';
import type { CheckSeverity, RecipeCheck, RecipeCheckAssertion } from '../../shared/types';
import Button from './Button.vue';

type AssertionType = RecipeCheckAssertion['type'];

const props = defineProps<{
  modelValue: RecipeCheck[];
}>();

const emit = defineEmits<{
  'update:modelValue': [checks: RecipeCheck[]];
}>();

const { t } = useSettings();

const assertionTypes: AssertionType[] = [
  'exists',
  'notExists',
  'countEquals',
  'countGreaterThan',
  'countGreaterThanOrEqual',
  'countLessThan',
  'countLessThanOrEqual',
  'missingAttributeCountEquals',
  'emptyAttributeCountEquals',
  'eachElementMustHave',
  'eachElementShouldHave'
];

const severities: CheckSeverity[] = ['info', 'warning', 'error'];

function clonePlain<T>(value: T): T {
  return structuredClone(toRaw(value));
}

function assertionLabel(type: AssertionType): string {
  return t(`checks.assertion.${type}` as TranslationKey);
}

function severityLabel(severity: CheckSeverity): string {
  return t(`checks.${severity}` as TranslationKey);
}

function defaultAssertion(type: AssertionType): RecipeCheckAssertion {
  if (type === 'exists' || type === 'notExists') {
    return { type };
  }

  if (
    type === 'countEquals' ||
    type === 'countGreaterThan' ||
    type === 'countGreaterThanOrEqual' ||
    type === 'countLessThan' ||
    type === 'countLessThanOrEqual'
  ) {
    return { type, value: 0 };
  }

  if (type === 'missingAttributeCountEquals' || type === 'emptyAttributeCountEquals') {
    return { type, attribute: 'alt', value: 0 };
  }

  return { type, selector: '' };
}

function createCheck(): RecipeCheck {
  return {
    id: crypto.randomUUID(),
    name: t('checks.new'),
    description: '',
    selector: '',
    assertion: { type: 'exists' },
    severity: 'warning'
  };
}

function updateChecks(checks: RecipeCheck[]): void {
  emit('update:modelValue', checks);
}

function updateCheck(index: number, patch: Partial<RecipeCheck>): void {
  const checks = clonePlain(props.modelValue);
  checks[index] = {
    ...checks[index],
    ...patch
  };
  updateChecks(checks);
}

function addCheck(): void {
  updateChecks([...props.modelValue, createCheck()]);
}

function duplicateCheck(index: number): void {
  const check = clonePlain(props.modelValue[index]);
  check.id = crypto.randomUUID();
  check.name = `${check.name} (${t('field.duplicate')})`;
  const checks = [...props.modelValue];
  checks.splice(index + 1, 0, check);
  updateChecks(checks);
}

function removeCheck(index: number): void {
  updateChecks(props.modelValue.filter((_, itemIndex) => itemIndex !== index));
}

function updateAssertionType(index: number, type: AssertionType): void {
  updateCheck(index, { assertion: defaultAssertion(type) });
}

function updateAssertionValue(index: number, value: string): void {
  const check = props.modelValue[index];
  const assertion = check.assertion;
  if (!('value' in assertion)) {
    return;
  }

  updateCheck(index, {
    assertion: {
      ...assertion,
      value: Number(value)
    }
  });
}

function updateAssertionAttribute(index: number, attribute: string): void {
  const check = props.modelValue[index];
  const assertion = check.assertion;
  if (!('attribute' in assertion)) {
    return;
  }

  updateCheck(index, {
    assertion: {
      ...assertion,
      attribute
    }
  });
}

function updateAssertionSelector(index: number, selector: string): void {
  const check = props.modelValue[index];
  const assertion = check.assertion;
  if (!('selector' in assertion)) {
    return;
  }

  updateCheck(index, {
    assertion: {
      ...assertion,
      selector
    }
  });
}

function assertionValue(assertion: RecipeCheckAssertion): number {
  return 'value' in assertion ? assertion.value : 0;
}

function assertionAttribute(assertion: RecipeCheckAssertion): string {
  return 'attribute' in assertion ? assertion.attribute : '';
}

function assertionSelector(assertion: RecipeCheckAssertion): string {
  return 'selector' in assertion ? assertion.selector : '';
}
</script>

<template>
  <section class="space-y-2">
    <div class="flex items-center justify-between gap-2">
      <div>
        <p class="field-label">{{ t('checks.title') }}</p>
        <p class="mt-1 text-xs text-ink-500 dark:text-ink-300">
          {{ modelValue.length === 0 ? t('checks.noConfigured') : `${modelValue.length} ${t('checks.title')}` }}
        </p>
      </div>
      <Button size="xs" type="button" @click="addCheck">
        <Plus class="h-3.5 w-3.5" aria-hidden="true" />
        {{ t('checks.add') }}
      </Button>
    </div>

    <article
      v-for="(check, index) in modelValue"
      :key="check.id"
      class="rounded-lg border border-ink-200 bg-white p-2.5 dark:border-ink-700 dark:bg-ink-950"
    >
      <div class="mb-2 flex items-center justify-between gap-2">
        <h3 class="truncate text-sm font-semibold text-ink-900 dark:text-ink-50">{{ check.name || t('checks.edit') }}</h3>
        <div class="flex gap-1.5">
          <Button size="xs" type="button" @click="duplicateCheck(index)">
            <Copy class="h-3.5 w-3.5" aria-hidden="true" />
            {{ t('field.duplicate') }}
          </Button>
          <Button size="xs" variant="danger" type="button" @click="removeCheck(index)">
            <Trash2 class="h-3.5 w-3.5" aria-hidden="true" />
            {{ t('field.delete') }}
          </Button>
        </div>
      </div>

      <div class="grid gap-2">
        <label class="grid gap-1">
          <span class="field-label">{{ t('checks.name') }}</span>
          <input class="input" :value="check.name" @input="updateCheck(index, { name: ($event.target as HTMLInputElement).value })" />
        </label>

        <label class="grid gap-1">
          <span class="field-label">{{ t('checks.description') }}</span>
          <textarea
            class="input min-h-16 resize-y"
            :value="check.description ?? ''"
            @input="updateCheck(index, { description: ($event.target as HTMLTextAreaElement).value })"
          />
        </label>

        <div class="grid grid-cols-2 gap-2">
          <label class="grid gap-1">
            <span class="field-label">{{ t('checks.severity') }}</span>
            <select class="input" :value="check.severity" @change="updateCheck(index, { severity: ($event.target as HTMLSelectElement).value as CheckSeverity })">
              <option v-for="severity in severities" :key="severity" :value="severity">
                {{ severityLabel(severity) }}
              </option>
            </select>
          </label>

          <label class="grid gap-1">
            <span class="field-label">{{ t('checks.assertionType') }}</span>
            <select class="input" :value="check.assertion.type" @change="updateAssertionType(index, ($event.target as HTMLSelectElement).value as AssertionType)">
              <option v-for="type in assertionTypes" :key="type" :value="type">
                {{ assertionLabel(type) }}
              </option>
            </select>
          </label>
        </div>

        <label class="grid gap-1">
          <span class="field-label">{{ t('checks.targetSelector') }}</span>
          <input
            class="input font-mono text-xs"
            :value="check.selector"
            placeholder="main article"
            @input="updateCheck(index, { selector: ($event.target as HTMLInputElement).value })"
          />
        </label>

        <label v-if="'value' in check.assertion" class="grid gap-1">
          <span class="field-label">{{ t('checks.expectedValue') }}</span>
          <input
            class="input font-mono text-xs"
            type="number"
            :value="assertionValue(check.assertion)"
            @input="updateAssertionValue(index, ($event.target as HTMLInputElement).value)"
          />
        </label>

        <label v-if="'attribute' in check.assertion" class="grid gap-1">
          <span class="field-label">{{ t('checks.attribute') }}</span>
          <input
            class="input font-mono text-xs"
            :value="assertionAttribute(check.assertion)"
            placeholder="alt"
            @input="updateAssertionAttribute(index, ($event.target as HTMLInputElement).value)"
          />
        </label>

        <label v-if="'selector' in check.assertion" class="grid gap-1">
          <span class="field-label">{{ t('checks.innerSelector') }}</span>
          <input
            class="input font-mono text-xs"
            :value="assertionSelector(check.assertion)"
            placeholder=".title"
            @input="updateAssertionSelector(index, ($event.target as HTMLInputElement).value)"
          />
        </label>
      </div>
    </article>
  </section>
</template>
