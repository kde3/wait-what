'use client';

import { useRef, useState } from 'react';

export function useGenerate(api, playerId, setImageUrl) {
  const [generating, setGenerating] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  async function generate(prompt) {
    if (!prompt.trim() || generating) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    setGenerating(true);
    const data = await api('generate', { playerId, prompt }, { signal: controller.signal });
    if (controllerRef.current !== controller) return;
    controllerRef.current = null;
    setGenerating(false);
    if (data?.url) setImageUrl(data.url);
  }

  function cancelGenerate() {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setGenerating(false);
  }

  return { generating, generate, cancelGenerate };
}
