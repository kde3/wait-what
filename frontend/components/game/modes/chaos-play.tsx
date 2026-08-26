'use client';

import type { ComponentProps } from 'react';
import { useI18n } from '../../i18n-provider';
import type { ChaosCharacterId } from '../../../lib/chaos';
import { ChaosCharacter } from '../chaos-character';
import { ChaosReveal } from '../chaos-reveal';
import { ClassicPlay } from './classic-play';

export function ChaosPlay({ state, playerId, api, busy, error }: ComponentProps<typeof ClassicPlay>) {
  const { t } = useI18n();
  const character = state.game.chaosCharacterId as ChaosCharacterId;

  if (state.game.phase === 'reveal') return <ChaosReveal character={character} />;

  return (
    <>
      <aside className="flex items-center justify-between gap-3 rounded-xl border bg-surface px-4 py-3 shadow-sm">
        <ChaosCharacter character={character} size="small" state="active" />
        <span className="shrink-0 font-mono text-xs font-bold tracking-[0.14em] text-danger">{t('chaosActive')}</span>
      </aside>
      <ClassicPlay state={state} playerId={playerId} api={api} busy={busy} error={error} />
    </>
  );
}

export default ChaosPlay;
