'use client';

import { useI18n } from '../i18n-provider';
import { Button } from '../ui/button';
import { ImagePromptInput } from './image-prompt-input';
import { apiUrl } from '../../lib/backend-url';

// 생성 이미지 미리보기 + 프롬프트 입력 + 제출 버튼
export function PromptPanel({ prompt, setPrompt, imageUrl, generating, busy, locked, onGenerate, onCancelGenerate, onSubmit, onUnsubmit, submitLabel }: any) {
  const { t } = useI18n();
  return (
    <div className="space-y-3">
      {imageUrl && <img className="w-full rounded-lg border object-cover" src={apiUrl(imageUrl)} alt="AI" />}
      <ImagePromptInput
        value={prompt}
        isPending={generating}
        disabled={locked || (busy && !generating)}
        onChange={setPrompt}
        onSubmit={onGenerate}
        onCancel={onCancelGenerate}
      />
      {onSubmit && imageUrl && (
        locked ? (
          <Button variant="outline" className="w-full" onClick={onUnsubmit} isDisabled={busy}>
            {t('cancelSubmit')}
          </Button>
        ) : (
          <Button className="w-full" onClick={onSubmit} isDisabled={busy || generating}>
            {submitLabel ?? t('submitImage')}
          </Button>
        )
      )}
    </div>
  );
}

export default PromptPanel;
