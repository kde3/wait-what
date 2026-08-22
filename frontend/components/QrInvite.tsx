'use client';

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

export default function QrInvite({ url }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !url) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: 180,
      margin: 1,
      color: { dark: '#234634', light: '#ffffff' },
    }).catch(() => {});
  }, [url]);

  return (
    <div className="mt-3 flex justify-center rounded-lg border bg-white p-4">
      <canvas ref={canvasRef} />
    </div>
  );
}


