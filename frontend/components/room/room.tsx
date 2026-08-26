'use client';

import { useState } from 'react';
import { useI18n } from '../i18n-provider';
import { sfx } from '../../lib/sound';
import { MODE_LABEL_KEY, VISIBLE_MODES } from '../../lib/modes';
import { Card } from '@heroui/react';
import { Button } from '../ui/button';
import { OptionSelect } from '../ui/option-select';
import { Switch } from '../ui/switch';
import { ModeButton } from './mode-button';
import { Bug, Eye, Phone, UserPlus, Zap } from 'pixelarticons/react';
import { ParticipantList } from './participant-list';
import { InviteModal } from './invite-modal';

const MODE_ICONS = { classic: Phone, speed: Zap, chaos: Bug, imposter: Eye };
const MODE_META = VISIBLE_MODES.map((id) => ({ id, Icon: MODE_ICONS[id] }));

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
  const showTeamToggle = ['speed', 'coop'].includes(mode);

  const secondsItems = (values: number[]) =>
    values.map((value) => ({ id: String(value), label: `${value}${t('secondsUnit')}` }));
  const roundItems = (values: number[]) =>
    values.map((value) => ({ id: String(value), label: String(value) }));
  const difficultyItems = [
    { id: 'normal', label: t('difficultyNormal') },
    { id: 'hard', label: t('difficultyHard') },
    { id: 'hell', label: t('difficultyHell') },
  ];
  // 참가자를 인덱스로 고르는 선택기 — playerId는 인증 토큰이라 노출하지 않는다.
  const playerItems = state.players.map((p, i) => ({ id: String(i), label: p.nickname }));

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
        <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-2">
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
            <span>{t('optDifficulty')}</span>
            <OptionSelect
              className="w-28"
              aria-label={t('optDifficulty')}
              value={o.difficulty ?? 'normal'}
              items={difficultyItems}
              isDisabled={!isHost}
              onChange={(value) => setOption('difficulty', value)}
            />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
            <span>{t('optTextSeconds')}</span>
            <OptionSelect
              className="w-24"
              aria-label={t('optTextSeconds')}
              value={String(o.textSeconds)}
              items={secondsItems([20, 30, 45, 60, 90, 120])}
              isDisabled={!isHost}
              onChange={(value) => setOption('textSeconds', Number(value))}
            />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
            <span>{t('optImageSeconds')}</span>
            <OptionSelect
              className="w-24"
              aria-label={t('optImageSeconds')}
              value={String(o.imageSeconds)}
              items={secondsItems([45, 60, 90, 120, 180, 240])}
              isDisabled={!isHost}
              onChange={(value) => setOption('imageSeconds', Number(value))}
            />
          </label>
          {['speed', 'speed_team'].includes(mode) && (
            <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
              <span>{t('optRounds')}</span>
              <OptionSelect
                className="w-24"
                aria-label={t('optRounds')}
                value={String(o.rounds)}
                items={roundItems([3, 5, 7, 10])}
                isDisabled={!isHost}
                onChange={(value) => setOption('rounds', Number(value))}
              />
            </label>
          )}
          {mode === 'speed' && (
            <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
              <span>{t('optFixedDrawer')}</span>
              <Switch
                isSelected={o.fixedDrawer}
                isDisabled={!isHost}
                aria-label={t('optFixedDrawer')}
                onChange={(checked) => setOption('fixedDrawer', checked)}
              />
            </label>
          )}
          {mode === 'speed' && o.fixedDrawer && (
            <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
              <span>{t('optDrawer')}</span>
              <OptionSelect
                className="w-32"
                aria-label={t('optDrawer')}
                value={String(o.fixedDrawerIndex)}
                items={playerItems}
                isDisabled={!isHost}
                onChange={(value) => setOption('fixedDrawerIndex', Number(value))}
              />
            </label>
          )}
          {showTeamToggle && (
            <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
              <span>{t('optTeamMode')}</span>
              <Switch
                isSelected={o.teamMode}
                isDisabled={!isHost}
                aria-label={t('optTeamMode')}
                onChange={(checked) => setOption('teamMode', checked)}
              />
            </label>
          )}
          {mode === 'coop' && (
            <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
              <span>{t('optScored')}</span>
              <Switch
                isSelected={o.scored}
                isDisabled={!isHost}
                aria-label={t('optScored')}
                onChange={(checked) => setOption('scored', checked)}
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
