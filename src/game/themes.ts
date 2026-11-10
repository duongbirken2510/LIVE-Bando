// 20 giao diện bản đồ. Chọn ở trang điều khiển (khung "Chọn giao diện"), server nhớ trong settings.json.
// Mỗi giao diện chỉ là bộ màu + bo góc + kiểu chữ tiêu đề; bố cục giữ nguyên.
export interface Theme {
  id: string;
  name: string;
  bg1: string; // nền tối (hoặc sáng) chính
  bg2: string; // nền vùng giữa
  dust: string; // chấm hoa văn trên nền
  panel: string; // nền các khung
  line: string; // viền khung
  accent: string; // màu nhấn chính: tiêu đề, số điểm
  accent2: string; // màu nhấn phụ: nhãn giai đoạn, quà
  land: string; // tỉnh chưa sáng
  mapLine: string; // đường biên tỉnh
  pearl: string; // hạng 2, thẻ tên người chơi
  copper: string; // hạng 3
  ink: string; // chữ thường
  muted: string; // chữ phụ
  head1: string; // dải tiêu đề
  head2: string;
  headInk: string;
  label: string; // tên tỉnh trên bản đồ
  sea: string; // chữ Biển Đông
  serif: boolean; // tiêu đề chữ có chân (Playfair) hay không chân (Be Vietnam Pro)
  r: number; // bo góc khung
  lit: [string, string, string, string, string, string]; // 6 màu tỉnh sáng (tỉnh liền kề không trùng màu)
}

export const THEMES: Theme[] = [
  { id: 'son-mai', name: 'Sơn mài', bg1: '#1a0f0a', bg2: '#2a1610', dust: 'rgba(224,180,82,.10)', panel: 'rgba(26,15,10,.9)', line: '#8f6c33', accent: '#e0b452', accent2: '#b3261e', land: '#2e1d14', mapLine: 'rgba(224,180,82,.5)', pearl: '#dfe8e3', copper: '#c9773a', ink: '#f3e9d2', muted: '#b8a58a', head1: '#7d1812', head2: '#b3261e', headInk: '#fff3dc', label: '#fff8e6', sea: 'rgba(224,180,82,.42)', serif: true, r: 18, lit: ['#e3b04b', '#d2452f', '#3fa58a', '#e07a8f', '#9fc7c0', '#c9773a'] },
  { id: 'lua-do', name: 'Lụa đỏ', bg1: '#2a0608', bg2: '#4a0b10', dust: 'rgba(255,215,140,.10)', panel: 'rgba(40,6,10,.88)', line: '#b0773a', accent: '#ffd27a', accent2: '#e23b2e', land: '#3d1014', mapLine: 'rgba(255,210,130,.45)', pearl: '#ffe9d6', copper: '#f08a4b', ink: '#fff1e4', muted: '#d9a99a', head1: '#5c0a0d', head2: '#a3161b', headInk: '#ffe7b0', label: '#fff6e8', sea: 'rgba(255,210,130,.4)', serif: true, r: 22, lit: ['#ffd27a', '#ff8a5c', '#f6c1a0', '#ffb347', '#e86f8e', '#fff0c2'] },
  { id: 'bien-dem', name: 'Biển đêm', bg1: '#041526', bg2: '#0a2c4a', dust: 'rgba(140,210,255,.10)', panel: 'rgba(5,22,40,.88)', line: '#2f6d96', accent: '#7fd3ff', accent2: '#ff6f61', land: '#0f2f4a', mapLine: 'rgba(127,211,255,.45)', pearl: '#e3f4ff', copper: '#ffb36b', ink: '#e8f5ff', muted: '#8fb3cc', head1: '#062a4a', head2: '#0e4c7c', headInk: '#e3f4ff', label: '#ffffff', sea: 'rgba(127,211,255,.4)', serif: false, r: 14, lit: ['#7fd3ff', '#ffd166', '#06d6a0', '#ff6f91', '#b8f2e6', '#ffb36b'] },
  { id: 'ngoc-bich', name: 'Ngọc bích', bg1: '#04170f', bg2: '#0b2d1f', dust: 'rgba(150,240,190,.09)', panel: 'rgba(4,24,16,.88)', line: '#3b8a63', accent: '#9ff0c3', accent2: '#e8a33d', land: '#123a29', mapLine: 'rgba(159,240,195,.42)', pearl: '#eafff4', copper: '#e8a33d', ink: '#effff6', muted: '#96c4ad', head1: '#0b3a26', head2: '#13603f', headInk: '#eafff4', label: '#ffffff', sea: 'rgba(159,240,195,.38)', serif: true, r: 18, lit: ['#9ff0c3', '#f2d06b', '#5cc8a0', '#f59e85', '#c7f9e0', '#e8a33d'] },
  { id: 'hoa-sen', name: 'Hoa sen', bg1: '#1c0a1a', bg2: '#36122f', dust: 'rgba(255,180,220,.10)', panel: 'rgba(30,10,28,.88)', line: '#a0507f', accent: '#ffb3d1', accent2: '#e04f8a', land: '#3a1735', mapLine: 'rgba(255,179,209,.45)', pearl: '#fff0f6', copper: '#f5b971', ink: '#fff2f8', muted: '#d3a1bd', head1: '#4a1240', head2: '#8a2468', headInk: '#ffe3ef', label: '#fff8fb', sea: 'rgba(255,179,209,.4)', serif: true, r: 26, lit: ['#ffb3d1', '#f5d76e', '#9be3c8', '#ff7aa8', '#c9b6ff', '#f5b971'] },
  { id: 'thu-ha-noi', name: 'Thu Hà Nội', bg1: '#1c1206', bg2: '#33210b', dust: 'rgba(255,200,120,.10)', panel: 'rgba(30,19,7,.88)', line: '#a37a3a', accent: '#f4c06a', accent2: '#c8553d', land: '#3a2810', mapLine: 'rgba(244,192,106,.45)', pearl: '#fbefd9', copper: '#d98c3f', ink: '#fbf1df', muted: '#c2a77f', head1: '#4a2b0c', head2: '#8a5418', headInk: '#fff0d0', label: '#fff9ee', sea: 'rgba(244,192,106,.4)', serif: true, r: 16, lit: ['#f4c06a', '#d98c3f', '#a7c957', '#c8553d', '#f2e3bc', '#e9a36b'] },
  { id: 'tre-xanh', name: 'Tre xanh', bg1: '#0c1a0c', bg2: '#1a331a', dust: 'rgba(200,240,150,.09)', panel: 'rgba(12,26,12,.88)', line: '#5e8f3a', accent: '#cdeb8b', accent2: '#f0b33c', land: '#1f3d1f', mapLine: 'rgba(205,235,139,.42)', pearl: '#f2ffe6', copper: '#f0b33c', ink: '#f3fbe9', muted: '#a8c48f', head1: '#1d3f12', head2: '#356b1e', headInk: '#f2ffe6', label: '#ffffff', sea: 'rgba(205,235,139,.36)', serif: false, r: 10, lit: ['#cdeb8b', '#f0b33c', '#7cc47f', '#f28c5a', '#e8f5c8', '#9ad1d4'] },
  { id: 'gom-chu-dau', name: 'Gốm Chu Đậu', bg1: '#f2ece0', bg2: '#fbf8f1', dust: 'rgba(30,60,120,.08)', panel: 'rgba(255,252,245,.93)', line: '#2f4f8f', accent: '#1f3f8a', accent2: '#b0302a', land: '#e4dccb', mapLine: 'rgba(31,63,138,.5)', pearl: '#1f3f8a', copper: '#b86b2a', ink: '#1b2540', muted: '#5d6680', head1: '#1f3f8a', head2: '#2e5bb8', headInk: '#ffffff', label: '#1b2540', sea: 'rgba(31,63,138,.4)', serif: true, r: 20, lit: ['#2e5bb8', '#6d93d6', '#b0302a', '#3f8f8a', '#d9a441', '#8aa9e6'] },
  { id: 'giay-do', name: 'Giấy dó', bg1: '#efe6d2', bg2: '#f8f2e4', dust: 'rgba(80,50,20,.08)', panel: 'rgba(250,245,232,.93)', line: '#8a6a45', accent: '#a3261e', accent2: '#a3261e', land: '#e0d4bb', mapLine: 'rgba(60,40,20,.5)', pearl: '#2b2118', copper: '#8a5a2b', ink: '#2b2118', muted: '#6e5d49', head1: '#2b2118', head2: '#4a3a2a', headInk: '#f5e9d0', label: '#2b2118', sea: 'rgba(60,40,20,.35)', serif: true, r: 6, lit: ['#c0392b', '#d4a03c', '#5b8c5a', '#3c6e8f', '#b56576', '#8a5a2b'] },
  { id: 'hoang-hon', name: 'Hoàng hôn', bg1: '#1b0b24', bg2: '#3b1238', dust: 'rgba(255,170,120,.10)', panel: 'rgba(30,10,36,.86)', line: '#b0607a', accent: '#ffb86b', accent2: '#ff5e78', land: '#3a1a40', mapLine: 'rgba(255,184,107,.45)', pearl: '#ffe8de', copper: '#ff8f5a', ink: '#fff0ea', muted: '#d4a2b8', head1: '#ff6a3d', head2: '#b02a6b', headInk: '#fff3e0', label: '#fff8f2', sea: 'rgba(255,184,107,.4)', serif: false, r: 24, lit: ['#ffb86b', '#ff5e78', '#ffd56b', '#c77dff', '#ff8f5a', '#ffe0b5'] },
  { id: 'co-do', name: 'Cờ đỏ sao vàng', bg1: '#3a0606', bg2: '#6a0d0d', dust: 'rgba(255,221,0,.10)', panel: 'rgba(60,6,6,.88)', line: '#e0b000', accent: '#ffdd00', accent2: '#da251d', land: '#5a1212', mapLine: 'rgba(255,221,0,.5)', pearl: '#fff6cc', copper: '#ff9f1c', ink: '#fff8e0', muted: '#e3b0a0', head1: '#da251d', head2: '#b0150f', headInk: '#ffdd00', label: '#ffffff', sea: 'rgba(255,221,0,.42)', serif: false, r: 12, lit: ['#ffdd00', '#ffb000', '#fff3a0', '#ff9f1c', '#ffe066', '#ffc94d'] },
  { id: 'dem-trang', name: 'Đêm trăng', bg1: '#0b1020', bg2: '#1a2240', dust: 'rgba(220,230,255,.10)', panel: 'rgba(12,16,34,.86)', line: '#6c7aa8', accent: '#e6ecff', accent2: '#8aa2ff', land: '#1d2648', mapLine: 'rgba(230,236,255,.42)', pearl: '#ffffff', copper: '#c9b27c', ink: '#eef2ff', muted: '#9aa6c8', head1: '#1d2648', head2: '#34407a', headInk: '#f2f5ff', label: '#ffffff', sea: 'rgba(230,236,255,.35)', serif: true, r: 30, lit: ['#e6ecff', '#8aa2ff', '#c9b27c', '#7fd1c7', '#b9a6ff', '#ffd6a5'] },
  { id: 'hoi-an', name: 'Phố cổ Hội An', bg1: '#062320', bg2: '#0c3a35', dust: 'rgba(255,200,80,.10)', panel: 'rgba(6,34,31,.88)', line: '#b88a2e', accent: '#ffc94a', accent2: '#e5533d', land: '#114640', mapLine: 'rgba(255,201,74,.45)', pearl: '#fff2cc', copper: '#f28c28', ink: '#fdf6e3', muted: '#9fc2b8', head1: '#a8321f', head2: '#e5533d', headInk: '#ffe9a8', label: '#fffaf0', sea: 'rgba(255,201,74,.38)', serif: true, r: 18, lit: ['#ffc94a', '#e5533d', '#f28c28', '#ffe08a', '#ff7b6b', '#f6b26b'] },
  { id: 'ruong-bac-thang', name: 'Ruộng bậc thang', bg1: '#14170a', bg2: '#2a2f12', dust: 'rgba(240,220,120,.10)', panel: 'rgba(22,25,10,.88)', line: '#9a9a3a', accent: '#f2d16b', accent2: '#6aa84f', land: '#343a17', mapLine: 'rgba(242,209,107,.45)', pearl: '#f7f3d9', copper: '#d9a13f', ink: '#f7f5e6', muted: '#b8b58a', head1: '#3d4a14', head2: '#6a7d1f', headInk: '#fff6c7', label: '#fffbe8', sea: 'rgba(242,209,107,.38)', serif: false, r: 14, lit: ['#f2d16b', '#9ccc65', '#d9a13f', '#c5e17a', '#e6b85c', '#7cb342'] },
  { id: 'tim-hue', name: 'Tím Huế', bg1: '#170b26', bg2: '#2c1550', dust: 'rgba(210,180,255,.10)', panel: 'rgba(24,12,40,.88)', line: '#7d5bb5', accent: '#d9c2ff', accent2: '#f2b84b', land: '#2f1c55', mapLine: 'rgba(217,194,255,.45)', pearl: '#f6efff', copper: '#f2b84b', ink: '#f6f0ff', muted: '#a998c9', head1: '#3b1a6b', head2: '#5d2c9c', headInk: '#f6efff', label: '#ffffff', sea: 'rgba(217,194,255,.38)', serif: true, r: 22, lit: ['#d9c2ff', '#f2b84b', '#9f7aea', '#f687b3', '#b794f4', '#fbd38d'] },
  { id: 'ca-phe-sua', name: 'Cà phê sữa', bg1: '#1a110b', bg2: '#2e1f14', dust: 'rgba(230,200,160,.09)', panel: 'rgba(28,19,12,.88)', line: '#8a6a4a', accent: '#e8c9a0', accent2: '#c46a3a', land: '#3a2a1c', mapLine: 'rgba(232,201,160,.42)', pearl: '#f5e9da', copper: '#c46a3a', ink: '#f5ece0', muted: '#b39a80', head1: '#3a2414', head2: '#6b4428', headInk: '#f5e1c4', label: '#fff8ef', sea: 'rgba(232,201,160,.36)', serif: false, r: 20, lit: ['#e8c9a0', '#c46a3a', '#a67c52', '#f2b880', '#d9a066', '#efe0c8'] },
  { id: 'suong-som', name: 'Sương sớm', bg1: '#e6edf2', bg2: '#f6f9fb', dust: 'rgba(40,70,100,.07)', panel: 'rgba(255,255,255,.9)', line: '#7d98ad', accent: '#2f6690', accent2: '#d1495b', land: '#d5e0e8', mapLine: 'rgba(47,102,144,.45)', pearl: '#2f6690', copper: '#c97b3d', ink: '#1d2d3a', muted: '#5f7383', head1: '#2f6690', head2: '#3a7ca5', headInk: '#ffffff', label: '#1d2d3a', sea: 'rgba(47,102,144,.35)', serif: false, r: 16, lit: ['#3a7ca5', '#81c3d7', '#d1495b', '#edae49', '#66a182', '#9b72aa'] },
  { id: 'neon-sai-gon', name: 'Neon Sài Gòn', bg1: '#07060f', bg2: '#140f2a', dust: 'rgba(0,255,240,.08)', panel: 'rgba(10,8,22,.86)', line: '#ff2fb3', accent: '#2ff3ff', accent2: '#ff2fb3', land: '#17123a', mapLine: 'rgba(47,243,255,.5)', pearl: '#e9fbff', copper: '#ffd23f', ink: '#f0f6ff', muted: '#9aa0c8', head1: '#ff2fb3', head2: '#6a1bff', headInk: '#ffffff', label: '#ffffff', sea: 'rgba(47,243,255,.38)', serif: false, r: 4, lit: ['#2ff3ff', '#ff2fb3', '#ffd23f', '#7cff6b', '#a96bff', '#ff7a2f'] },
  { id: 'dong-co', name: 'Đồng cổ', bg1: '#120d08', bg2: '#241a10', dust: 'rgba(205,140,70,.10)', panel: 'rgba(22,16,10,.88)', line: '#9c6b3c', accent: '#d9a066', accent2: '#4f8a7a', land: '#2d2014', mapLine: 'rgba(217,160,102,.45)', pearl: '#f1e2cf', copper: '#b8733a', ink: '#f3e8da', muted: '#b39674', head1: '#3a2412', head2: '#6b4220', headInk: '#f1d6b0', label: '#fff6ea', sea: 'rgba(217,160,102,.38)', serif: true, r: 8, lit: ['#d9a066', '#4f8a7a', '#b8733a', '#e3c08d', '#7fae9c', '#c98a50'] },
  { id: 'muc-tau', name: 'Mực tàu', bg1: '#141414', bg2: '#242424', dust: 'rgba(255,255,255,.06)', panel: 'rgba(20,20,20,.9)', line: '#8a8a8a', accent: '#f2f2f2', accent2: '#c8102e', land: '#2c2c2c', mapLine: 'rgba(242,242,242,.4)', pearl: '#f2f2f2', copper: '#c8102e', ink: '#f2f2f2', muted: '#a0a0a0', head1: '#c8102e', head2: '#8f0b20', headInk: '#ffffff', label: '#ffffff', sea: 'rgba(242,242,242,.3)', serif: true, r: 2, lit: ['#f2f2f2', '#c8102e', '#9e9e9e', '#d9d9d9', '#e05a6d', '#bdbdbd'] },
];

export const DEFAULT_THEME = THEMES[0];
export const themeById = (id: string | null | undefined) => THEMES.find((t) => t.id === id) ?? DEFAULT_THEME;

/** Biến CSS cho khung .stage */
export function themeVars(t: Theme): Record<string, string> {
  return {
    '--bg1': t.bg1,
    '--bg2': t.bg2,
    '--dust': t.dust,
    '--panel': t.panel,
    '--line': t.line,
    '--accent': t.accent,
    '--accent2': t.accent2,
    '--land': t.land,
    '--map-line': t.mapLine,
    '--pearl': t.pearl,
    '--copper': t.copper,
    '--ink': t.ink,
    '--muted': t.muted,
    '--head1': t.head1,
    '--head2': t.head2,
    '--head-ink': t.headInk,
    '--label': t.label,
    '--sea': t.sea,
    '--r': `${t.r}px`,
    '--display': t.serif ? "'Playfair Display', Georgia, serif" : "'Be Vietnam Pro', system-ui, sans-serif",
  };
}
