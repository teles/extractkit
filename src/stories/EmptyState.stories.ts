import type { Meta, StoryObj } from '@storybook/vue3';
import EmptyState from '../sidepanel/components/EmptyState.vue';
import Button from '../sidepanel/components/Button.vue';

const meta = {
  title: 'Primitives/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    compact: { control: 'boolean' },
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TitleOnly: Story = {
  args: { title: 'No recipes found' },
};

export const WithDescription: Story = {
  args: {
    title: 'No runs yet',
    description: 'Run a recipe on any page to see results here.',
  },
};

export const WithAction: Story = {
  args: { title: 'No recipes found' },
  render: () => ({
    components: { EmptyState, Button },
    template: `
      <EmptyState
        title="No recipes found"
        description="Add your first recipe to start extracting data from pages."
      >
        <template #action>
          <Button variant="primary" size="sm">Add recipe</Button>
        </template>
      </EmptyState>
    `,
  }),
};

export const Compact: Story = {
  args: {
    title: 'No results',
    description: 'This recipe produced no data.',
    compact: true,
  },
};
