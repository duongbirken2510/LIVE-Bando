import { useState } from 'react';

/** Avatar TikTok; không có ảnh hoặc ảnh lỗi thì hiện chữ cái cuối của tên trên nền màu riêng của người đó */
export function Avatar({ user, size, className = '' }: { user: { name: string; avatar: string }; size: number; className?: string }) {
  const [broken, setBroken] = useState<string | null>(null);
  const ok = user.avatar && broken !== user.avatar;
  let hue = 0;
  for (const c of user.name) hue = (hue * 31 + c.charCodeAt(0)) % 360;
  const letter = (user.name.trim().split(/\s+/).pop() ?? '?').slice(0, 1).toUpperCase() || '?';
  return (
    <div
      className={`avatar ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.44, background: ok ? undefined : `hsl(${hue} 45% 38%)` }}
    >
      {ok ? <img src={user.avatar} referrerPolicy="no-referrer" onError={() => setBroken(user.avatar)} alt="" /> : letter}
    </div>
  );
}
