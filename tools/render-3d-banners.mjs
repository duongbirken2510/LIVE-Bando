/**
 * Minimal-Text 3D Studio Brand Banner (2400x1260), 3D CTA Banner (2400x640) & Transparent Logo Wordmark (1800x520) Renderer
 * - Composites docs/media/live_bando_social_hero.jpg with native 'Segoe UI' Vietnamese typography via Headless Chrome CDP.
 * - Strictly Evergreen (ZERO version numbers like v1.0.0 and ZERO hardcoded port numbers inside images).
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MEDIA_DIR = path.join(ROOT, 'docs', 'media');

const heroJpgPath = path.join(MEDIA_DIR, 'live_bando_social_hero.jpg');
if (!fs.existsSync(heroJpgPath)) {
  throw new Error(`Missing 3D Studio Hero image at ${heroJpgPath}`);
}
const bg3dDataUri = `data:image/jpeg;base64,${fs.readFileSync(heroJpgPath).toString('base64')}`;

const brandBannerHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 2400px;
    height: 1260px;
    overflow: hidden;
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    background: #080204;
    color: #fff;
    position: relative;
  }
  .bg-3d {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center center;
  }
  .outer-rim {
    position: absolute;
    inset: 24px;
    border-radius: 36px;
    border: 2px solid rgba(251, 191, 36, 0.45);
    box-shadow: inset 0 0 70px rgba(0, 0, 0, 0.55);
    pointer-events: none;
  }
  .top-badge {
    position: absolute;
    left: 1150px;
    top: 205px;
    display: inline-flex;
    align-items: center;
    gap: 14px;
    background: rgba(24, 8, 6, 0.78);
    border: 2px solid rgba(251, 191, 36, 0.72);
    padding: 13px 36px;
    border-radius: 999px;
    font-size: 26px;
    font-weight: 900;
    letter-spacing: 0.09em;
    color: #fde68a;
    box-shadow: 0 14px 35px rgba(0,0,0,0.8);
  }
  .pulse-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #ef4444;
    box-shadow: 0 0 14px #ef4444;
  }
  .bottom-right-panel {
    position: absolute;
    left: 1110px;
    top: 805px;
    width: 1140px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 26px;
  }
  .tagline {
    font-size: 38px;
    font-weight: 900;
    letter-spacing: 0.05em;
    color: #fef3c7;
    text-transform: uppercase;
    text-shadow: 0 6px 20px rgba(0,0,0,0.95);
    white-space: nowrap;
  }
  .pill-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
  }
  .pill-3d {
    background: linear-gradient(145deg, rgba(42, 16, 12, 0.90) 0%, rgba(16, 6, 5, 0.96) 100%);
    border: 2px solid rgba(251, 191, 36, 0.72);
    box-shadow: 0 14px 30px rgba(0,0,0,0.85), inset 0 2px 8px rgba(254, 240, 138, 0.25);
    border-radius: 20px;
    padding: 14px 28px;
    font-size: 27px;
    font-weight: 800;
    color: #fff;
    white-space: nowrap;
  }
  .pill-3d span { color: #fbbf24; }
  .author-sig {
    margin-top: 8px;
    font-size: 24px;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: rgba(253, 224, 71, 0.88);
    text-shadow: 0 4px 12px rgba(0,0,0,0.95);
  }
</style>
</head>
<body>
  <img class="bg-3d" src="${bg3dDataUri}" alt="Việt Nam Đất Nước Ta Ơi" />
  <div class="outer-rim"></div>
  <div class="top-badge">
    <span class="pulse-dot"></span>
    <span>TIKTOK LIVE INTERACTIVE GIS GAME SHOW · 9:16</span>
  </div>
  <div class="bottom-right-panel">
    <div class="tagline">BẢN ĐỒ 34 TỈNH THÀNH &amp; BIỂN ĐẢO QUÊ HƯƠNG</div>
    <div class="pill-row">
      <div class="pill-3d">🗺️ <span>34 Tỉnh</span> &amp; Biển Đảo</div>
      <div class="pill-3d">🎨 <span>20 Giao Diện</span> Sơn Mài</div>
      <div class="pill-3d">💿 Bộ Cài <span>.EXE 1-Click</span></div>
    </div>
    <div class="author-sig">DUONG BIRKEN • DUONGBIRKEN.DETA.VN</div>
  </div>
</body>
</html>`;

const ctaBannerHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 2400px;
    height: 640px;
    overflow: hidden;
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    background: radial-gradient(circle at 50% 20%, #4a120e 0%, #1c0806 55%, #080202 100%);
    color: #fff;
    position: relative;
  }
  .outer-rim {
    position: absolute;
    inset: 20px;
    border-radius: 34px;
    border: 2.5px solid rgba(251, 191, 36, 0.58);
    box-shadow: inset 0 0 80px rgba(245, 158, 11, 0.14);
    pointer-events: none;
  }
  .wrap {
    position: relative;
    z-index: 10;
    width: 100%;
    height: 100%;
    padding: 52px 84px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
  }
  .title {
    font-size: 50px;
    font-weight: 900;
    letter-spacing: 0.03em;
    background: linear-gradient(180deg, #fffbeb 0%, #fde047 50%, #d97706 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 8px 20px rgba(0,0,0,0.9));
    white-space: nowrap;
  }
  .grid {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 42px;
  }
  .card-3d {
    height: 390px;
    border-radius: 32px;
    padding: 36px 34px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    text-align: center;
    background: linear-gradient(160deg, rgba(34, 16, 14, 0.94) 0%, rgba(12, 5, 5, 0.98) 100%);
    box-shadow: 0 28px 60px rgba(0,0,0,0.85), inset 0 3px 12px rgba(255,255,255,0.08);
  }
  .c-blue { border: 3px solid rgba(56, 189, 248, 0.82); }
  .c-gold { border: 3px solid rgba(251, 191, 36, 0.88); }
  .c-emerald { border: 3px solid rgba(52, 211, 153, 0.82); }
  .orb-3d {
    width: 112px;
    height: 112px;
    border-radius: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 58px;
    box-shadow: 0 16px 35px rgba(0,0,0,0.7), inset 0 4px 14px rgba(255,255,255,0.35);
  }
  .o-blue { background: linear-gradient(145deg, #0284c7, #1e3a8a); border: 2.5px solid #7dd3fc; }
  .o-gold { background: linear-gradient(145deg, #f59e0b, #92400e); border: 2.5px solid #fef08a; }
  .o-emerald { background: linear-gradient(145deg, #10b981, #065f46); border: 2.5px solid #a7f3d0; }
  .card-title { font-size: 35px; font-weight: 900; letter-spacing: 0.02em; color: #fff; }
  .btn-3d {
    width: 100%;
    padding: 20px 24px;
    border-radius: 20px;
    font-size: 28px;
    font-weight: 900;
    box-shadow: 0 12px 28px rgba(0,0,0,0.65), inset 0 3px 8px rgba(255,255,255,0.35);
  }
  .b-blue { background: linear-gradient(180deg, #0ea5e9 0%, #0369a1 100%); color: #fff; border: 2px solid #7dd3fc; }
  .b-gold { background: linear-gradient(180deg, #fbbf24 0%, #d97706 100%); color: #0f172a; border: 2px solid #fef08a; }
  .b-emerald { background: linear-gradient(180deg, #10b981 0%, #047857 100%); color: #fff; border: 2px solid #a7f3d0; }
</style>
</head>
<body>
  <div class="outer-rim"></div>
  <div class="wrap">
    <div class="title">🗺️ VIỆT NAM ĐẤT NƯỚC TA ƠI — BẢN ĐỒ 34 TỈNH &amp; BIỂN ĐẢO</div>
    <div class="grid">
      <div class="card-3d c-blue">
        <div class="orb-3d o-blue">💿</div>
        <div class="card-title">BỘ CÀI WINDOWS 1-CLICK</div>
        <div class="btn-3d b-blue">TẢI BỘ CÀI ĐỘC LẬP (.EXE)</div>
      </div>
      <div class="card-3d c-gold">
        <div class="orb-3d o-gold">⭐</div>
        <div class="card-title">TẶNG 1 STAR GITHUB</div>
        <div class="btn-3d b-gold">LIVE-Bando</div>
      </div>
      <div class="card-3d c-emerald">
        <div class="orb-3d o-emerald">🌐</div>
        <div class="card-title">TÁC GIẢ DUONG BIRKEN</div>
        <div class="btn-3d b-emerald">duongbirken.deta.vn</div>
      </div>
    </div>
  </div>
</body>
</html>`;

const brandHtmlPath = path.join(process.env.TEMP || '/tmp', 'live_bando_brand_3d.html');
const ctaHtmlPath = path.join(process.env.TEMP || '/tmp', 'live_bando_cta_3d.html');
fs.writeFileSync(brandHtmlPath, brandBannerHtml, 'utf8');
fs.writeFileSync(ctaHtmlPath, ctaBannerHtml, 'utf8');

const chromeCandidates = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
];
const browserExe = chromeCandidates.find((p) => fs.existsSync(p));
if (!browserExe) throw new Error('Chrome/Edge not found');

const debugPort = 9364;
const userDataDir = path.join(ROOT, '.chrome-capture-tmp');
const proc = spawn(
  browserExe,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${userDataDir}`,
    'about:blank',
  ],
  { stdio: 'ignore' }
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (let i = 0; i < 40; i++) {
  await sleep(300);
  try {
    const r = await fetch(`http://127.0.0.1:${debugPort}/json/version`);
    if (r.ok) break;
  } catch {}
}
const pageTarget = await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, { method: 'PUT' }).then((r) => r.json());
const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }));
let msgId = 1;
const callCdp = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = msgId++;
    const handler = (ev) => {
      const data = JSON.parse(ev.data);
      if (data.id === id) {
        ws.removeEventListener('message', handler);
        if (data.error) reject(new Error(data.error.message));
        else resolve(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });

await callCdp('Page.enable');

// 1. 3D Brand Banner (2400 x 1260)
await callCdp('Emulation.setDeviceMetricsOverride', { width: 2400, height: 1260, deviceScaleFactor: 1, mobile: false });
await callCdp('Page.navigate', { url: `file:///${brandHtmlPath.replace(/\\/g, '/')}` });
await sleep(900);
const brandShot = await callCdp('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 2400, height: 1260, scale: 1 } });
fs.writeFileSync(path.join(MEDIA_DIR, 'live_bando_brand_banner.png'), Buffer.from(brandShot.data, 'base64'));
console.log('  [✓] Đã lưu: docs/media/live_bando_brand_banner.png (2400x1260 Evergreen 3D)');

// 2. 3D CTA Banner (2400 x 640)
await callCdp('Emulation.setDeviceMetricsOverride', { width: 2400, height: 640, deviceScaleFactor: 1, mobile: false });
await callCdp('Page.navigate', { url: `file:///${ctaHtmlPath.replace(/\\/g, '/')}` });
await sleep(700);
const ctaShot = await callCdp('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 2400, height: 640, scale: 1 } });
fs.writeFileSync(path.join(MEDIA_DIR, 'live_bando_cta_banner.png'), Buffer.from(ctaShot.data, 'base64'));
console.log('  [✓] Đã lưu: docs/media/live_bando_cta_banner.png (2400x640 Evergreen 3D)');

// 3. Transparent Logo Wordmark (1800 x 520)
const wordmarkSvgUrl = pathToFileURL(path.join(MEDIA_DIR, 'live_bando_logo_wordmark.svg')).href;
await callCdp('Emulation.setDeviceMetricsOverride', { width: 1800, height: 520, deviceScaleFactor: 1, mobile: false });
await callCdp('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
await callCdp('Page.navigate', { url: wordmarkSvgUrl });
await sleep(700);
const logoShot = await callCdp('Page.captureScreenshot', { format: 'png', omitBackground: true, clip: { x: 0, y: 0, width: 1800, height: 520, scale: 1 } });
fs.writeFileSync(path.join(MEDIA_DIR, 'live_bando_logo_wordmark.png'), Buffer.from(logoShot.data, 'base64'));
console.log('  [✓] Đã lưu: docs/media/live_bando_logo_wordmark.png (1800x520 Transparent)');

ws.close();
proc.kill();
try {
  fs.rmSync(userDataDir, { recursive: true, force: true });
} catch {}
