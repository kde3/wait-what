import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Attachment } from 'pixelarticons/react';
import { PromptInput } from '../../components/ui/prompt-input';
import { Button } from '../../components/ui/button';

const meta = {
  title: 'UI/Prompt Input',
  component: PromptInput,
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
} satisfies Meta<typeof PromptInput>;

export default meta;
type Story = StoryObj<typeof meta>;

function ControlledPromptInput({
  initialValue = '',
  disabled = false,
  initiallyPending = false,
  ...props
}: Partial<React.ComponentProps<typeof PromptInput>> & {
  initialValue?: string;
  initiallyPending?: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const [isPending, setIsPending] = useState(initiallyPending);
  return (
    <PromptInput
      value={value}
      disabled={disabled}
      isPending={isPending}
      onChange={setValue}
      onCancel={() => setIsPending(false)}
      onSubmit={() => setIsPending(true)}
      {...props}
    />
  );
}

export const Default: Story = {
  render: () => <ControlledPromptInput />,
};

export const Filled: Story = {
  render: () => (
    <ControlledPromptInput initialValue="A cat in a spacesuit eating ramen on the moon" />
  ),
};

export const Pending: Story = {
  render: () => <ControlledPromptInput initiallyPending />,
};

// maxLength를 주면 글자수 카운터가 함께 나온다.
export const WithCounter: Story = {
  render: () => <ControlledPromptInput maxLength={200} />,
};

// actions 슬롯에는 마이크 말고 무엇이든 꽂을 수 있다.
export const WithActions: Story = {
  render: () => (
    <ControlledPromptInput
      maxLength={200}
      actions={
        <Button isIconOnly type="button" variant="tertiary" aria-label="Attach a file">
          <Attachment className="size-4" aria-hidden="true" />
        </Button>
      }
    />
  ),
};
