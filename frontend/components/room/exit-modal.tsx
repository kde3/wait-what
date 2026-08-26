'use client';

import { Button } from '../ui/button';
import { Modal } from '../ui/modal';
import { useI18n } from '../i18n-provider';

const REASON_KEYS = {
  gone: { title: 'roomGoneTitle', message: 'errRoomNotFound' },
  disconnected: { title: 'disconnectedTitle', message: 'errDisconnected' },
  dropped: { title: 'droppedTitle', message: 'errDropped' },
} as const;

export type ExitReason = keyof typeof REASON_KEYS;

export function ExitModal({ isOpen = true, reason, onGoHome }: { isOpen?: boolean; reason: ExitReason; onGoHome?: () => void }) {
  const { t } = useI18n();
  const keys = REASON_KEYS[reason] ?? REASON_KEYS.gone;
  return (
    <Modal
      isOpen={isOpen}
      isDismissable={false}
      title={t(keys.title)}
      footer={<Button className="w-full" onClick={onGoHome}>{t('goHome')}</Button>}
    >
      <p className="text-sm text-muted">{t(keys.message)}</p>
    </Modal>
  );
}

export default ExitModal;
