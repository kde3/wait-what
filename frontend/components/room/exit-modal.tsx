'use client';

import { Modal } from '@heroui/react';
import { Button } from '../ui/button';
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
    <Modal.Backdrop isOpen={isOpen} isDismissable={false}>
      <Modal.Container size="sm" placement="center">
        <Modal.Dialog>
          <Modal.Header><Modal.Heading>{t(keys.title)}</Modal.Heading></Modal.Header>
          <Modal.Body>
            <p className="text-sm text-muted">{t(keys.message)}</p>
          </Modal.Body>
          <Modal.Footer>
            <Button className="w-full" onClick={onGoHome}>{t('goHome')}</Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

export default ExitModal;
