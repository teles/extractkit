import type { Meta, StoryObj } from '@storybook/vue3';
import ChecksSummary from '../sidepanel/components/ChecksSummary.vue';
import type { RecipeChecksResult } from '../shared/types';

const noChecks: RecipeChecksResult | undefined = undefined;

const allPassed: RecipeChecksResult = {
  status: 'passed',
  passed: 6,
  warnings: 0,
  errors: 0,
  skipped: 0,
  results: [
    { id: 'chk-1', name: 'Title exists', status: 'passed', severity: 'error', selector: 'title', assertion: { type: 'exists' } },
    { id: 'chk-2', name: 'Description exists', status: 'passed', severity: 'error', selector: 'meta[name="description"]', assertion: { type: 'exists' } },
    { id: 'chk-3', name: 'Canonical URL set', status: 'passed', severity: 'warning', selector: 'link[rel="canonical"]', assertion: { type: 'exists' } },
    { id: 'chk-4', name: 'OG title present', status: 'passed', severity: 'warning', selector: 'meta[property="og:title"]', assertion: { type: 'exists' } },
    { id: 'chk-5', name: 'OG description present', status: 'passed', severity: 'warning', selector: 'meta[property="og:description"]', assertion: { type: 'exists' } },
    { id: 'chk-6', name: 'Twitter card defined', status: 'passed', severity: 'info', selector: 'meta[name="twitter:card"]', assertion: { type: 'exists' } },
  ],
};

const withWarnings: RecipeChecksResult = {
  status: 'warning',
  passed: 4,
  warnings: 2,
  errors: 0,
  skipped: 1,
  results: [
    { id: 'chk-1', name: 'Title exists', status: 'passed', severity: 'error', selector: 'title', assertion: { type: 'exists' } },
    { id: 'chk-2', name: 'Description exists', status: 'passed', severity: 'error', selector: 'meta[name="description"]', assertion: { type: 'exists' } },
    { id: 'chk-3', name: 'Description length ok', status: 'failed', severity: 'warning', selector: 'meta[name="description"]', assertion: { type: 'emptyAttributeCountEquals', attribute: 'content', value: 0 }, message: 'Description is 178 chars, recommended max is 160.' },
    { id: 'chk-4', name: 'Canonical URL set', status: 'passed', severity: 'warning', selector: 'link[rel="canonical"]', assertion: { type: 'exists' } },
    { id: 'chk-5', name: 'OG title present', status: 'passed', severity: 'warning', selector: 'meta[property="og:title"]', assertion: { type: 'exists' } },
    { id: 'chk-6', name: 'OG description present', status: 'failed', severity: 'warning', selector: 'meta[property="og:description"]', assertion: { type: 'exists' }, message: 'OG description is missing or empty.' },
    { id: 'chk-7', name: 'Twitter card defined', status: 'skipped', severity: 'info', selector: 'meta[name="twitter:card"]', assertion: { type: 'exists' } },
  ],
};

const withErrors: RecipeChecksResult = {
  status: 'error',
  passed: 2,
  warnings: 1,
  errors: 3,
  skipped: 0,
  results: [
    { id: 'chk-1', name: 'Title exists', status: 'passed', severity: 'error', selector: 'title', assertion: { type: 'exists' } },
    { id: 'chk-2', name: 'Description missing', status: 'failed', severity: 'error', selector: 'meta[name="description"]', assertion: { type: 'exists' }, message: 'No meta description tag found.' },
    { id: 'chk-3', name: 'Description length ok', status: 'skipped', severity: 'warning', selector: 'meta[name="description"]', assertion: { type: 'emptyAttributeCountEquals', attribute: 'content', value: 0 } },
    { id: 'chk-4', name: 'Canonical URL set', status: 'failed', severity: 'error', selector: 'link[rel="canonical"]', assertion: { type: 'exists' }, message: 'No canonical link found.' },
    { id: 'chk-5', name: 'OG title present', status: 'passed', severity: 'warning', selector: 'meta[property="og:title"]', assertion: { type: 'exists' } },
    { id: 'chk-6', name: 'OG description present', status: 'failed', severity: 'error', selector: 'meta[property="og:description"]', assertion: { type: 'exists' }, message: 'Open Graph tags are missing entirely.' },
    { id: 'chk-7', name: 'Twitter card defined', status: 'failed', severity: 'warning', selector: 'meta[name="twitter:card"]', assertion: { type: 'exists' }, message: 'Defaulting to summary; consider using summary_large_image.' },
  ],
};

const meta = {
  title: 'Results/ChecksSummary',
  component: ChecksSummary,
  tags: ['autodocs'],
  argTypes: {
    compact: { control: 'boolean' },
    showAllResults: { control: 'boolean' },
    expandable: { control: 'boolean' },
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ChecksSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoChecks: Story = {
  args: { checks: noChecks },
};

export const AllPassed: Story = {
  args: { checks: allPassed, showAllResults: true },
};

export const WithWarnings: Story = {
  args: { checks: withWarnings, showAllResults: true },
};

export const WithErrors: Story = {
  args: { checks: withErrors, showAllResults: true },
};

export const CompactSummary: Story = {
  render: () => ({
    components: { ChecksSummary },
    setup: () => ({ allPassed, withWarnings, withErrors }),
    template: `
      <div class="flex flex-col gap-3">
        <ChecksSummary :checks="allPassed" :compact="true" />
        <ChecksSummary :checks="withWarnings" :compact="true" />
        <ChecksSummary :checks="withErrors" :compact="true" />
      </div>
    `,
  }),
};

export const Expandable: Story = {
  args: { checks: withWarnings, expandable: true },
};
