<script setup lang="ts">
import { computed } from 'vue';
import VueJsonPretty from 'vue-json-pretty';
import type { JSONDataType } from 'vue-json-pretty/types/utils';
import 'vue-json-pretty/lib/styles.css';

const props = defineProps<{
  value: unknown;
  compact?: boolean;
  tone?: 'dark' | 'light';
}>();

const previewData = computed<JSONDataType>(() => toJsonData(props.value));
const maxHeightClass = computed(() => (props.compact ? 'max-h-[280px]' : 'max-h-[420px]'));

function toJsonData(value: unknown): JSONDataType {
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'object') {
    return value as Record<string, unknown>;
  }

  return String(value);
}
</script>

<template>
  <div
    class="extractkit-json-viewer overflow-auto rounded-lg border border-ink-200 bg-ink-100 px-2.5 py-2 font-mono text-xs text-ink-900 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-50"
    :class="maxHeightClass"
  >
    <VueJsonPretty
      :data="previewData"
      :deep="4"
      :collapsed-node-length="80"
      :show-line="true"
      :show-line-number="true"
      :show-length="true"
      :show-icon="true"
      :collapsed-on-click-brackets="true"
      root-path="data"
    />
  </div>
</template>

<style>
.extractkit-json-viewer .vjs-tree {
  color: #202124;
  font-family: "Roboto Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 20px;
}

.extractkit-json-viewer .vjs-tree-node {
  border-radius: 4px;
  min-width: 0;
}

.extractkit-json-viewer .vjs-tree-node:hover,
.extractkit-json-viewer .vjs-tree-node.is-highlight {
  background: #e8f0fe;
}

.extractkit-json-viewer .vjs-indent-unit.has-line {
  border-left-color: #dadce0;
}

.extractkit-json-viewer .vjs-key {
  color: #7b1fa2;
}

.extractkit-json-viewer .vjs-value-string {
  color: #188038;
}

.extractkit-json-viewer .vjs-value-number,
.extractkit-json-viewer .vjs-value-boolean {
  color: #1a73e8;
}

.extractkit-json-viewer .vjs-value-null,
.extractkit-json-viewer .vjs-value-undefined {
  color: #d93025;
}

.extractkit-json-viewer .vjs-value {
  overflow-wrap: anywhere;
  word-break: break-word;
}

.extractkit-json-viewer .vjs-comment,
.extractkit-json-viewer .vjs-node-index {
  color: #5f6368;
}

.dark .extractkit-json-viewer .vjs-tree {
  color: #f8f9fa;
}

.dark .extractkit-json-viewer .vjs-key {
  color: #d7aefb;
}

.dark .extractkit-json-viewer .vjs-value-string {
  color: #81c995;
}

.dark .extractkit-json-viewer .vjs-value-number,
.dark .extractkit-json-viewer .vjs-value-boolean {
  color: #8ab4f8;
}

.dark .extractkit-json-viewer .vjs-value-null,
.dark .extractkit-json-viewer .vjs-value-undefined {
  color: #f28b82;
}

.dark .extractkit-json-viewer .vjs-tree-brackets,
.dark .extractkit-json-viewer .vjs-colon {
  color: #f8f9fa;
}

.dark .extractkit-json-viewer .vjs-tree-node:hover,
.dark .extractkit-json-viewer .vjs-tree-node.is-highlight {
  background: #2f3336;
}

.dark .extractkit-json-viewer .vjs-indent-unit.has-line {
  border-left-color: #80868b;
}

.dark .extractkit-json-viewer .vjs-comment,
.dark .extractkit-json-viewer .vjs-node-index {
  color: #e8eaed;
}
</style>
