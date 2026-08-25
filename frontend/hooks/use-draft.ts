'use client';

import { useEffect, useState } from 'react';

export function useDraft(draft, resetKey) {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState(null);
  useEffect(() => {
    setPrompt(draft?.prompt ?? '');
    setImageUrl(draft?.url ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);
  return { prompt, setPrompt, imageUrl, setImageUrl };
}
