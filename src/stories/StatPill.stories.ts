import type { Meta, StoryObj } from '@storybook/vue3';
import StatPill from '../sidepanel/components/StatPill.vue';

const meta = {
  title: 'Primitives/StatPill',
  component: StatPill,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    value: { control: 'number' }
  },
  parameters: { layout: 'padded' }
} satisfies Meta<typeof StatPill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { label: 'Total runs', value: 47 } };
export const Zero: Story = { args: { label: 'Errors', value: 0 } };

export const RunSummary: Story = {
  args: { label: '', value: 0 },
  render: () => ({
    components: { StatPill },
    template: `
      <div class="grid grid-cols-4 gap-2">
        <StatPill label="Runs" :value="128" />
        <StatPill label="Successful" :value="109" />
        <StatPill label="Warnings" :value="14" />
        <StatPill label="Errors" :value="5" />
      </div>
    `
  })
};
