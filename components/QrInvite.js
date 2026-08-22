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
      color: { dark: '#0b1d51', light: '#ffffff' },
    }).catch(() => {});
  }, [url]);

  return (
    <div className="qr-box">
      <canvas ref={canvasRef} />
    </div>
  );
}
