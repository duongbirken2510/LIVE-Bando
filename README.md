# Việt Nam đất nước ta ơi

Game cho buổi TikTok LIVE. Người xem gõ tên tỉnh, thành quê mình vào comment, bản đồ Việt Nam bay tới tỉnh đó, tỉnh sáng lên kèm tên và avatar người gọi, MC đọc tên bạn ấy và nhắc một hai món ngon, danh thắng của quê đó.

Bản đồ 34 tỉnh, thành mới từ 2025, có Hoàng Sa, Trường Sa và các đảo. Gõ tên tỉnh cũ trước sáp nhập, tên thành phố (Hạ Long, Nha Trang, Đà Lạt...) hay tên đảo (Phú Quốc, Côn Đảo, Lý Sơn...) đều nhận đúng tỉnh.

## ⚠️ Đọc trước khi dùng: lưu ý, cảnh báo và trách nhiệm

Game chia sẻ miễn phí, ai cũng lấy về dùng được. Trước khi dùng cho buổi live của mình, đọc kỹ mấy điều sau:

1. **Bản đồ là hình mô phỏng.** Hoàng Sa, Trường Sa được vẽ thu nhỏ, đặt gần bờ hơn thực tế cho vừa khung hình. Ranh giới 34 tỉnh, thành lấy từ bộ dữ liệu cộng đồng, không phải bản đồ chính thức của nhà nước. Trên màn hình đã có dòng ghi "Hình ảnh mô phỏng, vẽ thu nhỏ, không theo tỷ lệ", đừng xoá dòng này. Ai sửa bản đồ thì phải giữ đủ Hoàng Sa, Trường Sa.
2. **Không dùng game để trao thưởng.** Game chỉ cộng điểm cho quê, không có giải thưởng. Nếu bạn tự đặt thêm thưởng tiền hay quà cho người đứng top hoặc tặng nhiều nhất, việc đó có thể bị coi là khuyến mại hoặc trò chơi có thưởng theo luật, phải làm thủ tục riêng, và bạn tự chịu trách nhiệm.
3. **Tiền quà là thu nhập của bạn.** Quà người xem tặng là thu nhập của người live. Việc kê khai, nộp thuế thì bạn tự tìm hiểu theo quy định hiện hành.
4. **Kết nối và giọng đọc dùng công cụ không chính thức.** Game nối vào phòng live và tạo giọng MC qua các công cụ bên ngoài, không phải công cụ chính thức của nền tảng hay của Microsoft, Google. Các công cụ này có thể ngừng chạy bất cứ lúc nào. Rủi ro với tài khoản của bạn (bị hạn chế, khoá tính năng) bạn tự cân nhắc.
5. **Bộ lọc từ tục không bắt được hết.** Game đã chặn tên và comment tục, MC không bao giờ đọc nguyên văn comment. Dù vậy người xem luôn nghĩ ra cách viết mới, nên chủ kênh vẫn phải tự để mắt và chịu trách nhiệm về nội dung buổi live của mình.
6. **Lời MC kể về các tỉnh** (món ngon, danh thắng) được soạn theo hiểu biết chung, có thể chưa chuẩn hết. Thấy chỗ nào sai thì sửa trong `src/game/provinceTalk.ts`.
7. **Dùng game là bạn tự chịu trách nhiệm.** Game được chia sẻ nguyên trạng, không kèm cam kết gì. Tác giả không chịu trách nhiệm về thiệt hại hay rắc rối pháp lý phát sinh khi bạn sử dụng. Mấy điều trên là tự tìm hiểu, không phải tư vấn pháp lý. Ai live với mục đích kinh doanh thì nên hỏi luật sư.

## Cần có

- Máy tính Windows 10 hoặc 11. Mac/Linux xem cuối trang.
- Mạng internet: giọng MC được tạo qua mạng, không có mạng thì MC im.
- Node.js (miễn phí, cài một lần, hướng dẫn ở bước 2).

## Cài đặt lần đầu

### Bước 1: Tải game về

1. Trên trang GitHub này, bấm nút xanh **Code** rồi chọn **Download ZIP**.
2. Mở thư mục Downloads, chuột phải vào file `viet-nam-dat-nuoc-ta-oi-master.zip`, chọn **Extract All...** (Giải nén tất cả), bấm **Extract**.
3. Chép thư mục vừa giải nén ra chỗ dễ tìm, ví dụ `D:\Game\viet-nam-dat-nuoc-ta-oi`.

Phải giải nén ra hẳn. Bấm đúp mở thẳng trong file zip thì game không chạy.

Biết dùng git thì gõ:

```bash
git clone https://github.com/workaipvlinh-byte/viet-nam-dat-nuoc-ta-oi.git
```

### Bước 2: Cài Node.js

1. Vào https://nodejs.org, tải bản có chữ **LTS**.
2. Mở file vừa tải, bấm **Next** liên tục rồi **Install**, để nguyên các lựa chọn mặc định.
3. Cài xong thì khởi động lại máy cho chắc.

### Bước 3: Chạy game

1. Mở thư mục game, bấm đúp file `BAT-LIVE.bat`.
2. Nếu Windows hiện bảng xanh "Windows protected your PC", bấm **More info** rồi **Run anyway**. Bảng này hiện vì file tải từ mạng về, không phải lỗi.
3. Lần đầu game tự cài thư viện, mất khoảng 1–2 phút, cửa sổ đen chạy nhiều chữ là bình thường.
4. Xong thì trình duyệt tự mở **trang điều khiển** (`http://localhost:3000`). Trong cửa sổ đen có dòng `Link LIVE Studio`, đó là link cho bước 4.

Từ lần sau chỉ cần bấm đúp `BAT-LIVE.bat` là chạy ngay.

**Giữ cửa sổ đen mở suốt buổi live.** Đóng nó là game tắt.

### Bước 4: Đưa màn hình game vào TikTok LIVE Studio

1. Trong TikTok LIVE Studio, thêm nguồn **Link** (nguồn trang web).
2. Dán link: `http://lvh.me:3000/?view=stage`
3. Đặt kích thước **1080 × 1920** (màn hình dọc).

Nếu cửa sổ đen báo "cổng 3000 đang bận nên dùng cổng 3001" thì link phải đổi số theo, ví dụ `http://lvh.me:3001/?view=stage`. Lấy đúng link in trong cửa sổ đen.

### Bước 5: Kết nối với buổi live

1. Bấm bắt đầu live trên TikTok trước.
2. Ở trang điều khiển, khung **Kết nối TikTok LIVE**, gõ username TikTok của kênh (không cần chữ @), bấm **Kết nối**.
3. Thấy báo đã kết nối là xong. Người xem comment tên quê là bản đồ chạy.

## Chỉnh game trên trang điều khiển

Mọi thứ dưới đây chỉnh bằng chuột, không cần đụng code. Chỉnh xong được lưu lại, lần sau bật vẫn giữ.

- **Chọn giao diện** (ngay dưới khung Kết nối): 20 bộ màu như Sơn mài, Lụa đỏ, Biển đêm, Hoa sen, Tím Huế, Neon Sài Gòn. Bấm vào là ô xem trước đổi theo.
- **Giọng đọc trên stage**: chọn MC nữ (Hoài My) hoặc nam (Nam Minh), bấm Nghe thử. Ô đổi tên kênh: tên MC xưng khi chào, cảm ơn. Ô gõ câu bất kỳ để MC đọc ngay.
- **Chữ trên màn hình & âm thanh**:
  - Sửa chữ: tên game (2 dòng), dòng hướng dẫn, tên các bảng "Vừa gọi tên quê", "Quà gửi về quê", "Người giữ lửa quê", "Bục quê nhà", "Đang ghé thăm", "Đồng hương các buổi live". Để trống ô nào thì ô đó dùng chữ mặc định.
  - Công tắc: Âm thanh toàn bộ, Nhạc nền, Hiệu ứng quà.
  - Thanh kéo âm lượng nhạc nền.
  - Thanh kéo tốc độ giọng đọc, từ 0.7 (chậm) tới 1.5 (nhanh).

## Thử trước khi live

Chưa live vẫn thử được, ở trang điều khiển:

- Khung **Thử game Việt Nam đất nước ta ơi**: nút mô phỏng một lượt gọi tên, 5 nút thử hiệu ứng quà theo mức xu.
- Khung **Giả lập**: thêm người vào, comment, tặng quà, thả tim từng cái một. Mục **Live tự động** cho 10, 50 hoặc 100 người giả chơi trọn một vòng.

Muốn nghe tiếng khi thử thì mở link `?view=stage` trong trình duyệt và bấm vào trang một lần (trình duyệt chặn tự phát tiếng khi chưa bấm). Thử xong nhớ đóng tab đó trước khi live thật.

## Luật chơi

- Gõ tên tỉnh, thành (có dấu, không dấu, viết tắt HN, SG, HCM đều được): +1 điểm cho quê, mỗi người tối đa 1 điểm mỗi 10 giây cho 1 tỉnh.
- Thả tim: 15 tim = +1 điểm.
- Tặng quà: 1–4 xu +3, 5–29 xu +30, 30–99 xu +100, 100–999 xu +500, từ 1.000 xu +3.000. Quà càng to hiệu ứng càng lớn. Tặng khi chưa gõ quê thì gõ quê lúc nào được cộng bù lúc đó.
- Mỗi vòng 2 phút 30 giây, tổng kết 15 giây: ba quê nhiều điểm nhất lên bục, người góp nhiều nhất là "Người giữ lửa quê". Sang vòng mới điểm về 0.

## Gặp lỗi

- **Bấm `BAT-LIVE.bat` báo "npm is not recognized"**: chưa cài Node.js, hoặc cài rồi mà chưa khởi động lại máy.
- **Nghe 2 giọng MC hoặc 2 lớp nhạc**: đang mở trang `?view=stage` ở 2 chỗ. Chỉ để lại trang trong LIVE Studio, đóng các tab khác.
- **MC không nói**: kiểm tra mạng, công tắc Âm thanh toàn bộ, và link trong LIVE Studio có đúng cổng in trong cửa sổ đen không.
- **Không kết nối được**: phải đang live rồi mới kết nối, username gõ đúng và không có @.
- **Màn hình trong LIVE Studio trắng**: cửa sổ đen đã bị đóng, bấm lại `BAT-LIVE.bat`.

## Mac / Linux

Cài Node.js bản LTS, mở Terminal trong thư mục game rồi gõ:

```bash
npm install
```

```bash
LIVE_MODE=1 npm run dev
```

Sau đó làm tiếp từ bước 4. Trang điều khiển ở `http://localhost:3000`.

## Chỉnh sâu hơn (cần sửa code)

- `src/game/config.ts`: mọi câu MC đọc, điểm từng mức quà, thời gian vòng.
- `src/game/provinceTalk.ts`: món ngon, danh thắng, lời khen của từng tỉnh.
- `src/game/provinces.ts`: cách gọi tỉnh, tên đảo, thành phố.
- `src/game/themes.ts`: 20 giao diện màu.

## Nguồn bản đồ

Ranh giới 34 tỉnh, thành (từ 2025) lấy từ [nguyenduy1133/Free-GIS-Data](https://github.com/nguyenduy1133/Free-GIS-Data), đã rút gọn và bổ sung đảo bằng `tools/prep-map.mjs`, `tools/add-islands.mjs`.
