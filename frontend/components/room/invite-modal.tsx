'use client';

import { Input, Modal } from '@heroui/react';
import { Button } from '../ui/button';
import { Copy } from 'pixelarticons/react';
import { useI18n } from '../i18n-provider';
import QrInvite from './qr-invite';

export function InviteModal({ code, url, isOpen, copied, onOpenChange, onCopy }: any) {
  const { t } = useI18n();
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container size="md" placement="center">
        <Modal.Dialog className="sm:max-w-xl">
          <Modal.CloseTrigger />
          <Modal.Header><Modal.Heading>{t('inviteTitle')}</Modal.Heading></Modal.Header>
          <Modal.Body>
            <div className="flex w-full flex-col items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold tracking-[0.2em] text-accent">{code}</p>
              </div>
              <QrInvite url={url} size={240} />
              <div className="flex w-full gap-3">
                <Input aria-label={t('copyLink')} value={url} readOnly tabIndex={-1} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} className="pointer-events-none min-w-0 flex-1 text-sm" />
                <Button className="shrink-0" variant="secondary" onClick={onCopy} aria-label={copied ? t('copied') : t('copyLink')}>
                  <Copy className="size-4" aria-hidden="true" />
                  {copied ? t('copied') : t('copyLink')}
                </Button>
              </div>
            </div>
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
