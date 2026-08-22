'use client';

import { useState } from 'react';
import { useI18n } from './I18nProvider';
import { aiComment } from '../lib/i18n';
import { wordText } from '../lib/words';
import { TeamBadge } from './GameBits';
import { sfx } from '../lib/sound';
import { Button } from '@heroui/react';

// 게임 결과 공유 텍스트 생성 (키워드/프롬프트 포함)
function buildShareText(state, results, t, lang) {
  const lines = [`🎨 ${t('appName')} — ${t('resultsTitle')}`];
  const url = typeof window !== 'undefined' ? window.location.href : '';
  switch (results.kind) {
    case 'classic':
      for (const album of results.albums) {
        lines.push('');
        lines.push(`📖 ${album.owner}${t('albumOf')}`);
        album.entries.forEach((e) => {
          if (e.type === 'text') lines.push(`  ✏️ ${e.author}: ${e.text}`);
          else lines.push(`  🎨 ${e.author}: ${e.prompt || t('notSubmitted')}`);
        });
      }
      break;
    case 'speed':
      results.scores?.forEach((s, i) => lines.push(`${i + 1}. ${s.nickname} — ${s.score}${t('points')}`));
      results.history.forEach((h) => {
        lines.push(`🔑 ${wordText(h.keyword, lang)} → ${h.winner ?? t('noWinner')}`);
      });
      break;
    case 'speed_team':
      lines.push(`${t('teamA')} ${results.teamScores[0]} : ${results.teamScores[1]} ${t('teamB')}`);
      results.history.forEach((h) => {
        lines.push(`🔑 ${wordText(h.keyword, lang)} → ${h.winner ?? t('noWinner')}`);
      });
      break;
    case 'relay':
      lines.push(`🎯 ${t('relayThemeLabel')}: ${wordText(results.theme, lang)}`);
      results.groups.forEach((g) => {
        if (g.score != null) lines.push(`⭐ ${t('aiScore')}: ${g.score}`);
        g.entries.forEach((e) => e.prompt && lines.push(`  🖌️ ${e.nickname}: ${e.prompt}`));
      });
      break;
    case 'coop':
      lines.push(`🎯 ${t('relayThemeLabel')}: ${wordText(results.theme, lang)}`);
      results.groups.forEach((g) => {
        if (g.score != null) lines.push(`⭐ ${t('aiScore')}: ${g.score}`);
        g.cells.forEach((c) => c.prompt && lines.push(`  🧩 ${c.nickname}: ${c.prompt}`));
      });
      break;
    case 'imposter':
      lines.push(`🕵️ ${t('imposterPublic')}: ${results.imposter}`);
      lines.push(`🔑 ${t('keywordWas')}: ${wordText(results.keyword, lang)}`);
      lines.push(`💬 ${t('imposterGuessLabel')}: ${results.guess ?? '-'}`);
      lines.push(results.won ? t('imposterWin') : t('imposterLose'));
      break;
  }
  if (url) {
    lines.push('');
    lines.push(url);
  }
  return lines.join('\n');
}

function ShareButton({ state, results }) {
  const { t, lang } = useI18n();
  const [copied, setCopied] = useState(false);

  async function share() {
    const text = buildShareText(state, results, t, lang);
    sfx.pop();
    if (navigator.share) {
      try {
        await navigator.share({ title: t('appName'), text });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <Button onClick={share} className="w-full">
      {copied ? t('shareCopied') : `📤 ${t('share')}`}
    </Button>
  );
}

export default function GameResults({ state }) {
  const { t, lang } = useI18n();
  const r = state.results;
  if (!r) return null;

  return (
    <>
      <p className="text-center text-sm text-muted">🎉 {t('resultsTitle')}</p>

      {r.kind === 'classic' &&
        r.albums.map((album, ai) => (
          <div key={ai} className="rounded-xl border bg-surface p-5 text-foreground shadow-sm">
            <h2>
              📖 {album.owner}
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
                  <div className={i === 0 ? 'rounded-lg border border-accent/30 bg-accent/5 p-4' : 'rounded-lg bg-surface-secondary p-4'}>{item.text}</div>
                ) : item.url ? (
                  <>
                    <img className="w-full rounded-lg border object-cover" src={item.url} alt="AI" />
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
            <h2>🏆 {t('scoreboard')}</h2>
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
                      {i === 0 ? '👑 ' : ''}
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
            <h2>📜 {t('resultsTitle')}</h2>
            {r.history.map((h, i) => (
              <div key={i} className="space-y-2 border-b py-4 last:border-0">
                <div className="text-sm font-medium">
                  🔑 {wordText(h.keyword, lang)} — 🖌️ {h.drawer} →{' '}
                  {h.winner ? `🎉 ${h.winner}` : t('noWinner')}
                </div>
                {h.url && <img className="w-full rounded-lg border object-cover" src={h.url} alt="AI" />}
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
            <h2>🏆 {t('scoreboard')}</h2>
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
            <h2>📜 {t('resultsTitle')}</h2>
            {r.history.map((h, i) => (
              <div key={i} className="space-y-2 border-b py-4 last:border-0">
                <div className="text-sm font-medium">
                  🔑 {wordText(h.keyword, lang)} →{' '}
                  {h.winner ? `🎉 ${h.winnerTeam === 0 ? t('teamA') : t('teamB')} (${h.winner})` : t('noWinner')}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[0, 1].map((ti) =>
                    h.urls[ti] ? (
                      <div key={ti} className="space-y-2 text-center">
                        <TeamBadge team={ti} />
                        <img className="w-full rounded-lg border object-cover" src={h.urls[ti]} alt="AI" />
                      </div>
                    ) : null,
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {r.kind === 'relay' && (
        <>
          <div className="rounded-xl border bg-surface p-5 text-foreground shadow-sm">
            <h2>
              🎯 {t('relayThemeLabel')}: {wordText(r.theme, lang)}
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
                  ⭐ {t('aiScore')}: <b>{g.score}</b> — {aiComment(lang, g.score)}
                </div>
              )}
              {g.finalImage && (
                <>
                  <p className="text-sm text-muted">{t('finalImage')}</p>
                  <img className="w-full rounded-lg border object-cover" src={g.finalImage} alt="AI" />
                </>
              )}
              <p className="text-sm text-muted">{t('relayHistory')}</p>
              {g.entries.map((e, i) => (
                <div key={i} className="space-y-2 border-b py-4 last:border-0">
                  <div className="text-sm font-medium">
                    🖌️ {e.nickname} {e.skipped && <span className="inline-flex rounded-full bg-surface-tertiary px-2 py-0.5 text-xs text-foreground">{t('skipped')}</span>}
                  </div>
                  {e.prompt && (
                    <p className="text-sm text-muted">
                      {t('promptLabel')}: {e.prompt}
                    </p>
                  )}
                  {e.url && <img className="w-full max-w-xs rounded-lg border object-cover" src={e.url} alt="AI" />}
                </div>
              ))}
            </div>
          ))}
        </>
      )}

      {r.kind === 'coop' && (
        <>
          <div className="rounded-xl border bg-surface p-5 text-foreground shadow-sm">
            <h2>
              🎯 {t('relayThemeLabel')}: {wordText(r.theme, lang)}
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
                  ⭐ {t('aiScore')}: <b>{g.score}</b> — {aiComment(lang, g.score)}
                </div>
              )}
              <div className="grid overflow-hidden rounded-lg border" style={{ gridTemplateColumns: `repeat(${g.cols}, 1fr)` }}>
                {g.cells.map((cell, ci) => (
                  <div key={ci} className="aspect-square overflow-hidden border">
                    {cell.url ? (
                      <img src={cell.url} alt={cell.nickname} title={`${cell.nickname}: ${cell.prompt ?? ''}`} />
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
                      🧩 {cell.nickname}: {cell.prompt}
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
              🕵️ {t('imposterPublic')}: <b>{r.imposter}</b>
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
                  {e.url ? <img src={e.url} alt={e.nickname} /> : <div className="grid size-full min-h-24 place-items-center bg-surface-secondary text-xs text-muted">{t('skipped')}</div>}
                  <span>
                    {e.nickname}
                    {e.nickname === r.imposter ? ' 🕵️' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <ShareButton state={state} results={r} />
      <a href="/">
        <Button variant="outline" className="mt-2 w-full">
          {t('playAgain')}
        </Button>
      </a>
    </>
  );
}


