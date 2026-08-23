'use client';

import type { ComponentType, SVGProps } from 'react';
import { Button } from '../ui/button';

interface ModeButtonProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  description: string;
  isSelected?: boolean;
  isDisabled?: boolean;
  onPress?: () => void;
}

/**
 * 게임 모드 선택 타일. 일반 버튼과 달리 아이콘·제목·설명이 세로로 쌓이고,
 * 선택 상태를 variant로 드러낸다.
 */
export function ModeButton({
  icon: Icon,
  label,
  description,
  isSelected = false,
  isDisabled = false,
  onPress,
}: ModeButtonProps) {
  return (
    <Button
      variant={isSelected ? 'primary' : 'outline'}
      className="h-auto min-h-24 w-full flex-col items-start gap-1 whitespace-normal p-3 text-left"
      onClick={onPress}
      isDisabled={isDisabled}
    >
      <span className="flex items-center gap-2">
        {/* 선택되면 버튼 전경색(흰색)을 따라가고, 평소엔 브랜드 옥색으로 포인트를 준다. */}
        <Icon
          className={isSelected ? 'size-5' : 'size-5 text-[var(--palette-secondary)]'}
          aria-hidden="true"
        />
        <span className="font-medium">{label}</span>
      </span>
      <span className="text-xs text-muted">{description}</span>
    </Button>
  );
}
