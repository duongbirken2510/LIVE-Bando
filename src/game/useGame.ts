import { useEffect, useState } from 'react';
import { useLiveEvents } from '../live/useLiveEvents';
import type { LiveStatus } from '../live/types';
import { voice, speakableName } from '../live/voice';
import { containsBanned, isRudeName, maskBanned } from '../live/bannedWords';
import { NameBatcher } from '../live/scoreboard';
import { detectWish, GiftThanker, makePicker, OncePerPerson, RecentPeople, WishLimiter } from '../live/chatter';
import { IS_STAGE } from '../live/page';
import { GAME } from './config';
import { findProvince, findSpot, PROVINCE_BY_ID, type Spot } from './provinces';
import { talkAbout } from './provinceTalk';

const pick = makePicker();

voice.defaultWho = GAME.voice; // server gửi lại giọng đã chọn (setVoice) ngay khi trang nối vào
voice.rate = GAME.voiceRate;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface Person {
  username: string;
  name: string;
  avatar: string;
}

/** 1 lượt bản đồ ghé thăm: camera bay tới tỉnh, thắp sáng, MC đọc tên */
export interface Visit {
  pid: string | null; // null = tặng quà mà chưa chọn quê
  user: Person;
  kind: 'comment' | 'gift';
  xu: number;
  pts: number;
  gift: string;
  others: number; // số người khác cùng gọi tỉnh này lúc đang chờ
  pri: boolean; // quà lớn: chen lên đầu hàng
  id: number;
  spot?: Spot | null; // gõ tên đảo (Phú Quốc, Côn Đảo...): camera bay thẳng tới đảo
}

export interface FeedItem {
  id: number;
  name: string;
  avatar: string;
  text: string;
  gift: boolean;
}

export type Phase = 'open' | 'play' | 'summary';

export interface RankRow {
  id: string;
  name: string;
  pts: number;
  at: number;
}

export interface Summary {
  no: number;
  top: RankRow[];
  champion: Champion | null;
}

export interface Champion extends Person {
  pts: number;
  home: string | null;
}

interface PlayerState extends Person {
  home: string | null;
  pts: number; // điểm góp cho quê trong vòng này
  likes: number;
  pendingXu: number; // quà tặng trước khi chọn quê, gõ tên quê thì cộng bù
  last: Record<string, number>;
}

// ---------- Đồng hồ vòng ----------
// Tính theo giờ máy nên trang điều khiển và trang stage luôn cùng giai đoạn.
// Thời gian 1 vòng chủ kênh chọn (prefs.roundSec, tính cả 15 giây mở màn); mọi trang nhận cùng lệnh nên vẫn cùng nhịp
let roundMs = GAME.roundMs;
let CYCLE = roundMs + GAME.summaryMs;
let clockOffset = 0;
export function roundClock(now = Date.now()) {
  const t = (((now + clockOffset) % CYCLE) + CYCLE) % CYCLE;
  const phase: Phase = t < GAME.openMs ? 'open' : t < roundMs ? 'play' : 'summary';
  return { phase, remainMs: phase === 'summary' ? 0 : roundMs - t };
}
/** Đổi thời gian 1 vòng. restart: đang chơi mà đổi thì bắt đầu vòng mới cho khỏi nhảy giờ giữa chừng */
function setRoundMs(ms: number, restart: boolean) {
  if (ms === roundMs) return;
  roundMs = ms;
  CYCLE = roundMs + GAME.summaryMs;
  if (restart) newRound();
}
export const roundSecOf = (prefs: Record<string, string>) => Math.min(1200, Math.max(60, Number(prefs.roundSec) || GAME.roundMs / 1000));
/** Trọn 1 vòng (mở màn + gặp gỡ + tổng kết), cho live tự động */
export const roundCycleMs = () => CYCLE;
/** Nhảy về đầu 1 vòng mới (live tự động dùng để chạy trọn 1 vòng) */
function newRound() {
  const t = (((Date.now() + clockOffset) % CYCLE) + CYCLE) % CYCLE;
  clockOffset += CYCLE - t;
}
function skipPhase() {
  const t = (((Date.now() + clockOffset) % CYCLE) + CYCLE) % CYCLE;
  const next = t < GAME.openMs ? GAME.openMs : t < roundMs ? roundMs : CYCLE;
  clockOffset += next - t + 1;
}

// ---------- Đồng hương các buổi LIVE (lưu trong trình duyệt của trang) ----------
// shortcut: mỗi trang (stage / điều khiển) lưu riêng trong localStorage; muốn dùng chung thì chuyển lên server.ts
const FANS_KEY = 'vndnto:fans';
function loadFans() {
  const m = new Map<string, Set<string>>();
  try {
    const raw = JSON.parse(localStorage.getItem(FANS_KEY) || '{}') as Record<string, string[]>;
    for (const [k, v] of Object.entries(raw)) if (PROVINCE_BY_ID.has(k) && Array.isArray(v)) m.set(k, new Set(v));
  } catch {
    // trình duyệt chặn lưu: bắt đầu từ 0
  }
  return m;
}

let seq = 0;
const MAX_FEED = 12;

/**
 * Luật chơi. Màn hình (GameStage) chỉ đọc state trả về.
 * State thay đổi nhiều (500 người cùng comment) nên giữ trong 1 object và vẽ lại tối đa ~8 lần/giây.
 */
export function useGame() {
  const [status, setStatus] = useState<LiveStatus | null>(null);
  const [channelName, setChannelName] = useState(GAME.defaultChannelName);
  const [, setVersion] = useState(0);
  const [voiceWho, setVoiceWho] = useState(voice.defaultWho);
  const [theme, setTheme] = useState<string>(''); // '' = giao diện mặc định; server gửi lại giao diện đã chọn khi nối vào
  // Cài đặt chủ kênh sửa ở trang điều khiển (chữ trên màn hình, nhạc nền). Server nhớ, gửi lại khi trang nối vào.
  const [prefs, setPrefs] = useState<Record<string, string>>({});

  const [g] = useState(() => ({
    kenh: GAME.defaultChannelName,
    round: 1,
    phase: roundClock().phase,
    warned: false,
    scores: new Map<string, { pts: number; at: number }>(),
    next: new Map<string, { pts: number; at: number }>(), // điểm gửi lúc đang tổng kết: tính cho vòng sau
    players: new Map<string, PlayerState>(),
    queue: [] as Visit[],
    lastVisit: new Map<string, number>(),
    visiting: null as Visit | null,
    called: null as Visit | null,
    feed: [] as FeedItem[],
    prefs: {} as Record<string, string>,
    prefsLoaded: false,
    summary: null as Summary | null,
    fans: loadFans(),
    saveTimer: 0,
    drawTimer: 0,
    talk: {
      greeter: new NameBatcher(
        GAME.greetEveryMs,
        GAME.namesPerGreeting,
        (names, more) => voice.say(GAME.greeting(joinNames(names, more > 0), g.kenh, more)),
        (): boolean => voice.waiting >= 2 || g.queue.some((q: Visit) => q.pri), // có quà lớn đang chờ thì cảm ơn quà trước
      ),
      gifts: new GiftThanker(30_000, GAME.priorityGiftCoins),
      follows: new OncePerPerson(),
      wishes: new WishLimiter(GAME.wishPerUserMs, GAME.wishGlobalMs),
      recent: new RecentPeople(),
    },
  }));
  g.kenh = channelName;

  const draw = () => {
    if (g.drawTimer) return;
    g.drawTimer = window.setTimeout(() => {
      g.drawTimer = 0;
      setVersion((v) => v + 1);
    }, 120);
  };

  // tên bậy (kể cả viết lách: l0n, đ.ị.t, djt) thì hiện username; username cũng bậy thì hiện "Người xem"
  const safeName = (nickname: string, username: string) => (!isRudeName(nickname) ? nickname : !isRudeName(username) ? username : 'Người xem');

  const player = (e: { username: string; avatar: string }, name: string) => {
    let p = g.players.get(e.username);
    if (!p) g.players.set(e.username, (p = { username: e.username, name, avatar: e.avatar, home: null, pts: 0, likes: 0, pendingXu: 0, last: {} }));
    p.name = name;
    if (e.avatar) p.avatar = e.avatar;
    return p;
  };

  const addPoints = (pid: string, n: number, pl: PlayerState) => {
    if (!n) return;
    const map = g.phase === 'summary' ? g.next : g.scores;
    const s = map.get(pid) ?? { pts: 0, at: 0 };
    s.pts += n;
    s.at = Date.now();
    map.set(pid, s);
    if (g.phase !== 'summary') pl.pts += n;
    draw();
  };

  const addFan = (pid: string, username: string) => {
    let set = g.fans.get(pid);
    if (!set) g.fans.set(pid, (set = new Set()));
    if (set.has(username)) return;
    set.add(username);
    clearTimeout(g.saveTimer);
    g.saveTimer = window.setTimeout(() => {
      try {
        localStorage.setItem(FANS_KEY, JSON.stringify(Object.fromEntries([...g.fans].map(([k, v]) => [k, [...v]]))));
      } catch {
        // đầy bộ nhớ / bị chặn: bỏ qua, không làm đứng game
      }
    }, 2000);
  };

  const pushFeed = (item: Omit<FeedItem, 'id'>) => {
    g.feed.push({ ...item, id: ++seq });
    if (g.feed.length > MAX_FEED) g.feed.shift();
    draw();
  };

  // Hàng chờ ghé thăm: quà lớn chen lên đầu; bình luận cùng tỉnh đang chờ thì gộp "A với 14 người nữa"
  const enqueue = (v: Visit) => {
    if (v.pri) {
      const i = g.queue.findIndex((q) => !q.pri);
      g.queue.splice(i < 0 ? g.queue.length : i, 0, v);
      return draw();
    }
    if (v.kind === 'comment') {
      const same = g.queue.find((q) => q.kind === 'comment' && q.pid === v.pid);
      if (same) return void same.others++;
      if (g.visiting?.pid === v.pid) return;
      if (v.pid && Date.now() - (g.lastVisit.get(v.pid) ?? 0) < GAME.revisitMs) return;
    }
    if (g.queue.filter((q) => !q.pri).length >= GAME.maxQueue) return; // đông quá: vẫn có điểm, chỉ không lên hình
    g.queue.push(v);
    draw();
  };

  const champion = (): Champion | null => {
    let best: PlayerState | null = null;
    for (const p of g.players.values()) if (p.pts > 0 && (!best || p.pts > best.pts)) best = p;
    return best && { username: best.username, name: best.name, avatar: best.avatar, pts: best.pts, home: best.home && PROVINCE_BY_ID.get(best.home)!.name };
  };

  const ranking = (): RankRow[] =>
    [...g.scores]
      .map(([id, s]) => ({ id, name: PROVINCE_BY_ID.get(id)!.name, pts: s.pts, at: s.at }))
      .sort((a, b) => b.pts - a.pts || a.at - b.at); // bằng điểm: quê đạt mức điểm đó trước xếp trên

  const resetRound = () => {
    g.queue = g.queue.filter((q) => q.kind === 'gift'); // lượt quà giữ lại sang vòng mới, người tặng không mất khoảnh khắc
    g.visiting = null;
    // pendingXu giữ lại: tặng quà mà chưa gõ quê thì vòng sau gõ vẫn được cộng bù
    for (const p of g.players.values()) Object.assign(p, { home: null, pts: 0, likes: 0 });
    g.lastVisit.clear();
    g.warned = false;
  };

  useLiveEvents({
    onStatus: setStatus,

    onChat: (e) => {
      const name = safeName(e.nickname, e.username);
      const { talk } = g;
      talk.recent.note(e.username, speakableName(name));
      pushFeed({ name, avatar: e.avatar, text: maskBanned(e.comment).slice(0, 60), gift: false });

      const topic = containsBanned(e.comment) || isRudeName(e.comment) ? null : detectWish(e.comment);
      const reply = topic && pick(GAME.wishReplies[topic] ?? []);
      if (reply && talk.wishes.allow(e.username)) voice.say(reply(speakableName(name)));

      // --- Luật chơi: gõ tên tỉnh, thành ---
      const prov = findProvince(e.comment);
      if (!prov) return;
      const pl = player(e, name);
      pl.home = prov.id;
      const now = Date.now();
      if (now - (pl.last[prov.id] ?? 0) >= GAME.commentCooldownMs) {
        pl.last[prov.id] = now;
        addPoints(prov.id, GAME.pointsPerComment, pl);
      }
      if (pl.pendingXu) {
        addPoints(prov.id, GAME.giftPoints(pl.pendingXu), pl);
        pl.pendingXu = 0;
      }
      addFan(prov.id, e.username);
      const spot = findSpot(e.comment);
      enqueue({
        pid: prov.id,
        user: { username: e.username, name, avatar: pl.avatar },
        kind: 'comment',
        xu: 0,
        pts: 0,
        gift: '',
        others: 0,
        pri: false,
        id: ++seq,
        spot: spot?.pid === prov.id ? spot : null,
      });
    },

    onGift: (e) => {
      const name = safeName(e.nickname, e.username);
      const coins = e.diamondCount * e.repeatCount;
      const pl = player(e, name);
      g.talk.recent.note(e.username, speakableName(name));
      pushFeed({ name, avatar: e.avatar, text: `tặng ${e.repeatCount} × ${e.giftName}`, gift: true });

      const pts = pl.home ? GAME.giftPoints(coins) : 0;
      if (pl.home) addPoints(pl.home, pts, pl);
      else pl.pendingXu += coins;
      // combo / tặng liên tục: cảm ơn 1 lần mỗi 30 giây; quà từ 30 xu luôn được ghé và cảm ơn
      if (g.talk.gifts.shouldThank(e.username, coins, g.queue.filter((q) => q.pri).length)) {
        enqueue({
          pid: pl.home,
          user: { username: e.username, name, avatar: pl.avatar },
          kind: 'gift',
          xu: coins,
          pts,
          gift: e.repeatCount > 1 ? `${e.repeatCount} ${e.giftName}` : e.giftName,
          others: 0,
          pri: coins >= GAME.priorityGiftCoins,
          id: ++seq,
        });
      }
    },

    onLike: (e) => {
      const pl = player({ username: e.username, avatar: '' }, safeName(e.nickname, e.username));
      pl.likes += e.likeCount;
      const n = Math.floor(pl.likes / GAME.likesPerPoint);
      if (n && pl.home) {
        pl.likes -= n * GAME.likesPerPoint;
        addPoints(pl.home, n, pl);
      }
    },

    onMember: (e) => {
      const spoken = speakableName(safeName(e.nickname, e.username));
      if (spoken !== 'bạn') g.talk.greeter.add(e.username, spoken);
    },

    onFollow: (e) => {
      if (g.talk.follows.first(e.username)) voice.say(GAME.thankFollow(speakableName(safeName(e.nickname, e.username)), g.kenh));
    },

    onControl: (c) => {
      if (c.action === 'setName' && c.text) setChannelName(c.text);
      // 2 lệnh này chạy ở mọi trang để trang điều khiển và stage giống nhau
      if (c.action === 'custom' && c.text === 'skip') skipPhase();
      if (c.action === 'custom' && c.text === 'newRound') newRound();
      if (c.action === 'setTheme' && c.text) setTheme(c.text);
      if (c.action === 'setPrefs' && c.text) {
        try {
          const p = JSON.parse(c.text) as Record<string, string>;
          const first = !g.prefsLoaded; // lần đầu nối vào: chỉ nhận cài đặt, không bắt đầu lại vòng
          g.prefsLoaded = true;
          setRoundMs(roundSecOf(p) * 1000, !first);
          if (first) g.phase = roundClock().phase; // đổi lúc đang chơi thì để vòng lặp vòng chơi tự sang vòng mới (cộng số vòng, xoá điểm)
          g.prefs = p;
          setPrefs(p);
          if (IS_STAGE && p.voiceRate) voice.rate = rateOf(p); // tốc độ đã chọn, server nhớ qua lần bật lại
        } catch {
          // bỏ qua bộ cài đặt hỏng
        }
      }
      if (c.action === 'setVoice' && (c.text === 'M' || c.text === 'F')) {
        voice.defaultWho = c.text;
        setVoiceWho(c.text);
      }
      if (c.action === 'custom' && c.text === 'resetFans') {
        g.fans.clear();
        try {
          localStorage.removeItem(FANS_KEY);
        } catch {
          // bỏ qua
        }
        draw();
      }
      if (c.action === 'reset') {
        resetRound();
        g.scores.clear();
        g.next.clear();
        g.feed = [];
        g.called = null;
        draw();
      }
      if (!IS_STAGE) return; // chỉ trang stage làm theo lệnh giọng đọc, tránh 2 giọng
      if (c.action === 'speak' && c.text) voice.say(c.text, true);
      if (c.action === 'setRate' && c.text) voice.rate = Number(c.text) || 1;
      if (c.action === 'reset') {
        voice.stop();
        for (const t of Object.values(g.talk)) t.reset();
      }
    },
  });

  // Vòng chơi: mở màn -> gặp gỡ -> tổng kết -> vòng mới
  useEffect(() => {
    const t = setInterval(() => {
      const c = roundClock();
      if (c.phase === 'play' && c.remainMs <= 10_000 && !g.warned) {
        g.warned = true;
        if (g.scores.size) voice.say(GAME.tenSecondsLeft, true);
      }
      if (c.phase === g.phase) return;
      if (c.phase === 'summary') {
        const top = ranking().slice(0, 3);
        const champ = champion();
        g.summary = { no: g.round, top, champion: champ };
        g.queue = g.queue.filter((q) => q.kind === 'gift'); // bỏ lượt gọi tên, giữ lượt quà cho vòng sau
        g.visiting = null;
        voice.say(GAME.summary(g.round, top, champ && speakableName(champ.name), labelsOf(g.prefs).champ), true);
      } else if (c.phase === 'open' || g.phase === 'summary') {
        g.round++;
        g.scores = g.next;
        g.next = new Map();
        g.summary = null;
        resetRound();
        voice.say(GAME.roundStart(g.round), true);
      }
      g.phase = c.phase;
      draw();
    }, 250);
    return () => clearInterval(t);
  }, []);

  // Lần lượt ghé thăm: MC đọc tên tỉnh cùng lúc camera bay tới, đọc xong mới qua tỉnh kế
  useEffect(() => {
    let alive = true;
    void (async () => {
      let idleSince = Date.now();
      while (alive) {
        const v = g.phase === 'summary' ? undefined : g.queue.shift();
        if (!v) {
          if (g.visiting && Date.now() - idleSince > GAME.homeAfterMs) {
            g.visiting = null;
            draw();
          }
          await sleep(150);
          continue;
        }
        g.called = v;
        if (v.pid) {
          g.visiting = v;
          g.lastVisit.set(v.pid, Date.now());
        }
        draw();
        voice.say(lineFor(v, g.queue.length), true);
        const start = Date.now();
        // quà càng to đứng càng lâu cho người tặng thấy hiệu ứng của mình
        await sleep(v.kind === 'gift' ? Math.max(GAME.dwellMs, GAME.giftTierDwellMs[GAME.giftTier(v.xu)]) : GAME.dwellMs);
        while (alive && voice.busy && Date.now() - start < 15_000) await sleep(150);
        idleSince = Date.now();
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Nhắc chia sẻ + đọc khi live im (chỉ trang stage có tiếng)
  useEffect(() => {
    if (!IS_STAGE) return;
    const timers = [
      setInterval(() => {
        const names = g.talk.recent.latest(3, GAME.shareReminderEveryMs);
        const line = names.length ? GAME.shareWithNames(joinNames(names), g.kenh) : pick(GAME.shareLines);
        if (line) voice.say(line);
      }, GAME.shareReminderEveryMs),
      setInterval(() => {
        if (voice.quietForMs() < GAME.idleAfterMs) return;
        const line = pick(GAME.idleLines);
        if (line) voice.say(line);
      }, 15_000),
    ];
    return () => timers.forEach(clearInterval);
  }, []);

  const rank = ranking();
  const waiting = new Set(g.queue.map((q) => q.pid));
  return {
    status,
    channelName,
    voiceWho,
    theme,
    prefs,
    labels: labelsOf(prefs),
    voiceRate: rateOf(prefs),
    soundOn: prefs.soundOn !== '0', // công tắc "Âm thanh toàn bộ"
    giftFx: prefs.giftFx !== '0', // công tắc "Hiệu ứng quà"
    giftTable: prefs.giftTable === '1', // công tắc khung "Quà gửi về quê" (bảng điểm quà), mặc định tắt
    roundSec: roundSecOf(prefs),
    music: {
      on: prefs.musicOn ? prefs.musicOn === '1' : GAME.musicOn,
      volume: Math.min(100, Math.max(0, Number(prefs.musicVolume ?? GAME.musicVolume) || 0)),
    },
    round: g.round,
    phase: g.phase,
    top: rank.slice(0, 3),
    // tỉnh đang chờ ghé thì chưa sáng, đợi camera tới mới thắp
    lit: rank.filter((r) => !waiting.has(r.id)).map((r) => r.id),
    litCount: rank.length,
    // độ đậm màu tỉnh theo điểm (căn bậc 2 cho tỉnh ít điểm vẫn thấy rõ)
    heat: Object.fromEntries(rank.map((r) => [r.id, Math.sqrt(r.pts / (rank[0]?.pts || 1))])) as Record<string, number>,
    // tỉnh đang xếp hàng chờ ghé, không trùng, tối đa 4
    upcoming: [...new Set(g.queue.filter((q) => q.pid).map((q) => q.spot?.name ?? PROVINCE_BY_ID.get(q.pid!)!.name))].slice(0, 4),
    visiting: g.visiting,
    called: g.called,
    feed: g.feed,
    champion: champion(),
    summary: g.phase === 'summary' ? g.summary : null,
    fans: Object.fromEntries([...g.fans].map(([k, v]) => [k, v.size])) as Record<string, number>,
  };
}

export type GameState = ReturnType<typeof useGame>;
export type Labels = typeof GAME.labels;

/** Tốc độ giọng đọc chủ kênh chọn (0.7–1.5), chưa chọn thì GAME.voiceRate */
const rateOf = (prefs: Record<string, string>) => Math.min(1.5, Math.max(0.7, Number(prefs.voiceRate) || GAME.voiceRate));

/** Chữ trên màn hình: chữ chủ kênh đặt (prefs.label_xxx), ô để trống thì dùng chữ mặc định */
export function labelsOf(prefs: Record<string, string>): Labels {
  const out = { ...GAME.labels };
  for (const k of Object.keys(out) as (keyof Labels)[]) {
    const v = prefs[`label_${k}`]?.trim();
    if (v) out[k] = v;
  }
  return out;
}

// 6 thành phố trực thuộc trung ương, còn lại là tỉnh
const CITIES = new Set(['ha-noi', 'hai-phong', 'hue', 'da-nang', 'can-tho', 'tp-ho-chi-minh']);
/** Tên để MC đọc: "TP. Hồ Chí Minh" đọc thành "Thành phố Hồ Chí Minh" */
const spokenProv = (pid: string) => PROVINCE_BY_ID.get(pid)!.name.replace(/^TP\.\s*/, 'Thành phố ');
/** "tỉnh Quảng Ninh", "thành phố Đà Nẵng", "Thành phố Hồ Chí Minh" */
const provUnit = (pid: string) => {
  const n = spokenProv(pid);
  return n.startsWith('Thành phố') ? n : `${CITIES.has(pid) ? 'thành phố' : 'tỉnh'} ${n}`;
};

function lineFor(v: Visit, waiting: number) {
  const name = speakableName(v.user.name);
  const prov = v.pid ? spokenProv(v.pid) : '';
  if (v.kind === 'gift') return v.pid ? GAME.giftLine(name, v.gift, prov, v.pts) : GAME.giftNoHome(name, v.gift);
  const place = v.spot?.name ?? prov; // gõ tên đảo thì gọi tên đảo
  const call = v.others > 0 ? GAME.calledWithOthers(name, place, v.others) : pick(GAME.calledLines)!(name, place);
  // nhắc 1-2 đặc sản / danh thắng, thỉnh thoảng khen người (src/game/provinceTalk.ts).
  // Phòng đông (còn từ 3 lượt chờ) thì chỉ gọi tên cho kịp.
  const quiet = !v.pid || waiting >= GAME.talkWhenQueueBelow;
  const s = v.spot;
  // đảo xa luôn có lời thăm các anh giữ đảo, kể cả lúc đông; đảo nhỏ thì nửa số lượt
  const talk = s?.far
    ? GAME.farSpotLine(s.name, provUnit(v.pid!))
    : quiet
      ? ''
      : s
        ? GAME.spotLine(s.name, provUnit(v.pid!), !!s.city) + (!s.city && Math.random() < 0.5 ? ` | ${pick(GAME.soldierLines)}` : '')
        : talkAbout(v.pid!, prov);
  return talk ? `${call} | ${talk}` : call;
}

// ['An', 'Bình', 'Chi'] -> 'bạn An, bạn Bình và bạn Chi'; commasOnly: 'bạn An, bạn Bình, bạn Chi' (câu sau còn "và N bạn nữa")
function joinNames(names: string[], commasOnly = false) {
  const spoken = names.map((n) => (n === 'bạn' ? n : `bạn ${n}`));
  if (commasOnly) return spoken.join(', ');
  return spoken.length > 1 ? `${spoken.slice(0, -1).join(', ')} và ${spoken[spoken.length - 1]}` : (spoken[0] ?? '');
}
