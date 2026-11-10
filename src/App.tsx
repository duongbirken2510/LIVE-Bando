import { IS_STAGE, emitTest, sendControl } from './live/page';
import { StageFrame } from './live/StageFrame';
import { Dashboard } from './live/Dashboard';
import { useGame, ROUND_CYCLE_MS } from './game/useGame';
import { GameStage } from './game/GameStage';
import { PROVINCES } from './game/provinces';
import { THEMES, themeById } from './game/themes';

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
      top={<ThemePicker current={themeById(game.theme).id} />}
      extra={<GameControls />}
      autoLive={{
        durationMs: ROUND_CYCLE_MS, // trọn 1 vòng: mở màn, gặp gỡ, tổng kết
        comment: () => provComment(),
        onStart: () => sendControl('custom', 'newRound'),
      }}
    />
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
