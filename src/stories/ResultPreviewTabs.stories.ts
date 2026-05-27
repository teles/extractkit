import type { Meta, StoryObj } from '@storybook/vue3';
import ResultPreviewTabs from '../sidepanel/components/ResultPreviewTabs.vue';
import {
  runHeadingsOutline,
  runPageMetadata,
  runImageSeoQa,
  runPageLinks,
  runJsonLd,
  runSeoSnapshot,
  runError,
} from './fixtures';

const meta = {
  title: 'Results/ResultPreviewTabs',
  component: ResultPreviewTabs,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ResultPreviewTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Individual run types — all tabs available (Readable / JSON / Checks)
// ---------------------------------------------------------------------------

export const HeadingsOutline: Story = {
  name: 'Headings Outline — array of objects',
  args: { run: runHeadingsOutline },
};

export const PageMetadata: Story = {
  name: 'Page Metadata — flat key-value',
  args: { run: runPageMetadata },
};

export const ImageSeoQa: Story = {
  name: 'Image SEO QA — partial with warnings + checks',
  args: { run: runImageSeoQa },
};

export const PageLinks: Story = {
  name: 'Page Links — array with empty text values',
  args: { run: runPageLinks },
};

export const JsonLdStructuredData: Story = {
  name: 'JSON-LD Structured Data — deeply nested',
  args: { run: runJsonLd },
};

export const SeoSnapshot: Story = {
  name: 'SEO Snapshot — mixed flat + check results',
  args: { run: runSeoSnapshot },
};

export const ErrorState: Story = {
  name: 'Error run — no data',
  args: { run: runError },
};

// ---------------------------------------------------------------------------
// Side-by-side comparison of all run types
// ---------------------------------------------------------------------------

export const AllRunTypes: Story = {
  name: 'All run types — side by side',
  args: { run: runHeadingsOutline },
  render: () => ({
    components: { ResultPreviewTabs },
    setup: () => ({
      runs: [
        runHeadingsOutline,
        runPageMetadata,
        runImageSeoQa,
        runPageLinks,
        runJsonLd,
        runSeoSnapshot,
        runError,
      ],
    }),
    template: `
      <div class="grid grid-cols-1 gap-8">
        <div v-for="run in runs" :key="run.id" class="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3">
          <p class="text-xs font-semibold text-zinc-400 mb-2">{{ run.recipeName }} — {{ run.status }}</p>
          <ResultPreviewTabs :run="run" />
        </div>
      </div>
    `,
  }),
};
