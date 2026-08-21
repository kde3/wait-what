'use client';

import { useState } from 'react';
import { useI18n } from './I18nProvider';
import { aiComment } from '../lib/i18n';
import { wordText } from '../lib/words';
import { TeamBadge } from './GameBits';
import { sfx } from '../lib/sound';

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
    <button onClick={share} className="share-btn">
      {copied ? t('shareCopied') : `📤 ${t('share')}`}
    </button>
  );
}

export default function GameResults({ state }) {
  const { t, lang } = useI18n();
  const r = state.results;
  if (!r) return null;

  return (
    <>
      <p className="subtitle">🎉 {t('resultsTitle')}</p>

      {r.kind === 'classic' &&
        r.albums.map((album, ai) => (
          <div key={ai} className="card">
            <h2>
              📖 {album.owner}
              {t('albumOf')}
            </h2>
            {album.entries.map((item, i) => (
              <div key={i} className="album-item">
                <div className="album-author">
                  {item.author}
                  {item.type === 'text' ? t('authorPhrase') : t('authorImage')}
                  {i === 0 && <span className="badge">{t('originBadge')}</span>}
                </div>
                {item.type === 'text' ? (
                  <div className={`album-text ${i === 0 ? 'album-origin' : ''}`}>{item.text}</div>
                ) : item.url ? (
                  <>
                    <img className="game-image" src={item.url} alt="AI" />
                    {item.prompt && (
                      <p className="hint-left">
                        {t('promptLabel')}: {item.prompt}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="album-text">{t('notSubmitted')}</div>
                )}
              </div>
            ))}
          </div>
        ))}

      {r.kind === 'speed' && (
        <>
          <div className="card">
            <h2>🏆 {t('scoreboard')}</h2>
            {r.teamMode ? (
              <div className="team-scores big">
                <span className="team-badge team-0">
                  {t('teamA')} {r.teamScores[0]}
                </span>
                <span className="team-badge team-1">
                  {t('teamB')} {r.teamScores[1]}
                </span>
              </div>
            ) : (
              <ul className="score-list">
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
          <div className="card">
            <h2>📜 {t('resultsTitle')}</h2>
            {r.history.map((h, i) => (
              <div key={i} className="album-item">
                <div className="album-author">
                  🔑 {wordText(h.keyword, lang)} — 🖌️ {h.drawer} →{' '}
                  {h.winner ? `🎉 ${h.winner}` : t('noWinner')}
                </div>
                {h.url && <img className="game-image" src={h.url} alt="AI" />}
                {h.prompt && (
                  <p className="hint-left">
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
          <div className="card">
            <h2>🏆 {t('scoreboard')}</h2>
            <div className="team-scores big">
              <span className="team-badge team-0">
                {t('teamA')} {r.teamScores[0]}
              </span>
              <span className="team-badge team-1">
                {t('teamB')} {r.teamScores[1]}
              </span>
            </div>
          </div>
          <div className="card">
            <h2>📜 {t('resultsTitle')}</h2>
            {r.history.map((h, i) => (
              <div key={i} className="album-item">
                <div className="album-author">
                  🔑 {wordText(h.keyword, lang)} →{' '}
                  {h.winner ? `🎉 ${h.winnerTeam === 0 ? t('teamA') : t('teamB')} (${h.winner})` : t('noWinner')}
                </div>
                <div className="image-pair">
                  {[0, 1].map((ti) =>
                    h.urls[ti] ? (
                      <div key={ti} className="image-pair-item">
                        <TeamBadge team={ti} />
                        <img className="game-image" src={h.urls[ti]} alt="AI" />
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
          <div className="card">
            <h2>
              🎯 {t('relayThemeLabel')}: {wordText(r.theme, lang)}
            </h2>
          </div>
          {r.groups.map((g, gi) => (
            <div key={gi} className="card">
              {r.teamMode && (
                <h2>
                  <TeamBadge team={gi} />
                </h2>
              )}
              {g.score != null && (
                <div className="score-banner">
                  ⭐ {t('aiScore')}: <b>{g.score}</b> — {aiComment(lang, g.score)}
                </div>
              )}
              {g.finalImage && (
                <>
                  <p className="hint-left">{t('finalImage')}</p>
                  <img className="game-image" src={g.finalImage} alt="AI" />
                </>
              )}
              <p className="hint-left">{t('relayHistory')}</p>
              {g.entries.map((e, i) => (
                <div key={i} className="album-item">
                  <div className="album-author">
                    🖌️ {e.nickname} {e.skipped && <span className="badge">{t('skipped')}</span>}
                  </div>
                  {e.prompt && (
                    <p className="hint-left">
                      {t('promptLabel')}: {e.prompt}
                    </p>
                  )}
                  {e.url && <img className="game-image small" src={e.url} alt="AI" />}
                </div>
              ))}
            </div>
          ))}
        </>
      )}

      {r.kind === 'coop' && (
        <>
          <div className="card">
            <h2>
              🎯 {t('relayThemeLabel')}: {wordText(r.theme, lang)}
            </h2>
          </div>
          {r.groups.map((g, gi) => (
            <div key={gi} className="card">
              {r.teamMode && (
                <h2>
                  <TeamBadge team={gi} />
                </h2>
              )}
              {g.score != null && (
                <div className="score-banner">
                  ⭐ {t('aiScore')}: <b>{g.score}</b> — {aiComment(lang, g.score)}
                </div>
              )}
              <div className="coop-grid" style={{ gridTemplateColumns: `repeat(${g.cols}, 1fr)` }}>
                {g.cells.map((cell, ci) => (
                  <div key={ci} className="coop-cell">
                    {cell.url ? (
                      <img src={cell.url} alt={cell.nickname} title={`${cell.nickname}: ${cell.prompt ?? ''}`} />
                    ) : (
                      <div className="coop-empty">{cell.nickname}</div>
                    )}
                  </div>
                ))}
              </div>
              {g.cells.map(
                (cell, ci) =>
                  cell.prompt && (
                    <p key={ci} className="hint-left">
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
          <div className={`card reveal-card ${r.won ? 'imposter-won' : ''}`}>
            <h2>{r.won ? t('imposterWin') : t('imposterLose')}</h2>
            <p className="keyword-reveal">
              🕵️ {t('imposterPublic')}: <b>{r.imposter}</b>
            </p>
            <p className="keyword-reveal">
              {t('keywordWas')}: <b>{wordText(r.keyword, lang)}</b>
            </p>
            <p className="keyword-reveal">
              {t('imposterGuessLabel')}: <b>{r.guess ?? '-'}</b>
            </p>
          </div>
          <div className="card">
            <h2>{t('imposterGallery')}</h2>
            <div className="gallery-grid">
              {r.entries.map((e, i) => (
                <div key={i} className="gallery-item">
                  {e.url ? <img src={e.url} alt={e.nickname} /> : <div className="coop-empty">{t('skipped')}</div>}
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
        <button className="secondary" style={{ marginTop: 10 }}>
          {t('playAgain')}
        </button>
      </a>
    </>
  );
}
