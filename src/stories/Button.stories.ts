import type { Meta, StoryObj } from '@storybook/vue3';
import { Search } from '@lucide/vue';
import Button from '../sidepanel/components/Button.vue';

const meta = {
  title: 'Primitives/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger'],
    },
    size: { control: 'radio', options: ['xs', 'sm'] },
    block: { control: 'boolean' },
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllVariants: Story = {
  render: () => ({
    components: { Button },
    template: `
      <div class="flex flex-wrap gap-2">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
      </div>
    `,
  }),
};

export const BothSizes: Story = {
  render: () => ({
    components: { Button },
    template: `
      <div class="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="xs">xs button</Button>
        <Button variant="secondary" size="sm">sm button</Button>
        <Button variant="primary" size="xs">xs primary</Button>
        <Button variant="primary" size="sm">sm primary</Button>
      </div>
    `,
  }),
};

export const WithIcon: Story = {
  render: () => ({
    components: { Button, Search },
    template: `
      <div class="flex flex-wrap gap-2">
        <Button size="xs">
          <Search class="h-3.5 w-3.5" />
          Search
        </Button>
        <Button size="sm" variant="primary">
          <Search class="h-4 w-4" />
          Search
        </Button>
      </div>
    `,
  }),
};

export const Disabled: Story = {
  render: () => ({
    components: { Button },
    template: `
      <div class="flex flex-wrap gap-2">
        <Button disabled variant="primary">Primary</Button>
        <Button disabled variant="secondary">Secondary</Button>
        <Button disabled variant="ghost">Ghost</Button>
        <Button disabled variant="danger">Danger</Button>
      </div>
    `,
  }),
};

export const BlockLayout: Story = {
  render: () => ({
    components: { Button },
    template: `
      <div class="flex flex-col gap-2 w-64">
        <Button block variant="primary">Block primary</Button>
        <Button block variant="secondary">Block secondary</Button>
      </div>
    `,
  }),
};
