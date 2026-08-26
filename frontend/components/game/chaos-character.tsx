'use client';

import Image from 'next/image';
import { Bug } from 'pixelarticons/react';
import { useI18n } from '../i18n-provider';
import {
  CHAOS_CHARACTER_BY_ID,
  type ChaosCharacterId,
  type ChaosCharacterState,
} from '../../lib/chaos';

type ChaosCharacterSize = 'small' | 'medium' | 'large';

interface ChaosCharacterProps {
  character: ChaosCharacterId;
  size?: ChaosCharacterSize;
  state?: ChaosCharacterState;
  className?: string;
}

const sizeClasses: Record<ChaosCharacterSize, { frame: string; avatar: string; code: string }> = {
  small: { frame: 'flex-row gap-2', avatar: 'size-12 rounded-xl', code: 'text-xs' },
  medium: { frame: 'flex-col gap-3 text-center', avatar: 'size-24 rounded-2xl', code: 'text-lg' },
  large: { frame: 'flex-col gap-4 text-center', avatar: 'size-40 rounded-[2rem]', code: 'text-2xl' },
};

export function ChaosCharacter({ character: characterId, size = 'medium', state = 'idle', className = '' }: ChaosCharacterProps) {
  const { t } = useI18n();
  const character = CHAOS_CHARACTER_BY_ID[characterId];
  const classes = sizeClasses[size];
  const color = `var(--palette-chaos-${character.colorKey})`;

  return (
    <figure className={`inline-flex items-center ${classes.frame} ${className}`} data-character={character.id} data-state={state}>
      <div
        className={`relative grid shrink-0 place-items-center overflow-hidden border-2 bg-surface-secondary shadow-lg ${classes.avatar}`}
        style={{ borderColor: color, boxShadow: `0 12px 32px color-mix(in srgb, ${color} 24%, transparent)` }}
      >
        {character.image ? (
          <Image src={character.image} alt={t(character.nameKey)} fill sizes={size === 'large' ? '160px' : size === 'medium' ? '96px' : '48px'} className="object-contain" />
        ) : (
          <>
            <span className="absolute top-2 h-3 w-1 rounded-full" style={{ backgroundColor: color }} />
            <span className="absolute top-1 size-2 rounded-full" style={{ backgroundColor: color }} />
            <div className="grid h-3/5 w-4/5 place-items-center rounded-xl border bg-[var(--palette-ink)] text-white">
              <Bug className="absolute size-1/3 opacity-20" aria-hidden="true" />
              <strong className={`${classes.code} relative z-10 max-w-full truncate px-1 font-extrabold tracking-tight`}>
                {t(character.nameKey)}
              </strong>
            </div>
            <span className="absolute bottom-2 h-1.5 w-1/2 rounded-full" style={{ backgroundColor: color }} />
          </>
        )}
      </div>
      <figcaption className={size === 'small' ? 'min-w-0' : 'max-w-sm'}>
        <strong className={size === 'large' ? 'block text-3xl' : 'block text-sm'}>{t(character.nameKey)}</strong>
        {size !== 'small' && (
          <>
            <span className="mt-1 block font-mono text-xs font-bold tracking-[0.16em]" style={{ color }}>
              {t(character.systemMessageKey)}
            </span>
            <span className="mt-2 block font-description text-sm text-muted">{t(character.descriptionKey)}</span>
          </>
        )}
      </figcaption>
    </figure>
  );
}
