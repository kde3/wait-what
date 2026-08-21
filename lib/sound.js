// WebAudio 기반 효과음/배경음악 — 오디오 파일 없이 런타임 합성한다.
let ctx = null;
let mutedCache = null;
let bgmTimer = null;

export function isMuted() {
  if (mutedCache === null) {
    mutedCache = typeof window !== 'undefined' && window.localStorage.getItem('gp_muted') === '1';
  }
  return mutedCache;
}

export function setMuted(m) {
  mutedCache = !!m;
  try {
    window.localStorage.setItem('gp_muted', m ? '1' : '0');
  } catch {}
  if (m) stopBgm();
}

function ac() {
  if (typeof window === 'undefined') return null;
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
  const c = ac();
  if (!c) return;
  try {
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.015);
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

// 잔잔한 생성형 배경음악 (펜타토닉 랜덤 노트)
export function startBgm() {
  if (isMuted() || bgmTimer || !ac()) return;
  const notes = [262, 294, 330, 392, 440, 523, 587];
  bgmTimer = setInterval(() => {
    if (isMuted()) return;
    const f = notes[Math.floor(Math.random() * notes.length)];
    tone(f, 1.8, 'sine', 0.02);
    tone(f / 2, 1.8, 'sine', 0.015);
  }, 1500);
}

export function stopBgm() {
  if (bgmTimer) clearInterval(bgmTimer);
  bgmTimer = null;
}
