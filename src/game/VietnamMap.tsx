import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { geoArea, geoMercator, geoPath } from 'd3-geo';
import { interpolateZoom, type ZoomView } from 'd3-interpolate';
import type { Visit } from './useGame';
import { Avatar } from './Avatar';
import { PROVINCE_BY_ID } from './provinces';

// Bản đồ 34 tỉnh, thành (public/vn34.json, dựng bằng tools/prep-map.mjs).
// Hoàng Sa (TP. Đà Nẵng) và Trường Sa (tỉnh Khánh Hòa) vẽ trong 2 khung riêng, sáng cùng tỉnh của mình.

type Props = { id: string; name: string; color?: number; island?: boolean; parent?: string };
type Feat = GeoJSON.Feature<GeoJSON.MultiPolygon, Props>;

export const MAP_W = 1080;
export const MAP_H = 1020;
const FOCUS_X = 354; // tâm vùng nhìn: bên trái cột thẻ
const FOCUS_W = 640;

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
  const proj = geoMercator().fitExtent([[40, 14], [668, MAP_H - 14]], { type: 'FeatureCollection', features: main });
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
  // Trên bản đồ chính: Hoàng Sa đúng vĩ độ, ngoài khơi Đà Nẵng; Trường Sa thu gọn ngoài khơi Khánh Hòa (thật ra xa hơn, vượt khung hình)
  const onMain = {
    'hoang-sa': islandShapes(islands['hoang-sa'], [[566, 440], [682, 520]]),
    'truong-sa': islandShapes(islands['truong-sa'], [[596, 872], [684, 996]]),
  };
  return { provs, byId: new Map(provs.map((p) => [p.id, p])), at, islands, onMain };
}

function islandShapes(feat: Feat, box: [[number, number], [number, number]]) {
  const proj = geoMercator().fitExtent(box, feat);
  const p = geoPath(proj);
  const parts = feat.geometry.coordinates.map((c) => {
    const poly = { type: 'Polygon', coordinates: c } as GeoJSON.Polygon;
    return { d: p(poly) ?? '', c: p.centroid(poly) };
  });
  return { parts, proj, box };
}

// Đảo chính (toạ độ gần đúng) để ghi tên trong khung phóng to
const ISLAND_NAMES = {
  'hoang-sa': [
    ['Phú Lâm', 112.33, 16.83],
    ['Linh Côn', 112.73, 16.67],
    ['Hoàng Sa', 111.61, 16.53],
    ['Tri Tôn', 111.2, 15.78],
  ],
  'truong-sa': [
    ['Song Tử Tây', 114.33, 11.43],
    ['Thị Tứ', 114.28, 11.05],
    ['Nam Yết', 114.36, 10.18],
    ['Sinh Tồn', 114.33, 9.88],
    ['Trường Sa Lớn', 111.92, 8.64],
  ],
} as const;
type Prepared = ReturnType<typeof prepare>;

const HOME: ZoomView = [FOCUS_X, MAP_H / 2, MAP_H];

export function VietnamMap({
  palette,
  lit,
  visiting,
  onArrive,
}: {
  palette: readonly string[];
  lit: string[];
  visiting: Visit | null;
  onArrive?: (v: Visit | null, at: [number, number] | null) => void;
}) {
  const [data, setData] = useState<Prepared | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const worldRef = useRef<SVGGElement>(null);
  const view = useRef<ZoomView>(HOME);
  const [arrived, setArrived] = useState<Visit | null>(null);

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
    let to = HOME;
    if (p) {
      const [[x0, y0], [x1, y1]] = p.b;
      const size = Math.max(y1 - y0, ((x1 - x0) * MAP_H) / FOCUS_W) * 1.55;
      to = [(x0 + x1) / 2, (y0 + y1) / 2 + size * 0.06, Math.max(size, MAP_H / 11)];
    }
    setArrived(null);
    onArrive?.(null, null);
    const i = interpolateZoom(view.current, to);
    const ms = Math.min(1400, Math.max(650, i.duration * 0.8));
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / ms);
      const e = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
      const cam = camera(i(e));
      if (t < 1) raf = requestAnimationFrame(step);
      else if (p && visiting) {
        setArrived(visiting);
        onArrive?.(visiting, [p.c[0] * cam.k + cam.x, p.c[1] * cam.k + cam.y]);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, target, visiting?.id]);

  if (!data) return null;
  const litSet = new Set(lit);
  const on = (id: string) => (litSet.has(id) && (id !== target || arrived?.pid === id)) || arrived?.pid === id;
  const sea = data.at(110.3, 13.4);
  const gulf = data.at(107.75, 19.9);
  const thai = data.at(103.2, 9.9);

  return (
    <>
      <svg ref={svgRef} width={MAP_W} height={MAP_H} className="vn-map" style={{ ['--k' as string]: 1 }}>
        <g ref={worldRef}>
          <text className="sea-lbl" x={sea[0]} y={sea[1]}>Biển Đông</text>
          <text className="sea-lbl sm" x={gulf[0]} y={gulf[1]}>Vịnh Bắc Bộ</text>
          <text className="sea-lbl sm" x={thai[0]} y={thai[1]}>Vịnh Thái Lan</text>
          {data.provs.map((p) => (
            <path
              key={p.id}
              d={p.d}
              className={`prov${on(p.id) ? ' on' : ''}${arrived?.pid === p.id ? ' visit' : ''}`}
              style={on(p.id) ? { fill: palette[p.color % palette.length] } : undefined}
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
                <text className="isl-lbl" x={g.box[1][0]} y={id === 'hoang-sa' ? g.box[1][1] + 26 : g.box[0][1] - 10}>
                  {label}
                </text>
              </g>
            );
          })}
          {arrived?.pid && (
            <circle key={arrived.id} className="burst" cx={data.byId.get(arrived.pid)!.c[0]} cy={data.byId.get(arrived.pid)!.c[1]} />
          )}
          {data.provs
            .filter((p) => on(p.id) && arrived?.pid !== p.id)
            .map((p) => (
              <text key={p.id} className="prov-lbl" x={p.c[0]} y={p.c[1]}>
                {p.name}
              </text>
            ))}
        </g>
      </svg>
      <IslandFrame id="hoang-sa" feat={data.islands['hoang-sa']} on={on('da-nang')} visit={arrived?.pid === 'da-nang'} className="inset-hs" w={286} h={118}>
        Quần đảo Hoàng Sa <span>(TP. Đà Nẵng)</span>
      </IslandFrame>
      <IslandFrame id="truong-sa" feat={data.islands['truong-sa']} on={on('khanh-hoa')} visit={arrived?.pid === 'khanh-hoa'} className="inset-ts" w={286} h={150}>
        Quần đảo Trường Sa <span>(tỉnh Khánh Hòa)</span>
      </IslandFrame>
    </>
  );
}

function IslandFrame({ id, feat, on, visit, className, w, h, children }: { id: keyof typeof ISLAND_NAMES; feat: Feat; on: boolean; visit: boolean; className: string; w: number; h: number; children: ReactNode }) {
  const shapes = useMemo(() => islandShapes(feat, [[18, 12], [w - 18, h - 12]]), [feat, w, h]);
  return (
    <div className={`panel island ${className}${on ? ' on' : ''}${visit ? ' visit' : ''}`}>
      <div className="island-title">{children}</div>
      <svg width={w} height={h}>
        {shapes.parts.map((s, i) => (
          <g key={i}>
            <path d={s.d} />
            <circle cx={s.c[0]} cy={s.c[1]} r={2.6} />
          </g>
        ))}
        {ISLAND_NAMES[id].map(([n, lon, lat]) => {
          const [x, y] = shapes.proj([lon, lat]) ?? [0, 0];
          const right = x > w * 0.62; // gần mép phải thì ghi tên sang trái
          return (
            <text key={n} className="isl-name" x={right ? x - 6 : x + 6} y={y + 4} textAnchor={right ? 'end' : 'start'}>
              {n}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

/** Ghim người chơi đúng tâm tỉnh khi camera tới nơi: tên tỉnh to, avatar, tên người, quà */
export function VisitPin({ v, at }: { v: Visit; at: [number, number] }) {
  return (
    <div className="pin" style={{ left: at[0], top: Math.max(at[1], 330) }}>
      <div className="pin-prov">{v.pid && provName(v.pid)}</div>
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
