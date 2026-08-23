import type { Meta, StoryObj } from '@storybook/react';
import { Phone, Zap, Users } from 'pixelarticons/react';
import { ModeButton } from '../../components/room/mode-button';

const meta = {
  title: 'UI/ModeButton',
  component: ModeButton,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <main className="grid w-[min(92vw,260px)] p-10">
        <Story />
      </main>
    ),
  ],
  args: {
    icon: Phone,
    label: '클래식',
    description: '제시어를 그림으로, 그림을 다시 제시어로',
  },
} satisfies Meta<typeof ModeButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unselected: Story = {};

export const Selected: Story = {
  args: { isSelected: true },
};

export const Disabled: Story = {
  args: { isDisabled: true },
};

/** 실제 로비처럼 여러 개를 격자로 놓았을 때 */
export const InGrid: Story = {
  decorators: [
    (Story) => (
      <main className="w-[min(92vw,560px)] p-10">
        <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-2 md:grid-cols-[repeat(3,minmax(0,1fr))]">
          <Story />
        </div>
      </main>
    ),
  ],
  render: (args) => (
    <>
      <ModeButton {...args} isSelected />
      <ModeButton {...args} icon={Zap} label="스피드" description="제한 시간 안에 빠르게 맞히기" />
      <ModeButton {...args} icon={Users} label="협동" description="다 같이 한 장을 완성하기" />
    </>
  ),
};
