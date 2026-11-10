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
- Giọng MC mặc định: nữ HoaiMy (`GAME.voice = 'F'` trong config.ts). Đổi nam/nữ ở khung "Giọng đọc trên stage" (phần chung, đã chép vào `_base`); server nhớ trong settings.json. Edge lỗi thì tự đọc bằng giọng Google.
- 20 giao diện (`src/game/themes.ts`): Sơn mài (mặc định), Lụa đỏ, Biển đêm, Ngọc bích, Hoa sen, Thu Hà Nội, Tre xanh, Gốm Chu Đậu, Giấy dó, Hoàng hôn, Cờ đỏ sao vàng, Đêm trăng, Phố cổ Hội An, Ruộng bậc thang, Tím Huế, Cà phê sữa, Sương sớm, Neon Sài Gòn, Đồng cổ, Mực tàu. Chọn ở khung "Chọn giao diện" ngay dưới "Kết nối TikTok LIVE"; stage và ô xem trước đổi ngay, server nhớ (lệnh `setTheme`). Mỗi giao diện chỉ đổi màu, bo góc, kiểu chữ tiêu đề; bố cục giữ nguyên. Màu viết qua biến CSS trong `src/index.css`, đừng viết cứng màu mới.
- Đốm sáng: camera tới tỉnh thì 1 đốm sáng bay vòng cung từ avatar "Vừa gọi tên quê" vào tỉnh (0,75 giây), chạm tới thì tỉnh mới sáng, loé ra, hiện "+N điểm" bay lên và ghim người chơi. Âm thanh: tiếng vút lấp lánh lúc bay, chuông + 2 tiếng xu "ting ting" lúc chạm (`src/game/sfx.ts`, Web Audio, không cần file).
- Nhạc nền tự soạn (`src/game/music.ts`): ngũ cung, 116 nhịp/phút, trống nhẹ, mặc định bật 30%; MC nói thì nhạc nhỏ còn 35%. Chỉ trang stage phát.
- Công tắc "Âm thanh toàn bộ" (prefs.soundOn): tắt thì nhạc, tiếng hiệu ứng im, giọng MC vẫn chạy theo nhịp nhưng âm lượng 0 (game không lệch).
- Chữ trên màn hình sửa được ở khung "Chữ trên màn hình & âm thanh" (tên game 2 dòng, dòng hướng dẫn, Vừa gọi tên quê, Quà gửi về quê, Người giữ lửa quê, Bục quê nhà, Đang ghé thăm, Đồng hương các buổi live). Lưu qua lệnh chung `setPrefs` (server nhớ trong settings.json, khóa `label_xxx`); ô trống = chữ mặc định trong `GAME.labels`. Nút "Mô phỏng 1 lượt gọi tên" bắn 1 comment giả để xem đủ hiệu ứng + tiếng trên stage.
- MC kể chuyện từng tỉnh (`src/game/provinceTalk.ts`): mỗi lượt gọi tên đọc thêm 2 món ngon + 2 danh thắng + 1 lời khen người tỉnh đó (30% khen chung người Việt). Tỉnh sáp nhập gộp đặc sản tỉnh cũ. Hàng chờ từ 3 lượt trở lên thì chỉ gọi tên (`talkWhenQueueBelow`), vì mỗi lượt kể chuyện dài ~15 giây.
- Đã kiểm tra hàng chờ giọng: 10 comment + 2 quà dồn cùng lúc, 22 đoạn đọc nối tiếp, không đoạn nào phát chồng; quà chen trước tỉnh đang chờ nhưng không cắt câu đang đọc.
- Giọng đọc mặc định 1.1 (`GAME.voiceRate`). MC kể ngắn: mỗi lượt 1-2 đặc sản/danh thắng, 1/5 lượt mới khen người; phòng đông (3 lượt chờ trở lên) thì chỉ gọi tên.
- Đảo: bản đồ 34 tỉnh gốc thiếu Côn Đảo và 125 đảo nhỏ khác; `tools/add-islands.mjs` chép đảo từ bản 63 tỉnh cùng nguồn về đúng tỉnh mới (đã chạy, quét lại 0 đảo thiếu).
- Địa danh (`SPOTS` trong provinces.ts): đảo (Phú Quốc, Côn Đảo, Cát Bà, Lý Sơn, Cô Tô... và đảo nhỏ có người ở), thành phố thuộc tỉnh (Hạ Long, Nha Trang, Đà Lạt, Vũng Tàu, Sa Pa...), các đảo Hoàng Sa / Trường Sa. Gõ tên thì MC gọi đúng tên đó + "thuộc tỉnh X", camera bay tới đúng chỗ, điểm cộng cho tỉnh. Hạ Long là thành phố của Quảng Ninh, không phải tên khác của Quảng Ninh. Đảo xa (Hoàng Sa, Trường Sa): camera về cả nước, ghim vào cụm đảo trên bản đồ, MC luôn gửi lời thương tới các anh giữ đảo (chủ kênh muốn: nhiều bạn đi nghĩa vụ xa nhà). Tên đảo dễ trùng chữ thường (sinh tồn, sơn ca, hải tặc, Minh Châu...) phải gõ kèm chữ "đảo".
- Hiệu ứng quà tăng theo xu (`GiftFx.tsx`, `GAME.giftTier`): 1-4 xu đốm sáng; 5-29 mưa xu; 30-99 mưa xu dày + băng rôn; 100-999 + pháo hoa trên tỉnh, loé sáng; từ 1.000 xu pháo hoa cả màn hình, băng rôn lớn, kèn. Âm thanh riêng từng mức (`playGift`), quà càng to đứng càng lâu (`giftTierDwellMs`). Băng rôn đặt dưới bản đồ cho khỏi che ghim. Công tắc "Hiệu ứng quà" + 5 nút thử trong khung cài đặt. Quà tặng lúc tổng kết vẫn giữ lượt hiệu ứng sang vòng sau.
- Chào người vào: 6 giây 1 lượt, 3 tên. Đông (chờ hơn 6 người) thì gộp 1 câu "chào bạn A, bạn B, bạn C và 37 bạn nữa vừa vào live", xoá hàng chờ chào (`NameBatcher` trong `src/live/scoreboard.ts`). Có quà lớn đang chờ thì cảm ơn quà trước rồi mới chào.
- Nhận tên tỉnh xét dấu trước: "chị Huệ" không phải Huế, "hơn là" không phải Hòn La, "còn có" không phải Cồn Cỏ, "lên đảo" không phải Len Đao. Gõ dính liền (thanhhoa, danang, halong) vẫn nhận. Đảo "Hòn ..." gõ không dấu phải kèm chữ "đảo". Đã thử 85 câu, đúng hết; "thái bình" (hoà bình) vẫn bị tính là Hưng Yên, chấp nhận.
- Quà tặng khi chưa gõ quê: xu giữ qua vòng sau, gõ quê lúc nào thì cộng bù lúc đó.
- Bố cục stage (chủ kênh chốt 2026-11-10): bản đồ chữ S là nhân vật chính, cao gần hết khung (map-box 316 → 1786, MAP_H 1470), đáy mờ dần; phần dưới bị chat che lúc nhìn cả nước là chấp nhận được vì zoom vào tỉnh thì camera đưa lên giữa. Thẻ đặt vào chỗ trống quanh chữ S: "Vừa gọi tên quê" ở khoảng trống bên trái (vùng Lào), cột phải x 720 (Sắp ghé, dòng chạy, dòng điểm quà đổi mức mỗi 2,5 giây, Bục quê nhà dạng cột 2-1-3, Người giữ lửa quê). Góc dưới bên trái là chỗ comment: không đặt thẻ. Bỏ 2 khung phóng to Hoàng Sa / Trường Sa; 2 quần đảo vẽ thu gọn ngoài khơi Đà Nẵng / Khánh Hòa trên bản đồ chính (vẽ đúng vị trí thật thì cả nước bị thu nhỏ). Gõ tên đảo xa: camera phóng vào cụm đảo, ghim đúng đảo. Tiêu đề hạ 20px cho avatar chủ kênh ở góc trên.
- Thêm: dải "Sắp ghé" (tỉnh đang xếp hàng), tỉnh tô đậm nhạt theo điểm, tên tỉnh to mờ dần khi camera tới, 10 giây cuối hiện số đếm to + "Còn N giây, quê nào vượt lên?". Thông báo mở vòng / tổng kết luôn nằm trên mọi thứ (z-index 50). Chữ trên stage tối thiểu ~28px (trừ tên tỉnh trên bản đồ và tên trong cột bục).
- Live tự động (khung Giả lập, phần chung): 10 / 50 / 100 người chạy trọn 1 vòng 2:45, tự nhảy về đầu vòng mới (`custom: newRound`), comment là tên tỉnh.
- Giao diện riêng: chất tranh sơn mài (nền đen nâu, viền vàng thếp, son đỏ), font Playfair Display cho tiêu đề + Be Vietnam Pro.
