'use client';

import { useState } from 'react';
import { useI18n } from './I18nProvider';
import QrInvite from './QrInvite';
import { sfx } from '../lib/sound';

const MODE_META = [
  { id: 'classic', icon: '📞', min: 2 },
  { id: 'speed', icon: '⚡', min: 2 },
  { id: 'speed_team', icon: '🏁', min: 2 },
  { id: 'relay', icon: '🖌️', min: 2 },
  { id: 'coop', icon: '🧩', min: 2 },
  { id: 'imposter', icon: '🕵️', min: 3 },
];

const MODE_LABEL_KEY = {
  classic: 'modeClassic',
  speed: 'modeSpeed',
  speed_team: 'modeSpeedTeam',
  relay: 'modeRelay',
  coop: 'modeCoop',
  imposter: 'modeImposter',
};

export function modeLabelKey(mode) {
  return MODE_LABEL_KEY[mode] ?? 'modeClassic';
}

export default function Lobby({ state, playerId, api, busy, error, onStarted }) {
  const { t } = useI18n();
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);
  const isHost = !!state.you?.isHost;
  const roomUrl = typeof window !== 'undefined' ? `${window.location.origin}/room/${state.code}` : '';

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      sfx.pop();
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  async function setMode(mode) {
    if (!isHost || busy) return;
    sfx.click();
    await api('config', { playerId, patch: { mode } });
  }

  async function setOption(key, value) {
    if (!isHost) return;
    await api('config', { playerId, patch: { options: { [key]: value } } });
  }

  async function joinTeam(team) {
    sfx.click();
    await api('team', { playerId, team });
  }

  async function start() {
    sfx.start();
    const ok = await api('start', { playerId });
    if (ok) onStarted?.();
  }

  const o = state.options;
  const mode = state.mode;
  const showTeamToggle = ['speed', 'relay', 'coop'].includes(mode);

  return (
    <>
      <div className="card">
        <div className="lobby-head">
          <div>
            <div className="room-name">
              {state.isPublic ? '🌐' : '🔒'} {state.name}
            </div>
            <div className="hint-left">
              {t('roomCodeLabel')}: <b className="code-inline">{state.code}</b>
            </div>
          </div>
          <div className="invite-btns">
            <button className="secondary small" onClick={copyLink}>
              {copied ? t('copied') : `🔗 ${t('copyLink')}`}
            </button>
            <button className="secondary small" onClick={() => setShowQr((v) => !v)}>
              {showQr ? t('hideQr') : `📱 ${t('showQr')}`}
            </button>
          </div>
        </div>
        {showQr && <QrInvite url={roomUrl} />}
        <p className="hint">{t('lobbyShareHint')}</p>
      </div>

      <div className="card">
        <h2>{t('modeTitle')}</h2>
        <div className="mode-grid">
          {MODE_META.map((m) => (
            <button
              key={m.id}
              className={`mode-card ${mode === m.id ? 'selected' : ''} ${isHost ? '' : 'readonly'}`}
              onClick={() => setMode(m.id)}
              disabled={!isHost || busy}
            >
              <span className="mode-icon">{m.icon}</span>
              <span className="mode-name">{t(MODE_LABEL_KEY[m.id])}</span>
              <span className="mode-desc">{t(MODE_LABEL_KEY[m.id] + 'Desc')}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>{t('optionsTitle')}</h2>
        <div className="options-grid">
          <label className="opt">
            <span>{t('optTextSeconds')}</span>
            <select
              value={o.textSeconds}
              disabled={!isHost}
              onChange={(e) => setOption('textSeconds', +e.target.value)}
            >
              {[20, 30, 45, 60, 90, 120].map((s) => (
                <option key={s} value={s}>
                  {s}
                  {t('secondsUnit')}
                </option>
              ))}
            </select>
          </label>
          <label className="opt">
            <span>{t('optImageSeconds')}</span>
            <select
              value={o.imageSeconds}
              disabled={!isHost}
              onChange={(e) => setOption('imageSeconds', +e.target.value)}
            >
              {[45, 60, 90, 120, 180, 240].map((s) => (
                <option key={s} value={s}>
                  {s}
                  {t('secondsUnit')}
                </option>
              ))}
            </select>
          </label>
          {['speed', 'speed_team'].includes(mode) && (
            <label className="opt">
              <span>{t('optRounds')}</span>
              <select value={o.rounds} disabled={!isHost} onChange={(e) => setOption('rounds', +e.target.value)}>
                {[3, 5, 7, 10].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
          )}
          {mode === 'speed' && (
            <label className="opt toggle">
              <span>{t('optFixedDrawer')}</span>
              <input
                type="checkbox"
                checked={o.fixedDrawer}
                disabled={!isHost}
                onChange={(e) => setOption('fixedDrawer', e.target.checked)}
              />
            </label>
          )}
          {showTeamToggle && (
            <label className="opt toggle">
              <span>{t('optTeamMode')}</span>
              <input
                type="checkbox"
                checked={o.teamMode}
                disabled={!isHost}
                onChange={(e) => setOption('teamMode', e.target.checked)}
              />
            </label>
          )}
          {['relay', 'coop'].includes(mode) && (
            <label className="opt toggle">
              <span>{t('optScored')}</span>
              <input
                type="checkbox"
                checked={o.scored}
                disabled={!isHost}
                onChange={(e) => setOption('scored', e.target.checked)}
              />
            </label>
          )}
          {mode === 'imposter' && (
            <label className="opt toggle">
              <span>{t('optModerator')}</span>
              <input
                type="checkbox"
                checked={o.moderator}
                disabled={!isHost}
                onChange={(e) => setOption('moderator', e.target.checked)}
              />
            </label>
          )}
        </div>
        <label className="opt banned">
          <span>{t('optBannedWords')}</span>
          <input
            type="text"
            maxLength={200}
            placeholder={t('bannedWordsPlaceholder')}
            defaultValue={o.bannedWords}
            disabled={!isHost}
            onBlur={(e) => setOption('bannedWords', e.target.value)}
          />
        </label>
      </div>

      <div className="card">
        <h2>
          {t('participants')} ({state.players.length})
        </h2>
        {state.teamGame ? (
          <div className="team-columns">
            {[0, 1].map((team) => (
              <div key={team} className={`team-col team-${team}`}>
                <div className="team-col-head">
                  {team === 0 ? t('teamA') : t('teamB')}
                  {state.you && state.you.team !== team && (
                    <button className="inline-btn tiny" onClick={() => joinTeam(team)} disabled={busy}>
                      {t('moveHere')}
                    </button>
                  )}
                </div>
                <ul className="player-list">
                  {state.players
                    .filter((p) => p.team === team)
                    .map((p, i) => (
                      <li key={i} className={p.isHost ? 'host' : ''}>
                        {p.nickname}
                        {p.nickname === state.you?.nickname && ` (${t('you')})`}
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <ul className="player-list">
            {state.players.map((p, i) => (
              <li key={i} className={p.isHost ? 'host' : ''}>
                {p.nickname}
                {p.nickname === state.you?.nickname && ` (${t('you')})`}
              </li>
            ))}
          </ul>
        )}

        {isHost ? (
          <button onClick={start} disabled={busy} style={{ marginTop: 12 }}>
            {t('startGame')}
          </button>
        ) : (
          <p className="hint">{t('waitingHost')}</p>
        )}
        {error && <p className="error">{error}</p>}
      </div>
    </>
  );
}
