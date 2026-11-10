/**
 * Words that must never be spoken or shown on the live (vulgar, sexual, drugs, gambling, violence, scams).
 * Matching uses the accented text, so ordinary words like "lớn", "các", "buổi", "đeo" are not caught.
 * shortcut: fixed list, misses creative spellings (l0n, đ.ị.t); extend BANNED_TOKENS when one slips through.
 */

// Single words, lowercase, compared token by token
const BANNED_TOKENS = new Set([
  // Vietnamese vulgar (accented) and unambiguous teen-code
  'lồn', 'lìn', 'cặc', 'buồi', 'đéo', 'địt', 'đụ', 'đĩ', 'cứt', 'đm', 'đmm', 'đcm', 'đkm',
  'dm', 'dmm', 'dcm', 'dkm', 'vcl', 'vkl', 'vcc', 'clgt', 'loz', 'dit', 'ditme', 'dume', 'cmm',
  'vl', 'vkl', 'cl', 'clm', 'ml', 'djt', 'đjt', 'chịch', 'nứng', 'phò', 'đĩ', 'lol', 'buoi', 'kặc', 'cak',
  // English
  'fuck', 'fck', 'fuk', 'shit', 'bitch', 'dick', 'pussy', 'sex', 'sexy', 'porn', 'nude', 'xxx', 'cave',
  // Violence, gambling, scams
  'giết', 'chém', 'casino', 'scam',
]);

// Multi-word phrases, compared on the lowercase text with single spaces
const BANNED_PHRASES = [
  'địt mẹ', 'đụ má', 'đù má', 'đéo mẹ', 'con đĩ', 'dit me', 'du ma', 'vãi lồn', 'óc chó', 'súc vật', 'mẹ mày', 'bố mày',
  'ma túy', 'ma tuý', 'thuốc lắc', 'cần sa', 'cá độ', 'lô đề', 'cờ bạc', 'chuyển khoản', 'lừa đảo',
];

const normalize = (text: string) => text.normalize('NFC').toLowerCase().replace(/\s+/g, ' ');
const tokensOf = (text: string) => normalize(text).split(/[^\p{L}\p{M}\p{N}]+/u).filter(Boolean);

export function containsBanned(text: string): boolean {
  if (!text) return false;
  const tokens = tokensOf(text);
  if (tokens.some((t) => BANNED_TOKENS.has(t))) return true;
  const joined = ` ${tokens.join(' ')} `;
  return BANNED_PHRASES.some((p) => joined.includes(` ${p} `));
}

/**
 * Kiểm tra gắt cho TÊN người chơi (tên chỉ để đọc / hiện, chặn nhầm thì gọi "bạn", không mất gì):
 * bỏ dấu, đổi số / ký hiệu thường dùng để lách (l0n, đ!t, @), gộp chữ lặp (loooon), bỏ dấu chấm chen giữa (đ.ị.t).
 * Không dùng cho câu MC hay comment thường: "các" bỏ dấu thành "cac" sẽ bị chặn nhầm.
 */
const RUDE_PLAIN = new Set([
  'lon', 'loz', 'lol', 'cak', 'kac', 'buoi', 'deo', 'dit', 'djt', 'dm', 'dmm', 'dcm', 'dkm', 'dume', 'duma',
  'ditme', 'vcl', 'vkl', 'vl', 'cl', 'clm', 'ml', 'cmm', 'cc', 'chich', 'nung', 'cave', 'sex', 'sexy', 'fuck', 'fck',
  'shit', 'bitch', 'dick', 'porn', 'xxx', 'nude',
]);
// cụm dài, tìm trong chữ đã viết liền (bắt cả "dit.me", "duma123")
const RUDE_SQUASHED = ['concac', 'ditme', 'ditcon', 'dume', 'duma', 'dumay', 'memay', 'bomay', 'sucvat', 'occho', 'oclon', 'vailon', 'lonme', 'buoime', 'clgt'];
const LEET: Record<string, string> = { '0': 'o', '1': 'i', '!': 'i', '|': 'i', '3': 'e', '4': 'a', '@': 'a', '$': 's', '5': 's', '7': 't', j: 'i' };

const plainRude = (text: string) =>
  text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[01!|3@$457j]/g, (c) => LEET[c] ?? c)
    .replace(/([a-z])\1+/g, '$1'); // loooon -> lon

export function isRudeName(text: string): boolean {
  if (!text) return false;
  if (containsBanned(text)) return true;
  const p = plainRude(text);
  const words = p.split(/[^a-z]+/).filter(Boolean);
  if (words.some((w) => RUDE_PLAIN.has(w))) return true;
  // đ.ị.t / l o n: các chữ cái lẻ đứng liền nhau thì ghép lại xét
  const singles = p.split(/[^a-z]+/).map((w) => (w.length === 1 ? w : ' ')).join('').split(' ');
  if (singles.some((w) => w.length > 1 && RUDE_PLAIN.has(w))) return true;
  const squashed = p.replace(/[^a-z]/g, '');
  return RUDE_SQUASHED.some((r) => squashed.includes(r));
}

// For text shown on screen: banned words become ***
export function maskBanned(text: string): string {
  if (!containsBanned(text)) return text;
  let out = text.replace(/[\p{L}\p{M}\p{N}]+/gu, (w) => (BANNED_TOKENS.has(w.normalize('NFC').toLowerCase()) ? '***' : w));
  for (const p of BANNED_PHRASES) {
    out = out.replace(new RegExp(p.replace(/ /g, '\\s+'), 'giu'), '***');
  }
  return out;
}
