'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { ArrowUp, Microphone, Square } from '@gravity-ui/icons';
import { Button } from '@heroui/react';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  onMicrophone?: () => void;
  microphoneSlot?: ReactNode;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  isGenerating?: boolean;
}

export function PromptInput({
  value,
  onChange,
  onSubmit,
  onCancel,
  onMicrophone,
  microphoneSlot,
  placeholder = '어떤 그림을 만들고 싶은지 입력하세요',
  maxLength = 200,
  disabled = false,
  isGenerating = false,
}: PromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSubmit = Boolean(value.trim()) && !disabled;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = '0px';
    textarea.style.height = `${Math.max(56, textarea.scrollHeight)}px`;
  }, [value]);

  return (
    <div
      className="w-full rounded-3xl border bg-surface p-3 shadow-sm"
      data-slot="prompt-input"
    >
      <textarea
        ref={textareaRef}
        aria-label="이미지 생성 프롬프트"
        className="block min-h-14 w-full resize-none overflow-hidden border-0 bg-transparent px-2 py-2 text-foreground outline-none placeholder:text-muted focus:border-transparent focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
        disabled={disabled || isGenerating}
        maxLength={maxLength}
        placeholder={placeholder}
        rows={1}
        style={{ resize: 'none', outline: 'none', boxShadow: 'none' }}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && canSubmit) {
            event.preventDefault();
            onSubmit();
          }
        }}
      />

      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="px-2 text-xs tabular-nums text-muted">
          {value.length} / {maxLength}
        </span>
        <div className="flex items-center gap-2">
          {microphoneSlot ?? (
            <Button
              isIconOnly
              type="button"
              variant="tertiary"
              aria-label="음성으로 프롬프트 입력"
              isDisabled={disabled || isGenerating}
              onClick={onMicrophone}
            >
              <Microphone className="size-4" aria-hidden="true" />
            </Button>
          )}
          <Button
            isIconOnly
            type="button"
            aria-label={isGenerating ? '그림 생성 취소' : '프롬프트 제출'}
            isDisabled={!isGenerating && !canSubmit}
            onClick={isGenerating ? onCancel : onSubmit}
          >
            {isGenerating ? (
              <Square className="size-3 fill-current" aria-hidden="true" />
            ) : (
              <ArrowUp className="size-4" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
