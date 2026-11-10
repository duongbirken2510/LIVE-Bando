# Việt Nam đất nước ta ơi

Game TikTok LIVE: người xem gõ tên tỉnh, thành quê mình, bản đồ Việt Nam bay tới tỉnh đó, MC đọc tên, tỉnh sáng lên kèm avatar người gọi.

## Chạy

1. Cài [Node.js](https://nodejs.org) bản LTS (một lần).
2. Bấm đúp `BAT-LIVE.bat`. Lần đầu tự cài thư viện 1–2 phút, xong tự mở trang điều khiển `http://localhost:3000`.
3. TikTok LIVE Studio → thêm nguồn **Link**: `http://lvh.me:3000/?view=stage`, kích thước 1080 × 1920.
4. Bắt đầu live, nhập username vào trang điều khiển, bấm Kết nối.

Chưa live mà muốn thử: dùng các nút trong khung **Thử game Việt Nam đất nước ta ơi** ở trang điều khiển.

Giữ cửa sổ `BAT-LIVE.bat` mở suốt buổi live. Chỉ trang stage phát tiếng; đừng mở link `?view=stage` ở chỗ khác khi đang live (sẽ bị 2 giọng).

## Nguồn bản đồ

Ranh giới 34 tỉnh, thành (từ 2025) lấy từ [nguyenduy1133/Free-GIS-Data](https://github.com/nguyenduy1133/Free-GIS-Data), đã rút gọn và bổ sung đảo bằng `tools/prep-map.mjs`, `tools/add-islands.mjs`.
