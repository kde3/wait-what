'use client';

import { apiUrl } from '../../lib/backend-url';
import type { ChaosCharacterId } from '../../lib/chaos';

interface ChaosAffectedImageProps {
  src: string;
  characterId?: ChaosCharacterId | null;
  alt?: string;
  className?: string;
}

function hashUrl(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededShuffle(seed: number) {
  const order = Array.from({ length: 9 }, (_, index) => index);
  let value = seed;
  for (let index = order.length - 1; index > 0; index--) {
    value = Math.imul(value ^ (value >>> 15), 2246822519) >>> 0;
    const target = value % (index + 1);
    [order[index], order[target]] = [order[target], order[index]];
  }
  return order;
}

export function ChaosAffectedImage({ src, characterId, alt = 'AI', className = '' }: ChaosAffectedImageProps) {
  const imageUrl = apiUrl(src);
  const seed = hashUrl(src);
  const frameClass = `relative aspect-[4/3] w-full overflow-hidden rounded-lg border bg-surface-secondary ${className}`;

  if (characterId === '404') {
    const side = seed % 4;
    const coverClasses = [
      'inset-y-0 left-0 w-[28%]',
      'inset-y-0 right-0 w-[28%]',
      'inset-x-0 top-0 h-[28%]',
      'inset-x-0 bottom-0 h-[28%]',
    ];
    return (
      <div className={frameClass}>
        <img className="size-full object-cover" src={imageUrl} alt={alt} />
        <div className={`absolute bg-surface ${coverClasses[side]}`} aria-hidden="true" />
      </div>
    );
  }

  if (characterId === 'glitch') {
    const order = seededShuffle(seed);
    return (
      <div className={`${frameClass} grid grid-cols-3`} role="img" aria-label={alt}>
        {order.map((sourceTile, displayTile) => {
          const column = sourceTile % 3;
          const row = Math.floor(sourceTile / 3);
          return (
            <div
              key={displayTile}
              className="bg-cover"
              style={{
                backgroundImage: `url(${JSON.stringify(imageUrl)})`,
                backgroundSize: '300% 300%',
                backgroundPosition: `${column * 50}% ${row * 50}%`,
              }}
            />
          );
        })}
      </div>
    );
  }

  if (characterId === 'pixel') {
    const origins = ['center', 'top left', 'top right', 'bottom left', 'bottom right'];
    const zoom = 1.5 + (seed % 4) * 0.1;
    return (
      <div className={frameClass}>
        <img
          className="size-full object-cover"
          src={imageUrl}
          alt={alt}
          style={{ transform: `scale(${zoom})`, transformOrigin: origins[seed % origins.length] }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1.5px)', backgroundSize: '8px 8px' }}
          aria-hidden="true"
        />
      </div>
    );
  }

  if (characterId === 'filter') {
    const presets = [
      'grayscale(0.75) contrast(1.2)',
      'sepia(0.65) saturate(1.35)',
      'hue-rotate(75deg) saturate(1.35)',
      'brightness(0.9) contrast(1.25) saturate(0.8)',
    ];
    return <img className={`w-full rounded-lg border object-cover ${className}`} src={imageUrl} alt={alt} style={{ filter: presets[seed % presets.length] }} />;
  }

  return <img className={`w-full rounded-lg border object-cover ${className}`} src={imageUrl} alt={alt} />;
}

export default ChaosAffectedImage;
