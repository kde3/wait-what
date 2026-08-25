// WebAudio 기반 효과음/배경음악 — 오디오 파일 없이 런타임 합성한다.
let ctx = null;
let mutedCache = null;
let bgmAudio: HTMLAudioElement | null = null;
let desiredBgm: 'home' | 'play' | null = null;
let bgmResumeArmed = false;
let lifecycleBound = false;
let volumeCache = null;

const BGM_BASE_VOLUME = 0.3;
const DEFAULT_VOLUME = 0.6;

const BGM_SOURCES = {
  home: '/sounds/bgm/home.mp3',
  play: '/sounds/bgm/play.mp3',
} as const;

function armBgmResume() {
  if (bgmResumeArmed || typeof window === 'undefined') return;
  bgmResumeArmed = true;
  const resume = () => {
    bgmResumeArmed = false;
    window.removeEventListener('pointerdown', resume);
    window.removeEventListener('keydown', resume);
    if (desiredBgm && !isMuted()) playBgm(desiredBgm);
  };
  window.addEventListener('pointerdown', resume, { once: true });
  window.addEventListener('keydown', resume, { once: true });
}

function bindLifecycle() {
  if (lifecycleBound || typeof document === 'undefined') return;
  lifecycleBound = true;

  const suspend = () => {
    bgmAudio?.pause();
    if (ctx && ctx.state === 'running') void ctx.suspend();
  };

  const restore = () => {
    if (document.visibilityState !== 'visible') return;
    if (desiredBgm && !isMuted()) playBgm(desiredBgm);
  };

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) suspend();
    else restore();
  });
  window.addEventListener('pagehide', suspend);
  window.addEventListener('pageshow', restore);
  window.addEventListener('freeze', suspend);
}

export function isMuted() {
  if (mutedCache === null) {
    if (typeof window !== 'undefined') window.localStorage.removeItem('gp_muted');
    mutedCache = typeof window !== 'undefined' && window.sessionStorage.getItem('gp_muted') === '1';
  }
  return mutedCache;
}

export function getVolume() {
  if (volumeCache === null) {
    const raw = typeof window !== 'undefined' ? window.sessionStorage.getItem('gp_volume') : null;
    const parsed = raw === null ? NaN : Number(raw);
    volumeCache = Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : DEFAULT_VOLUME;
  }
  return volumeCache;
}

export function setVolume(v) {
  volumeCache = Math.min(1, Math.max(0, Number(v) || 0));
  try {
    window.sessionStorage.setItem('gp_volume', String(volumeCache));
  } catch {}
  if (bgmAudio) bgmAudio.volume = BGM_BASE_VOLUME * volumeCache;
}

export function setMuted(m) {
  mutedCache = !!m;
  try {
    window.sessionStorage.setItem('gp_muted', m ? '1' : '0');
  } catch {}
  if (m) {
    bgmAudio?.pause();
  } else if (desiredBgm) {
    playBgm(desiredBgm);
  }
}

function ac() {
  if (typeof window === 'undefined') return null;
  bindLifecycle();
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq, dur = 0.12, type = 'sine', gain = 0.12, delay = 0) {
  if (isMuted()) return;
  const level = gain * getVolume();
  if (level <= 0) return;
  const c = ac();
  if (!c) return;
  try {
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(level, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  } catch {}
}

export const sfx = {
  click: () => tone(700, 0.05, 'triangle', 0.07),
  pop: () => {
    tone(520, 0.06, 'sine', 0.1);
    tone(780, 0.08, 'sine', 0.08, 0.05);
  },
  submit: () => {
    tone(523, 0.08, 'sine', 0.11);
    tone(784, 0.12, 'sine', 0.11, 0.09);
  },
  correct: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.13, 'triangle', 0.12, i * 0.09)),
  wrong: () => tone(160, 0.25, 'sawtooth', 0.07),
  tick: () => tone(1250, 0.03, 'square', 0.045),
  start: () => [392, 523, 659].forEach((f, i) => tone(f, 0.1, 'triangle', 0.1, i * 0.08)),
  win: () => [523, 659, 784, 659, 1047, 1319].forEach((f, i) => tone(f, 0.15, 'triangle', 0.12, i * 0.11)),
};

export function playBgm(track: 'home' | 'play') {
  desiredBgm = track;
  if (typeof window === 'undefined' || isMuted()) return;
  bindLifecycle();
  if (document.visibilityState === 'hidden') return;

  const source = BGM_SOURCES[track];
  bgmAudio ??= new Audio();
  if (!bgmAudio.src.endsWith(source)) {
    bgmAudio.src = source;
    bgmAudio.currentTime = 0;
  }
  bgmAudio.loop = true;
  bgmAudio.volume = BGM_BASE_VOLUME * getVolume();
  void bgmAudio.play().catch(armBgmResume);
}

export function startBgm() {
  playBgm('play');
}

export function stopBgm() {
  desiredBgm = null;
  if (!bgmAudio) return;
  bgmAudio.pause();
  bgmAudio.currentTime = 0;
}
