'use client';

import { useI18n } from '../i18n-provider';

export function SubmittedNotice() {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 rounded-lg border bg-surface-secondary px-3 py-2 text-sm text-muted">
      <span className="size-3 shrink-0 animate-spin rounded-full border-2 border-muted border-t-primary" aria-hidden="true" />
      <span>
        <b className="text-foreground">{t('submitted')}</b> {t('waitingOthers')}
      </span>
    </div>
  );
}

export default SubmittedNotice;
