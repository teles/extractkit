import type { Meta, StoryObj } from '@storybook/vue3';
import ValidationSummary from '../sidepanel/components/ValidationSummary.vue';
import type { OutputValidationResult } from '../shared/types';

const passed: OutputValidationResult = {
  status: 'valid',
  issues: [],
};

const failed: OutputValidationResult = {
  status: 'invalid',
  issues: [
    { path: 'images[1].alt', message: 'Expected string, received null', keyword: 'type' },
    { path: 'images[3].alt', message: 'Expected string, received null', keyword: 'type' },
    { path: 'images[4].width', message: 'Expected string, received null', keyword: 'type' },
    { path: 'images[4].height', message: 'Expected string, received null', keyword: 'type' },
  ],
};

const skipped: OutputValidationResult = {
  status: 'skipped',
  issues: [],
};

const meta = {
  title: 'Results/ValidationSummary',
  component: ValidationSummary,
  tags: ['autodocs'],
  argTypes: {
    compact: { control: 'boolean' },
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ValidationSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Valid: Story = { args: { validation: passed } };
export const Invalid: Story = { args: { validation: failed } };
export const Skipped: Story = { args: { validation: skipped } };
export const NoValidation: Story = { args: { validation: undefined } };

export const AllStatuses: Story = {
  render: () => ({
    components: { ValidationSummary },
    setup: () => ({ passed, failed, skipped }),
    template: `
      <div class="flex flex-col gap-4">
        <div>
          <p class="text-xs text-zinc-400 mb-1">valid</p>
          <ValidationSummary :validation="passed" />
        </div>
        <div>
          <p class="text-xs text-zinc-400 mb-1">invalid</p>
          <ValidationSummary :validation="failed" />
        </div>
        <div>
          <p class="text-xs text-zinc-400 mb-1">skipped</p>
          <ValidationSummary :validation="skipped" />
        </div>
      </div>
    `,
  }),
};

export const CompactInvalid: Story = {
  args: { validation: failed, compact: true },
};
