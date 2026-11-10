// Bù đảo bị thiếu trong bản đồ 34 tỉnh (vd Côn Đảo) bằng đảo của bản 63 tỉnh cùng nguồn
// (Provinces_included_Paracel_SpratlyIslands.geojson của nguyenduy1133/Free-GIS-Data).
// Đảo nào ở bản 63 tỉnh mà cách mọi điểm của bản 34 tỉnh quá 3 km thì chép sang tỉnh mới tương ứng.
// Chạy: npx tsx tools/add-islands.mjs <p63.geojson> [--write]
import fs from 'node:fs';
import { findProvince } from '../src/game/provinces.ts';

const [, , p63File, write] = process.argv;
const out = new URL('../public/vn34.json', import.meta.url);
const vn = JSON.parse(fs.readFileSync(out, 'utf8'));
const p63 = JSON.parse(fs.readFileSync(p63File, 'utf8'));

// lưới 0.05 độ chứa các điểm của bản 34 tỉnh để tra nhanh khoảng cách
const grid = new Map();
const key = (x, y) => `${Math.floor(x / 0.05)},${Math.floor(y / 0.05)}`;
for (const f of vn.features) for (const poly of f.geometry.coordinates) for (const [x, y] of poly[0]) (grid.get(key(x, y)) ?? grid.set(key(x, y), []).get(key(x, y))).push([x, y]);
const nearKm = (x, y) => {
  let d = Infinity;
  const gx = Math.floor(x / 0.05), gy = Math.floor(y / 0.05);
  for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) for (const [px, py] of grid.get(`${gx + i},${gy + j}`) ?? []) d = Math.min(d, Math.hypot(px - x, py - y) * 111);
  return d;
};

const inRing = ([x, y], ring) => {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const insideVn = (pt) => vn.features.some((f) => f.geometry.coordinates.some((p) => inRing(pt, p[0])));

const added = [];
for (const f of p63.features) {
  const old = f.properties.Name;
  if (/paracel|spratly|hoang sa|truong sa/i.test(`${old} ${f.properties.Note ?? ''}`)) continue; // 2 quần đảo đã có trong bản 34 tỉnh
  const prov = findProvince(old.replace(/^(Thanh pho|Tinh)\s+/i, ''));
  if (!prov) { console.warn('Không đoán được tỉnh mới của', old); continue; }
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const poly of polys) {
    const ring = poly[0];
    const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length, cy = ring.reduce((s, p) => s + p[1], 0) / ring.length;
    const xs = ring.map((p) => p[0]), ys = ring.map((p) => p[1]);
    if (Math.max(...xs) - Math.min(...xs) > 0.6 || Math.max(...ys) - Math.min(...ys) > 0.6) continue; // không phải đảo
    if (insideVn([cx, cy]) || nearKm(cx, cy) < 3) continue; // bản 34 tỉnh đã có
    if (cx > 110) continue; // Hoàng Sa / Trường Sa đã vẽ trong khung riêng
    // lấy tối đa ~60 điểm cho nhẹ, làm tròn 4 số lẻ (~10 m)
    const step = Math.max(1, Math.floor(ring.length / 60));
    const slim = ring.filter((_, i) => i % step === 0).map(([x, y]) => [+x.toFixed(4), +y.toFixed(4)]);
    if (slim.length < 4) continue;
    slim.push(slim[0]);
    const target = vn.features.find((v) => v.properties.id === prov.id);
    target.geometry.coordinates.push([slim]);
    added.push(`${prov.name} <- ${old} (${cx.toFixed(2)}, ${cy.toFixed(2)})`);
  }
}
console.log(`Bù ${added.length} đảo:\n` + added.join('\n'));
if (write) fs.writeFileSync(out, JSON.stringify(vn));
