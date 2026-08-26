'use client';

import { useI18n } from '../i18n-provider';
import type { ChaosCharacterId } from '../../lib/chaos';
import { ChaosCharacter } from './chaos-character';

interface ChaosRevealProps {
  character: ChaosCharacterId;
}

export function ChaosReveal({ character }: ChaosRevealProps) {
  const { t } = useI18n();

  return (
    <section className="relative isolate grid min-h-[34rem] place-items-center overflow-hidden rounded-3xl border bg-surface p-6 text-foreground shadow-xl">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,color-mix(in_srgb,var(--palette-primary)_16%,transparent),transparent_64%)]" />
      <div className="space-y-7 text-center">
        <header className="space-y-2">
          <p className="font-mono text-xs font-bold tracking-[0.24em] text-danger">{t('chaosRevealTitle')}</p>
          <h1 className="text-2xl font-extrabold">{t('chaosRevealEyebrow')}</h1>
        </header>
        <ChaosCharacter character={character} size="large" state="active" />
      </div>
    </section>
  );
}
