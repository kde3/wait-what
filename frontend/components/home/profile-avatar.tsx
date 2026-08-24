'use client';

import { useEffect, useState } from 'react';
import { Avatar } from '@heroui/react';

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

const PROFILE_IMAGE_STORAGE_KEY = 'garticphone-profile-image';

interface ProfileAvatarProps {
  nickname?: string;
  imageUrl?: string;
  className?: string;
}

export function ProfileAvatar({ nickname = '익명', imageUrl, className }: ProfileAvatarProps) {
  const [selectedImage, setSelectedImage] = useState(imageUrl ?? '');

  useEffect(() => {
    if (imageUrl) {
      setSelectedImage(imageUrl);
      return;
    }

    window.localStorage.removeItem(PROFILE_IMAGE_STORAGE_KEY);
    const savedImage = window.sessionStorage.getItem(PROFILE_IMAGE_STORAGE_KEY);
    if (savedImage && CHARACTER_IMAGES.includes(savedImage as (typeof CHARACTER_IMAGES)[number])) {
      setSelectedImage(savedImage);
      return;
    }

    const randomImage = CHARACTER_IMAGES[Math.floor(Math.random() * CHARACTER_IMAGES.length)];
    window.sessionStorage.setItem(PROFILE_IMAGE_STORAGE_KEY, randomImage);
    setSelectedImage(randomImage);
  }, [imageUrl]);

  return (
    <Avatar className={className}>
      {selectedImage && <Avatar.Image alt={`${nickname} 프로필`} src={selectedImage} />}
    </Avatar>
  );
}
