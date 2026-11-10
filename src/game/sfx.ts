import { IS_STAGE } from '../live/page';
import { voice } from '../live/voice';

/**
 * Âm thanh hiệu ứng tạo bằng Web Audio (không cần file).
 * Chỉ trang stage được phát tiếng (giống giọng MC); trang điều khiển im, trừ khi bấm "Nghe thử" (force).
 */
let ctx: AudioContext | null = null;
const VOLUME = 0.28; // nhỏ hơn giọng MC

/** Công tắc "Âm thanh toàn bộ" ở trang điều khiển: tắt thì mọi tiếng hiệu ứng im */
export const sound = { on: true };

function audio() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(c: AudioContext, out: AudioNode, freq: number, start: number, dur: number, type: OscillatorType, peak: number, toFreq?: number) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  if (toFreq) o.frequency.exponentialRampToValueAtTime(toFreq, start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(peak, start + Math.min(0.03, dur / 4));
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(out);
  o.start(start);
  o.stop(start + dur + 0.02);
}

/** Âm thanh quà theo mức (2-5), phát lúc đốm sáng chạm tỉnh: xu leng keng -> kèn ngắn -> pháo nổ -> kèn lớn + pháo */
export function playGift(tier: number, force = false) {
  if (tier < 2 || (!force && !(IS_STAGE && voice.enabled && sound.on))) return;
  try {
    const c = audio();
    const out = c.createGain();
    out.gain.value = VOLUME * (tier >= 4 ? 1.2 : 1);
    out.connect(c.destination);
    const t = c.currentTime + 0.05;
    // xu rơi leng keng: càng to càng nhiều tiếng
    const coins = [0, 0, 6, 10, 14, 20][tier];
    for (let i = 0; i < coins; i++) tone(c, out, 2400 + Math.random() * 1600, t + i * 0.07 + Math.random() * 0.04, 0.12, 'square', 0.05);
    // kèn chào: rê - fa# - la - rê (lên quãng tám)
    if (tier >= 3) {
      const notes = tier === 5 ? [587.3, 740, 880, 1174.7, 1480, 1760] : [587.3, 740, 880, 1174.7];
      notes.forEach((f, i) => tone(c, out, f, t + 0.1 + i * 0.12, i === notes.length - 1 ? 0.9 : 0.2, 'sawtooth', 0.09));
    }
    // pháo nổ: tiếng trầm "bụp" + tiếng rít
    const pops = [0, 0, 0, 0, 3, 8][tier];
    for (let i = 0; i < pops; i++) {
      const at = t + 0.3 + i * (tier === 5 ? 0.45 : 0.35);
      tone(c, out, 900, at - 0.25, 0.25, 'sine', 0.06, 2400);
      tone(c, out, 120, at, 0.35, 'sine', 0.5, 40);
      for (let k = 0; k < 4; k++) tone(c, out, 3000 + Math.random() * 2000, at + 0.05 + k * 0.05, 0.08, 'triangle', 0.05);
    }
  } catch {
    // không có Web Audio: bỏ qua
  }
}

/** Đốm sáng: tiếng vút lấp lánh trong lúc bay (flyMs), chạm tỉnh thì chuông "keng" */
export function playSpark(flyMs: number, force = false) {
  if (!force && !(IS_STAGE && voice.enabled && sound.on)) return;
  try {
    const c = audio();
    const out = c.createGain();
    out.gain.value = VOLUME;
    out.connect(c.destination);
    const t = c.currentTime + 0.02;
    const fly = flyMs / 1000;
    // vút: tiếng trượt lên rồi xuống theo vòng cung
    tone(c, out, 500, t, fly * 0.55, 'sine', 0.35, 1600);
    tone(c, out, 1600, t + fly * 0.5, fly * 0.5, 'sine', 0.25, 900);
    // lấp lánh dọc đường bay
    for (let i = 0; i < 9; i++) tone(c, out, 2200 + Math.random() * 1800, t + (i / 9) * fly, 0.09, 'triangle', 0.12);
    // chạm tỉnh: tiếng "bùm" nhẹ + chuông 3 nốt ngân
    const land = t + fly;
    tone(c, out, 140, land, 0.25, 'sine', 0.5, 60);
    for (const [f, p] of [
      [880, 0.35],
      [1318.5, 0.25],
      [1760, 0.18],
      [2637, 0.08],
    ] as const)
      tone(c, out, f, land, 1.4, 'sine', p);
    // tích điểm: 2 tiếng xu "ting ting"
    tone(c, out, 1975.5, land + 0.18, 0.18, 'square', 0.07);
    tone(c, out, 2637, land + 0.3, 0.35, 'square', 0.07);
  } catch {
    // trình duyệt không có Web Audio: bỏ qua, không làm đứng game
  }
}
