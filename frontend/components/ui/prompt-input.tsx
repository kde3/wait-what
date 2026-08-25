'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { ArrowUp, Square } from 'pixelarticons/react';
import { twMerge } from 'tailwind-merge';
import { Button } from './button';

interface PromptInputLabels {
  input?: string;
  submit?: string;
  cancel?: string;
}

// 도메인·언어 중립 기본값. 번역이 필요하면 쓰는 쪽에서 labels로 덮어쓴다.
const DEFAULT_LABELS: Required<PromptInputLabels> = {
  input: 'Prompt',
  submit: 'Submit prompt',
  cancel: 'Cancel prompt',
};

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  /** 제출 버튼 왼쪽에 붙는 부가 컨트롤 (마이크, 첨부, 모델 선택 등) */
  actions?: ReactNode;
  placeholder?: string;
  /** 주지 않으면 글자수 카운터를 숨긴다. */
  maxLength?: number;
  disabled?: boolean;
  isPending?: boolean;
  labels?: PromptInputLabels;
  className?: string;
}

export function PromptInput({
  value,
  onChange,
  onSubmit,
  onCancel,
  actions,
  placeholder = 'Enter a prompt',
  maxLength,
  disabled = false,
  isPending = false,
  labels,
  className,
}: PromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSubmit = Boolean(value.trim()) && !disabled;
  const label = { ...DEFAULT_LABELS, ...labels };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = '0px';
    textarea.style.height = `${Math.max(56, textarea.scrollHeight)}px`;
  }, [value]);

  return (
    <div
      className={twMerge('w-full rounded-3xl border bg-surface p-3 shadow-sm', className)}
      data-slot="prompt-input"
    >
      <textarea
        ref={textareaRef}
        aria-label={label.input}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        className="block min-h-14 w-full resize-none overflow-hidden border-0 bg-transparent px-2 py-2 text-foreground outline-none placeholder:text-muted focus:border-transparent focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
        disabled={disabled || isPending}
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

      <div
        className={`mt-2 flex items-center gap-3 ${maxLength ? 'justify-between' : 'justify-end'}`}
      >
        {maxLength ? (
          <span className="px-2 text-xs tabular-nums text-muted">
            {value.length} / {maxLength}
          </span>
        ) : null}
        <div className="flex items-center gap-2">
          {actions}
          <Button
            isIconOnly
            type="button"
            aria-label={isPending ? label.cancel : label.submit}
            isDisabled={!isPending && !canSubmit}
            onClick={isPending ? onCancel : onSubmit}
          >
            {isPending ? (
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
