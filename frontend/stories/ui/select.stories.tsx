import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Select } from '../../components/ui/select';

const LANGS = [
  { id: 'ko', label: '한국어' },
  { id: 'en', label: 'English' },
  { id: 'ja', label: '日本語' },
  { id: 'zh', label: '中文' },
];

const meta = {
  title: 'UI/Select',
  component: Select,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <main className="grid min-h-[320px] w-[min(92vw,420px)] place-items-start p-10">
        <Story />
      </main>
    ),
  ],
  args: { children: null },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

function LangSelect(props: { className?: string; isDisabled?: boolean; placeholder?: string }) {
  const [lang, setLang] = useState('ko');

  return (
    <Select
      value={lang}
      onChange={(value) => setLang(String(value))}
      aria-label="언어"
      className="w-28"
      {...props}
    >
      {LANGS.map(({ id, label }) => (
        <Select.Item key={id} id={id} textValue={label}>
          {label}
        </Select.Item>
      ))}
    </Select>
  );
}

export const Default: Story = {
  render: () => <LangSelect />,
};

export const FullWidth: Story = {
  render: () => <LangSelect className="w-full" />,
};

export const Disabled: Story = {
  render: () => <LangSelect isDisabled />,
};

export const CustomTrigger: Story = {
  render: function CustomTriggerStory() {
    const [value, setValue] = useState('30');

    return (
      <Select.Root value={value} onChange={(next) => setValue(String(next))} aria-label="시간" className="w-40">
        <Select.Trigger className="justify-between">
          <Select.Value />
        </Select.Trigger>
        <Select.Options>
          {['20', '30', '45', '60'].map((seconds) => (
            <Select.Item key={seconds} id={seconds} textValue={`${seconds}초`}>
              {seconds}초
            </Select.Item>
          ))}
        </Select.Options>
      </Select.Root>
    );
  },
};
