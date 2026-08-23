import type { Meta, StoryObj } from '@storybook/react';
import { Search } from 'pixelarticons/react';
import { InputGroup } from '../../components/ui/input-group';

const meta = {
  title: 'UI/Input Group',
  component: InputGroup,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <main className="min-h-[320px] w-[min(92vw,560px)] p-10">
        <Story />
      </main>
    ),
  ],
} satisfies Meta<typeof InputGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <InputGroup fullWidth>
      <InputGroup.Prefix>
        <Search className="size-4 text-[var(--palette-text-secondary)]" aria-hidden="true" />
      </InputGroup.Prefix>
      <InputGroup.Input aria-label="방 찾기" placeholder="방 이름을 검색하세요" />
      <InputGroup.Suffix className="text-xs font-bold text-[var(--palette-text-secondary)]">
        검색
      </InputGroup.Suffix>
    </InputGroup>
  ),
};

export const InviteCode: Story = {
  render: () => (
    <InputGroup fullWidth>
      <InputGroup.Prefix className="text-sm text-[var(--palette-text-secondary)]">코드</InputGroup.Prefix>
      <InputGroup.Input aria-label="초대 코드" defaultValue="PLAY" />
    </InputGroup>
  ),
};
