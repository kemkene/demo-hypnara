# 🌙 HƯỚNG DẪN SỬ DỤNG VÀ GIỚI THIỆU SẢN PHẨM HYPNARA
> **AI Sleep & Digital Wellbeing Coach — Trợ lý AI Tối Ưu Giấc Ngủ & Quản Lý Thói Quen Sinh Hoạt Số**

---

## 1. Giới Thiệu Sản Phẩm (Product Overview)

### ❓ Hypnara là gì?
**Hypnara** là ứng dụng web thông minh giúp người dùng nâng cao chất lượng giấc ngủ, cân bằng thời gian sử dụng thiết bị số (Screen Time, chơi game) và xây dựng kỷ luật bản thân thông qua sự hỗ trợ của trí tuệ nhân tạo **DeepSeek AI** kết hợp cùng **Bộ Quy Tắc Dự Phòng Chuyên Gia (Rule-Based Offline Engine)**.

### 🎯 Mục tiêu chính của ứng dụng
- **Cải thiện chất lượng giấc ngủ**: Giúp người dùng ngủ đủ 7.0 - 9.0 giờ/đêm và tuân thủ quy tắc tắt điện thoại 30 phút trước khi đi ngủ.
- **Làm chủ thiết bị số**: Theo dõi và giảm thiểu thời gian nghiện điện thoại, ứng dụng tiêu tốn thời gian (TikTok, YouTube, Games).
- **Phân tích tương quan AI ngầm**: Phát hiện mối liên hệ giữa các thói quen (ví dụ: *Đêm trước thiếu ngủ làm tăng 2 giờ Screen Time ngày hôm sau*).
- **Cơ chế nhắc nhở thông minh**: Thông báo native trên trình duyệt và banner cảnh báo đi ngủ đúng giờ cài đặt mỗi tối.
- **Độ sẵn sàng 100% (High Resilience)**: Kể cả khi chưa có API Key DeepSeek hoặc mất kết nối mạng, hệ thống AI vẫn hoạt động trơn tru qua engine offline tích hợp sẵn.

---

## 2. Danh Sách Tính Năng Nổi Bật (Core Features)

### 📊 1. Màn hình Tổng quan & Điểm số Sleep Score (0 - 100)
- **Đồng hồ điểm số Sleep Score**: 
  - Thuật toán khoa học đánh giá 6 chỉ số sức khỏe giấc ngủ.
  - **Minh bạch hóa dữ liệu**: Nếu 7 ngày gần nhất bạn chưa ghi nhận giờ ngủ, điểm số sẽ hiển thị `--` kèm nhãn trung tính `"Chưa có dữ liệu"` (thay vì bị đánh giá 0 điểm "Cần cải thiện").
- **6 Thẻ chỉ số chính (6 Metrics Grid)**: Thời lượng ngủ, Screen Time, Thời gian tắt máy trước ngủ, Phút vận động, Thời gian chơi game, Điểm tâm trạng (1-5).
- **Biểu Đồ Cột Ghép SVG Hiện Đại (Grouped Bar Chart)**:
  - Cột ghép 3 màu sắc trực quan: Giờ ngủ (tím chàm `#4f46e5`), Screen Time (xanh cyan `#0891b2`), Vận động (xanh ngọc `#059669`).
  - **Dải tiêu chuẩn vàng WHO (7.0 - 9.0h)**: Vùng nền màu hổ phách amber kèm đường nét đứt chuẩn y tế thế giới giúp học viên nhận biết ngay tình trạng ngủ đủ hay thiếu ngủ.
  - **Bộ lọc linh hoạt**: Chọn xem `Cột ghép (Tất cả)`, chỉ xem `Giờ ngủ`, `Screen Time` hoặc `Vận động` theo các mốc 7 ngày, 14 ngày hoặc 30 ngày.
  - **Sắp xếp chuẩn thời gian**: Các ngày luôn hiển thị theo thứ tự thời gian tăng dần từ quá khứ đến hiện tại.
- **Phân tích tương quan AI (Correlation Insights)**: Đưa ra nhận xét khoa học về tác động giữa các thói quen.
- **Thiết lập Đa Mục Tiêu & Danh Sách Nhắc Nhở Tùy Chỉnh**:
  - Chọn đồng thời **nhiều mục tiêu cùng lúc** qua các thẻ chip mục tiêu có sẵn hoặc tự nhập mục tiêu cá nhân.
  - Quản lý **danh sách nhiều khung giờ nhắc nhở**: Thêm giờ mới, đổi tên nhãn, bật/tắt công tắc từng nhắc nhở, xóa hoặc bấm **"Thử chuông"** từng khung giờ.
  - **Hệ thống Chuông Web Audio êm dịu**: Tự động tổng hợp âm thanh chuông đôi thư giãn (`E5` ➔ `B5`) bằng Web Audio API thuần (không cần file âm thanh ngoài) kèm thông báo toast nổi phản hồi tức thì.

### 📋 2. Nhật Ký Thói Quen & Giảm Ma Sát Nhập Liệu
- **Chuẩn hóa múi giờ Việt Nam (UTC+7)**: Hệ thống luôn nhận diện đúng ngày hôm nay dù bạn nhập liệu vào lúc 0h00 sáng hay 6h30 sáng trước khi đi làm/đi học.
- **Nút "Copy từ hôm qua"**: Chỉ cần 1 click để sao chép số liệu từ ngày hôm trước và chỉnh sửa nhanh.
- **Hỗ trợ chọn ngày (Backdate entry)**: Cho phép nhập bù nhật ký cho các ngày trong quá khứ để xây dựng lịch sử nhiều ngày.
- **Quy chuẩn Gợi ý AI (Spec FR-005)**:
  - Khi nhập dữ liệu cho **Hôm nay**: Nút *Phân Tích AI DeepSeek* hoạt động đầy đủ, phân tích chuyên sâu 10 ngày gần nhất để đưa ra 3 hành động cụ thể cho tối nay.
  - Khi chọn **Ngày quá khứ**: Hệ thống chuyển sang chế độ lưu trữ lịch sử và tự động vô hiệu hóa nút gọi gợi ý AI kèm thông báo hướng dẫn.
- **Thông báo & Hướng dẫn Cấu hình DeepSeek API Key Tự Động**:
  - Nếu chưa có API Key hoặc Key bị lỗi, hệ thống tự động chạy bộ máy Offline và hiển thị ngay khung cảnh báo màu vàng kèm hướng dẫn 4 bước tạo API Key miễn phí tại [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys).
- **Biến gợi ý thành Cam Kết**: Chuyển trực tiếp gợi ý của AI thành Mục tiêu cam kết cho ngày hôm nay chỉ với 1 click.
- **Bảng lịch sử & Xuất CSV**: Xem danh sách phân trang (10 bản ghi/trang) và tải xuống dữ liệu dạng file CSV.

### 🏆 3. Động Lực & Kỷ Luật (Motivation Hub)
- **Huy hiệu kỷ luật (Motivational Badges)**: Mở khóa các danh hiệu như *Khởi đầu xanh*, *Bền bỉ 3 ngày*, *Chiến binh 1 tuần*, *Master Tắt Máy*, *Năng lượng sống*.
- **Chuỗi ngày kỷ luật (Habit Streak)**: Tính toán chính xác theo lịch số học, không bị gián đoạn hay lệch ngày quanh nửa đêm.
- **Cam kết hành động (Action Commitments)**: 
  - Đặt mục tiêu nhỏ (ví dụ: *Tắt máy lúc 22:30*).
  - **Ràng buộc thời gian thực**: Chỉ có thể điểm danh "Đã làm" vào hoặc sau ngày đến hạn cam kết. Các cam kết trong tương lai hiển thị nhãn `⏳ Chưa đến hạn` để đảm bảo tính trung thực.
- **Thư động lực cá nhân hóa (AI Motivational Letter)**:
  - AI tự động viết một lá thư tiếp sức mạnh tinh thần dài 250 - 350 từ.
  - **Thân thiện với thành viên mới (0 ngày)**: Gửi thư chào đón truyền cảm hứng bước chân đầu tiên, hoàn toàn không bịa đặt số ngày sử dụng.

### 🔔 4. Banner Nhắc Nhở Ban Đêm & Chuông Thư Giãn (Nightly Reminder Banner)
- Vào đúng các khung giờ bạn đã kích hoạt (ví dụ: 21:30, 22:00, 22:30):
  - Xuất hiện Banner màu tím huyền ảo trên đầu ứng dụng nhắc nhở bạn tạm dừng thiết bị số, thư giãn mắt và điền thói quen hôm nay.
  - Tự động phát chuông Web Audio êm dịu và bắn thông báo Native Push của trình duyệt kể cả khi bạn đang mở tab khác.

### ⚡ 5. Đồng Bộ Dữ Liệu Thời Gian Thực & Trải Nghiệm Mượt Mà
- **Không cần F5**: Khi Lưu thói quen, Điểm danh cam kết hay Đổi mục tiêu nhắc nhở, toàn bộ biểu đồ cột, điểm Sleep Score và chuỗi Streak ở các tab khác tự động cập nhật ngay lập tức.
- **Tự động làm mới khi Đăng xuất / Đăng nhập**: Xóa sạch phiên làm việc cũ, tải mới giao diện người dùng tức thì.
- **Cô lập lỗi tiện ích trình duyệt**: Bộ lọc thông minh chặn hoàn toàn các lỗi từ Chrome extension bên thứ ba (như Urban VPN), không làm hiện popup đỏ nhầm lẫn.

### 📷 6. Quét Ảnh OCR Tự Động (Screen Time OCR)
- Kéo thả hoặc tải lên ảnh chụp màn hình **Thời gian sử dụng (iOS Screen Time / Android Digital Wellbeing)**.
- Thư viện **Tesseract.js** tự động bóc tách:
  - Tổng giờ Screen Time
  - Ứng dụng ngốn nhiều thời gian nhất (TikTok, YouTube, Facebook...)
  - Số lần cầm máy (Pickups)
- Nhấn *Điền tự động* để tự đổ dữ liệu vào Form nhập thói quen.

### 💬 7. Trợ Lý AI Hypnara Trò Chuyện 24/7 (AI Coach Drawer)
- Khung chat nổi ở góc màn hình sẵn sàng giải đáp về mất ngủ, kỹ thuật thở 4-7-8, cách cai điện thoại ban đêm, chế độ đơn sắc Grayscale và cách tăng áp lực buồn ngủ tự nhiên.

---

## 3. Hướng Dẫn Khởi Chạy Ứng Dụng (Setup & Running)

### 🚀 Cách 1: Khởi chạy bằng Docker (Khuyên dùng - Nhanh nhất)
Yêu cầu: Đã cài đặt Docker và Docker Desktop.

1. Mở Terminal tại thư mục dự án:
   ```bash
   cd /Users/truongcon/Desktop/hypnara-demo
   ```
2. Chạy 1 lệnh duy nhất để khởi tạo cả Web App và Postgres Database:
   ```bash
   docker-compose up -d --build
   ```
3. Truy cập ứng dụng tại trình duyệt: **[http://localhost:3000](http://localhost:3000)**

---

### 🛠️ Cách 2: Khởi chạy trên máy Host (Môi trường phát triển Node.js)
Yêu cầu: Node.js (khuyên dùng Node 18, 20 hoặc 22) và Postgres đang chạy ở cổng 5432.

1. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```
2. Kiểm tra file `.env` chứa chuỗi kết nối Database và API Key DeepSeek:
   ```env
   DATABASE_URL=postgres://hypnara:hypnara@localhost:5432/hypnara
   DEEPSEEK_API_KEY=sk-xxxxxx...
   DEEPSEEK_MODEL=deepseek-chat
   ```
   *(Lưu ý: Nếu không có API Key, hệ thống vẫn hoạt động đầy đủ với Rule-based Offline Fallback).*

3. Chạy kiểm thử tự động toàn diện (Unit Tests):
   ```bash
   npm test
   ```
   *(Kết quả mong đợi: 28/28 tests PASS 100%).*

4. Khởi chạy ở chế độ phát triển (Development):
   ```bash
   npm run dev
   ```
   hoặc chạy bản build tối ưu:
   ```bash
   npm run build
   npm start
   ```
5. Truy cập ứng dụng tại: **[http://localhost:3000](http://localhost:3000)**

---

## 4. Hướng Dẫn Trải Nghiệm Người Dùng Theo Các Bước (Step-by-Step User Journey)

1. **Bước 1: Đăng nhập / Đăng ký tài khoản**
   - Nhấn nút **Đăng nhập** ở góc phải thanh điều hướng.
   - Nhập Username và Password mong muốn để tạo tài khoản mới.

2. **Bước 2: Cài đặt mục tiêu & Giờ nhắc nhở**
   - Vào tab **Tổng quan**, chọn Mục tiêu lớn (ví dụ: *Tắt máy trước khi ngủ 30 phút*).
   - Chọn **Giờ nhắc nhở hàng ngày** (ví dụ: `22:00`) và bấm **Bật thông báo Web** để cấp quyền.

3. **Bước 3: Nhập thói quen hoặc Quét ảnh OCR**
   - Vào mục **Quét OCR**, kéo thả ảnh màn hình Screen Time từ điện thoại -> Nhấn **Điền tự động vào Form**.
   - Hoặc vào mục **Thói quen**, chọn nút **Copy từ hôm qua** để điều chỉnh nhanh các thông số.

4. **Bước 4: Nhận tư vấn AI & Tạo cam kết hành động**
   - Sau khi nhập xong các số liệu hôm nay, nhấn nút **Phân Tích AI DeepSeek**.
   - Đọc 3 lời khuyên hành động và nhấn **Biến thành Cam Kết Hành Động** để đưa vào danh sách mục tiêu cần hoàn thành.

5. **Bước 5: Theo dõi xu hướng & Duy trì chuỗi Streak**
   - Chuyển sang màn hình **Tổng quan** để xem biểu đồ xu hướng và kiểm tra điểm **Sleep Score**.
   - Đánh dấu hoàn thành các cam kết khi đến hạn trong tab **Động lực** để tăng tỷ lệ hoàn thành và mở khóa huy hiệu!
