import type { Meta, StoryObj } from '@storybook/react';
import { ProfileAvatar } from '../../components/home/profile-avatar';

const CHARACTERS = [
  'blueberry',
  'cherry',
  'grape',
  'green-apple',
  'peach',
  'pineapple',
  'strawberry',
  'tangerine',
];

const meta = {
  title: 'Home/Profile Avatar',
  component: ProfileAvatar,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <main className="grid min-h-[200px] w-[min(92vw,620px)] place-items-center p-10">
        <Story />
      </main>
    ),
  ],
  args: {
    nickname: '익명',
  },
} satisfies Meta<typeof ProfileAvatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Large: Story = {
  args: {
    className: 'size-28 border-4 border-[var(--palette-border-accent-soft)] bg-surface-tertiary',
  },
};

export const Small: Story = {
  args: { className: 'size-8' },
};

export const AllCharacters: Story = {
  render: (args) => (
    <div className="flex flex-wrap justify-center gap-4">
      {CHARACTERS.map((name) => (
        <div key={name} className="flex flex-col items-center gap-1">
          <ProfileAvatar {...args} imageUrl={`/images/characters/${name}.png`} className="size-16" />
          <span className="text-xs text-muted">{name}</span>
        </div>
      ))}
    </div>
  ),
};
