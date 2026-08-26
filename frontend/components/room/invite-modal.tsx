'use client';

import { Input } from '@heroui/react';
import { Button } from '../ui/button';
import { Modal } from '../ui/modal';
import { Copy } from 'pixelarticons/react';
import { useI18n } from '../i18n-provider';
import QrInvite from './qr-invite';

export function InviteModal({ code, url, isOpen, copied, onOpenChange, onCopy }: any) {
  const { t } = useI18n();
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={t('inviteTitle')}
      size="md"
      showCloseButton
      dialogClassName="sm:max-w-xl"
    >
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
    </Modal>
  );
}
