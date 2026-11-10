import { IS_STAGE, emitTest, sendControl } from './live/page';
import { StageFrame } from './live/StageFrame';
import { Dashboard } from './live/Dashboard';
import { useGame, ROUND_CYCLE_MS } from './game/useGame';
import { GameStage } from './game/GameStage';
import { PROVINCES } from './game/provinces';
import { THEMES, themeById } from './game/themes';
import { useState } from 'react';
import type { GameState, Labels } from './game/useGame';
import { GAME } from './game/config';
import { playSpark } from './game/sfx';
import { startMusic, stopMusic } from './game/music';

export default function App() {
  const game = useGame();

  // Trang cho TikTok LIVE Studio: chỉ có màn hình game
  if (IS_STAGE) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <StageFrame>
          <GameStage game={game} />
        </StageFrame>
      </div>
    );
  }

  // Trang điều khiển
  return (
    <Dashboard
      status={game.status}
      channelName={game.channelName}
      voiceWho={game.voiceWho}
      preview={
        <StageFrame maxHeight={720}>
          <GameStage game={game} />
        </StageFrame>
      }
      top={
        <>
          <ThemePicker current={themeById(game.theme).id} />
          <TextAndSound game={game} />
        </>
      }
      extra={<GameControls />}
      autoLive={{
        durationMs: ROUND_CYCLE_MS, // trọn 1 vòng: mở màn, gặp gỡ, tổng kết
        comment: () => provComment(),
        onStart: () => sendControl('custom', 'newRound'),
      }}
    />
  );
}

const LABEL_FIELDS: [keyof Labels, string][] = [
  ['title1', 'Tên game, dòng to'],
  ['title2', 'Tên game, dòng nghiêng'],
  ['subtitle', 'Dòng hướng dẫn dưới tên'],
  ['called', 'Khung người vừa gọi'],
  ['gifts', 'Khung bảng quà'],
  ['champ', 'Danh hiệu người góp nhiều nhất'],
  ['podium', 'Khung top 3'],
  ['visiting', 'Chữ trước tên tỉnh đang ghé'],
  ['fans', 'Chữ đếm đồng hương'],
];
const setPrefs = (p: Record<string, string>) => sendControl('setPrefs', JSON.stringify(p));

/** Sửa chữ trên màn hình, bật/tắt âm thanh, nhạc nền, nút mô phỏng 1 lượt gọi tên */
function TextAndSound({ game }: { game: GameState }) {
  const [draft, setDraft] = useState<Record<string, string> | null>(null);
  const [previewing, setPreviewing] = useState(false);
  // ô nhập: chữ đang soạn, chưa soạn thì lấy chữ chủ kênh đã lưu
  const val = (k: keyof Labels) => draft?.[k] ?? game.prefs[`label_${k}`] ?? '';
  const save = () => {
    if (!draft) return;
    setPrefs(Object.fromEntries(Object.entries(draft).map(([k, v]) => [`label_${k}`, v])));
    setDraft(null);
  };
  const restore = () => {
    setPrefs(Object.fromEntries(LABEL_FIELDS.map(([k]) => [`label_${k}`, ''])));
    setDraft(null);
  };
  const simulate = async () => {
    const u = fakeUser();
    await emitTest('chat', { ...u, comment: provComment() });
  };
  // 1 người giả chọn quê rồi tặng quà đúng số xu: thấy đủ đốm sáng + hiệu ứng mức đó + tiếng trên stage
  const simulateGift = async (xu: number) => {
    const u = fakeUser();
    await emitTest('chat', { ...u, comment: provComment() });
    setTimeout(() => emitTest('gift', { ...u, giftName: xu >= 1000 ? 'Vương miện' : xu >= 100 ? 'Xe thể thao' : 'Hoa hồng', giftId: 1, diamondCount: xu, repeatCount: 1 }), 600);
  };
  const previewMusic = () => {
    setPreviewing(true);
    startMusic(game.music.volume / 100);
    setTimeout(() => {
      stopMusic();
      setPreviewing(false);
    }, 8000);
  };
  const box = 'rounded-lg bg-slate-800 px-3 py-2 text-sm';
  const btn = 'rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium hover:bg-slate-700';

  return (
    <section className="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800">
      <h2 className="mb-3 font-semibold">Chữ trên màn hình & âm thanh</h2>

      <div className="grid gap-2 sm:grid-cols-2">
        {LABEL_FIELDS.map(([k, hint]) => (
          <label key={k} className="text-xs text-slate-400">
            {hint}
            <input
              className={`${box} mt-1 w-full text-slate-100`}
              maxLength={60}
              placeholder={GAME.labels[k]}
              value={val(k)}
              onChange={(e) => setDraft({ ...(draft ?? {}), [k]: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && save()}
            />
          </label>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-slate-950 disabled:opacity-40" disabled={!draft} onClick={save}>
          Lưu chữ
        </button>
        <button className={btn} onClick={restore}>
          Về chữ mặc định
        </button>
        <span className="self-center text-xs text-slate-500">Ô để trống thì dùng chữ mặc định (chữ mờ).</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-slate-800/60 p-3 text-sm">
        <Switch on={game.soundOn} onChange={(on) => setPrefs({ soundOn: on ? '1' : '0' })} label="Âm thanh toàn bộ" />
        <Switch on={game.music.on} onChange={(on) => setPrefs({ musicOn: on ? '1' : '0' })} label="Nhạc nền" />
        <Switch on={game.giftFx} onChange={(on) => setPrefs({ giftFx: on ? '1' : '0' })} label="Hiệu ứng quà" />
        <label className="flex items-center gap-2">
          Âm lượng nhạc
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={game.music.volume}
            onChange={(e) => setPrefs({ musicVolume: e.target.value })}
            className="accent-amber-500"
          />
          <span className="w-9 text-right tabular-nums">{game.music.volume}%</span>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-slate-950" onClick={simulate}>
          ✨ Mô phỏng 1 lượt gọi tên
        </button>
        <button className={btn} onClick={() => playSpark(750, true)}>
          🔊 Nghe tiếng đốm sáng (máy này)
        </button>
        <button className={btn} onClick={previewMusic} disabled={previewing}>
          🎵 {previewing ? 'Đang phát 8 giây...' : 'Nghe thử nhạc nền (máy này)'}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-slate-400">Thử hiệu ứng quà:</span>
        {[3, 10, 50, 199, 1000].map((xu, i) => (
          <button key={xu} className={btn} title={GAME.giftTierNames[i + 1]} onClick={() => simulateGift(xu)}>
            {['🌹', '🪙', '🎉', '🎆', '👑'][i]} {xu.toLocaleString('vi-VN')} xu
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Mô phỏng: 1 người giả gọi tên 1 tỉnh, stage chạy đủ đốm sáng, tích điểm, giọng MC và âm thanh (nếu đang bật). Nút "máy này" chỉ phát ở loa máy tính, không lên live.
      </p>
    </section>
  );
}

function Switch({ on, onChange, label }: { on: boolean; onChange: (on: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex items-center gap-2">
      <span className={`relative h-6 w-11 rounded-full transition ${on ? 'bg-emerald-500' : 'bg-slate-600'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
      {label}: <b className={on ? 'text-emerald-400' : 'text-slate-400'}>{on ? 'Bật' : 'Tắt'}</b>
    </button>
  );
}

/** 20 giao diện: bấm là stage và ô xem trước đổi ngay; server nhớ lựa chọn */
function ThemePicker({ current }: { current: string }) {
  return (
    <section className="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800">
      <h2 className="mb-3 font-semibold">
        Chọn giao diện <span className="text-sm font-normal text-slate-400">({themeById(current).name})</span>
      </h2>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => sendControl('setTheme', t.id)}
            className={`overflow-hidden rounded-lg text-left ring-2 transition ${t.id === current ? 'ring-amber-400' : 'ring-transparent hover:ring-slate-500'}`}
            title={t.name}
          >
            <div style={{ background: `linear-gradient(90deg, ${t.head1}, ${t.head2})`, height: 8 }} />
            <div className="flex h-11 items-center justify-center gap-1" style={{ background: `radial-gradient(circle at 40% 40%, ${t.bg2}, ${t.bg1})` }}>
              {t.lit.slice(0, 4).map((c) => (
                <span key={c} className="h-3 w-3 rounded-full" style={{ background: c, outline: `1px solid ${t.mapLine}` }} />
              ))}
            </div>
            <div className="truncate px-1.5 py-1 text-[11px] font-medium" style={{ background: t.bg1, color: t.accent }}>
              {t.name}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

// ---------- Nút riêng của game ----------
const NAMES = ['Lan Anh', 'Minh Tuấn', 'Thu Hà', 'Quốc Bảo', 'Ngọc Mai', 'Hoàng Long', 'Bích Trâm', 'Đức Anh', 'Kim Ngân', 'Mỹ Linh', 'Gia Huy', 'Bé Na 🌸'];
const any = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const fakeUser = (i = Math.floor(Math.random() * 500)) => {
  const nickname = i < NAMES.length ? NAMES[i] : `${any(NAMES)} ${i}`;
  return { username: `test${i}`, nickname };
};
const provComment = () => {
  const p = any(PROVINCES);
  return any([p.name, `quê mình ${any(p.aliases)} nè`, `${p.name} ơi`, any(p.aliases).toUpperCase()]);
};

function GameControls() {
  const btn = 'rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium hover:bg-slate-700';
  return (
    <section className="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800">
      <h2 className="mb-3 font-semibold">Thử game Việt Nam đất nước ta ơi</h2>
      <div className="flex flex-wrap gap-2">
        <button className={btn} onClick={() => emitTest('chat', { ...fakeUser(), comment: provComment() })}>
          📍 1 người gọi tên tỉnh
        </button>
        <button className={btn} onClick={() => emitTest('chat', { ...fakeUser(), comment: 'Quê mình Kiên Giang nè' })}>
          🗺️ Gõ tên tỉnh cũ (Kiên Giang)
        </button>
        <button className={btn} onClick={() => emitTest('chat', { ...fakeUser(), comment: 'Hoàng Sa Trường Sa là của Việt Nam' })}>
          🏝️ Gõ Hoàng Sa
        </button>
        <button
          className={btn}
          onClick={() => {
            for (let i = 0; i < 60; i++) setTimeout(() => emitTest('chat', { ...fakeUser(i), comment: provComment() }), i * 50);
          }}
        >
          👥 60 người gọi liền
        </button>
        <button
          className={btn}
          onClick={async () => {
            const u = fakeUser(3);
            await emitTest('chat', { ...u, comment: 'Đắk Lắk' });
            setTimeout(() => emitTest('gift', { ...u, giftName: 'Hoa hồng', giftId: 5655, diamondCount: 1, repeatCount: 199 }), 800);
          }}
        >
          🎁 Gọi Đắk Lắk rồi tặng 199 xu
        </button>
        <button className={btn} onClick={() => emitTest('gift', { ...fakeUser(), giftName: 'Kem', giftId: 5827, diamondCount: 1, repeatCount: 1 })}>
          🍦 Tặng quà khi chưa chọn quê
        </button>
        <button className={btn} onClick={() => emitTest('like', { ...fakeUser(3), likeCount: 45 })}>
          ❤️ 45 tim (Đắk Lắk +3)
        </button>
        <button className={btn} onClick={() => sendControl('custom', 'skip')}>
          ⏭️ Qua giai đoạn kế
        </button>
        <button className={`${btn} bg-rose-900 hover:bg-rose-800`} onClick={() => sendControl('custom', 'resetFans')}>
          Xoá số đồng hương
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Mỗi vòng 2:30: 15 giây mở màn, rồi gặp gỡ, hết giờ tổng kết 15 giây. "Qua giai đoạn kế" để xem nhanh phần tổng kết.
      </p>
    </section>
  );
}
