// 34 tỉnh, thành theo Nghị quyết 202/2025/QH15. `name` phải khớp cột TinhThanh của bản đồ (public/vn34.json).
// Alias: tên không dấu, viết tắt, tên tỉnh cũ đã sáp nhập, vài thành phố quen gọi.
// Thêm cách gọi mới: thêm vào chuỗi alias của tỉnh đó (viết không dấu, chữ thường).
export interface Province {
  id: string;
  name: string;
  aliases: string[];
}

export const PROVINCES: Province[] = [
  ['An Giang', 'an giang, kien giang, phu quoc, chau doc, rach gia, long xuyen, nam du, tho chu'],
  ['Bắc Ninh', 'bac ninh, bac giang'],
  ['Cà Mau', 'ca mau, bac lieu'],
  ['Cần Thơ', 'can tho, soc trang, hau giang'],
  ['Cao Bằng', 'cao bang'],
  ['Đà Nẵng', 'da nang, quang nam, hoi an, tam ky, hoang sa, cu lao cham'],
  ['Đắk Lắk', 'dak lak, daklak, dac lac, dak lac, phu yen, buon ma thuot, buon me thuot, bmt, tuy hoa'],
  ['Điện Biên', 'dien bien'],
  ['Đồng Nai', 'dong nai, binh phuoc, bien hoa'],
  ['Đồng Tháp', 'dong thap, tien giang, my tho, cao lanh, sa dec'],
  ['Gia Lai', 'gia lai, binh dinh, quy nhon, pleiku'],
  ['Hà Nội', 'ha noi, hanoi, hn, thu do'],
  ['Hà Tĩnh', 'ha tinh'],
  ['Hải Phòng', 'hai phong, hai duong, cat ba, bach long vi'],
  ['Huế', 'hue, thua thien hue, tt hue'],
  ['Hưng Yên', 'hung yen, thai binh'],
  ['Khánh Hòa', 'khanh hoa, ninh thuan, nha trang, phan rang, cam ranh, truong sa'],
  ['Lai Châu', 'lai chau'],
  ['Lâm Đồng', 'lam dong, dak nong, binh thuan, da lat, dalat, phan thiet, bao loc, phu quy'],
  ['Lạng Sơn', 'lang son'],
  ['Lào Cai', 'lao cai, yen bai, sa pa, sapa'],
  ['Nghệ An', 'nghe an, xu nghe'],
  ['Ninh Bình', 'ninh binh, ha nam, nam dinh'],
  ['Phú Thọ', 'phu tho, vinh phuc, hoa binh, viet tri'],
  ['Quảng Ngãi', 'quang ngai, kon tum, kontum, ly son'],
  ['Quảng Ninh', 'quang ninh, ha long, mong cai, cam pha, co to, van don'],
  ['Quảng Trị', 'quang tri, quang binh, dong hoi, con co'],
  ['Sơn La', 'son la'],
  ['Tây Ninh', 'tay ninh, long an'],
  ['Thái Nguyên', 'thai nguyen, bac kan, bac can'],
  ['Thanh Hóa', 'thanh hoa, xu thanh'],
  ['TP. Hồ Chí Minh', 'ho chi minh, tp hcm, tphcm, hcm, sai gon, saigon, sg, binh duong, ba ria vung tau, ba ria, vung tau, brvt, con dao, con son, thu duc'],
  ['Tuyên Quang', 'tuyen quang, ha giang'],
  ['Vĩnh Long', 'vinh long, ben tre, tra vinh'],
].map(([name, aliases]) => ({ id: slug(name), name, aliases: aliases.split(',').map((s) => s.trim()) }));

export const PROVINCE_BY_ID = new Map(PROVINCES.map((p) => [p.id, p]));

/**
 * Địa danh có tiếng (đảo, thành phố thuộc tỉnh): gõ tên thì MC gọi đúng tên đó, nói thuộc tỉnh nào,
 * camera bay thẳng tới đó; điểm vẫn cộng cho tỉnh. Toạ độ tâm gần đúng, span = cỡ khung nhìn (độ).
 * Vd "Hạ Long" là thành phố của tỉnh Quảng Ninh, không phải tên khác của Quảng Ninh.
 */
export interface Spot {
  name: string;
  pid: string;
  lon: number;
  lat: number;
  span: number;
  aliases: string[];
  city?: boolean; // thành phố / thị xã (không có thì là đảo)
  far?: boolean; // đảo ở Hoàng Sa / Trường Sa, ngoài khung bản đồ chính
}
const city = (name: string, pid: string, lon: number, lat: number, aliases: string[]): Spot => ({ name, pid, lon, lat, span: 0.7, aliases, city: true });
export const SPOTS: Spot[] = [
  city('Hạ Long', 'quang-ninh', 107.08, 20.95, ['ha long']),
  city('Móng Cái', 'quang-ninh', 107.97, 21.53, ['mong cai']),
  city('Nha Trang', 'khanh-hoa', 109.19, 12.24, ['nha trang']),
  city('Cam Ranh', 'khanh-hoa', 109.16, 11.92, ['cam ranh']),
  city('Phan Rang', 'khanh-hoa', 108.99, 11.57, ['phan rang']),
  city('Đà Lạt', 'lam-dong', 108.44, 11.94, ['da lat', 'dalat']),
  city('Phan Thiết', 'lam-dong', 108.1, 10.93, ['phan thiet']),
  city('Bảo Lộc', 'lam-dong', 107.81, 11.55, ['bao loc']),
  city('Vũng Tàu', 'tp-ho-chi-minh', 107.08, 10.35, ['vung tau']),
  city('Biên Hòa', 'dong-nai', 106.82, 10.95, ['bien hoa']),
  city('Sa Pa', 'lao-cai', 103.84, 22.34, ['sa pa', 'sapa']),
  city('Hội An', 'da-nang', 108.33, 15.88, ['hoi an']),
  city('Tam Kỳ', 'da-nang', 108.48, 15.57, ['tam ky']),
  city('Quy Nhơn', 'gia-lai', 109.22, 13.78, ['quy nhon']),
  city('Pleiku', 'gia-lai', 108.0, 13.98, ['pleiku']),
  city('Buôn Ma Thuột', 'dak-lak', 108.04, 12.67, ['buon ma thuot', 'buon me thuot', 'bmt']),
  city('Tuy Hòa', 'dak-lak', 109.32, 13.09, ['tuy hoa']),
  city('Châu Đốc', 'an-giang', 105.12, 10.7, ['chau doc']),
  city('Rạch Giá', 'an-giang', 105.09, 10.01, ['rach gia']),
  city('Long Xuyên', 'an-giang', 105.43, 10.39, ['long xuyen']),
  city('Mỹ Tho', 'dong-thap', 106.36, 10.36, ['my tho']),
  city('Cao Lãnh', 'dong-thap', 105.63, 10.46, ['cao lanh']),
  city('Sa Đéc', 'dong-thap', 105.76, 10.29, ['sa dec']),
  city('Việt Trì', 'phu-tho', 105.4, 21.32, ['viet tri']),
  city('Đồng Hới', 'quang-tri', 106.62, 17.47, ['dong hoi']),
  { name: 'Phú Quốc', pid: 'an-giang', lon: 103.97, lat: 10.23, span: 0.9, aliases: ['phu quoc'] },
  { name: 'Nam Du', pid: 'an-giang', lon: 104.35, lat: 9.68, span: 0.4, aliases: ['nam du'] },
  { name: 'Thổ Chu', pid: 'an-giang', lon: 103.47, lat: 9.3, span: 0.4, aliases: ['tho chu'] },
  { name: 'Côn Đảo', pid: 'tp-ho-chi-minh', lon: 106.61, lat: 8.69, span: 0.5, aliases: ['con dao', 'con son'] },
  { name: 'Cát Bà', pid: 'hai-phong', lon: 107.04, lat: 20.79, span: 0.45, aliases: ['cat ba'] },
  { name: 'Bạch Long Vĩ', pid: 'hai-phong', lon: 107.72, lat: 20.13, span: 0.35, aliases: ['bach long vi'] },
  { name: 'Cô Tô', pid: 'quang-ninh', lon: 107.77, lat: 20.98, span: 0.4, aliases: ['co to'] },
  { name: 'Vân Đồn', pid: 'quang-ninh', lon: 107.45, lat: 21.07, span: 0.5, aliases: ['van don'] },
  { name: 'Lý Sơn', pid: 'quang-ngai', lon: 109.12, lat: 15.38, span: 0.35, aliases: ['ly son'] },
  { name: 'Cù Lao Chàm', pid: 'da-nang', lon: 108.51, lat: 15.95, span: 0.35, aliases: ['cu lao cham'] },
  { name: 'Cồn Cỏ', pid: 'quang-tri', lon: 107.34, lat: 17.16, span: 0.35, aliases: ['con co'] },
  { name: 'Phú Quý', pid: 'lam-dong', lon: 108.94, lat: 10.52, span: 0.35, aliases: ['phu quy'] },
  // đảo nhỏ có người ở, nhiều bạn đi nghĩa vụ ở đây
  ...(
    [
      ['Hòn Khoai', 'ca-mau', 104.83, 8.43, ['hon khoai']],
      ['Hòn Chuối', 'ca-mau', 104.33, 8.95, ['hon chuoi']],
      ['Hòn Sơn', 'an-giang', 104.63, 9.8, ['hon son']],
      ['Hải Tặc', 'an-giang', 104.4, 10.26, ['dao hai tac']],
      ['Hòn Mê', 'thanh-hoa', 105.92, 19.38, ['hon me']],
      ['Hòn Ngư', 'nghe-an', 105.77, 18.8, ['hon ngu']],
      ['Hòn La', 'quang-tri', 106.52, 17.93, ['hon la']],
      ['Cù Lao Xanh', 'gia-lai', 109.35, 13.62, ['cu lao xanh']],
      ['Cù Lao Câu', 'lam-dong', 108.47, 11.22, ['cu lao cau']],
      ['Hòn Tre', 'khanh-hoa', 109.23, 12.21, ['hon tre']],
      ['Bình Ba', 'khanh-hoa', 109.24, 11.84, ['dao binh ba']],
      ['Bình Hưng', 'khanh-hoa', 109.25, 11.71, ['dao binh hung']],
      ['Quan Lạn', 'quang-ninh', 107.53, 21.02, ['quan lan']],
      ['Minh Châu', 'quang-ninh', 107.6, 20.98, ['dao minh chau']],
      ['Ngọc Vừng', 'quang-ninh', 107.43, 20.86, ['ngoc vung']],
      ['đảo Trần', 'quang-ninh', 108.01, 21.2, ['dao tran']],
      ['Cái Chiên', 'quang-ninh', 107.75, 21.33, ['cai chien']],
      ['Vĩnh Thực', 'quang-ninh', 108.03, 21.45, ['vinh thuc']],
      ['Long Châu', 'hai-phong', 107.12, 20.62, ['dao long chau']],
      ['Hòn Dấu', 'hai-phong', 106.8, 20.67, ['hon dau']],
    ] as const
  ).map(([name, pid, lon, lat, aliases]) => ({ name, pid, lon, lat, span: 0.3, aliases: [...aliases] })),
  // Hoàng Sa (TP. Đà Nẵng), Trường Sa (tỉnh Khánh Hòa): ngoài khung bản đồ chính, camera về cả nước + sáng khung đảo
  ...(
    [
      ['quần đảo Hoàng Sa', 'da-nang', 112.0, 16.4, ['quan dao hoang sa', 'hoang sa']],
      ['Phú Lâm', 'da-nang', 112.33, 16.83, ['dao phu lam']],
      ['Tri Tôn', 'da-nang', 111.2, 15.78, ['dao tri ton']],
      ['Linh Côn', 'da-nang', 112.73, 16.67, ['linh con']],
      ['quần đảo Trường Sa', 'khanh-hoa', 113.5, 9.8, ['quan dao truong sa', 'truong sa']],
      ['Trường Sa Lớn', 'khanh-hoa', 111.92, 8.64, ['truong sa lon']],
      ['Song Tử Tây', 'khanh-hoa', 114.33, 11.43, ['song tu tay']],
      ['Sinh Tồn', 'khanh-hoa', 114.33, 9.88, ['dao sinh ton']],
      ['Nam Yết', 'khanh-hoa', 114.36, 10.18, ['nam yet']],
      ['Sơn Ca', 'khanh-hoa', 114.48, 10.38, ['dao son ca']],
      ['An Bang', 'khanh-hoa', 112.92, 7.89, ['dao an bang']],
      ['Phan Vinh', 'khanh-hoa', 113.7, 8.95, ['dao phan vinh']],
      ['Đá Tây', 'khanh-hoa', 112.25, 8.85, ['dao da tay']],
      ['Len Đao', 'khanh-hoa', 114.27, 9.78, ['len dao']],
    ] as const
  ).map(([name, pid, lon, lat, aliases]) => ({ name, pid, lon, lat, span: 0.3, aliases: [...aliases], far: true })),
];
// cách gọi dài xét trước: "truong sa lon" trước "truong sa"
const SPOT_ALIASES = SPOTS.flatMap((s) => s.aliases.map((a) => ({ a: ` ${a} `, s }))).sort((x, y) => y.a.length - x.a.length);
/** Địa danh (đảo, thành phố) nhắc tới trong comment, nếu có */
export function findSpot(text: string): Spot | null {
  const t = ` ${norm(text)} `;
  return SPOT_ALIASES.find(({ a }) => t.includes(a))?.s ?? null;
}

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

// cách gọi tỉnh + tên địa danh (đảo, thành phố) quy về tỉnh của nó; tạo lần đầu dùng vì SPOTS khai báo phía dưới
let ALIASES: { a: string; p: Province }[] | null = null;
const aliases = () =>
  (ALIASES ??= [
    ...PROVINCES.flatMap((p) => p.aliases.map((a) => ({ a: ` ${a} `, p }))),
    ...SPOTS.flatMap((s) => s.aliases.map((a) => ({ a: ` ${a} `, p: PROVINCE_BY_ID.get(s.pid)! }))),
  ]);

/** Tỉnh nhắc tới đầu tiên trong comment; trùng vị trí thì lấy cách gọi dài hơn. Không có -> null */
export function findProvince(text: string): Province | null {
  const t = ` ${norm(text)} `;
  let best: { i: number; len: number; p: Province } | null = null;
  for (const { a, p } of aliases()) {
    const i = t.indexOf(a);
    if (i >= 0 && (!best || i < best.i || (i === best.i && a.length > best.len))) best = { i, len: a.length, p };
  }
  return best?.p ?? null;
}
