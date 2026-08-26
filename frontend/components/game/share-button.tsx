'use client';

import { Share } from 'pixelarticons/react';
import { useState } from 'react';
import { useI18n } from '../i18n-provider';
import { wordText } from '../../lib/words';
import { sfx } from '../../lib/sound';
import { Button } from '../ui/button';
import { CHAOS_CHARACTER_BY_ID } from '../../lib/chaos';

// 게임 결과 공유 텍스트 생성 (키워드/프롬프트 포함)
function buildShareText(results, t, lang) {
  const lines = [`🎨 ${t('appName')} — ${t('resultsTitle')}`];
  const url = typeof window !== 'undefined' ? window.location.href : '';
  switch (results.kind) {
    case 'classic':
    case 'chaos':
      if (results.kind === 'chaos' && results.chaosCharacterId) {
        lines.push(`⚠️ ${t('chaosResultTitle')}: ${t(CHAOS_CHARACTER_BY_ID[results.chaosCharacterId].nameKey)}`);
      }
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

export function ShareButton({ results }) {
  const { t, lang } = useI18n();
  const [copied, setCopied] = useState(false);

  async function share() {
    const text = buildShareText(results, t, lang);
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
      {copied ? t('shareCopied') : <><Share className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> {t('share')}</>}
    </Button>
  );
}

export default ShareButton;
