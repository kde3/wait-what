import type { Meta, StoryObj } from '@storybook/react';
import QrInvite from '../../components/room/qr-invite';

const meta = {
  title: 'UI/QrInvite',
  component: QrInvite,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <main className="grid min-h-[320px] w-[min(92vw,620px)] place-items-center p-10">
        <Story />
      </main>
    ),
  ],
  args: {
    url: 'https://waitwhat.example/room/AB12',
    size: 240,
  },
} satisfies Meta<typeof QrInvite>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = {
  args: { size: 120 },
};

export const LongUrl: Story = {
  args: {
    url: 'https://waitwhat.example/room/AB12?player=01H9XK2M4QZ8&invite=classic-relay-session',
  },
};
