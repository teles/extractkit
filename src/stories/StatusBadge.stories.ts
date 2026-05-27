import type { Meta, StoryObj } from '@storybook/vue3';
import StatusBadge from '../sidepanel/components/StatusBadge.vue';

const meta = {
  title: 'Primitives/StatusBadge',
  component: StatusBadge,
  tags: ['autodocs'],
  argTypes: {
    status: { control: 'radio', options: ['success', 'partial', 'error'] },
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = { args: { status: 'success' } };
export const Partial: Story = { args: { status: 'partial' } };
export const Error: Story = { args: { status: 'error' } };

export const AllStatuses: Story = {
  args: { status: 'success' },
  render: () => ({
    components: { StatusBadge },
    template: `
      <div class="flex gap-2">
        <StatusBadge status="success" />
        <StatusBadge status="partial" />
        <StatusBadge status="error" />
      </div>
    `,
  }),
};
