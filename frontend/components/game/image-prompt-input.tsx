'use client';

import { useI18n } from '../i18n-provider';
import { PromptInput } from '../ui/prompt-input';
import MicButton from './mic-button';

const MAX_PROMPT_LENGTH = 200;

interface ImagePromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  disabled?: boolean;
  isPending?: boolean;
}

// 음성 인식 결과는 기존 프롬프트 뒤에 이어 붙이되 길이 제한을 넘지 않게 자른다.
function appendTranscript(current: string, text: string) {
  return (current ? `${current} ${text}` : text).slice(0, MAX_PROMPT_LENGTH);
}

export function ImagePromptInput({
  value,
  onChange,
  onSubmit,
  onCancel,
  disabled = false,
  isPending = false,
}: ImagePromptInputProps) {
  const { t } = useI18n();

  return (
    <PromptInput
      value={value}
      disabled={disabled}
      isPending={isPending}
      maxLength={MAX_PROMPT_LENGTH}
      placeholder={t('promptPlaceholder')}
      onCancel={onCancel}
      onChange={onChange}
      onSubmit={onSubmit}
      actions={
        <MicButton
          disabled={disabled || isPending}
          onText={(text) => onChange(appendTranscript(value, text))}
        />
      }
    />
  );
}
