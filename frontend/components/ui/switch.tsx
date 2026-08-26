'use client';

import type { ComponentProps } from 'react';
import { Switch as HeroSwitch } from '@heroui/react';

// HeroUI Switch는 합성 컴포넌트라 자식을 주지 않으면 빈 span만 남아 화면에 아무것도 안 보인다.
export function Switch(props: Omit<ComponentProps<typeof HeroSwitch>, 'children'>) {
  return (
    <HeroSwitch {...props}>
      <HeroSwitch.Content>
        <HeroSwitch.Control>
          <HeroSwitch.Thumb />
        </HeroSwitch.Control>
      </HeroSwitch.Content>
    </HeroSwitch>
  );
}
