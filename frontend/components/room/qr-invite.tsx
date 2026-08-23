'use client';

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

export default function QrInvite({ url, size = 240 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !url) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: size,
      margin: 1,
      color: {
        dark: getComputedStyle(document.documentElement).getPropertyValue('--palette-ink').trim() || '#080d2a',
        light: getComputedStyle(document.documentElement).getPropertyValue('--palette-surface-card').trim() || '#ffffff',
      },
    }).catch(() => {});
  }, [size, url]);

  return (
    <div className="flex justify-center rounded-xl border bg-white p-4">
      <canvas ref={canvasRef} />
    </div>
  );
}


