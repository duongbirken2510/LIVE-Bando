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
