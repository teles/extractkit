import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import type { DefineComponent } from 'vue';
import SegmentedControl from '../sidepanel/components/SegmentedControl.vue';

const meta = {
  title: 'Primitives/SegmentedControl',
  // Cast needed: vue-tsc can't infer Meta<> for generic components.
  component: SegmentedControl as unknown as DefineComponent,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoOptions: Story = {
  render: () => ({
    components: { SegmentedControl },
    setup() {
      const active = ref('readable');
      const options = [
        { value: 'readable', label: 'Readable' },
        { value: 'json', label: 'JSON' },
      ];
      return { active, options };
    },
    template: `<SegmentedControl v-model="active" :options="options" />`,
  }),
};

export const ThreeOptions: Story = {
  render: () => ({
    components: { SegmentedControl },
    setup() {
      const active = ref('readable');
      const options = [
        { value: 'readable', label: 'Readable' },
        { value: 'json', label: 'JSON' },
        { value: 'checks', label: 'Checks' },
      ];
      return { active, options };
    },
    template: `<SegmentedControl v-model="active" :options="options" />`,
  }),
};

export const FourOptions: Story = {
  render: () => ({
    components: { SegmentedControl },
    setup() {
      const active = ref('all');
      const options = [
        { value: 'all', label: 'All' },
        { value: 'passed', label: 'Passed' },
        { value: 'warnings', label: 'Warnings' },
        { value: 'errors', label: 'Errors' },
      ];
      return { active, options };
    },
    template: `<SegmentedControl v-model="active" :options="options" />`,
  }),
};
