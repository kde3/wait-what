'use client';

import { useI18n } from '../i18n-provider';
import { StatusBanner } from '../ui/status-banner';

export function SubmittedNotice() {
  const { t } = useI18n();
  return (
    <StatusBanner>
      <span>
        <b className="text-foreground">{t('submitted')}</b> {t('waitingOthers')}
      </span>
    </StatusBanner>
  );
}

export default SubmittedNotice;
