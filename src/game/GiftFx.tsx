import { useMemo } from 'react';
import { motion } from 'motion/react';
import type { Visit } from './useGame';
import { GAME } from './config';
import { PROVINCE_BY_ID } from './provinces';
import { Avatar } from './Avatar';

/**
 * Hiệu ứng quà theo số xu (GAME.giftTier), hiện khi đốm sáng chạm tỉnh:
 *   2: mưa xu quanh tỉnh | 3: mưa xu dày + băng rôn | 4: + pháo hoa trên tỉnh, loé sáng | 5: pháo hoa cả màn hình + băng rôn lớn
 * Có trần số hạt (tối đa ~60 xu, 8 chùm pháo x 16 tia) để máy live không giật.
 */
const COINS = [0, 0, 12, 22, 36, 60];
const FIREWORKS = [0, 0, 0, 0, 3, 8];
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export function GiftFx({ v, at }: { v: Visit; at: [number, number] }) {
  const tier = GAME.giftTier(v.xu);
  const dur = GAME.giftTierDwellMs[tier] / 1000;
  const coins = useMemo(
    () =>
      Array.from({ length: COINS[tier] }, () => ({
        x: tier === 5 ? rnd(40, 1040) : at[0] + rnd(-260, 260),
        delay: rnd(0, Math.min(1.6, dur * 0.4)),
        fall: rnd(1.1, 1.9),
        spin: rnd(-540, 540),
        size: rnd(26, 44),
        land: at[1] + rnd(20, 120),
      })),
    [tier, at, dur],
  );
  const fireworks = useMemo(
    () =>
      Array.from({ length: FIREWORKS[tier] }, (_, i) => ({
        x: tier === 5 ? rnd(140, 940) : at[0] + rnd(-200, 200),
        y: tier === 5 ? rnd(380, 1200) : at[1] + rnd(-320, -60),
        delay: i * (tier === 5 ? 0.45 : 0.35) + rnd(0, 0.2),
        hue: ['var(--accent)', 'var(--accent2)', 'var(--pearl)', 'var(--copper)'][i % 4],
      })),
    [tier, at],
  );
  if (tier < 2) return null;
  const prov = v.pid ? PROVINCE_BY_ID.get(v.pid)?.name : '';

  return (
    <div className="giftfx">
      {tier >= 4 && (
        <motion.div className="gfx-flash" initial={{ opacity: 0 }} animate={{ opacity: [0, tier === 5 ? 0.55 : 0.35, 0] }} transition={{ duration: 0.7 }} />
      )}

      {coins.map((c, i) => (
        <motion.div
          key={`c${i}`}
          className="gfx-coin"
          style={{ left: c.x, width: c.size, height: c.size, marginLeft: -c.size / 2 }}
          initial={{ y: tier === 5 ? -60 : at[1] - 420, opacity: 0, rotate: 0 }}
          animate={{ y: tier === 5 ? 1700 : c.land, opacity: [0, 1, 1, 0], rotate: c.spin }}
          transition={{ duration: c.fall, delay: c.delay, ease: 'easeIn', times: [0, 0.1, 0.8, 1] }}
        >
          xu
        </motion.div>
      ))}

      {fireworks.map((f, i) => (
        <div key={`f${i}`} className="gfx-fw" style={{ left: f.x, top: f.y }}>
          {Array.from({ length: 16 }, (_, k) => {
            const a = (k / 16) * Math.PI * 2;
            const r = tier === 5 ? 190 : 140;
            return (
              <motion.span
                key={k}
                style={{ background: f.hue }}
                initial={{ x: 0, y: 0, opacity: 0, scale: 1 }}
                animate={{ x: Math.cos(a) * r, y: Math.sin(a) * r + 40, opacity: [0, 1, 0], scale: [1, 1, 0.3] }}
                transition={{ duration: 1.2, delay: f.delay, ease: 'easeOut' }}
              />
            );
          })}
        </div>
      ))}

      {tier >= 3 && (
        <motion.div
          className={`gfx-banner t${tier}`}
          initial={{ y: -80, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <Avatar user={v.user} size={tier === 5 ? 120 : 84} />
          <div>
            <div className="gb-name">{v.user.name}</div>
            <div className="gb-text">
              tặng {v.gift} cho {prov}
            </div>
            <div className="gb-pts">+{v.pts.toLocaleString('vi-VN')} điểm</div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
