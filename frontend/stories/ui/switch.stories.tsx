import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from '../../components/ui/switch';

const meta = {
  title: 'UI/Switch',
  component: Switch,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <main className="grid min-h-[200px] w-[min(92vw,420px)] place-items-center p-10">
        <Story />
      </main>
    ),
  ],
  args: { 'aria-label': '팀 모드' },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

function Controlled(props: { isDisabled?: boolean; initial?: boolean }) {
  const [selected, setSelected] = useState(props.initial ?? false);
  return <Switch isSelected={selected} isDisabled={props.isDisabled} onChange={setSelected} aria-label="팀 모드" />;
}

export const Default: Story = {
  render: () => <Controlled />,
};

export const On: Story = {
  render: () => <Controlled initial />,
};

export const Disabled: Story = {
  render: () => <Controlled isDisabled />,
};

export const InOptionRow: Story = {
  render: () => (
    <label className="flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-sm">
      <span>팀 모드</span>
      <Controlled />
    </label>
  ),
};
