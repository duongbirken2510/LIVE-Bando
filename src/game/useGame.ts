import { useEffect, useState } from 'react';
import { useLiveEvents } from '../live/useLiveEvents';
import type { LiveStatus } from '../live/types';
import { voice, speakableName } from '../live/voice';
import { containsBanned, maskBanned } from '../live/bannedWords';
import { NameBatcher } from '../live/scoreboard';
import { detectWish, GiftThanker, makePicker, OncePerPerson, RecentPeople, WishLimiter } from '../live/chatter';
import { IS_STAGE } from '../live/page';
import { GAME } from './config';
import { findProvince, PROVINCE_BY_ID } from './provinces';

const pick = makePicker();

voice.defaultWho = GAME.voice; // server gửi lại giọng đã chọn (setVoice) ngay khi trang nối vào
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
const CYCLE = GAME.roundMs + GAME.summaryMs;
let clockOffset = 0;
export function roundClock(now = Date.now()) {
  const t = (((now + clockOffset) % CYCLE) + CYCLE) % CYCLE;
  const phase: Phase = t < GAME.openMs ? 'open' : t < GAME.roundMs ? 'play' : 'summary';
  return { phase, remainMs: phase === 'summary' ? 0 : GAME.roundMs - t };
}
/** Nhảy về đầu 1 vòng mới (live tự động dùng để chạy trọn 1 vòng) */
function newRound() {
  const t = (((Date.now() + clockOffset) % CYCLE) + CYCLE) % CYCLE;
  clockOffset += CYCLE - t;
}
export const ROUND_CYCLE_MS = CYCLE;
function skipPhase() {
  const t = (((Date.now() + clockOffset) % CYCLE) + CYCLE) % CYCLE;
  const next = t < GAME.openMs ? GAME.openMs : t < GAME.roundMs ? GAME.roundMs : CYCLE;
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
    summary: null as Summary | null,
    fans: loadFans(),
    saveTimer: 0,
    drawTimer: 0,
    talk: {
      greeter: new NameBatcher(
        GAME.greetEveryMs,
        GAME.namesPerGreeting,
        (names) => voice.say(GAME.greeting(joinNames(names), g.kenh)),
        () => voice.waiting >= 2,
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

  const safeName = (nickname: string, username: string) => (containsBanned(nickname) ? username : nickname);

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
    g.queue.length = 0;
    g.visiting = null;
    for (const p of g.players.values()) Object.assign(p, { home: null, pts: 0, likes: 0, pendingXu: 0 });
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

      const topic = containsBanned(e.comment) ? null : detectWish(e.comment);
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
      enqueue({ pid: prov.id, user: { username: e.username, name, avatar: pl.avatar }, kind: 'comment', xu: 0, pts: 0, gift: '', others: 0, pri: false, id: ++seq });
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
        g.queue.length = 0;
        g.visiting = null;
        voice.say(GAME.summary(g.round, top, champ && speakableName(champ.name)), true);
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
        voice.say(lineFor(v), true);
        const start = Date.now();
        await sleep(v.pri ? GAME.giftDwellMs : GAME.dwellMs);
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
    round: g.round,
    phase: g.phase,
    top: rank.slice(0, 3),
    // tỉnh đang chờ ghé thì chưa sáng, đợi camera tới mới thắp
    lit: rank.filter((r) => !waiting.has(r.id)).map((r) => r.id),
    litCount: rank.length,
    visiting: g.visiting,
    called: g.called,
    feed: g.feed,
    champion: champion(),
    summary: g.phase === 'summary' ? g.summary : null,
    fans: Object.fromEntries([...g.fans].map(([k, v]) => [k, v.size])) as Record<string, number>,
  };
}

export type GameState = ReturnType<typeof useGame>;

function lineFor(v: Visit) {
  const name = speakableName(v.user.name);
  const prov = v.pid ? PROVINCE_BY_ID.get(v.pid)!.name : '';
  if (v.kind === 'gift') return v.pid ? GAME.giftLine(name, v.gift, prov, v.pts) : GAME.giftNoHome(name, v.gift);
  if (v.others > 0) return GAME.calledWithOthers(name, prov, v.others);
  return pick(GAME.calledLines)!(name, prov);
}

// ['An', 'Bình', 'Chi'] -> 'bạn An, bạn Bình và bạn Chi'
function joinNames(names: string[]) {
  const spoken = names.map((n) => (n === 'bạn' ? n : `bạn ${n}`));
  return spoken.length > 1 ? `${spoken.slice(0, -1).join(', ')} và ${spoken[spoken.length - 1]}` : (spoken[0] ?? '');
}
