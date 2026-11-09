# Việt Nam đất nước ta ơi: ghi chú cho Claude

> File này mô tả RIÊNG game này. Luật chung cho mọi game nằm ở `E:\01_Projects\VibeCode\CLAUDE.md`.
> Khi chủ kênh chốt một quyết định (câu đọc, màu, font, luật chơi), ghi vào mục "Quyết định của chủ kênh".

## Ý tưởng

Người xem gõ tên tỉnh, thành quê mình. Bản đồ Việt Nam 34 tỉnh, thành lần lượt bay tới từng tỉnh được gọi: MC đọc tên tỉnh, camera zoom cận cảnh, tỉnh sáng màu, avatar và tên người gọi hiện ngay trên tỉnh. Mỗi vòng 2:30, ba quê nhiều điểm nhất lên bục.

## Luật chơi

- Tham gia: gõ tên tỉnh, thành (có dấu, không dấu, viết tắt HN/SG/HCM, tên tỉnh cũ đã sáp nhập đều nhận). Tỉnh gõ gần nhất là "quê" của người đó trong vòng.
- Comment tên tỉnh: +1 điểm cho tỉnh, mỗi người tối đa 1 điểm / 10 giây cho 1 tỉnh.
- Quà: 1–4 xu +3, 5–29 xu +30, 30–99 xu +100, 100–999 xu +500, từ 1.000 xu +3.000. Tặng khi chưa chọn quê thì gõ tên quê sau sẽ được cộng bù.
- Tim: 15 tim = +1 điểm cho quê.
- Vòng: 15 giây mở màn, gặp gỡ tới 00:00, tổng kết 15 giây, rồi vòng mới (điểm vòng về 0).
- Ghé thăm: mỗi tỉnh đứng ít nhất 3 giây, đọc xong mới qua tỉnh kế. 1 tỉnh vừa ghé thì 30 giây sau mới ghé lại. Hàng chờ tối đa 6 tỉnh. Quà từ 30 xu chen lên đầu ("đọc trước"), đứng 4,5 giây.
- Bằng điểm: quê đạt mức điểm đó trước xếp trên.
- "Đồng hương các buổi live": số tài khoản khác nhau từng gọi tỉnh đó, cộng dồn qua mọi buổi, không reset theo vòng.

## 6 câu hỏi thiết kế

1. 1 người comment: tên + avatar hiện ở dòng chạy bên trái ngay; tới lượt thì camera bay tới tỉnh, avatar to trên tỉnh, MC gọi tên.
2. 500 người: hàng chờ tối đa 6 tỉnh, comment cùng tỉnh đang chờ thì gộp "A và 49 người nữa"; dòng chạy chỉ 5 dòng. Đã thử 500 comment giả: không giật, không lỗi.
3. Không lên hình: vẫn có điểm cho quê, vẫn được tính đồng hương, quê vẫn sáng trên bản đồ.
4. Ai lên hình: người gọi đầu tiên của lượt ghé tỉnh đó; quà từ 30 xu chen lên trước.
5. Người vào sau: mỗi 2:30 có vòng mới, điểm về 0.
6. Quà: camera bay tới quê người tặng, avatar to, dòng "199 Hoa hồng · +500 điểm", MC cảm ơn đúng tên, lên "Người giữ lửa quê".

## File của game này

- `src/game/config.ts`: số liệu, mọi câu đọc.
- `src/game/provinces.ts`: 34 tỉnh + cách gọi (thêm tên gọi khác vào đây).
- `src/game/useGame.ts`: luật chơi, vòng, hàng chờ ghé thăm.
- `src/game/VietnamMap.tsx`: bản đồ, camera zoom, Hoàng Sa / Trường Sa.
- `src/game/GameStage.tsx`, `src/index.css`: màn hình 1080×1920.
- `public/vn34.json`: bản đồ. Nguồn `Provinces.geojson` của github.com/nguyenduy1133/Free-GIS-Data (34 tỉnh từ 2025, đã có Hoàng Sa trong Đà Nẵng, Trường Sa trong Khánh Hòa), rút gọn 8% bằng mapshaper, dựng lại bằng `tools/prep-map.mjs`.

## Lưu ý kỹ thuật

- File bản đồ gốc ghi nhầm Đồng Tháp (mã 31) thành "Lạng Sơn"; `tools/prep-map.mjs` đã sửa. Dựng lại bản đồ thì giữ bước sửa này.
- "Đồng hương" lưu trong localStorage của từng trang (stage và trang điều khiển đếm riêng). Muốn dùng chung/sao lưu thì chuyển lên server.ts.
- Đồng hồ vòng tính theo giờ máy nên trang điều khiển và stage luôn cùng giai đoạn.

## Quyết định của chủ kênh

- Tên game: "Việt Nam đất nước ta ơi". Câu chữ, tên bảng viết khác bản tham khảo "Thắp sáng bản đồ" (Vừa gọi tên quê, Người giữ lửa quê, Quà gửi về quê, Bục quê nhà, Đồng hương các buổi live).
- Bản đồ Việt Nam phải đúng: đủ 34 tỉnh, thành, có Hoàng Sa (TP. Đà Nẵng) và Trường Sa (tỉnh Khánh Hòa) trên bản đồ chính và khung phóng to, ghi "Biển Đông".
- MC đọc tới tên tỉnh thì camera zoom cận cảnh và thắp sáng tỉnh đó.
- Người chơi hiện tên + avatar.
- Giao diện riêng: chất tranh sơn mài (nền đen nâu, viền vàng thếp, son đỏ), font Playfair Display cho tiêu đề + Be Vietnam Pro.
