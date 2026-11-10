import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { roundClock, type GameState, type Visit } from './useGame';
import { GAME } from './config';
import { PROVINCE_BY_ID } from './provinces';
import { VietnamMap, VisitPin } from './VietnamMap';
import { Avatar } from './Avatar';
import { themeById, themeVars } from './themes';
import { playCelebrate, playGift, playSpark, sound } from './sfx';
import { GiftFx } from './GiftFx';
import { setMusicVolume, startMusic, stopMusic } from './music';
import { voice } from '../live/voice';
import { IS_STAGE } from '../live/page';

/**
 * Màn hình live 1080x1920, chất tranh sơn mài: nền sơn đen nâu, viền thếp vàng, tỉnh sáng màu son / vàng / ngọc.
 * Bố cục: bản đồ chữ S to gần hết khung là nhân vật chính. Thẻ đặt vào chỗ trống quanh chữ S:
 * "Vừa gọi tên quê" ở khoảng trống bên trái (vùng Lào), cột phải (Sắp ghé, dòng chạy, quà, Bục quê nhà, Người giữ lửa quê).
 * Góc dưới bên trái là chỗ comment của TikTok: chỉ có đất liền miền Nam, không đặt thẻ.
 */
export function GameStage({ game }: { game: GameState }) {
  const [pin, setPin] = useState<{ v: Visit; at: [number, number] } | null>(null);
  const [big, setBig] = useState<{ id: number; name: string } | null>(null);
  const [spark, setSpark] = useState<{ id: number; from: [number, number]; to: [number, number] } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const calledAvRef = useRef<HTMLDivElement>(null);
  const latest = useRef(0);
  const visitingId = game.visiting?.pid ?? null;

  // Camera tới nơi: đốm sáng bay từ avatar "Vừa gọi tên quê" vào tỉnh, chạm tới thì tỉnh sáng + hiện ghim
  const onArrive = (v: Visit | null, at: [number, number] | null) => {
    latest.current = v?.id ?? 0;
    if (!v || !at) {
      setPin(null);
      setSpark(null);
      return;
    }
    const to: [number, number] = [at[0], at[1] + MAP_TOP];
    setSpark({ id: v.id, from: centerIn(stageRef.current, calledAvRef.current) ?? [155, 990], to });
    playSpark(SPARK_MS);
    setTimeout(() => {
      if (latest.current !== v.id) return;
      setPin({ v, at });
      setBig({ id: v.id, name: v.spot ? v.spot.name : (v.pid && PROVINCE_BY_ID.get(v.pid)?.name) || '' });
      if (v.kind === 'gift' && game.giftFx) playGift(GAME.giftTier(v.xu));
    }, SPARK_MS);
    setTimeout(() => latest.current === v.id && setSpark(null), SPARK_MS + 600); // loé xong thì tắt
  };
  const fansHere = visitingId ? (game.fans[visitingId] ?? 0) : Object.values(game.fans).reduce((a, b) => a + b, 0);
  const L = game.labels;

  // Âm thanh toàn bộ + nhạc nền (chỉ trang stage phát tiếng)
  useEffect(() => {
    sound.on = game.soundOn;
    voice.volume = game.soundOn ? 1 : 0; // tắt: MC vẫn "đọc" theo nhịp nhưng không ra tiếng
    if (IS_STAGE && game.soundOn && game.music.on) startMusic(game.music.volume / 100);
    else stopMusic();
    setMusicVolume(game.music.volume / 100);
  }, [game.soundOn, game.music.on, game.music.volume]);
  useEffect(() => () => stopMusic(), []);
  // đủ mốc tim: nhạc mừng 1 lần mỗi lần thắp sáng
  useEffect(() => {
    if (game.allLit) playCelebrate();
  }, [game.allLit]);

  const theme = themeById(game.theme);
  return (
    <div ref={stageRef} className="stage" style={themeVars(theme) as React.CSSProperties}>
      <header className="stage-head">
        <h1>
          <span className="t1">{L.title1}</span>
          <span className="t2">{L.title2}</span>
        </h1>
        <p>{L.subtitle}</p>
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
        <span className="v-label">{L.visiting}</span>
        <span className="v-name">{visitingId ? PROVINCE_BY_ID.get(visitingId)?.name : 'Cả nước'}</span>
        <span className="v-fans">
          {L.fans}: <b>{fansHere.toLocaleString('vi-VN')}</b> người
        </span>
      </div>

      <div className="map-box">
        <VietnamMap palette={theme.lit} lit={game.lit} allLit={!!game.allLit} heat={game.heat} visiting={game.visiting} lightDelayMs={SPARK_MS} onArrive={onArrive} />
      </div>
      <div className="map-box overlay">
        {/* tên tỉnh to mờ dần giữa vùng bản đồ khi camera tới nơi */}
        <AnimatePresence>
          {big && pin?.v.id === big.id && (
            <motion.div
              key={big.id}
              className="big-prov"
              style={{ fontSize: Math.min(76, Math.floor(600 / Math.max(1, big.name.length))) }} // tên dài thì chữ nhỏ lại cho vừa 430px
              initial={{ opacity: 0, scale: 1.25 }}
              animate={{ opacity: [0, 0.9, 0.9, 0], scale: [1.25, 1, 1, 0.96] }}
              transition={{ duration: 2.4, times: [0, 0.15, 0.6, 1] }}
            >
              {big.name}
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {pin && (
            <motion.div key={pin.v.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
              <VisitPin v={pin.v} at={pin.at} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* luật bản đồ: 2 quần đảo vẽ thu gọn gần bờ, ranh giới tỉnh từ dữ liệu cộng đồng -> ghi rõ là hình mô phỏng */}
      {/* chỉ hiện lúc nhìn cả nước; zoom vào tỉnh thì nhường chỗ cho ghim người chơi */}
      <div className="map-note" style={{ opacity: visitingId ? 0 : 1 }}>
        Hình ảnh mô phỏng,
        <br />
        vẽ thu nhỏ,
        <br />
        không theo tỷ lệ
      </div>

      <div className="side">
        <Upcoming names={game.upcoming} />
        <HeartBar hearts={game.hearts} lit={!!game.allLit} />
        <Ticker game={game} />
        {game.giftTable && <GiftStrip title={L.gifts} />}
        <Podium top={game.top} title={L.podium} />
        <div className="panel champ">
          <h3>{L.champ}</h3>
          {game.champion ? (
            <div className="champ-body">
              <Avatar user={game.champion} size={84} className="champ-av" />
              <div className="champ-txt">
                <div className="c-name">{game.champion.name}</div>
                <div className="c-sub">góp {game.champion.pts.toLocaleString('vi-VN')} điểm</div>
              </div>
            </div>
          ) : (
            <div className="empty">Góp nhiều điểm nhất cho quê là lên đây</div>
          )}
        </div>
      </div>
      <Called v={game.called} avRef={calledAvRef} title={L.called} />
      <AnimatePresence>
        {!!game.allLit && (
          <motion.div
            key={game.allLit}
            className="all-lit"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          >
            <b>Cả nước sáng đèn!</b>
            <span>Cảm ơn {GAME.heartGoal.toLocaleString('vi-VN')} tim của cả nhà</span>
          </motion.div>
        )}
      </AnimatePresence>
      <FinalCountdown phase={game.phase} />

      <AnimatePresence>{spark && <Spark key={spark.id} from={spark.from} to={spark.to} />}</AnimatePresence>

      <AnimatePresence>
        {pin && pin.v.kind === 'gift' && game.giftFx && (
          <motion.div key={`g${pin.v.id}`} initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.4 } }}>
            <GiftFx v={pin.v} at={[pin.at[0], pin.at[1] + MAP_TOP]} />
          </motion.div>
        )}
      </AnimatePresence>

      <RoundBanner game={game} />
    </div>
  );
}

const MAP_TOP = 316; // .map-box top trong khung 1080x1920
const SPARK_MS = 750; // đốm sáng bay bao lâu; tỉnh sáng đúng lúc đốm chạm tới

/** Tâm của phần tử con, tính theo toạ độ khung 1080x1920 (khung có thể đang thu nhỏ) */
function centerIn(stage: HTMLElement | null, el: HTMLElement | null): [number, number] | null {
  if (!stage || !el) return null;
  const s = stage.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  const k = s.width / 1080 || 1;
  return [(r.left + r.width / 2 - s.left) / k, (r.top + r.height / 2 - s.top) / k];
}

/** Đốm sáng bay vòng cung từ avatar vào tỉnh, kéo theo 3 đốm nhỏ làm đuôi, chạm tới thì loé ra */
function Spark({ from, to }: { from: [number, number]; to: [number, number] }) {
  // vòng cung: điểm giữa đẩy lên trên một đoạn theo độ dài đường bay
  const dist = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const mid: [number, number] = [(from[0] + to[0]) / 2, Math.min(from[1], to[1]) - Math.min(220, dist * 0.35)];
  const xs = [from[0], mid[0], to[0]];
  const ys = [from[1], mid[1], to[1]];
  const fly = { duration: SPARK_MS / 1000, ease: [0.45, 0, 0.25, 1] as const, times: [0, 0.5, 1] };
  return (
    <motion.div className="spark-layer" initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.3 } }}>
      {[3, 2, 1].map((i) => (
        <motion.div
          key={i}
          className="spark tail"
          style={{ width: 34 - i * 7, height: 34 - i * 7, marginLeft: -(34 - i * 7) / 2, marginTop: -(34 - i * 7) / 2, opacity: 0.75 - i * 0.18 }}
          initial={{ x: from[0], y: from[1] }}
          animate={{ x: xs, y: ys }}
          transition={{ ...fly, delay: i * 0.045 }}
        />
      ))}
      <motion.div className="spark" initial={{ x: from[0], y: from[1], scale: 0.4 }} animate={{ x: xs, y: ys, scale: [0.4, 1.25, 1] }} transition={fly} />
      <motion.div
        className="spark-flash"
        style={{ left: to[0], top: to[1] }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.6, 2.2], opacity: [0, 0.9, 0] }}
        transition={{ duration: 0.6, delay: SPARK_MS / 1000 - 0.05, times: [0, 0.35, 1] }}
      />
    </motion.div>
  );
}

function Clock({ phase }: { phase: string }) {
  const s = useSecondsLeft();
  return (
    <div className={`chip clock${phase === 'play' && s <= 10 ? ' hot' : ''}`}>
      {String(Math.floor(s / 60)).padStart(2, '0')}:{String(s % 60).padStart(2, '0')}
    </div>
  );
}

/** 10 giây cuối vòng: số đếm to nháy đỏ trên đầu bản đồ, giục cả phòng kéo quê lên bục */
function FinalCountdown({ phase }: { phase: string }) {
  const s = useSecondsLeft();
  const on = phase === 'play' && s <= 10 && s > 0;
  return (
    <AnimatePresence>
      {on && (
        <motion.div className="final" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          <motion.b key={s} initial={{ scale: 1.6, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.35 }}>
            {s}
          </motion.b>
          <span>Còn {s} giây, quê nào vượt lên?</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function useSecondsLeft() {
  const [ms, setMs] = useState(() => roundClock().remainMs);
  useEffect(() => {
    const t = setInterval(() => setMs(roundClock().remainMs), 250);
    return () => clearInterval(t);
  }, []);
  return Math.ceil(ms / 1000);
}

/** Thanh tim chung cả phòng: đủ mốc thì thắp sáng cả bản đồ */
function HeartBar({ hearts, lit }: { hearts: number; lit: boolean }) {
  const pct = lit ? 100 : Math.min(100, (hearts / GAME.heartGoal) * 100);
  return (
    <div className={`heart-bar${lit ? ' full' : ''}`}>
      <div className="hb-top">
        <span>❤ Tim thắp sáng cả nước</span>
      </div>
      <div className="hb-track">
        <div className="hb-fill" style={{ width: `${pct}%` }} />
        <span className="hb-num">
          {lit ? GAME.heartGoal.toLocaleString('vi-VN') : hearts.toLocaleString('vi-VN')} / {GAME.heartGoal.toLocaleString('vi-VN')}
        </span>
      </div>
    </div>
  );
}

/** Tỉnh đang xếp hàng chờ ghé: người vừa comment thấy quê mình sắp tới lượt */
function Upcoming({ names }: { names: string[] }) {
  return (
    <div className="upcoming">
      <span className="up-lbl">Sắp ghé</span>
      {names.length ? (
        names.map((n, i) => (
          <span key={`${n}${i}`} className="up-name">
            {n}
          </span>
        ))
      ) : (
        <span className="up-empty">gõ tên quê để xếp hàng</span>
      )}
    </div>
  );
}

/** Bảng điểm quà thu thành 1 dòng, lần lượt đổi mức mỗi 2,5 giây */
function GiftStrip({ title }: { title: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % GAME.giftTable.length), 2500);
    return () => clearInterval(t);
  }, []);
  const [k, v] = GAME.giftTable[i];
  return (
    <div className="gift-strip">
      <span className="gs-lbl">{title}</span>
      <AnimatePresence mode="wait">
        <motion.span key={i} className="gs-row" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.25 }}>
          {k} <b>{v}</b>
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

function Called({ v, avRef, title }: { v: Visit | null; avRef: React.RefObject<HTMLDivElement | null>; title: string }) {
  return (
    <div className="panel called">
      <h3>{title}</h3>
      {v ? (
        <motion.div key={v.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="called-body">
          <div ref={avRef} className="called-av-wrap">
            <Avatar user={v.user} size={136} className="called-av" />
          </div>
          <div className="c-name">{v.user.name}</div>
          <div className="c-sub">
            {v.pid ? (
              <>
                gọi tên <b>{v.spot?.name ?? PROVINCE_BY_ID.get(v.pid)?.name}</b>
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

function Ticker({ game }: { game: GameState }) {
  return (
    <div className="ticker">
      {game.feed.slice(-4).reverse().map((f) => (
        <div key={f.id} className={`tk${f.gift ? ' gift' : ''}`}>
          <Avatar user={f} size={44} />
          <span>
            <b>{f.name}</b> {f.text}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Bục quê nhà dạng cột 2 - 1 - 3: cột cao theo điểm, khung cao cố định nên cột không bao giờ tràn ra ngoài */
function Podium({ top, title }: { top: GameState['top']; title: string }) {
  const max = top[0]?.pts || 1;
  return (
    <div className="panel podium">
      <h3>{title}</h3>
      {top.length ? (
        <div className="cols">
          {[1, 0, 2].map((i) => {
            const r = top[i];
            return (
              <div key={i} className={`col r${i + 1}`}>
                <div className="p-name">{r ? r.name.replace(/^TP\.\s*/, '') : '…'}</div>
                <div className="p-pts">{r ? r.pts.toLocaleString('vi-VN') : ''}</div>
                <div className="p-bar" style={{ height: r ? 46 + 104 * Math.sqrt(r.pts / max) : 30 }}>
                  {i + 1}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty big">Quê nào lên bục đầu tiên?</div>
      )}
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
  const colors = ['var(--accent)', 'var(--pearl)', 'var(--copper)'];
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
                      {game.labels.champ}: <b>{s.champion.name}</b>
                      <br />
                      góp {s.champion.pts.toLocaleString('vi-VN')} điểm cho quê
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <h2>Vòng {game.round}</h2>
                <p>{game.labels.subtitle}</p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
