import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PromptInput } from '../../components/ui/prompt-input';

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
    onMicrophone: () => undefined,
  },
} satisfies Meta<typeof PromptInput>;

export default meta;
type Story = StoryObj<typeof meta>;

function ControlledPromptInput({ initialValue = '', disabled = false, initiallyGenerating = false }) {
  const [value, setValue] = useState(initialValue);
  const [isGenerating, setIsGenerating] = useState(initiallyGenerating);
  return (
    <PromptInput
      value={value}
      disabled={disabled}
      isGenerating={isGenerating}
      onChange={setValue}
      onCancel={() => setIsGenerating(false)}
      onMicrophone={() => setValue((current) => `${current}${current ? ' ' : ''}달에서 라면을 먹는 고양이`)}
      onSubmit={() => setIsGenerating(true)}
    />
  );
}

export const Default: Story = {
  render: () => <ControlledPromptInput />,
};

export const Filled: Story = {
  render: () => <ControlledPromptInput initialValue="우주복을 입은 고양이가 달 표면에서 라면을 맛있게 먹는 모습" />,
};

export const Generating: Story = {
  render: () => <ControlledPromptInput initiallyGenerating />,
};
