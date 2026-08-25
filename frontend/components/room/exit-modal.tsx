'use client';

import { Modal } from '@heroui/react';
import { Button } from '../ui/button';
import { useI18n } from '../i18n-provider';

export function ExitModal({ isOpen, title, message, onGoHome }: any) {
  const { t } = useI18n();
  return (
    <Modal.Backdrop isOpen={isOpen} isDismissable={false}>
      <Modal.Container size="sm" placement="center">
        <Modal.Dialog>
          <Modal.Header><Modal.Heading>{title}</Modal.Heading></Modal.Header>
          <Modal.Body>
            <p className="text-sm text-muted">{message}</p>
          </Modal.Body>
          <Modal.Footer>
            <Button className="w-full" onClick={onGoHome}>{t('goHome')}</Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
