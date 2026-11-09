// Dựng public/vn34.json từ Provinces.geojson (nguyenduy1133/Free-GIS-Data) đã rút gọn bằng mapshaper:
// npx mapshaper Provinces.geojson -each "TinhThanh = Ma=='31' ? 'Đồng Tháp' : TinhThanh" \
//   -filter-fields TinhThanh -simplify 8% keep-shapes -o precision=0.0001 s34.geojson
// (file gốc ghi nhầm mã 31 = Đồng Tháp thành "Lạng Sơn")
// Chạy: npx tsx tools/prep-map.mjs <s34.geojson>
import fs from 'node:fs';
import { PROVINCES } from '../src/game/provinces.ts';

const src = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const byName = new Map(PROVINCES.map(p => [p.name, p]));
const polysOf = g => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates);
const avgLon = poly => poly[0].reduce((s, c) => s + c[0], 0) / poly[0].length;

const out = [];
const islands = { 'da-nang': ['hoang-sa', 'Quần đảo Hoàng Sa', 110], 'khanh-hoa': ['truong-sa', 'Quần đảo Trường Sa', 110.5] };
for (const f of src.features) {
  const p = byName.get(f.properties.TinhThanh);
  if (!p) throw new Error('Tên tỉnh lạ: ' + f.properties.TinhThanh);
  let polys = polysOf(f.geometry);
  const isl = islands[p.id];
  if (isl) {
    out.push({ type: 'Feature', properties: { id: isl[0], name: isl[1], parent: p.id, island: true },
      geometry: { type: 'MultiPolygon', coordinates: polys.filter(q => avgLon(q) > isl[2]) } });
    polys = polys.filter(q => avgLon(q) <= isl[2]);
  }
  out.push({ type: 'Feature', properties: { id: p.id, name: p.name }, geometry: { type: 'MultiPolygon', coordinates: polys } });
}
if (out.filter(f => !f.properties.island).length !== 34) throw new Error('Thiếu tỉnh');

// Tô màu: tỉnh liền kề (chung đỉnh biên sau khi mapshaper giữ topology) không trùng màu.
const prov = out.filter(f => !f.properties.island);
const verts = prov.map(f => new Set(f.geometry.coordinates.flat(2).map(c => c.join(','))));
const adj = prov.map((_, i) => prov.map((_, j) => i !== j && [...verts[i]].some(v => verts[j].has(v))));
prov.forEach((f, i) => {
  const used = new Set(prov.map((g, j) => (adj[i][j] ? g.properties.color : -1)));
  let c = 0; while (used.has(c)) c++;
  f.properties.color = c;
});
const maxColor = Math.max(...prov.map(f => f.properties.color));
console.log('Số màu cần:', maxColor + 1, '| láng giềng Hà Nội:',
  prov.filter((_, j) => adj[prov.findIndex(f => f.properties.id === 'ha-noi')][j]).map(f => f.properties.name).join(', '));
fs.writeFileSync(new URL('../public/vn34.json', import.meta.url), JSON.stringify({ type: 'FeatureCollection', features: out }));
