import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { OptionSelect } from '../../components/ui/option-select';

const DIFFICULTIES = [
  { id: 'easy', label: '쉬움' },
  { id: 'normal', label: '보통' },
  { id: 'hard', label: '어려움' },
];

const SECONDS = [20, 30, 45, 60, 90, 120].map((value) => ({ id: String(value), label: `${value}초` }));

const PLAYERS = [
  { id: '0', label: '익명 방장' },
  { id: '1', label: '그림 고양이' },
  { id: '2', label: '초록 로봇' },
];

const meta = {
  title: 'UI/Option Select',
  component: OptionSelect,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <main className="grid min-h-[320px] w-[min(92vw,420px)] place-items-start p-10">
        <Story />
      </main>
    ),
  ],
  args: { value: 'normal', items: DIFFICULTIES, onChange: () => undefined },
} satisfies Meta<typeof OptionSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

function Controlled({ items, initial, ...props }: { items: typeof DIFFICULTIES; initial: string; className?: string; isDisabled?: boolean }) {
  const [value, setValue] = useState(initial);
  return <OptionSelect value={value} items={items} onChange={setValue} aria-label="옵션" className="w-28" {...props} />;
}

export const Difficulty: Story = {
  render: () => <Controlled items={DIFFICULTIES} initial="normal" />,
};

export const Seconds: Story = {
  render: () => <Controlled items={SECONDS} initial="45" className="w-24" />,
};

export const Players: Story = {
  render: () => <Controlled items={PLAYERS} initial="0" className="w-32" />,
};

export const Disabled: Story = {
  render: () => <Controlled items={DIFFICULTIES} initial="normal" isDisabled />,
};
