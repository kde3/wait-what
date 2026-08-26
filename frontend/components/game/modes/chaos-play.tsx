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
  const activeCharacter = state.game.activeChaosCharacterId as ChaosCharacterId | null;

  if (state.game.phase === 'reveal') return <ChaosReveal character={character} />;

  return (
    <>
      {character === 'null' ? (
        <aside className="space-y-3 rounded-xl border bg-surface px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <ChaosCharacter character="null" size="small" state="active" />
            <span className="shrink-0 font-mono text-xs font-bold tracking-[0.14em] text-danger">{t('chaosRandomError')}</span>
          </div>
          {activeCharacter && (
            <div className="flex items-center justify-between gap-3 border-t pt-3">
              <span className="text-xs font-medium text-muted">{t('chaosCurrentTurn')}</span>
              <div className="flex items-center gap-3">
                <ChaosCharacter character={activeCharacter} size="small" state="active" />
                <span className="font-mono text-xs font-bold tracking-[0.14em] text-danger">{t('chaosActive')}</span>
              </div>
            </div>
          )}
        </aside>
      ) : (
        <aside className="flex items-center justify-between gap-3 rounded-xl border bg-surface px-4 py-3 shadow-sm">
          <ChaosCharacter character={character} size="small" state="active" />
          <span className="shrink-0 font-mono text-xs font-bold tracking-[0.14em] text-danger">{t('chaosActive')}</span>
        </aside>
      )}
      <ClassicPlay state={state} playerId={playerId} api={api} busy={busy} error={error} />
    </>
  );
}

export default ChaosPlay;
