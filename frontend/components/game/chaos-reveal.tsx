'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '../i18n-provider';
import { CHAOS_CHARACTERS, type ChaosCharacterId } from '../../lib/chaos';
import { ChaosCharacter } from './chaos-character';

const CHARACTER_IDS = CHAOS_CHARACTERS.map((item) => item.id);

interface ChaosRevealProps {
  character: ChaosCharacterId;
}

export function ChaosReveal({ character }: ChaosRevealProps) {
  const { t } = useI18n();
  const [displayCharacter, setDisplayCharacter] = useState<ChaosCharacterId>(CHARACTER_IDS[0]);
  const [isFinal, setIsFinal] = useState(false);
  const [isEmphasized, setIsEmphasized] = useState(false);

  useEffect(() => {
    const timers: number[] = [];
    const delays = [...Array(16).fill(100), 150, 200, 250, 300, 500];
    let elapsed = 0;
    let index = 0;

    setDisplayCharacter(CHARACTER_IDS[0]);
    setIsFinal(false);
    setIsEmphasized(false);

    delays.forEach((delay, step) => {
      elapsed += delay;
      timers.push(window.setTimeout(() => {
        if (step === delays.length - 1) {
          setDisplayCharacter(character);
          setIsFinal(true);
          setIsEmphasized(true);
          timers.push(window.setTimeout(() => setIsEmphasized(false), 180));
          return;
        }
        index = (index + 1) % CHARACTER_IDS.length;
        setDisplayCharacter(CHARACTER_IDS[index]);
      }, elapsed));
    });

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [character]);

  return (
    <section className="relative isolate grid min-h-[34rem] place-items-center overflow-hidden rounded-3xl border bg-surface p-6 text-foreground shadow-xl">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,color-mix(in_srgb,var(--palette-primary)_16%,transparent),transparent_64%)]" />
      <div className="space-y-7 text-center">
        <header className="space-y-2">
          <p className="font-mono text-xs font-bold tracking-[0.24em] text-danger">{t('chaosRevealTitle')}</p>
          <h1 className="text-2xl font-extrabold">{t('chaosRevealEyebrow')}</h1>
        </header>
        <div className={`transition-all duration-300 ${isFinal ? 'rounded-[2rem] ring-2 ring-danger/70 shadow-[0_0_48px_color-mix(in_srgb,var(--palette-danger)_36%,transparent)]' : ''} ${isEmphasized ? 'scale-110' : 'scale-100'} ${isFinal ? '' : '[&_figcaption>span]:hidden'}`}>
          <ChaosCharacter character={displayCharacter} size="large" state={isFinal ? 'success' : 'active'} />
        </div>
      </div>
    </section>
  );
}
