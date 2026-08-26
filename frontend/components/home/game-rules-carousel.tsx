'use client';

import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'pixelarticons/react';
import { useI18n } from '../i18n-provider';
import { Button } from '../ui/button';

const RULES = [
  { id: 'classic', src: '/images/rules/classic.png', label: 'modeClassic', square: false },
  { id: 'speed', src: '/images/rules/speed-quiz.png', label: 'modeSpeed', square: false },
  { id: 'chaos', src: '/images/rules/chaos.png', label: 'modeChaos', square: true },
  { id: 'imposter', src: '/images/rules/imposter.png', label: 'modeImposter', square: true },
] as const;

const STEPS_PER_MODE = 4;
const TOTAL_SLIDES = RULES.length * STEPS_PER_MODE;

export function GameRulesCarousel() {
  const { t } = useI18n();
  const [slide, setSlide] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const modeIndex = Math.floor(slide / STEPS_PER_MODE);
  const stepIndex = slide % STEPS_PER_MODE;
  const rule = RULES[modeIndex];

  function move(delta: number) {
    setSlide((current) => (current + delta + TOTAL_SLIDES) % TOTAL_SLIDES);
  }

  function finishSwipe(clientX: number) {
    if (touchStartX.current == null) return;
    const distance = clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(distance) >= 45) move(distance < 0 ? 1 : -1);
  }

  return (
    <section className="flex min-h-[360px] flex-col justify-center gap-4 py-4" aria-label={t('gameGuide')}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-foreground">{t(rule.label)}</h2>
          <p className="font-description text-sm text-muted">{stepIndex + 1} / {STEPS_PER_MODE}</p>
        </div>
        <div className="flex gap-1">
          <Button type="button" isIconOnly variant="tertiary" onClick={() => move(-1)} aria-label={t('previous')}>
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Button>
          <Button type="button" isIconOnly variant="tertiary" onClick={() => move(1)} aria-label={t('next')}>
            <ArrowRight className="size-5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div
        className={`relative mx-auto w-full touch-pan-y overflow-hidden rounded-xl bg-[var(--palette-ink)] shadow-[0_12px_32px_color-mix(in_srgb,var(--palette-ink)_20%,transparent)] ${rule.square ? 'aspect-square max-w-[360px]' : 'aspect-[3/4] max-w-[300px] sm:max-w-[330px]'}`}
        onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; }}
        onTouchEnd={(event) => finishSwipe(event.changedTouches[0]?.clientX ?? 0)}
      >
        <img
          key={rule.id}
          src={rule.src}
          alt={`${t(rule.label)} ${stepIndex + 1}`}
          className="pointer-events-none absolute inset-y-0 h-full w-[400%] max-w-none select-none object-fill transition-[left] duration-300"
          style={{ left: `${stepIndex * -100}%` }}
          draggable={false}
        />
      </div>

      <div className="grid grid-cols-4 gap-2" aria-label={t('modeTitle')}>
        {RULES.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`truncate rounded-lg px-2 py-2 text-xs font-bold transition ${index === modeIndex ? 'bg-[var(--palette-secondary-strong)] text-white' : 'bg-[var(--palette-control-tint)] text-[var(--palette-text-secondary)] hover:bg-[var(--palette-control-hover)]'}`}
            onClick={() => setSlide(index * STEPS_PER_MODE)}
          >
            {t(item.label)}
          </button>
        ))}
      </div>

      <div className="flex justify-center gap-1.5" aria-hidden="true">
        {Array.from({ length: STEPS_PER_MODE }, (_, index) => (
          <span key={index} className={`size-2 rounded-full ${index === stepIndex ? 'bg-[var(--palette-primary)]' : 'bg-[var(--palette-border-soft)]'}`} />
        ))}
      </div>
    </section>
  );
}
