<script setup lang="ts">
import { computed } from 'vue';

type MarkdownBlock =
  | {
      type: 'heading';
      level: number;
      text: string;
    }
  | {
      type: 'paragraph';
      text: string;
      label?: string;
      value?: string;
    }
  | {
      type: 'metadata';
      items: Array<{
        text: string;
        label?: string;
        value?: string;
      }>;
    }
  | {
      type: 'bullets';
      items: Array<{
        text: string;
        label?: string;
        value?: string;
      }>;
    }
  | {
      type: 'code';
      text: string;
    };

const props = defineProps<{
  markdown: string;
}>();

const blocks = computed(() => groupMetadataBlocks(parseMarkdown(props.markdown)));

function displayText(value: string): string {
  return value
    .replace(/\\([\\`*_{}[\]()#+!|])/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function parseText(value: string): { text: string; label?: string; value?: string } {
  const labelMatch = /^\*\*(.+?)\*\*:?\s*(.*)$/.exec(value);
  if (labelMatch) {
    return {
      text: displayText(value),
      label: displayText(labelMatch[1].replace(/:$/, '')),
      value: displayText(labelMatch[2])
    };
  }

  return {
    text: displayText(value)
  };
}

function parseMarkdown(markdown: string): MarkdownBlock[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const parsedBlocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? '';

    if (line.trim() === '') {
      index += 1;
      continue;
    }

    if (line.trim().startsWith('```')) {
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !(lines[index] ?? '').trim().startsWith('```')) {
        codeLines.push(lines[index] ?? '');
        index += 1;
      }
      parsedBlocks.push({ type: 'code', text: codeLines.join('\n') });
      index += 1;
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line);
    if (headingMatch) {
      parsedBlocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: displayText(headingMatch[2])
      });
      index += 1;
      continue;
    }

    if (/^-\s+/.test(line)) {
      const items: Array<{ text: string; label?: string; value?: string }> = [];
      while (index < lines.length && /^-\s+/.test(lines[index] ?? '')) {
        items.push(parseText((lines[index] ?? '').replace(/^-\s+/, '')));
        index += 1;
      }
      parsedBlocks.push({ type: 'bullets', items });
      continue;
    }

    const paragraphLines: string[] = [];
    while (
      index < lines.length &&
      (lines[index] ?? '').trim() !== '' &&
      !/^(#{1,6})\s+/.test(lines[index] ?? '') &&
      !/^-\s+/.test(lines[index] ?? '') &&
      !(lines[index] ?? '').trim().startsWith('```')
    ) {
      paragraphLines.push(lines[index] ?? '');
      index += 1;
    }

    parsedBlocks.push({
      type: 'paragraph',
      ...parseText(paragraphLines.join('\n'))
    });
  }

  return parsedBlocks;
}

function groupMetadataBlocks(parsedBlocks: MarkdownBlock[]): MarkdownBlock[] {
  const groupedBlocks: MarkdownBlock[] = [];
  let metadataItems: Array<{ text: string; label?: string; value?: string }> = [];

  function flushMetadata(): void {
    if (metadataItems.length > 0) {
      groupedBlocks.push({ type: 'metadata', items: metadataItems });
    }
    metadataItems = [];
  }

  for (const block of parsedBlocks) {
    if (block.type === 'paragraph' && block.label) {
      metadataItems.push(block);
      continue;
    }

    flushMetadata();
    groupedBlocks.push(block);
  }

  flushMetadata();
  return groupedBlocks;
}

function headingClass(level: number): string {
  if (level <= 2) {
    return 'text-[15px] font-semibold leading-6 text-ink-900 dark:text-ink-50';
  }

  if (level === 3) {
    return 'text-sm font-semibold leading-6 text-ink-900 dark:text-ink-50';
  }

  return 'text-xs font-semibold leading-5 text-ink-700 dark:text-ink-100';
}

function valueClass(value?: string): string {
  if (value && /^https?:\/\//.test(value)) {
    return 'font-mono text-[12px] leading-5 text-ink-900 dark:text-ink-50';
  }

  return 'font-medium text-ink-900 dark:text-ink-50';
}
</script>

<template>
  <div class="max-h-[420px] overflow-auto rounded-lg border border-ink-200 bg-white text-sm text-ink-700 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-100">
    <div class="space-y-3 p-3">
      <template v-for="(block, index) in blocks" :key="index">
        <component :is="`h${Math.min(block.level, 6)}`" v-if="block.type === 'heading'" :class="headingClass(block.level)">
          {{ block.text }}
        </component>

        <div
          v-else-if="block.type === 'paragraph' && block.label"
          class="grid gap-1 rounded-md border border-ink-200 bg-ink-50 px-2.5 py-2 sm:grid-cols-[minmax(120px,0.42fr)_1fr] dark:border-ink-700 dark:bg-ink-900"
        >
          <span class="text-xs font-medium uppercase text-ink-500 dark:text-ink-300">{{ block.label }}</span>
          <span class="min-w-0 whitespace-pre-wrap break-words font-medium text-ink-900 dark:text-ink-50">{{ block.value }}</span>
        </div>

        <p v-else-if="block.type === 'paragraph'" class="whitespace-pre-wrap break-words leading-6">{{ block.text }}</p>

        <div v-else-if="block.type === 'metadata'" class="overflow-hidden rounded-md border border-ink-200 bg-ink-50 dark:border-ink-700 dark:bg-ink-900">
          <div
            v-for="(item, itemIndex) in block.items"
            :key="itemIndex"
            class="grid gap-1 border-ink-200 px-2.5 py-2 sm:grid-cols-[minmax(104px,0.32fr)_1fr] dark:border-ink-700"
            :class="itemIndex > 0 ? 'border-t' : ''"
          >
            <span class="text-xs font-medium text-ink-500 dark:text-ink-300">{{ item.label }}</span>
            <span class="min-w-0 whitespace-pre-wrap break-words" :class="valueClass(item.value)">{{ item.value }}</span>
          </div>
        </div>

        <ul v-else-if="block.type === 'bullets'" class="space-y-1.5 pl-4">
          <li v-for="(item, itemIndex) in block.items" :key="itemIndex" class="list-disc leading-6">
            <template v-if="item.label">
              <span class="font-semibold text-ink-900 dark:text-ink-50">{{ item.label }}</span>
              <span v-if="item.value">: {{ item.value }}</span>
            </template>
            <template v-else>{{ item.text }}</template>
          </li>
        </ul>

        <pre
          v-else
          class="overflow-auto rounded-md border border-ink-200 bg-ink-100 p-2 font-mono text-xs leading-5 text-ink-800 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100"
        >{{ block.text }}</pre>
      </template>
    </div>
  </div>
</template>
