import type { Meta, StoryObj } from '@storybook/vue3';
import RunCard from '../sidepanel/components/RunCard.vue';
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
  title: 'Results/RunCard',
  component: RunCard,
  tags: ['autodocs'],
  argTypes: {
    deleteDisabled: { control: 'boolean' },
    batchName: { control: 'text' },
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof RunCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SuccessRun: Story = {
  args: { run: runHeadingsOutline },
};

export const MetadataRun: Story = {
  name: 'Success — Flat key-value (Page Metadata)',
  args: { run: runPageMetadata },
};

export const PartialWithWarnings: Story = {
  name: 'Partial — Image SEO QA with warnings',
  args: { run: runImageSeoQa },
};

export const WithLinks: Story = {
  name: 'Success — Array of links',
  args: { run: runPageLinks },
};

export const WithJsonLd: Story = {
  name: 'Success — Nested JSON-LD',
  args: { run: runJsonLd },
};

export const SeoSnapshot: Story = {
  name: 'Success — SEO Snapshot',
  args: { run: runSeoSnapshot },
};

export const ErrorRun: Story = {
  name: 'Error run',
  args: { run: runError },
};

export const WithBatchName: Story = {
  name: 'With batch name badge',
  args: { run: runHeadingsOutline, batchName: 'Docs audit 2026' },
};

export const AllRuns: Story = {
  name: 'All run types stacked',
  args: { run: runHeadingsOutline },
  render: () => ({
    components: { RunCard },
    setup: () => ({ runHeadingsOutline, runPageMetadata, runImageSeoQa, runPageLinks, runJsonLd, runSeoSnapshot, runError }),
    template: `
      <div class="flex flex-col gap-2">
        <RunCard :run="runHeadingsOutline" />
        <RunCard :run="runPageMetadata" />
        <RunCard :run="runImageSeoQa" />
        <RunCard :run="runPageLinks" />
        <RunCard :run="runJsonLd" />
        <RunCard :run="runSeoSnapshot" />
        <RunCard :run="runError" />
      </div>
    `,
  }),
};
