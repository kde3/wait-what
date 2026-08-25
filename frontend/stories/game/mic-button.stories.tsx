import type { Meta, StoryObj } from '@storybook/react';
import MicButton from '../../components/game/mic-button';

const meta = {
  title: 'Game/Mic Button',
  component: MicButton,
  decorators: [(Story) => <div className="p-6"><Story /></div>],
  args: { onText: () => undefined, disabled: false },
} satisfies Meta<typeof MicButton>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
