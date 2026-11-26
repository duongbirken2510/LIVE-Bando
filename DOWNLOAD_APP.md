# 💿 Tải Bộ Cài Đặt Windows 1-Click (`.EXE`) — Dành Cho Người Dùng Không Rành GitHub / Node.js
## Download 1-Click Standalone Windows Installer (`Viet-Nam-Dat-Nuoc-Ta-Oi-Setup-v1.0.exe`)

<div align="center">
  <img src="./docs/media/live_bando_brand_banner.png" alt="Việt Nam Đất Nước Ta Ơi — LIVE-BANDO Brand Banner" width="100%" />
  <br /><br />
  <h3>
    👉 <a href="https://github.com/duongbirken2510/LIVE-Bando/releases/latest/download/Viet-Nam-Dat-Nuoc-Ta-Oi-Setup-v1.0.exe"><b>[TẢI NGAY BỘ CÀI ĐẶT 1-CLICK: Viet-Nam-Dat-Nuoc-Ta-Oi-Setup-v1.0.exe]</b></a> 👈
  </h3>
  <p><i>(Đã tích hợp sẵn toàn bộ Node.js Runtime + System Tray Guardian v2 + Bản đồ 34 Tỉnh Thành &amp; Hoàng Sa - Trường Sa + 20 Giao Diện Sơn Mài + Giọng MC AI — Tải về bấm đúp là chạy ngay, KHÔNG cần cài đặt Node.js hay gõ lệnh!)</i></p>
</div>

---

## 🇻🇳 Hướng Dẫn Cài Đặt Trong 10 Giây (Dành Cho Người Không Rành Kỹ Thuật)

1. **Bước 1 — Tải file cài đặt `.exe` duy nhất:**
   - Bấm vào liên kết: **[`Viet-Nam-Dat-Nuoc-Ta-Oi-Setup-v1.0.exe`](https://github.com/duongbirken2510/LIVE-Bando/releases/latest/download/Viet-Nam-Dat-Nuoc-Ta-Oi-Setup-v1.0.exe)** (hoặc vào mục **[Releases](https://github.com/duongbirken2510/LIVE-Bando/releases/latest)** ở cột bên phải trang GitHub).
2. **Bước 2 — Nhấp đúp mở bộ cài đặt:**
   - Mở file `Viet-Nam-Dat-Nuoc-Ta-Oi-Setup-v1.0.exe` vừa tải về.
   - *(Nếu Windows hiện bảng xanh **Windows protected your PC / SmartScreen**: Bấm vào chữ **More info** (Thông tin thêm) ➔ bấm nút **Run anyway** (Vẫn chạy)).*
3. **Bước 3 — Bấm nút `🚀 CÀI ĐẶT NGAY (1-CLICK)`:**
   - Bộ cài đặt sẽ tự động giải nén, **tạo biểu tượng `Việt Nam Đất Nước Ta Ơi - TikTok LIVE` ngoài màn hình Desktop**, hiển thị biểu tượng **System Tray Guardian** ở góc đồng hồ Windows và tự động mở bảng điều khiển game ở chế độ Desktop App (`http://localhost:4012`)!
4. **Bước 4 — Những lần mở sau & Cách thoát hẳn:**
   - Bạn chỉ cần nhấp đúp vào biểu tượng **`Việt Nam Đất Nước Ta Ơi - TikTok LIVE`** ngoài màn hình Desktop (hoặc chạy trực tiếp file **`Viet-Nam-Dat-Nuoc-Ta-Oi.exe`** hay **`BAT-LIVE.bat`** trong thư mục dự án).
   - Khi bấm dấu `X` đóng cửa sổ điều khiển, phần mềm tự động thu gọn xuống **Khay Hệ Thống (góc đồng hồ Windows)** để không làm tắt sân khấu đang phát trên TikTok LIVE Studio.
   - Khi kết thúc buổi Live và muốn tắt hoàn toàn Server để giải phóng cổng `4012`: bấm nút đỏ **`🔌 Tắt Server (Port 4012)`** ở góc trên bên phải trang điều khiển, hoặc click chuột trái/phải vào biểu tượng ở góc đồng hồ Windows chọn **`🔌 Thoát Hẳn & Tắt Server (Port 4012)`**, hoặc chạy file **`TAT-LIVE.bat`**.

---

## 🇬🇧 1-Click Windows `.EXE` Installer Guide (No Git or Node.js Required)

1. **Download:** Click **[`Viet-Nam-Dat-Nuoc-Ta-Oi-Setup-v1.0.exe`](https://github.com/duongbirken2510/LIVE-Bando/releases/latest/download/Viet-Nam-Dat-Nuoc-Ta-Oi-Setup-v1.0.exe)** from **[GitHub Releases](https://github.com/duongbirken2510/LIVE-Bando/releases/latest)**.
2. **Run Installer:** Double-click `Viet-Nam-Dat-Nuoc-Ta-Oi-Setup-v1.0.exe` (if Windows SmartScreen prompts, click **More info** ➔ **Run anyway**) and click **`🚀 CÀI ĐẶT NGAY (1-CLICK)`**.
3. **Play & Stream:** The installer includes a self-contained Node.js runtime, custom `.ICO` icon, and **System Tray Guardian v2**, creates a **`Việt Nam Đất Nước Ta Ơi - TikTok LIVE`** shortcut on your Desktop, and launches the Admin Dashboard in App Mode at `http://localhost:4012` automatically.
4. **Add to TikTok LIVE Studio (`1080 × 1920`):** Add a **Link (Browser Source)** with URL `http://lvh.me:4012/?view=stage` and resolution `1080 × 1920`.

---

## 🛠️ Dành Cho Lập Trình Viên: Tự Đóng Gói Lại Bộ Cài `.EXE`

Khi bạn chỉnh sửa mã nguồn và muốn xuất lại file `Viet-Nam-Dat-Nuoc-Ta-Oi.exe` cùng bộ cài `release/Viet-Nam-Dat-Nuoc-Ta-Oi-Setup-v1.0.exe`, chỉ cần nhấp đúp vào **`DONG-GOI-EXE.bat`** hoặc chạy:

```bash
node build-installer.mjs
```

---

<div align="center">
  <a href="https://github.com/duongbirken2510/LIVE-Bando/releases/latest">
    <img src="./docs/media/live_bando_cta_banner.png" alt="Kêu gọi hành động - Tải Bộ Cài 1-Click, Tặng Star GitHub & Kết Nối Duong Birken" width="100%" />
  </a>
</div>
