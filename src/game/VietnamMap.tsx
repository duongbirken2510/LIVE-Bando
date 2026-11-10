import { useEffect, useRef, useState } from 'react';
import { geoArea, geoMercator, geoPath } from 'd3-geo';
import { interpolateZoom, type ZoomView } from 'd3-interpolate';
import type { Visit } from './useGame';
import { Avatar } from './Avatar';
import { PROVINCE_BY_ID } from './provinces';
import { GAME } from './config';

// Bản đồ 34 tỉnh, thành (public/vn34.json, dựng bằng tools/prep-map.mjs).
// Hoàng Sa (TP. Đà Nẵng) và Trường Sa (tỉnh Khánh Hòa) vẽ đúng vị trí thật trên bản đồ chính, sáng cùng tỉnh của mình.

type Props = { id: string; name: string; color?: number; island?: boolean; parent?: string };
type Feat = GeoJSON.Feature<GeoJSON.MultiPolygon, Props>;

export const MAP_W = 1080;
export const MAP_H = 1470; // kéo xuống sát thanh dưới: phần dưới bị chat che lúc nhìn cả nước, zoom vào tỉnh thì camera đưa lên giữa
// Bản đồ là nhân vật chính: chữ S cao gần hết khung. Thẻ "Vừa gọi tên quê" nằm ở khoảng trống bên trái (vùng Lào),
// cột thẻ bên phải từ x = 720. Tỉnh đang ghé hiện giữa 2 bên.
const FOCUS_X = 505;
const FOCUS_W = 420;

const mapData: Promise<GeoJSON.FeatureCollection<GeoJSON.MultiPolygon, Props>> = fetch('/vn34.json').then((r) => r.json());

interface Prov {
  id: string;
  name: string;
  d: string;
  color: number; // chỉ số màu (tỉnh liền kề khác nhau), màu thật theo giao diện
  c: [number, number];
  b: [[number, number], [number, number]];
}

// GeoJSON chuẩn vẽ vòng ngoài ngược chiều kim đồng hồ, d3-geo cần cùng chiều; sai chiều thì d3 hiểu thành "cả địa cầu trừ tỉnh này"
function fixWinding(f: Feat) {
  f.geometry.coordinates = f.geometry.coordinates.map((poly) =>
    geoArea({ type: 'Polygon', coordinates: poly }) > 2 * Math.PI ? poly.map((ring) => [...ring].reverse()) : poly,
  );
}

function prepare(fc: GeoJSON.FeatureCollection<GeoJSON.MultiPolygon, Props>) {
  fc.features.forEach((f) => fixWinding(f as Feat));
  const main = fc.features.filter((f) => !f.properties.island) as Feat[];
  // đất liền vừa chiều cao khung, dồn sát mép trái; phần biển bên phải dành cho Hoàng Sa, Trường Sa và cột thẻ
  const mainFc = { type: 'FeatureCollection', features: main } as const;
  const proj = geoMercator().fitExtent([[0, 30], [2000, MAP_H - 30]], mainFc);
  const left = geoPath(proj).bounds(mainFc)[0][0];
  const [tx, ty] = proj.translate();
  proj.translate([tx - left + 30, ty]);
  const path = geoPath(proj);
  const provs: Prov[] = main.map((f) => {
    // tâm và khung zoom theo mảnh đất liền lớn nhất (bỏ đảo nhỏ ra xa)
    const parts = f.geometry.coordinates.map((c) => ({ type: 'Polygon', coordinates: c }) as GeoJSON.Polygon);
    const big = parts.reduce((a, b) => (geoArea(b) > geoArea(a) ? b : a));
    return {
      id: f.properties.id,
      name: f.properties.name,
      d: path(f) ?? '',
      color: f.properties.color ?? 0,
      c: path.centroid(big) as [number, number],
      b: path.bounds(big) as [[number, number], [number, number]],
    };
  });
  const at = (lon: number, lat: number) => proj([lon, lat]) as [number, number];
  const islands = Object.fromEntries(
    fc.features
      .filter((f) => f.properties.island)
      .map((f) => [f.properties.id, f as Feat]),
  ) as Record<'hoang-sa' | 'truong-sa', Feat>;
  // Hoàng Sa, Trường Sa thật nằm rất xa (vẽ đúng chỗ thì cả nước phải thu nhỏ lại): vẽ thu gọn ngoài khơi
  // TP. Đà Nẵng và tỉnh Khánh Hòa, giữ đúng hình dạng cụm đảo, không lấn sang cột thẻ bên phải (x >= 720)
  const dn = at(108.25, 16.05);
  const kh = at(109.25, 12.25);
  const shapes = (feat: Feat, box: [[number, number], [number, number]]) => {
    const pr = geoMercator().fitExtent(box, feat);
    const p = geoPath(pr);
    return {
      parts: feat.geometry.coordinates.map((c) => {
        const poly = { type: 'Polygon', coordinates: c } as GeoJSON.Polygon;
        return { d: p(poly) ?? '', c: p.centroid(poly) };
      }),
      box: p.bounds(feat) as [[number, number], [number, number]],
      at: (lon: number, lat: number) => pr([lon, lat]) as [number, number], // toạ độ 1 đảo trong cụm vẽ thu gọn
    };
  };
  const onMain = {
    // Hoàng Sa: khe giữa bờ biển và cột thẻ. Trường Sa: dưới cột thẻ nên rộng hơn
    'hoang-sa': shapes(islands['hoang-sa'], [[dn[0] + 45, dn[1] - 60], [Math.min(dn[0] + 190, 705), dn[1] + 25]]),
    'truong-sa': shapes(islands['truong-sa'], [[kh[0] + 40, kh[1] + 50], [kh[0] + 250, kh[1] + 210]]),
  };
  return { provs, byId: new Map(provs.map((p) => [p.id, p])), at, onMain };
}

type Prepared = ReturnType<typeof prepare>;

const HOME: ZoomView = [FOCUS_X, MAP_H / 2, MAP_H];

export function VietnamMap({
  palette,
  lit,
  allLit = false,
  heat,
  visiting,
  lightDelayMs = 0,
  onArrive,
}: {
  palette: readonly string[];
  lit: string[];
  /** Đủ mốc tim: thắp sáng cả 34 tỉnh, lan từ Bắc vào Nam */
  allLit?: boolean;
  /** 0..1 theo điểm: quê nhiều điểm thì màu đậm */
  heat: Record<string, number>;
  visiting: Visit | null;
  /** Camera tới nơi rồi chờ bao lâu mới thắp sáng tỉnh (đợi đốm sáng bay vào) */
  lightDelayMs?: number;
  onArrive?: (v: Visit | null, at: [number, number] | null) => void;
}) {
  const [data, setData] = useState<Prepared | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const worldRef = useRef<SVGGElement>(null);
  const view = useRef<ZoomView>(HOME);
  const [arrived, setArrived] = useState<Visit | null>(null);
  const [burstAt, setBurstAt] = useState<[number, number] | null>(null);

  useEffect(() => {
    void mapData.then((fc) => setData(prepare(fc)));
  }, []);

  const camera = (v: ZoomView) => {
    view.current = v;
    const k = MAP_H / v[2];
    worldRef.current?.setAttribute('transform', `translate(${FOCUS_X - v[0] * k},${MAP_H / 2 - v[1] * k}) scale(${k})`);
    svgRef.current?.style.setProperty('--k', String(k));
    return { k, x: FOCUS_X - v[0] * k, y: MAP_H / 2 - v[1] * k };
  };

  // Camera bay tới tỉnh đang ghé; hết người gọi thì lùi về cả nước
  const target = visiting?.pid ?? null;
  useEffect(() => {
    if (!data) return;
    camera(view.current);
    const p = target ? data.byId.get(target) : null;
    const spot = visiting?.spot;
    let to = HOME;
    let anchor: [number, number] | null = p ? p.c : null; // điểm ghim / đốm sáng rơi vào (toạ độ bản đồ)
    if (p && spot?.far) {
      // đảo xa: camera phóng thẳng vào cụm đảo vẽ thu gọn, ghim cắm đúng đảo (gõ "Trường Sa" chung thì cắm giữa cụm)
      const g = data.onMain[spot.pid === 'da-nang' ? 'hoang-sa' : 'truong-sa'];
      const [[x0, y0], [x1, y1]] = g.box;
      const whole = spot.name.startsWith('quần đảo');
      const [sx, sy] = whole ? [(x0 + x1) / 2, (y0 + y1) / 2] : g.at(spot.lon, spot.lat);
      const x = Math.min(x1, Math.max(x0, sx));
      const y = Math.min(y1, Math.max(y0, sy));
      const size = Math.max(y1 - y0, ((x1 - x0) * MAP_H) / FOCUS_W) * 2.4;
      to = [whole ? (x0 + x1) / 2 : x, (whole ? (y0 + y1) / 2 : y) - (90 * size) / MAP_H, size];
      anchor = [x, y];
    } else if (p && spot) {
      const [x, y] = data.at(spot.lon, spot.lat);
      const h = Math.abs(data.at(spot.lon, spot.lat - spot.span / 2)[1] - data.at(spot.lon, spot.lat + spot.span / 2)[1]);
      const size = Math.max(h * 1.6, MAP_H / 14);
      // đặt điểm ghim thấp hơn giữa khung ~90px để chữ tên đảo phía trên không đè thanh "Đang ghé thăm"
      to = [x, y - (90 * size) / MAP_H, size];
      anchor = [x, y];
    } else if (p) {
      const [[x0, y0], [x1, y1]] = p.b;
      const size = Math.max(y1 - y0, ((x1 - x0) * MAP_H) / FOCUS_W) * 1.55;
      to = [(x0 + x1) / 2, (y0 + y1) / 2 + size * 0.06, Math.max(size, MAP_H / 11)];
    }
    setBurstAt(anchor);
    setArrived(null);
    onArrive?.(null, null);
    const i = interpolateZoom(view.current, to);
    const ms = Math.min(1400, Math.max(650, i.duration * 0.8));
    const t0 = performance.now();
    let raf = 0;
    let light = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / ms);
      const e = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
      const cam = camera(i(e));
      if (t < 1) raf = requestAnimationFrame(step);
      else if (p && visiting) {
        onArrive?.(visiting, [anchor![0] * cam.k + cam.x, anchor![1] * cam.k + cam.y]);
        light = window.setTimeout(() => setArrived(visiting), lightDelayMs);
      }
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(light);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, target, visiting?.id]);

  if (!data) return null;
  const litSet = new Set(lit);
  const on = (id: string) => allLit || (litSet.has(id) && (id !== target || arrived?.pid === id)) || arrived?.pid === id;
  const sea = data.at(109.7, 8.9); // dưới Trường Sa, ngoài khơi Cà Mau: không chạm đất liền, không vướng thẻ
  const gulf = data.at(107.75, 19.9);
  const thai = data.at(102.5, 8.7);

  return (
    <>
      <svg ref={svgRef} width={MAP_W} height={MAP_H} className="vn-map" style={{ ['--k' as string]: 1 }}>
        <g ref={worldRef}>
          <text className="sea-lbl" x={sea[0]} y={sea[1]}>Biển Đông</text>
          <text className="sea-lbl sm" x={gulf[0]} y={gulf[1]}>Vịnh Bắc Bộ</text>
          <text className="sea-lbl sm" x={thai[0]} y={thai[1]} style={{ textAnchor: 'start' }}>
            Vịnh Thái Lan
          </text>
          {data.provs.map((p) => (
            <path
              key={p.id}
              d={p.d}
              className={`prov${on(p.id) ? ' on' : ''}${arrived?.pid === p.id ? ' visit' : ''}`}
              style={
                on(p.id)
                  ? {
                      fill: palette[p.color % palette.length],
                      fillOpacity: allLit ? 1 : 0.5 + 0.5 * (arrived?.pid === p.id ? 1 : (heat[p.id] ?? 0)),
                      transitionDelay: allLit ? `${((p.c[1] / MAP_H) * 1.2).toFixed(2)}s` : undefined, // lan từ Bắc vào Nam
                    }
                  : undefined
              }
            />
          ))}
          {(
            [
              ['hoang-sa', 'da-nang', 'QĐ. Hoàng Sa'],
              ['truong-sa', 'khanh-hoa', 'QĐ. Trường Sa'],
            ] as const
          ).map(([id, parent, label]) => {
            const g = data.onMain[id];
            return (
              <g key={id} className={`isl-main${on(parent) ? ' on' : ''}`}>
                {g.parts.map((s, i) => (
                  <g key={i}>
                    <path d={s.d} />
                    <circle cx={s.c[0]} cy={s.c[1]} r={2.4} />
                  </g>
                ))}
                {/* Hoàng Sa: tên phía trên, canh phải theo cụm đảo (bên phải là cột thẻ); Trường Sa: tên phía dưới */}
                <text
                  className="isl-lbl"
                  x={id === 'hoang-sa' ? g.box[1][0] : (g.box[0][0] + g.box[1][0]) / 2}
                  y={id === 'hoang-sa' ? g.box[0][1] - 14 : g.box[1][1] + 30}
                  style={id === 'hoang-sa' ? { textAnchor: 'end' } : undefined}
                >
                  {label}
                </text>
              </g>
            );
          })}
          {arrived?.pid && burstAt && <circle key={arrived.id} className="burst" cx={burstAt[0]} cy={burstAt[1]} />}
          {data.provs
            .filter((p) => on(p.id) && arrived?.pid !== p.id)
            .map((p) => (
              <text key={p.id} className="prov-lbl" x={p.c[0]} y={p.c[1]}>
                {p.name}
              </text>
            ))}
        </g>
      </svg>
    </>
  );
}

/** Ghim người chơi đúng tâm tỉnh khi camera tới nơi: tên tỉnh to, avatar, tên người, quà */
export function VisitPin({ v, at }: { v: Visit; at: [number, number] }) {
  // tích điểm: quà thì điểm quà, gọi tên thì +1 cho mỗi người đang cùng gọi
  const gained = v.kind === 'gift' ? v.pts : (v.others + 1) * GAME.pointsPerComment;
  return (
    <div className="pin" style={{ left: at[0], top: Math.max(at[1], 330) }}>
      {gained > 0 && <div className="pin-points">+{gained.toLocaleString('vi-VN')} điểm</div>}
      <div className="pin-prov">{v.spot ? v.spot.name : v.pid && provName(v.pid)}</div>
      {v.spot && v.pid && <div className="pin-sub">thuộc {provName(v.pid)}</div>}
      <Avatar user={v.user} size={124} className="pin-av" />
      <div className="pin-name">{v.user.name}</div>
      {v.kind === 'gift' ? (
        <div className="pin-gift">
          {v.gift} · +{v.pts.toLocaleString('vi-VN')} điểm
        </div>
      ) : v.others > 0 ? (
        <div className="pin-more">và {v.others} người nữa</div>
      ) : null}
      <div className="pin-stem" />
    </div>
  );
}

const provName = (id: string) => PROVINCE_BY_ID.get(id)?.name ?? '';
