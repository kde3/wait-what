'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const LOBBY = '@LOBBY';

function wsUrl(channel, playerId) {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const params = new URLSearchParams({ code: channel, playerId: playerId ?? '' });
  return `${proto}//${window.location.host}/ws?${params}`;
}

// 웹소켓으로 채널을 구독하고, 연결이 안 되거나 끊기면 폴링으로 자동 폴백한다.
// onMessage는 ref로 잡아두어 콜백이 바뀌어도 재연결하지 않는다.
function useChannel(channel, playerId, { onMessage, poll, pollMs, enabled }) {
  const [live, setLive] = useState(false);
  const messageRef = useRef(onMessage);
  const pollRef = useRef(poll);

  useEffect(() => {
    messageRef.current = onMessage;
    pollRef.current = poll;
  });

  useEffect(() => {
    if (!enabled) return undefined;

    let closed = false;
    let socket = null;
    let retry = 0;
    let reconnectTimer = null;
    let pollTimer = null;

    const startPolling = () => {
      if (pollTimer) return;
      pollRef.current?.();
      pollTimer = setInterval(() => pollRef.current?.(), pollMs);
    };
    const stopPolling = () => {
      if (!pollTimer) return;
      clearInterval(pollTimer);
      pollTimer = null;
    };

    const connect = () => {
      if (closed) return;
      try {
        socket = new WebSocket(wsUrl(channel, playerId));
      } catch {
        startPolling();
        return;
      }

      socket.onopen = () => {
        retry = 0;
        setLive(true);
        stopPolling(); // 웹소켓이 살아있는 동안엔 폴링 중단
      };

      socket.onmessage = (event) => {
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }
        messageRef.current?.(msg);
      };

      socket.onerror = () => {};

      socket.onclose = () => {
        socket = null;
        setLive(false);
        if (closed) return;
        startPolling(); // 재연결될 때까지는 폴링으로 버틴다
        retry += 1;
        reconnectTimer = setTimeout(connect, Math.min(500 * 2 ** (retry - 1), 8000));
      };
    };

    connect();

    return () => {
      closed = true;
      clearTimeout(reconnectTimer);
      stopPolling();
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
    };
  }, [channel, playerId, enabled, pollMs]);

  return live;
}

// 방 상태 구독 — 최초 1회는 HTTP로 받아 첫 화면을 빨리 그린다.
export function useRoomState(code, playerId, enabled) {
  const [state, setState] = useState(null);
  const [gone, setGone] = useState(false);

  const fetchState = useCallback(async () => {
    if (!code) return;
    try {
      const res = await fetch(`/api/rooms/${code}/state?playerId=${encodeURIComponent(playerId ?? '')}`);
      if (!res.ok) {
        if (res.status === 404) setGone(true);
        return;
      }
      setState(await res.json());
    } catch {}
  }, [code, playerId]);

  const onMessage = useCallback((msg) => {
    if (msg.type === 'state') setState(msg.state);
    else if (msg.type === 'gone') setGone(true);
  }, []);

  useEffect(() => {
    if (enabled) fetchState();
  }, [enabled, fetchState]);

  const live = useChannel(code, playerId, { onMessage, poll: fetchState, pollMs: 1500, enabled: !!enabled });

  return { state, live, gone, refresh: fetchState };
}

// 로비 공개방 목록 구독
export function useLobbyRooms() {
  const [rooms, setRooms] = useState([]);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/rooms');
      if (res.ok) setRooms((await res.json()).rooms ?? []);
    } catch {}
  }, []);

  const onMessage = useCallback((msg) => {
    if (msg.type === 'lobby') setRooms(msg.rooms ?? []);
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const live = useChannel(LOBBY, '', { onMessage, poll: fetchRooms, pollMs: 4000, enabled: true });

  return { rooms, live };
}
