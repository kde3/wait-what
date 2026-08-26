'use client';

import { useEffect, useState } from 'react';
import { Avatar } from '@heroui/react';
import { Reload } from 'pixelarticons/react';

const CHARACTER_IMAGES = [
  '/images/characters/404.png',
  '/images/characters/FILTER.png',
  '/images/characters/GLITCH.png',
  '/images/characters/NULL.png',
  '/images/characters/PIXEL.png',
  '/images/characters/RETRY.png',
  '/images/characters/TIMEOUT.png',
] as const;

const PROFILE_IMAGE_STORAGE_KEY = 'ww_profile_image';

const PROFILE_IMAGE_EVENT = 'ww:profile-image';

interface ProfileAvatarProps {
  nickname?: string;
  imageUrl?: string;
  className?: string;
  changeable?: boolean;
  changeLabel?: string;
}

export function ProfileAvatar({ nickname = '익명', imageUrl, className, changeable = false, changeLabel = '프로필 변경' }: ProfileAvatarProps) {
  const [selectedImage, setSelectedImage] = useState(imageUrl ?? '');
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  useEffect(() => {
    if (imageUrl) {
      setSelectedImage(imageUrl);
      return;
    }

    const savedImage = window.sessionStorage.getItem(PROFILE_IMAGE_STORAGE_KEY);
    if (savedImage && CHARACTER_IMAGES.includes(savedImage as (typeof CHARACTER_IMAGES)[number])) {
      setSelectedImage(savedImage);
    } else {
      const randomImage = CHARACTER_IMAGES[Math.floor(Math.random() * CHARACTER_IMAGES.length)];
      window.sessionStorage.setItem(PROFILE_IMAGE_STORAGE_KEY, randomImage);
      setSelectedImage(randomImage);
    }

    const sync = (event: Event) => setSelectedImage((event as CustomEvent<string>).detail);
    window.addEventListener(PROFILE_IMAGE_EVENT, sync);
    return () => window.removeEventListener(PROFILE_IMAGE_EVENT, sync);
  }, [imageUrl]);

  function selectImage(image: (typeof CHARACTER_IMAGES)[number]) {
    window.sessionStorage.setItem(PROFILE_IMAGE_STORAGE_KEY, image);
    window.dispatchEvent(new CustomEvent(PROFILE_IMAGE_EVENT, { detail: image }));
    setSelectedImage(image);
    setIsPickerOpen(false);
  }

  const avatar = (
    <Avatar className={className}>
      {selectedImage && <Avatar.Image alt={`${nickname} 프로필`} src={selectedImage} />}
    </Avatar>
  );

  if (!changeable || imageUrl) return avatar;

  return (
    <>
      <div className="relative inline-flex">
        {avatar}
        <button
          type="button"
          aria-label={changeLabel}
          title={changeLabel}
          onClick={() => setIsPickerOpen(true)}
          className="absolute -right-1 -bottom-1 grid size-9 place-items-center rounded-full border-2 border-surface bg-primary text-white shadow-md transition-transform hover:scale-110 active:scale-95"
        >
          <Reload className="size-4" aria-hidden="true" />
        </button>
      </div>

      {isPickerOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4" onClick={() => setIsPickerOpen(false)}>
          <section className="w-full max-w-sm rounded-2xl border bg-surface p-5 text-foreground shadow-xl" role="dialog" aria-modal="true" aria-label={changeLabel} onClick={(event) => event.stopPropagation()}>
            <h2 className="text-center text-lg font-bold">{changeLabel}</h2>
            <div className="mt-5 grid grid-cols-4 gap-3">
              {CHARACTER_IMAGES.map((image) => (
                <button
                  key={image}
                  type="button"
                  aria-label={`${image.split('/').pop()?.replace('.png', '')} 선택`}
                  onClick={() => selectImage(image)}
                  className={`rounded-xl border-2 p-1 transition-transform hover:scale-105 active:scale-95 ${selectedImage === image ? 'border-primary ring-2 ring-primary/30' : 'border-transparent'}`}
                >
                  <Avatar className="size-full aspect-square">
                    <Avatar.Image alt="프로필 아바타" src={image} />
                  </Avatar>
                </button>
              ))}
            </div>
            <div className="mt-5 text-right">
              <button type="button" onClick={() => setIsPickerOpen(false)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-surface-secondary">
                닫기
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
