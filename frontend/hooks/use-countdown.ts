'use client';

import { useEffect, useState } from 'react';

// 서버 remaining을 받아 초 단위로 로컬 카운트다운.
// resetKey가 바뀌면 라운드가 넘어간 것으로 보고 서버 값으로 다시 맞춘다.
export function useCountdown(serverRemaining, resetKey) {
  const [remaining, setRemaining] = useState(serverRemaining ?? 0);

  useEffect(() => {
    setRemaining(serverRemaining ?? 0);
  }, [serverRemaining, resetKey]);

  useEffect(() => {
    const timer = setInterval(() => setRemaining((r) => (r > 0 ? r - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  return remaining;
}
