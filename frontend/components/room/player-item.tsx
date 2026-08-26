'use client';

import { Crown } from 'pixelarticons/react';
import { useI18n } from '../i18n-provider';
import type { Player } from '../../types/room';

export function PlayerItem({ player }: { player: Player }) {
  const { t } = useI18n();
  return (
    <li className="flex min-w-0 items-center gap-2 rounded-lg border bg-surface px-3 py-2 text-sm">
      {player.isHost && <Crown className="size-4 shrink-0 text-warning" aria-label={t('host')} />}
      <span className="min-w-0 break-words">
        {player.nickname}
        {player.you && ` (${t('you')})`}
      </span>
    </li>
  );
}

export default PlayerItem;
