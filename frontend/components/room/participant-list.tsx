'use client';

import { Card } from '@heroui/react';
import { Button } from '../ui/button';
import { Crown } from 'pixelarticons/react';
import { useI18n } from '../i18n-provider';

function PlayerItem({ player, currentNickname }: any) {
  const { t } = useI18n();
  return (
    <li className="flex min-w-0 items-center gap-2 rounded-lg border bg-surface px-3 py-2 text-sm">
      {player.isHost && <Crown className="size-4 shrink-0 text-warning" aria-label={t('host')} />}
      <span className="min-w-0 break-words">
        {player.nickname}
        {player.nickname === currentNickname && ` (${t('you')})`}
      </span>
    </li>
  );
}

export function ParticipantList({ state, busy = false, onJoinTeam }: any) {
  const { t } = useI18n();
  return (
    <section aria-labelledby="participants-heading" className="min-w-0 lg:sticky lg:top-6">
      <Card className="p-5">
        <h2 id="participants-heading">{t('participants')} ({state.players.length})</h2>
        {state.teamGame ? (
          <div className="grid gap-3">
            {[0, 1].map((team) => (
              <div key={team} className="rounded-lg border bg-surface-secondary p-3">
                <div className="mb-2 flex items-center justify-between gap-2 font-medium">
                  {team === 0 ? t('teamA') : t('teamB')}
                  {state.you && state.you.team !== team && (
                    <Button className="h-7 w-auto px-2 text-xs" onClick={() => onJoinTeam(team)} isDisabled={busy}>
                      {t('moveHere')}
                    </Button>
                  )}
                </div>
                <ul className="flex flex-col gap-2">
                  {state.players.filter((player) => player.team === team).map((player, index) => (
                    <PlayerItem key={index} player={player} currentNickname={state.you?.nickname} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {state.players.map((player, index) => (
              <PlayerItem key={index} player={player} currentNickname={state.you?.nickname} />
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
