import type { Meta, StoryObj } from '@storybook/react';
import { Spinner } from '../../components/ui/spinner';

const meta = {
  title: 'UI/Spinner',
  component: Spinner,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <main className="grid min-h-[200px] w-[min(92vw,420px)] place-items-center p-10">
        <Story />
      </main>
    ),
  ],
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <Spinner className="size-3" />
      <Spinner />
      <Spinner className="size-8" />
    </div>
  ),
};

export const CenteredBlock: Story = {
  render: () => (
    <div className="w-full py-8 text-center text-sm text-muted">
      <Spinner className="mx-auto mb-3 block" aria-hidden="true" />
      불러오는 중...
    </div>
  ),
};
