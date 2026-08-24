'use client';

import { useState } from 'react';
import { useI18n } from '../i18n-provider';
import { sfx } from '../../lib/sound';
import { Card, ListBox, Select, Switch } from '@heroui/react';
import { Button } from '../ui/button';
import { ModeButton } from './mode-button';
import { Eye, Flag, Pencil, Phone, UserPlus, Users, Zap } from 'pixelarticons/react';
import { ParticipantList } from './participant-list';
import { InviteModal } from './invite-modal';

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

// HeroUI Switch는 합성 컴포넌트라 자식을 주지 않으면 빈 span만 남아 화면에 아무것도 안 보인다.
function OptionSwitch({ isSelected, isDisabled, label, onChange }: any) {
  return (
    <Switch isSelected={isSelected} isDisabled={isDisabled} onChange={onChange} aria-label={label}>
      <Switch.Content>
        <Switch.Control><Switch.Thumb /></Switch.Control>
      </Switch.Content>
    </Switch>
  );
}

// 참가자를 인덱스로 고르는 선택기 — playerId는 인증 토큰이라 노출하지 않는다.
function PlayerSelect({ value, players, disabled, label, onChange }: any) {
  return (
    <Select value={String(value)} isDisabled={disabled} onChange={(next) => onChange(Number(next))} className="w-32" aria-label={label}>
      <Select.Trigger><Select.Value /></Select.Trigger>
      <Select.Popover><ListBox>
        {players.map((p: any, i: number) => <ListBox.Item key={i} id={String(i)} textValue={p.nickname}>{p.nickname}</ListBox.Item>)}
      </ListBox></Select.Popover>
    </Select>
  );
}

const MODE_META = [
  { id: 'classic', Icon: Phone, min: 2 },
  { id: 'speed', Icon: Zap, min: 2 },
  { id: 'speed_team', Icon: Flag, min: 2 },
  { id: 'relay', Icon: Pencil, min: 2 },
  { id: 'coop', Icon: Users, min: 2 },
  { id: 'imposter', Icon: Eye, min: 3 },
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

export default function Room({ state, playerId, api, busy, error, onStarted }) {
  const { t } = useI18n();
  const [showInvite, setShowInvite] = useState(false);
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
    <div className="space-y-4">
      <section aria-labelledby="room-title" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-surface px-5 py-4">
        <div className="min-w-0">
          <h1 id="room-title" className="truncate text-xl font-bold">{state.name}</h1>
          <p className="text-sm text-muted">{t(state.isPublic ? 'publicRoom' : 'privateRoom')}</p>
        </div>
        <Button onClick={() => setShowInvite(true)}>
          <UserPlus className="size-4" aria-hidden="true" />
          {t('inviteTitle')}
        </Button>
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(240px,280px)_minmax(0,1fr)]">
      <ParticipantList state={state} busy={busy} onJoinTeam={joinTeam} />

      <div className="min-w-0 space-y-4">
        <Card className="p-5">
        <h2>{t('modeTitle')}</h2>
        <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-2 md:grid-cols-[repeat(3,minmax(0,1fr))]">
          {MODE_META.map((m) => (
            <ModeButton
              key={m.id}
              icon={m.Icon}
              label={t(MODE_LABEL_KEY[m.id])}
              description={t(MODE_LABEL_KEY[m.id] + 'Desc')}
              isSelected={mode === m.id}
              isDisabled={!isHost || busy}
              onPress={() => setMode(m.id)}
            />
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
              <OptionSwitch
                isSelected={o.fixedDrawer}
                isDisabled={!isHost}
                label={t('optFixedDrawer')}
                onChange={(checked) => setOption('fixedDrawer', checked)}
              />
            </label>
          )}
          {mode === 'speed' && o.fixedDrawer && (
            <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
              <span>{t('optDrawer')}</span>
              <PlayerSelect
                value={o.fixedDrawerIndex}
                players={state.players}
                disabled={!isHost}
                label={t('optDrawer')}
                onChange={(value: number) => setOption('fixedDrawerIndex', value)}
              />
            </label>
          )}
          {showTeamToggle && (
            <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
              <span>{t('optTeamMode')}</span>
              <OptionSwitch
                isSelected={o.teamMode}
                isDisabled={!isHost}
                label={t('optTeamMode')}
                onChange={(checked) => setOption('teamMode', checked)}
              />
            </label>
          )}
          {['relay', 'coop'].includes(mode) && (
            <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
              <span>{t('optScored')}</span>
              <OptionSwitch
                isSelected={o.scored}
                isDisabled={!isHost}
                label={t('optScored')}
                onChange={(checked) => setOption('scored', checked)}
              />
            </label>
          )}
          {mode === 'imposter' && (
            <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
              <span>{t('optModerator')}</span>
              <OptionSwitch
                isSelected={o.moderator}
                isDisabled={!isHost}
                label={t('optModerator')}
                onChange={(checked) => setOption('moderator', checked)}
              />
            </label>
          )}
        </div>
        </Card>

        <Card className="p-5">
        {isHost ? (
          <Button className="w-full" onClick={start} isDisabled={busy}>
            {t('startGame')}
          </Button>
        ) : (
          <p className="text-center text-sm text-muted">{t('waitingHost')}</p>
        )}
        {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}
        </Card>
      </div>
      </div>

      <InviteModal code={state.code} url={roomUrl} isOpen={showInvite} copied={copied} onOpenChange={setShowInvite} onCopy={copyLink} />
    </div>
  );
}
