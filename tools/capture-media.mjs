/**
 * Script tự động kết xuất Brand Banner, CTA Banner và chụp 5 ảnh màn hình thực tế (Admin + 4 trạng thái Stage 1080x1920)
 * qua Chrome Headless & Chrome DevTools Protocol (CDP).
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MEDIA_DIR = path.join(ROOT, 'docs', 'media');
const SHOT_DIR = path.join(ROOT, 'docs', 'screenshots');

fs.mkdirSync(MEDIA_DIR, { recursive: true });
fs.mkdirSync(SHOT_DIR, { recursive: true });

function findChrome() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error('Không tìm thấy Chrome hoặc Edge');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForHttp(url, timeoutMs = 25000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try {
      const r = await fetch(url);
      if (r.ok) return true;
    } catch {
      // retry
    }
    await sleep(300);
  }
  throw new Error(`Timeout chờ ${url}`);
}

class CdpSession {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.pending = new Map();
    this.ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(String(ev.data));
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    });
  }
  async ready() {
    if (this.ws.readyState === WebSocket.OPEN) return;
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  close() {
    try {
      this.ws.close();
    } catch {}
  }
}

async function openTab(debugPort, url, width, height, scale = 1, preScript = '') {
  const res = await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, { method: 'PUT' });
  const tab = await res.json();
  const cdp = new CdpSession(tab.webSocketDebuggerUrl);
  await cdp.ready();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: scale,
    mobile: false,
  });
  if (preScript) {
    await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: preScript });
  }
  await cdp.send('Page.navigate', { url });
  return { tab, cdp };
}

async function capturePng(cdp, outPath, clip) {
  const params = { format: 'png', fromSurface: true, captureBeyondViewport: true };
  if (clip) params.clip = { ...clip, scale: 1 };
  const { data } = await cdp.send('Page.captureScreenshot', params);
  fs.writeFileSync(outPath, Buffer.from(data, 'base64'));
  console.log(`  [✓] Đã lưu: ${path.relative(ROOT, outPath)}`);
}

async function postJson(baseUrl, apiPath, body) {
  await fetch(`${baseUrl}${apiPath}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function main() {
  const chromeExe = findChrome();
  const debugPort = 9346;
  const userDataDir = path.join(ROOT, '.chrome-capture-tmp');

  console.log('1. Khởi chạy Server LIVE-BANDO...');
  const tsxCli = path.join(ROOT, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  const serverProc = spawn(process.execPath, [tsxCli, 'server.ts'], {
    cwd: ROOT,
    env: { ...process.env, PORT: '4012', LIVE_MODE: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const serverPort = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout chờ server.ts khởi động')), 25000);
    serverProc.stdout.on('data', (chunk) => {
      const s = String(chunk);
      const m = /http:\/\/localhost:(\d+)/.exec(s);
      if (m) {
        clearTimeout(timer);
        resolve(Number(m[1]));
      }
    });
    serverProc.stderr.on('data', (chunk) => {
      process.stderr.write(String(chunk));
    });
    serverProc.on('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`server.ts thoát sớm với mã ${code}`));
    });
  });

  const baseUrl = `http://localhost:${serverPort}`;
  await waitForHttp(`${baseUrl}/api/tiktok/status`);
  console.log(`   Server đang chạy tại ${baseUrl}`);

  console.log('2. Khởi chạy Chrome Headless...');
  const chromeProc = spawn(
    chromeExe,
    [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--hide-scrollbars',
      '--mute-audio',
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${userDataDir}`,
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  await waitForHttp(`http://127.0.0.1:${debugPort}/json/version`);

  try {
    // Brand Banner & CTA Banner 3D được kết xuất riêng qua tools/render-3d-banners.mjs
    // Đặt cấu hình mặc định chuẩn: Sơn mài, 150s (2 phút 30 giây), tốc độ 1.1x
    await postJson(baseUrl, '/api/control', { action: 'setTheme', text: 'son-mai' });
    await postJson(baseUrl, '/api/control', { action: 'setName', text: 'Duong Birken Live' });
    await postJson(baseUrl, '/api/control', {
      action: 'setPrefs',
      text: JSON.stringify({ roundSec: '150', voiceRate: '1.1', giftTable: '1', soundOn: '1', musicOn: '1', giftFx: '1' }),
    });

    // B. Mở Stage (1080 x 1920) có preScript tăng tốc xả hàng đợi khi bật cờ window.__FAST_QUEUE
    console.log('4. Mở trang Stage (1080x1920) & Admin Dashboard...');
    const fastQueueHook = `
      window.__FAST_QUEUE = true;
      HTMLAudioElement.prototype.play = function() {
        setTimeout(() => this.onended && this.onended(new Event('ended')), 5);
        return Promise.resolve();
      };
      const _origST = window.setTimeout.bind(window);
      window.setTimeout = (fn, ms, ...args) => {
        if (window.__FAST_QUEUE && typeof ms === 'number' && ms >= 120 && ms <= 9000) {
          return _origST(fn, 20, ...args);
        }
        return _origST(fn, ms, ...args);
      };
    `;
    const stageTab = await openTab(debugPort, `${baseUrl}/?view=stage`, 1080, 1920, 1, fastQueueHook);
    const adminTab = await openTab(debugPort, `${baseUrl}/`, 1600, 1380, 1, fastQueueHook);
    await sleep(2200);

    // Nhảy về đầu vòng rồi bấm skip 1 lần để qua ngay 15s Mở màn vòng -> vào thẳng pha "Vòng gặp gỡ" (play)!
    await postJson(baseUrl, '/api/control', { action: 'custom', text: 'newRound' });
    await sleep(300);
    await postJson(baseUrl, '/api/control', { action: 'custom', text: 'skip' });
    await sleep(500);

    // Bật __FAST_QUEUE để nạp nhanh 14 tỉnh khắp Bắc - Trung - Nam + Hoàng Sa + Trường Sa
    await stageTab.cdp.send('Runtime.evaluate', { expression: 'window.__FAST_QUEUE = true;' });
    await adminTab.cdp.send('Runtime.evaluate', { expression: 'window.__FAST_QUEUE = true;' });

    const seedComments = [
      { username: 'minhtuan_hn', nickname: 'Minh Tuấn', comment: 'Hà Nội ơi' },
      { username: 'lananh_dn', nickname: 'Lan Anh', comment: 'Đà Nẵng quê mình' },
      { username: 'quocbao_sg', nickname: 'Quốc Bảo', comment: 'Sài Gòn nè' },
      { username: 'thuha_kh', nickname: 'Thu Hà', comment: 'Nha Trang Khánh Hòa' },
      { username: 'hoanglong_qn', nickname: 'Hoàng Long', comment: 'Hạ Long Quảng Ninh' },
      { username: 'ngocmai_hue', nickname: 'Ngọc Mai', comment: 'Huế thương' },
      { username: 'ducanh_ct', nickname: 'Đức Anh', comment: 'Cần Thơ gạo trắng' },
      { username: 'bichtram_dl', nickname: 'Bích Trâm', comment: 'Buôn Ma Thuột Đắk Lắk' },
      { username: 'giahuy_ag', nickname: 'Gia Huy', comment: 'Phú Quốc An Giang' },
      { username: 'kimngan_ld', nickname: 'Kim Ngân', comment: 'Đà Lạt Lâm Đồng' },
      { username: 'thanhson_na', nickname: 'Thanh Sơn', comment: 'Nghệ An quê choa' },
      { username: 'mylinh_cm', nickname: 'Mỹ Linh', comment: 'Đất Mũi Cà Mau' },
      { username: 'baochau_lc', nickname: 'Bảo Châu', comment: 'Sa Pa Lào Cai' },
      { username: 'tuananh_GL', nickname: 'Tuấn Anh', comment: 'Quy Nhơn Gia Lai' },
    ];
    for (let i = 0; i < seedComments.length; i++) {
      const c = seedComments[i];
      await postJson(baseUrl, '/api/test/emit', { type: 'chat', data: c });
      await postJson(baseUrl, '/api/test/emit', {
        type: 'like',
        data: { username: c.username, nickname: c.nickname, likeCount: (15 - i) * 15 },
      });
    }

    // Chờ cho tới khi hàng đợi Sắp ghé trống (.up-empty xuất hiện) VÀ .v-name trở về "Cả nước"
    await sleep(800);
    for (let w = 0; w < 60; w++) {
      await sleep(300);
      const res = await stageTab.cdp.send('Runtime.evaluate', {
        expression: `Boolean(document.querySelector('.up-empty')) && document.querySelector('.v-name')?.textContent === 'Cả nước'`,
        returnByValue: true,
      });
      if (res?.result?.value === true) break;
    }
    await stageTab.cdp.send('Runtime.evaluate', { expression: 'window.__FAST_QUEUE = false;' });
    await adminTab.cdp.send('Runtime.evaluate', { expression: 'window.__FAST_QUEUE = false;' });
    await sleep(1600); // chờ hiệu ứng camera interpolateZoom lùi về HOME hoàn tất 100%

    // SHOT 02: Toàn cảnh bản đồ chữ S 34 tỉnh + Hoàng Sa & Trường Sa (Giao diện Sơn mài, 14/34 tỉnh đã sáng)
    console.log('5. Chụp 02-stage-son-mai-toan-canh.png (Toàn cảnh chữ S 34 tỉnh & Hoàng Sa - Trường Sa)...');
    await capturePng(stageTab.cdp, path.join(SHOT_DIR, '02-stage-son-mai-toan-canh.png'), { x: 0, y: 0, width: 1080, height: 1920 });

    // SHOT 04: Kích hoạt đủ 2.026 tim -> "Cả nước sáng đèn!" ngay trên góc nhìn toàn cảnh cả nước
    console.log('6. Chụp 04-stage-2026-tim-thap-sang-ca-nuoc.png (2.026 tim thắp sáng cả 34 tỉnh)...');
    await postJson(baseUrl, '/api/test/emit', {
      type: 'like',
      data: { username: 'minhtuan_hn', nickname: 'Minh Tuấn', likeCount: 2026 },
    });
    await sleep(1600);
    await capturePng(stageTab.cdp, path.join(SHOT_DIR, '04-stage-2026-tim-thap-sang-ca-nuoc.png'), { x: 0, y: 0, width: 1080, height: 1920 });

    // Chờ hết 5 giây hiệu ứng "Cả nước sáng đèn!" để chụp cảnh Zoom cận cảnh tỉnh & Quà tặng
    await sleep(3800);

    // SHOT 03: Bắn quà tặng 199 xu vào Đà Nẵng -> Camera bay cận cảnh tới Đà Nẵng + Ghim Avatar + Pháo hoa
    console.log('7. Chụp 03-stage-zoom-tinh-que-huong.png & 01-admin-dashboard.png...');
    await adminTab.cdp.send('Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Vẫn bật xem'))?.click()`,
    });
    await postJson(baseUrl, '/api/test/emit', {
      type: 'gift',
      data: { username: 'lananh_dn', nickname: 'Lan Anh', giftName: 'Pháo hoa', giftId: 2, diamondCount: 199, repeatCount: 1 },
    });
    await sleep(2100);
    await capturePng(stageTab.cdp, path.join(SHOT_DIR, '03-stage-zoom-tinh-que-huong.png'), { x: 0, y: 0, width: 1080, height: 1920 });
    await capturePng(adminTab.cdp, path.join(SHOT_DIR, '01-admin-dashboard.png'), { x: 0, y: 0, width: 1600, height: 1380 });

    // SHOT 05: Đổi sang giao diện Biển đêm & Bấm skip từ pha "play" sang pha "summary" (Tổng kết vòng)
    console.log('8. Chụp 05-stage-bien-dem-tong-ket-vong.png (Giao diện Biển đêm & Bảng Tổng kết vòng)...');
    await postJson(baseUrl, '/api/control', { action: 'setTheme', text: 'bien-dem' });
    await sleep(400);
    await postJson(baseUrl, '/api/control', { action: 'custom', text: 'skip' }); // từ play -> summary
    await sleep(900);
    await capturePng(stageTab.cdp, path.join(SHOT_DIR, '05-stage-bien-dem-tong-ket-vong.png'), { x: 0, y: 0, width: 1080, height: 1920 });

    // Khôi phục giao diện mặc định Sơn mài
    await postJson(baseUrl, '/api/control', { action: 'setTheme', text: 'son-mai' });

    stageTab.cdp.close();
    adminTab.cdp.close();
  } finally {
    try {
      chromeProc.kill();
    } catch {}
    try {
      serverProc.kill();
    } catch {}
    await sleep(600);
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {}
  }
}

main().catch((err) => {
  console.error('Lỗi capture-media:', err);
  process.exit(1);
});
