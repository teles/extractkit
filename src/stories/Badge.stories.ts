import type { Meta, StoryObj } from '@storybook/vue3';
import Badge from '../sidepanel/components/Badge.vue';

const meta = {
  title: 'Primitives/Badge',
  component: Badge,
  tags: ['autodocs'],
  args: { default: 'Label' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['neutral', 'primary', 'info', 'success', 'warning', 'danger', 'accent', 'category', 'dark']
    },
    size: { control: 'radio', options: ['xs', 'sm'] }
  },
  parameters: { layout: 'padded' }
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { variant: 'neutral', size: 'xs' },
  render: (args: Record<string, unknown>) => ({
    components: { Badge },
    setup: () => ({ args }),
    template: `<Badge v-bind="args">{{ args.default }}</Badge>`
  })
};

export const AllVariants: Story = {
  render: () => ({
    components: { Badge },
    template: `
      <div class="flex flex-wrap gap-2">
        <Badge variant="neutral">Neutral</Badge>
        <Badge variant="primary">Primary</Badge>
        <Badge variant="info">Info</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="danger">Danger</Badge>
        <Badge variant="accent">Accent</Badge>
        <Badge variant="category">Category</Badge>
        <Badge variant="dark">Dark</Badge>
      </div>
    `
  })
};

export const BothSizes: Story = {
  render: () => ({
    components: { Badge },
    template: `
      <div class="flex flex-wrap items-center gap-2">
        <Badge variant="success" size="xs">xs — Success</Badge>
        <Badge variant="success" size="sm">sm — Success</Badge>
        <Badge variant="warning" size="xs">xs — Warning</Badge>
        <Badge variant="warning" size="sm">sm — Warning</Badge>
      </div>
    `
  })
};
