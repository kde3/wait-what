'use client';

import { useEffect, useState } from 'react';
import { Avatar } from '@heroui/react';
import { Reload } from 'pixelarticons/react';

const CHARACTER_IMAGES = [
  '/images/characters/blueberry.png',
  '/images/characters/cherry.png',
  '/images/characters/grape.png',
  '/images/characters/green-apple.png',
  '/images/characters/peach.png',
  '/images/characters/pineapple.png',
  '/images/characters/strawberry.png',
  '/images/characters/tangerine.png',
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

  function nextImage() {
    const index = CHARACTER_IMAGES.indexOf(selectedImage as (typeof CHARACTER_IMAGES)[number]);
    const next = CHARACTER_IMAGES[(index + 1) % CHARACTER_IMAGES.length];
    window.sessionStorage.setItem(PROFILE_IMAGE_STORAGE_KEY, next);
    window.dispatchEvent(new CustomEvent(PROFILE_IMAGE_EVENT, { detail: next }));
  }

  const avatar = (
    <Avatar className={className}>
      {selectedImage && <Avatar.Image alt={`${nickname} 프로필`} src={selectedImage} />}
    </Avatar>
  );

  if (!changeable || imageUrl) return avatar;

  return (
    <div className="relative inline-flex">
      {avatar}
      <button
        type="button"
        aria-label={changeLabel}
        title={changeLabel}
        onClick={nextImage}
        className="absolute -right-1 -bottom-1 grid size-9 place-items-center rounded-full border-2 border-surface bg-primary text-white shadow-md transition-transform hover:scale-110 active:scale-95"
      >
        <Reload className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
