'use client';

import { useState } from 'react';
import { useI18n } from './I18nProvider';
import QrInvite from './QrInvite';
import { sfx } from '../lib/sound';
import { Button, Card, Input, ListBox, Select, Switch } from '@heroui/react';

function OptionSelect({ value, values, disabled, suffix = '', onChange }: any) {
  return (
    <Select value={String(value)} isDisabled={disabled} onChange={(next) => onChange(Number(next))} className="w-24" aria-label="option">
      <Select.Trigger><Select.Value /></Select.Trigger>
      <Select.Popover><ListBox>
        {values.map((item: number) => <ListBox.Item key={item} id={String(item)} textValue={`${item}${suffix}`}>{item}{suffix}</ListBox.Item>)}
      </ListBox></Select.Popover>
    </Select>
  );
}

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
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">
              {state.isPublic ? '🌐' : '🔒'} {state.name}
            </div>
            <div className="text-sm text-muted">
              {t('roomCodeLabel')}: <b className="font-mono tracking-widest text-accent">{state.code}</b>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={copyLink}>
              {copied ? t('copied') : `🔗 ${t('copyLink')}`}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowQr((v) => !v)}>
              {showQr ? t('hideQr') : `📱 ${t('showQr')}`}
            </Button>
          </div>
        </div>
        {showQr && <QrInvite url={roomUrl} />}
        <p className="text-center text-sm text-muted">{t('lobbyShareHint')}</p>
      </Card>

      <Card className="p-5">
        <h2>{t('modeTitle')}</h2>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {MODE_META.map((m) => (
            <Button
              key={m.id}
              variant={mode === m.id ? 'primary' : 'outline'}
              className="h-auto min-h-24 flex-col items-start gap-1 whitespace-normal p-3 text-left"
              onClick={() => setMode(m.id)}
              isDisabled={!isHost || busy}
            >
              <span className="text-lg">{m.icon}</span>
              <span className="font-medium">{t(MODE_LABEL_KEY[m.id])}</span>
              <span className="text-xs text-muted">{t(MODE_LABEL_KEY[m.id] + 'Desc')}</span>
            </Button>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2>{t('optionsTitle')}</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
            <span>{t('optTextSeconds')}</span>
            <OptionSelect value={o.textSeconds} values={[20, 30, 45, 60, 90, 120]} suffix={t('secondsUnit')} disabled={!isHost} onChange={(value: number) => setOption('textSeconds', value)} />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
            <span>{t('optImageSeconds')}</span>
            <OptionSelect value={o.imageSeconds} values={[45, 60, 90, 120, 180, 240]} suffix={t('secondsUnit')} disabled={!isHost} onChange={(value: number) => setOption('imageSeconds', value)} />
          </label>
          {['speed', 'speed_team'].includes(mode) && (
            <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
              <span>{t('optRounds')}</span>
              <OptionSelect value={o.rounds} values={[3, 5, 7, 10]} disabled={!isHost} onChange={(value: number) => setOption('rounds', value)} />
            </label>
          )}
          {mode === 'speed' && (
            <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
              <span>{t('optFixedDrawer')}</span>
              <Switch
                isSelected={o.fixedDrawer}
                isDisabled={!isHost}
                onChange={(checked) => setOption('fixedDrawer', checked)}
              />
            </label>
          )}
          {showTeamToggle && (
            <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
              <span>{t('optTeamMode')}</span>
              <Switch
                isSelected={o.teamMode}
                isDisabled={!isHost}
                onChange={(checked) => setOption('teamMode', checked)}
              />
            </label>
          )}
          {['relay', 'coop'].includes(mode) && (
            <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
              <span>{t('optScored')}</span>
              <Switch
                isSelected={o.scored}
                isDisabled={!isHost}
                onChange={(checked) => setOption('scored', checked)}
              />
            </label>
          )}
          {mode === 'imposter' && (
            <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
              <span>{t('optModerator')}</span>
              <Switch
                isSelected={o.moderator}
                isDisabled={!isHost}
                onChange={(checked) => setOption('moderator', checked)}
              />
            </label>
          )}
        </div>
        <label className="mt-2 flex flex-col gap-2 rounded-lg border p-3 text-sm">
          <span>{t('optBannedWords')}</span>
          <Input
            type="text"
            maxLength={200}
            placeholder={t('bannedWordsPlaceholder')}
            defaultValue={o.bannedWords}
            disabled={!isHost}
            onBlur={(e) => setOption('bannedWords', e.target.value)}
          />
        </label>
      </Card>

      <Card className="p-5">
        <h2>
          {t('participants')} ({state.players.length})
        </h2>
        {state.teamGame ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1].map((team) => (
              <div key={team} className="rounded-lg border bg-surface-secondary p-3">
                <div className="mb-2 flex items-center justify-between font-medium">
                  {team === 0 ? t('teamA') : t('teamB')}
                  {state.you && state.you.team !== team && (
                    <Button className="h-7 w-auto px-2 text-xs" onClick={() => joinTeam(team)} isDisabled={busy}>
                      {t('moveHere')}
                    </Button>
                  )}
                </div>
                <ul className="flex flex-wrap gap-2">
                  {state.players
                    .filter((p) => p.team === team)
                    .map((p, i) => (
                      <li key={i} className="rounded-full border bg-surface px-3 py-1 text-sm">
                        {p.nickname}
                        {p.nickname === state.you?.nickname && ` (${t('you')})`}
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {state.players.map((p, i) => (
              <li key={i} className="rounded-full border bg-surface px-3 py-1 text-sm">
                {p.nickname}
                {p.nickname === state.you?.nickname && ` (${t('you')})`}
              </li>
            ))}
          </ul>
        )}

        {isHost ? (
          <Button onClick={start} isDisabled={busy} style={{ marginTop: 12 }}>
            {t('startGame')}
          </Button>
        ) : (
          <p className="text-center text-sm text-muted">{t('waitingHost')}</p>
        )}
        {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}
      </Card>
    </>
  );
}



