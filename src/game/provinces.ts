// 34 tỉnh, thành theo Nghị quyết 202/2025/QH15. `name` phải khớp cột TinhThanh của bản đồ (public/vn34.json).
// Alias: tên không dấu, viết tắt, tên tỉnh cũ đã sáp nhập, vài thành phố quen gọi.
// Thêm cách gọi mới: thêm vào chuỗi alias của tỉnh đó (viết không dấu, chữ thường).
export interface Province {
  id: string;
  name: string;
  aliases: string[];
}

export const PROVINCES: Province[] = [
  ['An Giang', 'an giang, kien giang, phu quoc, chau doc, rach gia, long xuyen'],
  ['Bắc Ninh', 'bac ninh, bac giang'],
  ['Cà Mau', 'ca mau, bac lieu'],
  ['Cần Thơ', 'can tho, soc trang, hau giang'],
  ['Cao Bằng', 'cao bang'],
  ['Đà Nẵng', 'da nang, quang nam, hoi an, tam ky, hoang sa'],
  ['Đắk Lắk', 'dak lak, daklak, dac lac, dak lac, phu yen, buon ma thuot, buon me thuot, bmt, tuy hoa'],
  ['Điện Biên', 'dien bien'],
  ['Đồng Nai', 'dong nai, binh phuoc, bien hoa'],
  ['Đồng Tháp', 'dong thap, tien giang, my tho, cao lanh, sa dec'],
  ['Gia Lai', 'gia lai, binh dinh, quy nhon, pleiku'],
  ['Hà Nội', 'ha noi, hanoi, hn, thu do'],
  ['Hà Tĩnh', 'ha tinh'],
  ['Hải Phòng', 'hai phong, hai duong'],
  ['Huế', 'hue, thua thien hue, tt hue'],
  ['Hưng Yên', 'hung yen, thai binh'],
  ['Khánh Hòa', 'khanh hoa, ninh thuan, nha trang, phan rang, cam ranh, truong sa'],
  ['Lai Châu', 'lai chau'],
  ['Lâm Đồng', 'lam dong, dak nong, binh thuan, da lat, dalat, phan thiet, bao loc'],
  ['Lạng Sơn', 'lang son'],
  ['Lào Cai', 'lao cai, yen bai, sa pa, sapa'],
  ['Nghệ An', 'nghe an, xu nghe'],
  ['Ninh Bình', 'ninh binh, ha nam, nam dinh'],
  ['Phú Thọ', 'phu tho, vinh phuc, hoa binh, viet tri'],
  ['Quảng Ngãi', 'quang ngai, kon tum, kontum'],
  ['Quảng Ninh', 'quang ninh, ha long, mong cai, cam pha'],
  ['Quảng Trị', 'quang tri, quang binh, dong hoi'],
  ['Sơn La', 'son la'],
  ['Tây Ninh', 'tay ninh, long an'],
  ['Thái Nguyên', 'thai nguyen, bac kan, bac can'],
  ['Thanh Hóa', 'thanh hoa, xu thanh'],
  ['TP. Hồ Chí Minh', 'ho chi minh, tp hcm, tphcm, hcm, sai gon, saigon, sg, binh duong, ba ria vung tau, ba ria, vung tau, brvt, con dao, thu duc'],
  ['Tuyên Quang', 'tuyen quang, ha giang'],
  ['Vĩnh Long', 'vinh long, ben tre, tra vinh'],
].map(([name, aliases]) => ({ id: slug(name), name, aliases: aliases.split(',').map((s) => s.trim()) }));

export const PROVINCE_BY_ID = new Map(PROVINCES.map((p) => [p.id, p]));

export function norm(s: string) {
  return String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
export function slug(name: string) {
  return norm(name).replace(/ /g, '-');
}

const ALIASES = PROVINCES.flatMap((p) => p.aliases.map((a) => ({ a: ` ${a} `, p })));

/** Tỉnh nhắc tới đầu tiên trong comment; trùng vị trí thì lấy cách gọi dài hơn. Không có -> null */
export function findProvince(text: string): Province | null {
  const t = ` ${norm(text)} `;
  let best: { i: number; len: number; p: Province } | null = null;
  for (const { a, p } of ALIASES) {
    const i = t.indexOf(a);
    if (i >= 0 && (!best || i < best.i || (i === best.i && a.length > best.len))) best = { i, len: a.length, p };
  }
  return best?.p ?? null;
}
