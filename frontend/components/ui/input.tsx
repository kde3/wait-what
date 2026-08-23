import { Input as HeroInput } from '@heroui/react';
import { createUIComponent } from './base';

// 색·테두리는 HeroUI 필드 토큰(--field-*)을 그대로 쓴다.
// 게임 화면(Classic > First Phrase)의 입력창과 같은 모습이 되도록 별도 지정하지 않는다.
export const Input = createUIComponent(HeroInput, [
  'transition-[border-color,box-shadow]',
  'duration-200',
  'disabled:cursor-not-allowed',
]);
