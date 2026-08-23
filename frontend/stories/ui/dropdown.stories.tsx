import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Moon, Sun, Monitor } from 'pixelarticons/react';
import { Button } from '../../components/ui/button';
import { Dropdown } from '../../components/ui/dropdown';

const THEMES = [
  { id: 'light', Icon: Sun, label: '라이트' },
  { id: 'dark', Icon: Moon, label: '다크' },
  { id: 'system', Icon: Monitor, label: '시스템' },
];

const meta = {
  title: 'UI/Dropdown',
  component: Dropdown,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <main className="grid min-h-[320px] w-[min(92vw,420px)] place-items-start p-10">
        <Story />
      </main>
    ),
  ],
  args: { children: null },
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const IconTrigger: Story = {
  render: function IconTriggerStory() {
    const [theme, setTheme] = useState('dark');
    const Current = THEMES.find(({ id }) => id === theme)?.Icon ?? Monitor;

    return (
      <Dropdown>
        <Button isIconOnly variant="tertiary" aria-label="화면 테마">
          <Current className="size-5" aria-hidden="true" />
        </Button>
        <Dropdown.Popover>
          <Dropdown.Menu aria-label="화면 테마" selectedKey={theme} onSelect={setTheme}>
            {THEMES.map(({ id, Icon, label }) => (
              <Dropdown.Item key={id} id={id} textValue={label}>
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {label}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    );
  },
};

export const TextTrigger: Story = {
  render: function TextTriggerStory() {
    const [action, setAction] = useState('');

    return (
      <div className="space-y-3">
        <Dropdown>
          <Button variant="secondary">더 보기</Button>
          <Dropdown.Popover>
            <Dropdown.Menu aria-label="더 보기" onSelect={setAction}>
              <Dropdown.Item id="invite" textValue="초대하기">초대하기</Dropdown.Item>
              <Dropdown.Item id="rename" textValue="방 이름 변경">방 이름 변경</Dropdown.Item>
              <Dropdown.Item id="leave" textValue="방 나가기">방 나가기</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
        <p className="text-sm text-muted">선택: {action || '없음'}</p>
      </div>
    );
  },
};
