import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ImagePromptInput } from '../../components/game/image-prompt-input';

const meta = {
  title: 'Game/Image Prompt Input',
  component: ImagePromptInput,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <main className="min-h-screen w-full px-4 py-12">
        <div className="mx-auto w-full max-w-[714px]">
          <Story />
        </div>
      </main>
    ),
  ],
  args: {
    value: '',
    onChange: () => undefined,
    onSubmit: () => undefined,
    onCancel: () => undefined,
  },
} satisfies Meta<typeof ImagePromptInput>;

export default meta;
type Story = StoryObj<typeof meta>;

function ControlledImagePromptInput({
  initialValue = '',
  disabled = false,
  initiallyPending = false,
}) {
  const [value, setValue] = useState(initialValue);
  const [isPending, setIsPending] = useState(initiallyPending);
  return (
    <ImagePromptInput
      value={value}
      disabled={disabled}
      isPending={isPending}
      onChange={setValue}
      onCancel={() => setIsPending(false)}
      onSubmit={() => setIsPending(true)}
    />
  );
}

export const Default: Story = {
  render: () => <ControlledImagePromptInput />,
};

export const Filled: Story = {
  render: () => (
    <ControlledImagePromptInput initialValue="우주복을 입은 고양이가 달 표면에서 라면을 맛있게 먹는 모습" />
  ),
};

export const Generating: Story = {
  render: () => <ControlledImagePromptInput initiallyPending />,
};
