import type { Meta, StoryObj } from '@storybook/react';
import { Tabs } from '../../components/ui/tabs';

const meta = {
  title: 'UI/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <main className="w-[min(92vw,420px)] p-10">
        <Story />
      </main>
    ),
  ],
  // 각 스토리가 render로 트리를 직접 그리므로 children은 자리만 채운다.
  args: { children: null },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 선택 표시(인디케이터)는 흰 알약 + 옥색 링. */
export const TwoTabs: Story = {
  render: () => (
    <Tabs defaultSelectedKey="guest">
      <Tabs.ListContainer>
        <Tabs.List className="grid-cols-2">
          <Tabs.Tab id="guest">
            익명 프로필
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="social">
            소셜 로그인
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
      <Tabs.Panel id="guest" className="pt-4 text-sm">익명 프로필 패널</Tabs.Panel>
      <Tabs.Panel id="social" className="pt-4 text-sm">소셜 로그인 패널</Tabs.Panel>
    </Tabs>
  ),
};

/** 열 개수는 사용처에서 grid-cols-* 로 지정한다. */
export const ThreeTabs: Story = {
  render: () => (
    <Tabs defaultSelectedKey="all">
      <Tabs.ListContainer>
        <Tabs.List className="grid-cols-3">
          {[
            { id: 'all', label: '전체' },
            { id: 'open', label: '공개방' },
            { id: 'mine', label: '내 방' },
          ].map((tab) => (
            <Tabs.Tab key={tab.id} id={tab.id}>
              {tab.label}
              <Tabs.Indicator />
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.ListContainer>
    </Tabs>
  ),
};
