import { voice } from '../live/voice';

/**
 * Nhạc nền tự soạn bằng Web Audio (không dùng file, không vướng bản quyền):
 * giai điệu ngũ cung (Rê - Mi - Sol - La - Si), bass, trống, hi-hat, 116 nhịp/phút, lặp 4 ô nhịp.
 * MC đang nói thì nhạc tự nhỏ lại. Chỉ trang stage bật (xem GameStage).
 */
const BPM = 116;
const STEP = 60 / BPM / 2; // 1 bước = nốt móc đơn
const SCALE = [293.66, 329.63, 392.0, 440.0, 493.88, 587.33, 659.25]; // D4 E4 G4 A4 B4 D5 E5
// 4 ô nhịp x 8 móc đơn, -1 = nghỉ
const MELODY = [3, -1, 5, 4, 3, 2, 3, -1, 2, 1, 0, -1, 1, 2, 3, -1, 3, -1, 5, 6, 5, 4, 3, -1, 4, 3, 2, 1, 0, -1, 0, -1];
const BASS = [73.42, 98.0, 110.0, 73.42]; // D2 G2 A2 D2, mỗi ô nhịp 1 nốt gốc

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let timer = 0;
let step = 0;
let nextAt = 0;
let volume = 0.3;

function env(c: AudioContext, out: AudioNode, at: number, dur: number, peak: number) {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  g.connect(out);
  return g;
}
function osc(c: AudioContext, out: AudioNode, type: OscillatorType, f: number, at: number, dur: number, peak: number, toF?: number) {
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f, at);
  if (toF) o.frequency.exponentialRampToValueAtTime(toF, at + dur);
  o.connect(env(c, out, at, dur, peak));
  o.start(at);
  o.stop(at + dur + 0.02);
}
function hit(c: AudioContext, out: AudioNode, at: number, dur: number, peak: number, type: BiquadFilterType, f: number) {
  const s = c.createBufferSource();
  s.buffer = noise;
  const filt = c.createBiquadFilter();
  filt.type = type;
  filt.frequency.value = f;
  s.connect(filt).connect(env(c, out, at, dur, peak));
  s.start(at);
  s.stop(at + dur + 0.02);
}

function schedule() {
  if (!ctx || !master) return;
  // MC đang nói: nhạc nhỏ còn 35%. Mở 2 trang stage thì chỉ trang được phát tiếng (mở sau cùng) có nhạc, tránh 2 lớp nhạc
  const on = voice.enabled ? 1 : 0;
  master.gain.setTargetAtTime(on * volume * (voice.busy ? 0.35 : 1) * 0.5, ctx.currentTime, 0.25);
  while (nextAt < ctx.currentTime + 0.15) {
    const t = nextAt;
    const s = step % 32;
    const bar = Math.floor(s / 8);
    const n = MELODY[s];
    if (n >= 0) {
      osc(ctx, master, 'triangle', SCALE[n], t, STEP * 1.6, 0.22);
      osc(ctx, master, 'sine', SCALE[n] * 2, t, STEP * 0.8, 0.05); // ánh kim nhẹ
    }
    if (s % 2 === 1) osc(ctx, master, 'triangle', BASS[bar], t, STEP * 0.9, 0.28); // bass nảy ở phách nghịch
    if (s % 4 === 0) osc(ctx, master, 'sine', 140, t, 0.18, 0.7, 45); // trống trầm
    if (s % 4 === 2) hit(ctx, master, t, 0.12, 0.25, 'bandpass', 1800); // vỗ tay
    hit(ctx, master, t, 0.04, s % 2 ? 0.12 : 0.06, 'highpass', 7000); // hi-hat
    nextAt += STEP;
    step++;
  }
}

export function startMusic(vol: number) {
  volume = vol;
  if (timer) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    if (!noise) {
      noise = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    nextAt = ctx.currentTime + 0.1;
    step = 0;
    timer = window.setInterval(schedule, 50);
  } catch {
    // không có Web Audio: thôi, không làm đứng game
  }
}

export function stopMusic() {
  clearInterval(timer);
  timer = 0;
  if (ctx && master) {
    const m = master;
    m.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
    setTimeout(() => m.disconnect(), 1200);
  }
  master = null;
}

export function setMusicVolume(vol: number) {
  volume = vol;
}

// Trình duyệt chặn tự phát tiếng khi chưa ai bấm vào trang: bấm 1 lần là nhạc chạy
if (typeof window !== 'undefined') window.addEventListener('pointerdown', () => void ctx?.resume(), { passive: true });
