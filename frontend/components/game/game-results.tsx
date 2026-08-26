'use client';

import { Article, BookOpen, Crown, Eye, Key, PartyPopper, Pencil, Star, Target, Trophy, Users } from 'pixelarticons/react';
import { useI18n } from '../i18n-provider';
import { aiComment } from '../../lib/i18n';
import { wordText } from '../../lib/words';
import { TeamBadge } from './team-badge';
import { ShareButton } from './share-button';
import { Button } from '../ui/button';
import { StatusBanner } from '../ui/status-banner';
import { apiUrl } from '../../lib/backend-url';

export default function GameResults({ state, playerId, api, busy, onLeave }: any) {
  const { t, lang } = useI18n();
  const r = state.results;
  if (!r) return null;

  return (
    <>
      <p className="text-center text-sm text-muted"><PartyPopper className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> {t('resultsTitle')}</p>

      {r.kind === 'classic' &&
        r.albums.map((album, ai) => (
          <div key={ai} className="rounded-xl border bg-surface p-5 text-foreground shadow-sm">
            <h2>
              <BookOpen className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> {album.owner}
              {t('albumOf')}
            </h2>
            {album.entries.map((item, i) => (
              <div key={i} className="space-y-2 border-b py-4 last:border-0">
                <div className="text-sm font-medium">
                  {item.author}
                  {item.type === 'text' ? t('authorPhrase') : t('authorImage')}
                  {i === 0 && <span className="inline-flex rounded-full bg-surface-tertiary px-2 py-0.5 text-xs text-foreground">{t('originBadge')}</span>}
                </div>
                {item.type === 'text' ? (
                  <div className={i === 0 ? 'rounded-lg border border-accent/30 bg-accent/5 p-4' : 'rounded-lg bg-surface-secondary p-4'}>{item.text || t('emptyValue')}</div>
                ) : item.url ? (
                  <>
                    <img className="w-full rounded-lg border object-cover" src={apiUrl(item.url)} alt="AI" />
                    {item.prompt && (
                      <p className="text-sm text-muted">
                        {t('promptLabel')}: {item.prompt}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="rounded-lg bg-surface-secondary p-4">{t('notSubmitted')}</div>
                )}
              </div>
            ))}
          </div>
        ))}

      {r.kind === 'speed' && (
        <>
          <div className="rounded-xl border bg-surface p-5 text-foreground shadow-sm">
            <h2><Trophy className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> {t('scoreboard')}</h2>
            {r.teamMode ? (
              <div className="flex justify-center gap-3 py-2 text-lg">
                <span className="inline-flex rounded-full bg-surface-tertiary px-3 py-1 text-xs font-medium text-foreground">
                  {t('teamA')} {r.teamScores[0]}
                </span>
                <span className="inline-flex rounded-full bg-surface-secondary px-3 py-1 text-xs font-medium text-muted">
                  {t('teamB')} {r.teamScores[1]}
                </span>
              </div>
            ) : (
              <ul className="space-y-2">
                {r.scores.map((s, i) => (
                  <li key={i}>
                    <span>
                      {i === 0 ? <Crown className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> : null}
                      {s.nickname}
                    </span>
                    <b>
                      {s.score} {t('points')}
                    </b>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-xl border bg-surface p-5 text-foreground shadow-sm">
            <h2><Article className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> {t('resultsTitle')}</h2>
            {r.history.map((h, i) => (
              <div key={i} className="space-y-2 border-b py-4 last:border-0">
                <div className="text-sm font-medium">
                  <Key className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> {wordText(h.keyword, lang)} — <Pencil className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> {h.drawer} →{' '}
                  {h.winner ? <><PartyPopper className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> {h.winner}</> : t('noWinner')}
                </div>
                {h.url && <img className="w-full rounded-lg border object-cover" src={apiUrl(h.url)} alt="AI" />}
                {h.prompt && (
                  <p className="text-sm text-muted">
                    {t('promptLabel')}: {h.prompt}
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {r.kind === 'speed_team' && (
        <>
          <div className="rounded-xl border bg-surface p-5 text-foreground shadow-sm">
            <h2><Trophy className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> {t('scoreboard')}</h2>
            <div className="flex justify-center gap-3 py-2 text-lg">
              <span className="inline-flex rounded-full bg-surface-tertiary px-3 py-1 text-xs font-medium text-foreground">
                {t('teamA')} {r.teamScores[0]}
              </span>
              <span className="inline-flex rounded-full bg-surface-secondary px-3 py-1 text-xs font-medium text-muted">
                {t('teamB')} {r.teamScores[1]}
              </span>
            </div>
          </div>
          <div className="rounded-xl border bg-surface p-5 text-foreground shadow-sm">
            <h2><Article className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> {t('resultsTitle')}</h2>
            {r.history.map((h, i) => (
              <div key={i} className="space-y-2 border-b py-4 last:border-0">
                <div className="text-sm font-medium">
                  <Key className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> {wordText(h.keyword, lang)} →{' '}
                  {h.winner ? <><PartyPopper className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> {`${h.winnerTeam === 0 ? t('teamA') : t('teamB')} (${h.winner})`}</> : t('noWinner')}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[0, 1].map((ti) =>
                    h.urls[ti] ? (
                      <div key={ti} className="space-y-2 text-center">
                        <TeamBadge team={ti} />
                        <img className="w-full rounded-lg border object-cover" src={apiUrl(h.urls[ti])} alt="AI" />
                      </div>
                    ) : null,
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}


      {r.kind === 'coop' && (
        <>
          <div className="rounded-xl border bg-surface p-5 text-foreground shadow-sm">
            <h2>
              <Target className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> {t('relayThemeLabel')}: {wordText(r.theme, lang)}
            </h2>
          </div>
          {r.groups.map((g, gi) => (
            <div key={gi} className="rounded-xl border bg-surface p-5 text-foreground shadow-sm">
              {r.teamMode && (
                <h2>
                  <TeamBadge team={gi} />
                </h2>
              )}
              {g.score != null && (
                <div className="mb-3 rounded-lg bg-surface-secondary p-3 text-center font-medium">
                  <Star className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> {t('aiScore')}: <b>{g.score}</b> — {g.comment ?? aiComment(lang, g.score)}
                </div>
              )}
              <div className="grid overflow-hidden rounded-lg border" style={{ gridTemplateColumns: `repeat(${g.cols}, 1fr)` }}>
                {g.cells.map((cell, ci) => (
                  <div key={ci} className="aspect-square overflow-hidden border">
                    {cell.url ? (
                      <img src={apiUrl(cell.url)} alt={cell.nickname} title={`${cell.nickname}: ${cell.prompt ?? ''}`} />
                    ) : (
                      <div className="grid size-full min-h-24 place-items-center bg-surface-secondary text-xs text-muted">{cell.nickname}</div>
                    )}
                  </div>
                ))}
              </div>
              {g.cells.map(
                (cell, ci) =>
                  cell.prompt && (
                    <p key={ci} className="text-sm text-muted">
                      <Users className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> {cell.nickname}: {cell.prompt}
                    </p>
                  ),
              )}
            </div>
          ))}
        </>
      )}

      {r.kind === 'imposter' && (
        <>
          <div className={r.won ? 'rounded-xl border border-accent/40 bg-accent/5 p-6 text-center shadow-sm' : 'rounded-xl border bg-surface p-6 text-center shadow-sm'}>
            <h2>{r.won ? t('imposterWin') : t('imposterLose')}</h2>
            <p className="my-2 text-sm">
              <Eye className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> {t('imposterPublic')}: <b>{r.imposter}</b>
            </p>
            <p className="my-2 text-sm">
              {t('keywordWas')}: <b>{wordText(r.keyword, lang)}</b>
            </p>
            <p className="my-2 text-sm">
              {t('imposterGuessLabel')}: <b>{r.guess ?? '-'}</b>
            </p>
          </div>
          <div className="rounded-xl border bg-surface p-5 text-foreground shadow-sm">
            <h2>{t('imposterGallery')}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {r.entries.map((e, i) => (
                <div key={i} className="space-y-2 rounded-lg border p-2 text-center text-sm">
                  {e.url ? <img src={apiUrl(e.url)} alt={e.nickname} /> : <div className="grid size-full min-h-24 place-items-center bg-surface-secondary text-xs text-muted">{t('skipped')}</div>}
                  <span>
                    {e.nickname}
                    {e.nickname === r.imposter ? <Eye className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> : null}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <ShareButton results={r} />
      {state.you?.staying ? (
        <StatusBanner className="mt-2 gap-3">
          <span>
            {t('stayingWait')} ({state.players.filter((p) => p.staying).length}/{state.players.length})
          </span>
          <Button variant="outline" className="h-7 w-auto px-2 text-xs" onClick={onLeave} isDisabled={busy}>
            {t('leaveRoom')}
          </Button>
        </StatusBanner>
      ) : (
        <div className="mt-2 flex gap-2">
          <Button className="flex-1" onClick={() => api('restart', { playerId })} isDisabled={busy}>
            {t('stayInRoom')} ({state.players.filter((p) => p.staying).length}/{state.players.length})
          </Button>
          <Button variant="outline" className="flex-1" onClick={onLeave} isDisabled={busy}>
            {t('leaveRoom')}
          </Button>
        </div>
      )}
    </>
  );
}


