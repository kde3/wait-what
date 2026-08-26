import type { Meta, StoryObj } from '@storybook/react';
import { Modal } from '../../components/ui/modal';
import { Button } from '../../components/ui/button';

const meta = {
  title: 'UI/Modal',
  component: Modal,
  parameters: { layout: 'fullscreen' },
  args: {
    isOpen: true,
    onOpenChange: () => undefined,
    title: '새 방 만들기',
    children: <p className="text-sm text-muted">모달 본문 내용이 여기에 들어갑니다.</p>,
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithFooter: Story = {
  args: {
    footer: (
      <>
        <Button variant="secondary">취소</Button>
        <Button>확인</Button>
      </>
    ),
  },
};

export const WithCloseButton: Story = {
  args: { title: '초대하기', size: 'md', showCloseButton: true },
};

export const NotDismissable: Story = {
  args: {
    title: '방이 사라졌어요',
    isDismissable: false,
    footer: <Button className="w-full">메인으로</Button>,
  },
};
