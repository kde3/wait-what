import { InputGroup as HeroInputGroup } from '@heroui/react';
import { createUIComponent } from './base';

// input.tsx와 동일하게 색은 HeroUI 필드 토큰에 맡긴다.
const InputGroupRoot = createUIComponent(HeroInputGroup, [
  'transition-[border-color,box-shadow]',
  'duration-200',
]);

const InputGroupInput = createUIComponent(HeroInputGroup.Input, []);

export const InputGroup = Object.assign(InputGroupRoot, {
  Input: InputGroupInput,
  Prefix: HeroInputGroup.Prefix,
  Suffix: HeroInputGroup.Suffix,
});
