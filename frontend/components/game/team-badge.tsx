'use client';

import { useI18n } from '../i18n-provider';

export function TeamBadge({ team }) {
  const { t } = useI18n();
  if (team !== 0 && team !== 1) return null;
  return <span className="inline-flex rounded-full bg-surface-tertiary px-3 py-1 text-xs font-medium text-foreground">{team === 0 ? t('teamA') : t('teamB')}</span>;
}

export default TeamBadge;
