import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { roundClock, type GameState, type Visit } from './useGame';
import { GAME } from './config';
import { PROVINCE_BY_ID } from './provinces';
import { VietnamMap, VisitPin } from './VietnamMap';
import { Avatar } from './Avatar';

/**
 * Màn hình live 1080x1920, chất tranh sơn mài: nền sơn đen nâu, viền thếp vàng, tỉnh sáng màu son / vàng / ngọc.
 * Chừa 255px dưới cùng cho giao diện TikTok.
 */
export function GameStage({ game }: { game: GameState }) {
  const [pin, setPin] = useState<{ v: Visit; at: [number, number] } | null>(null);
  const visitingId = game.visiting?.pid ?? null;
  const fansHere = visitingId ? (game.fans[visitingId] ?? 0) : Object.values(game.fans).reduce((a, b) => a + b, 0);

  return (
    <div className="stage">
      <header className="stage-head">
        <h1>
          <span className="t1">Việt Nam</span>
          <span className="t2">đất nước ta ơi</span>
        </h1>
        <p>{GAME.subtitle}</p>
      </header>

      <div className="bar">
        <div className="chip round">Vòng {game.round}</div>
        <Clock phase={game.phase} />
        <div className="chip phase">{{ open: 'Mở màn vòng', play: 'Vòng gặp gỡ', summary: 'Tổng kết vòng' }[game.phase]}</div>
        <div className="chip lit">
          Đã sáng <b>{game.litCount}</b>/34
        </div>
      </div>

      <div className="visiting">
        <span className="v-label">Đang ghé thăm</span>
        <span className="v-name">{visitingId ? PROVINCE_BY_ID.get(visitingId)?.name : 'Cả nước'}</span>
        <span className="v-fans">
          Đồng hương các buổi live: <b>{fansHere.toLocaleString('vi-VN')}</b> người
        </span>
      </div>

      <div className="map-box">
        <VietnamMap lit={game.lit} visiting={game.visiting} onArrive={(v, at) => setPin(v && at ? { v, at } : null)} />
      </div>
      <div className="map-box overlay">
        <AnimatePresence>
          {pin && (
            <motion.div key={pin.v.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
              <VisitPin v={pin.v} at={pin.at} />
            </motion.div>
          )}
        </AnimatePresence>
        <Ticker game={game} hidden={!!visitingId} />
      </div>

      <Called v={game.called} />

      <div className="panel gifts">
        <h3>Quà gửi về quê</h3>
        {GAME.giftTable.map(([k, v]) => (
          <div key={k} className="g-row">
            <span>{k}</span>
            <b>{v}</b>
          </div>
        ))}
      </div>

      <div className="bottom">
        <Podium top={game.top} />
        <div className="panel champ">
          <h3>Người giữ lửa quê</h3>
          {game.champion ? (
            <>
              <Avatar user={game.champion} size={104} className="champ-av" />
              <div className="c-name">{game.champion.name}</div>
              <div className="c-sub">
                {game.champion.home && <>quê {game.champion.home}, </>}
                {game.champion.pts.toLocaleString('vi-VN')} điểm
              </div>
            </>
          ) : (
            <div className="empty">Ai góp nhiều điểm nhất cho quê trong vòng sẽ lên đây</div>
          )}
        </div>
      </div>

      <RoundBanner game={game} />
    </div>
  );
}

function Clock({ phase }: { phase: string }) {
  const [ms, setMs] = useState(() => roundClock().remainMs);
  useEffect(() => {
    const t = setInterval(() => setMs(roundClock().remainMs), 250);
    return () => clearInterval(t);
  }, []);
  const s = Math.ceil(ms / 1000);
  return (
    <div className={`chip clock${phase === 'play' && s <= 10 ? ' hot' : ''}`}>
      {String(Math.floor(s / 60)).padStart(2, '0')}:{String(s % 60).padStart(2, '0')}
    </div>
  );
}

function Called({ v }: { v: Visit | null }) {
  return (
    <div className="panel called">
      <h3>Vừa gọi tên quê</h3>
      {v ? (
        <motion.div key={v.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="called-body">
          <Avatar user={v.user} size={112} className="called-av" />
          <div className="c-name">{v.user.name}</div>
          <div className="c-sub">
            {v.pid ? (
              <>
                gọi tên <b>{PROVINCE_BY_ID.get(v.pid)?.name}</b>
              </>
            ) : (
              <>tặng {v.xu} xu, chưa chọn quê</>
            )}
          </div>
        </motion.div>
      ) : (
        <div className="empty">Chưa ai gọi. Gõ tên quê bạn đi!</div>
      )}
    </div>
  );
}

function Ticker({ game, hidden }: { game: GameState; hidden: boolean }) {
  return (
    <div className="ticker" style={{ opacity: hidden ? 0 : 1 }}>
      {game.feed.slice(-5).reverse().map((f) => (
        <div key={f.id} className={`tk${f.gift ? ' gift' : ''}`}>
          <Avatar user={f} size={40} />
          <span>
            <b>{f.name}</b> {f.text}
          </span>
        </div>
      ))}
    </div>
  );
}

function Podium({ top }: { top: GameState['top'] }) {
  const max = top[0]?.pts || 1;
  return (
    <div className="panel podium">
      <h3>Bục quê nhà</h3>
      <div className="cols">
        {[1, 0, 2].map((i) => {
          const r = top[i];
          return (
            <div key={i} className={`col r${i + 1}`}>
              <div className="p-name">{r?.name ?? '…'}</div>
              <div className="p-pts">{r ? `${r.pts.toLocaleString('vi-VN')} điểm` : ''}</div>
              <div className="p-bar" style={{ height: r ? 60 + 150 * Math.sqrt(r.pts / max) : 44 }}>
                {i + 1}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RoundBanner({ game }: { game: GameState }) {
  // Mở màn: hiện 3,5 giây đầu vòng. Tổng kết: hiện suốt 15 giây.
  const [openShown, setOpenShown] = useState(false);
  useEffect(() => {
    if (game.phase !== 'open') return setOpenShown(false);
    setOpenShown(true);
    const t = setTimeout(() => setOpenShown(false), 3500);
    return () => clearTimeout(t);
  }, [game.phase, game.round]);

  const s = game.summary;
  const colors = ['var(--gold)', 'var(--pearl)', 'var(--copper)'];
  return (
    <AnimatePresence>
      {(s || openShown) && (
        <motion.div className="banner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
          <motion.div className="banner-box" initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }}>
            {s ? (
              <>
                <h2>Tổng kết vòng {s.no}</h2>
                <p>Cảm ơn cả nhà đã gọi tên quê mình</p>
                <div className="rows">
                  {s.top.length ? (
                    s.top.map((r, i) => (
                      <div key={r.id} className="row">
                        <span className="rk" style={{ background: colors[i] }}>
                          {i + 1}
                        </span>
                        <span className="rn">{r.name}</span>
                        <span className="rp">{r.pts.toLocaleString('vi-VN')} điểm</span>
                      </div>
                    ))
                  ) : (
                    <div className="row">Vòng này chưa quê nào lên tiếng</div>
                  )}
                </div>
                {s.champion && (
                  <div className="mvp">
                    <Avatar user={s.champion} size={84} />
                    <div>
                      Người giữ lửa quê: <b>{s.champion.name}</b>
                      <br />
                      {s.champion.pts.toLocaleString('vi-VN')} điểm{s.champion.home ? ` cho ${s.champion.home}` : ''}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <h2>Vòng {game.round}</h2>
                <p>Gõ tên tỉnh, thành quê bạn để bản đồ ghé thăm</p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
