<script setup lang="ts">
import { computed, toRaw } from 'vue';
import { useSettings } from '../../composables/useSettings';
import type { ExtractMode, RecipeField, SimpleField, Transform } from '../../shared/types';

type FieldMode = 'single' | 'list' | 'group';
type ChildMode = 'single' | 'list';

const props = defineProps<{
  modelValue: RecipeField[];
}>();

const emit = defineEmits<{
  'update:modelValue': [fields: RecipeField[]];
}>();

const { t } = useSettings();

const extractOptions = computed<Array<{ value: ExtractMode; label: string }>>(() => [
  { value: 'text', label: t('extract.text') },
  { value: 'html', label: t('extract.html') },
  { value: 'attribute', label: t('extract.attribute') },
  { value: 'json', label: t('extract.json') },
  { value: 'exists', label: t('extract.exists') },
  { value: 'count', label: t('extract.count') },
  { value: 'tagName', label: t('extract.tagName') }
]);

const transformOptions = computed<Array<{ value: Transform; label: string }>>(() => [
  { value: 'trim', label: t('transform.trim') },
  { value: 'removeExtraSpaces', label: t('transform.removeExtraSpaces') },
  { value: 'lowercase', label: t('transform.lowercase') },
  { value: 'uppercase', label: t('transform.uppercase') },
  { value: 'number', label: t('transform.number') },
  { value: 'currency', label: t('transform.currency') },
  { value: 'absoluteUrl', label: t('transform.absoluteUrl') },
  { value: 'jsonParse', label: t('transform.jsonParse') }
]);

function eventValue(event: Event): string {
  return (event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;
}

function eventChecked(event: Event): boolean {
  return (event.target as HTMLInputElement).checked;
}

function createSimpleField(multiple = false): SimpleField {
  return {
    id: crypto.randomUUID(),
    kind: 'field',
    key: 'field',
    selector: '',
    extract: 'text',
    multiple
  };
}

function clonePlain<T>(value: T): T {
  return structuredClone(toRaw(value));
}

function updateFields(fields: RecipeField[]): void {
  emit('update:modelValue', fields);
}

function updateField(index: number, field: RecipeField): void {
  const nextFields = clonePlain(props.modelValue);
  nextFields[index] = field;
  updateFields(nextFields);
}

function addField(): void {
  updateFields([...props.modelValue, createSimpleField(false)]);
}

function removeField(index: number): void {
  updateFields(props.modelValue.filter((_, itemIndex) => itemIndex !== index));
}

function duplicateField(index: number): void {
  const field = clonePlain(props.modelValue[index]);
  field.id = crypto.randomUUID();
  field.key = `${field.key}_copy`;
  if (field.kind === 'group') {
    field.fields = field.fields.map((child) => ({
      ...child,
      id: crypto.randomUUID()
    }));
  }

  const nextFields = [...props.modelValue];
  nextFields.splice(index + 1, 0, field);
  updateFields(nextFields);
}

function fieldMode(field: RecipeField): FieldMode {
  if (field.kind === 'group') {
    return 'group';
  }

  return field.multiple ? 'list' : 'single';
}

function changeFieldMode(index: number, mode: FieldMode): void {
  const currentField = props.modelValue[index];
  const base = {
    id: currentField.id,
    key: currentField.key,
    selector: currentField.selector,
    required: currentField.required
  };

  if (mode === 'group') {
    updateField(index, {
      ...base,
      kind: 'group',
      multiple: true,
      fields: currentField.kind === 'group' ? currentField.fields : [createSimpleField(false)]
    });
    return;
  }

  updateField(index, {
    ...base,
    kind: 'field',
    extract: currentField.kind === 'field' ? currentField.extract : 'text',
    attribute: currentField.kind === 'field' ? currentField.attribute : undefined,
    multiple: mode === 'list',
    transforms: currentField.kind === 'field' ? currentField.transforms : undefined
  });
}

function updateFieldBase(index: number, patch: Partial<Pick<RecipeField, 'key' | 'selector' | 'required'>>): void {
  updateField(index, {
    ...props.modelValue[index],
    ...patch
  });
}

function updateSimpleField(index: number, patch: Partial<SimpleField>): void {
  const field = props.modelValue[index];
  if (field.kind !== 'field') {
    return;
  }

  updateField(index, {
    ...field,
    ...patch
  });
}

function hasTransform(field: SimpleField, transform: Transform): boolean {
  return Boolean(field.transforms?.includes(transform));
}

function updateTransform(index: number, transform: Transform, enabled: boolean): void {
  const field = props.modelValue[index];
  if (field.kind !== 'field') {
    return;
  }

  const transforms = new Set(field.transforms ?? []);
  if (enabled) {
    transforms.add(transform);
  } else {
    transforms.delete(transform);
  }

  updateSimpleField(index, {
    transforms: Array.from(transforms)
  });
}

function childMode(field: SimpleField): ChildMode {
  return field.multiple ? 'list' : 'single';
}

function updateChild(groupIndex: number, childIndex: number, child: SimpleField): void {
  const group = props.modelValue[groupIndex];
  if (group.kind !== 'group') {
    return;
  }

  const fields = [...group.fields];
  fields[childIndex] = child;
  updateField(groupIndex, {
    ...group,
    fields
  });
}

function addChild(groupIndex: number): void {
  const group = props.modelValue[groupIndex];
  if (group.kind !== 'group') {
    return;
  }

  updateField(groupIndex, {
    ...group,
    fields: [...group.fields, createSimpleField(false)]
  });
}

function removeChild(groupIndex: number, childIndex: number): void {
  const group = props.modelValue[groupIndex];
  if (group.kind !== 'group') {
    return;
  }

  updateField(groupIndex, {
    ...group,
    fields: group.fields.filter((_, index) => index !== childIndex)
  });
}

function updateChildBase(groupIndex: number, childIndex: number, patch: Partial<SimpleField>): void {
  const group = props.modelValue[groupIndex];
  if (group.kind !== 'group') {
    return;
  }

  updateChild(groupIndex, childIndex, {
    ...group.fields[childIndex],
    ...patch
  });
}

function updateChildTransform(groupIndex: number, childIndex: number, transform: Transform, enabled: boolean): void {
  const group = props.modelValue[groupIndex];
  if (group.kind !== 'group') {
    return;
  }

  const child = group.fields[childIndex];
  const transforms = new Set(child.transforms ?? []);
  if (enabled) {
    transforms.add(transform);
  } else {
    transforms.delete(transform);
  }

  updateChildBase(groupIndex, childIndex, {
    transforms: Array.from(transforms)
  });
}
</script>

<template>
  <div class="space-y-2">
    <article
      v-for="(field, index) in modelValue"
      :key="field.id"
      class="rounded-lg border border-ink-200 bg-white p-2.5 dark:border-ink-700 dark:bg-ink-950"
    >
      <div class="mb-2 flex items-center justify-between gap-2">
        <select class="input max-w-[150px]" :value="fieldMode(field)" @change="changeFieldMode(index, eventValue($event) as FieldMode)">
          <option value="single">{{ t('field.mode.single') }}</option>
          <option value="list">{{ t('field.mode.list') }}</option>
          <option value="group">{{ t('field.mode.group') }}</option>
        </select>
        <div class="flex gap-2">
          <button class="btn-secondary px-2 py-1 text-xs" type="button" @click="duplicateField(index)">{{ t('field.duplicate') }}</button>
          <button class="btn-danger px-2 py-1 text-xs" type="button" @click="removeField(index)">{{ t('field.delete') }}</button>
        </div>
      </div>

      <div class="grid gap-2">
        <label class="grid gap-1">
          <span class="field-label">{{ t('field.jsonKey') }}</span>
          <input class="input font-mono text-xs" :value="field.key" @input="updateFieldBase(index, { key: eventValue($event) })" />
        </label>

        <label class="grid gap-1">
          <span class="field-label">{{ t('field.selector') }}</span>
          <input class="input font-mono text-xs" :value="field.selector" @input="updateFieldBase(index, { selector: eventValue($event) })" />
        </label>

        <label class="flex items-center gap-2 text-sm font-semibold text-ink-700 dark:text-ink-50">
          <input
            type="checkbox"
            class="h-4 w-4 rounded border-ink-300 text-brand-600 focus-ring dark:border-ink-700 dark:text-brand-400"
            :checked="Boolean(field.required)"
            @change="updateFieldBase(index, { required: eventChecked($event) })"
          />
          {{ t('field.required') }}
        </label>
      </div>

      <div v-if="field.kind === 'field'" class="mt-3 grid gap-2">
        <label class="grid gap-1">
          <span class="field-label">{{ t('field.extract') }}</span>
          <select class="input" :value="field.extract" @change="updateSimpleField(index, { extract: eventValue($event) as ExtractMode })">
            <option v-for="option in extractOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>

        <label v-if="field.extract === 'attribute'" class="grid gap-1">
          <span class="field-label">{{ t('field.attribute') }}</span>
          <input class="input font-mono text-xs" :value="field.attribute ?? ''" placeholder="href" @input="updateSimpleField(index, { attribute: eventValue($event) })" />
        </label>

        <fieldset class="grid gap-2">
          <legend class="field-label mb-1">{{ t('field.transforms') }}</legend>
          <div class="grid grid-cols-2 gap-2">
            <label v-for="transform in transformOptions" :key="transform.value" class="flex items-center gap-2 text-xs font-semibold text-ink-700 dark:text-ink-50">
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-ink-300 text-brand-600 focus-ring dark:border-ink-700 dark:text-brand-400"
                :checked="hasTransform(field, transform.value)"
                @change="updateTransform(index, transform.value, eventChecked($event))"
              />
              {{ transform.label }}
            </label>
          </div>
        </fieldset>
      </div>

      <div v-else class="mt-3 rounded-lg border border-ink-200 bg-ink-100 p-2.5 dark:border-ink-700 dark:bg-ink-800">
        <div class="mb-2 flex items-center justify-between gap-2">
          <h4 class="text-sm font-semibold text-ink-900 dark:text-ink-50">{{ t('field.itemFields') }}</h4>
          <button class="btn-secondary px-2 py-1 text-xs" type="button" @click="addChild(index)">{{ t('field.add') }}</button>
        </div>

        <div class="space-y-2">
          <article v-for="(child, childIndex) in field.fields" :key="child.id" class="rounded-md border border-ink-200 bg-white p-2.5 dark:border-ink-700 dark:bg-ink-950">
            <div class="mb-2 flex items-center justify-between gap-2">
              <select class="input max-w-[150px]" :value="childMode(child)" @change="updateChildBase(index, childIndex, { multiple: eventValue($event) === 'list' })">
                <option value="single">{{ t('field.mode.single') }}</option>
                <option value="list">{{ t('field.mode.list') }}</option>
              </select>
              <button class="btn-danger px-2 py-1 text-xs" type="button" @click="removeChild(index, childIndex)">{{ t('field.delete') }}</button>
            </div>

            <div class="grid gap-2">
              <label class="grid gap-1">
                <span class="field-label">{{ t('field.jsonKey') }}</span>
                <input class="input font-mono text-xs" :value="child.key" @input="updateChildBase(index, childIndex, { key: eventValue($event) })" />
              </label>

              <label class="grid gap-1">
                <span class="field-label">{{ t('field.selector') }}</span>
                <input class="input font-mono text-xs" :value="child.selector" @input="updateChildBase(index, childIndex, { selector: eventValue($event) })" />
              </label>

              <label class="grid gap-1">
                <span class="field-label">{{ t('field.extract') }}</span>
                <select class="input" :value="child.extract" @change="updateChildBase(index, childIndex, { extract: eventValue($event) as ExtractMode })">
                  <option v-for="option in extractOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                </select>
              </label>

              <label v-if="child.extract === 'attribute'" class="grid gap-1">
                <span class="field-label">{{ t('field.attribute') }}</span>
                <input class="input font-mono text-xs" :value="child.attribute ?? ''" placeholder="href" @input="updateChildBase(index, childIndex, { attribute: eventValue($event) })" />
              </label>

              <label class="flex items-center gap-2 text-sm font-semibold text-ink-700 dark:text-ink-50">
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border-ink-300 text-brand-600 focus-ring dark:border-ink-700 dark:text-brand-400"
                  :checked="Boolean(child.required)"
                  @change="updateChildBase(index, childIndex, { required: eventChecked($event) })"
                />
                {{ t('field.required') }}
              </label>

              <fieldset class="grid gap-2">
                <legend class="field-label mb-1">{{ t('field.transforms') }}</legend>
                <div class="grid grid-cols-2 gap-2">
                  <label v-for="transform in transformOptions" :key="transform.value" class="flex items-center gap-2 text-xs font-semibold text-ink-700 dark:text-ink-50">
                    <input
                      type="checkbox"
                      class="h-4 w-4 rounded border-ink-300 text-brand-600 focus-ring dark:border-ink-700 dark:text-brand-400"
                      :checked="hasTransform(child, transform.value)"
                      @change="updateChildTransform(index, childIndex, transform.value, eventChecked($event))"
                    />
                    {{ transform.label }}
                  </label>
                </div>
              </fieldset>
            </div>
          </article>
        </div>
      </div>
    </article>

    <button class="btn-secondary w-full" type="button" @click="addField">{{ t('field.addField') }}</button>
  </div>
</template>
