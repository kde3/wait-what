import type { Meta, StoryObj } from '@storybook/react';
import { GuessPanel } from '../../components/game/guess-panel';

const guesses = [
  { nickname: '초록 로봇', text: '배', correct: false },
  { nickname: '익명 방장', text: '유령선', correct: false },
  { nickname: '그림 고양이', text: '해적선', correct: true },
];

const meta = {
  title: 'Game/Guess Panel',
  component: GuessPanel,
  decorators: [(Story) => <div className="mx-auto max-w-xl p-6"><Story /></div>],
  args: {
    guesses: [],
    onGuess: async () => undefined,
    disabled: false,
    busy: false,
  },
} satisfies Meta<typeof GuessPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const WithGuesses: Story = { args: { guesses } };
export const CorrectAnswer: Story = { args: { guesses } };

// 출제자는 입력창 없이 피드만 본다
export const DrawerView: Story = { args: { guesses, disabled: true } };
