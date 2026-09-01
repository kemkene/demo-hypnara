# 🌙 HƯỚNG DẪN SỬ DỤNG VÀ GIỚI THIỆU SẢN PHẨM HYPNARA
> **AI Sleep & Digital Wellbeing Coach — Trợ lý AI Tối Ưu Giấc Ngủ & Quản Lý Thói Quen Sinh Hoạt Số**

---

## 1. Giới Thiệu Sản Phẩm (Product Overview)

### ❓ Hypnara là gì?
**Hypnara** là ứng dụng web thông minh giúp người dùng nâng cao chất lượng giấc ngủ, cân bằng thời gian sử dụng thiết bị số (Screen Time, chơi game) và xây dựng kỷ luật bản thân thông qua sự hỗ trợ của trí tuệ nhân tạo **DeepSeek AI**.

### 🎯 Mục tiêu chính của ứng dụng
- **Cải thiện chất lượng giấc ngủ**: Giúp người dùng ngủ đủ 7.0 - 9.0 giờ/đêm và tuân thủ quy tắc tắt điện thoại 30 phút trước khi đi ngủ.
- **Làm chủ thiết bị số**: Theo dõi và giảm thiểu thời gian nghiện điện thoại, ứng dụng tiêu tốn thời gian (TikTok, YouTube, Games).
- **Phân tích tương quan AI ngầm**: Phát hiện mối liên hệ giữa các thói quen (ví dụ: *Đêm trước thiếu ngủ làm tăng 2 giờ Screen Time ngày hôm sau*).
- **Giảm ma sát nhập liệu**: Tự động bóc tách số liệu từ ảnh chụp màn hình Screen Time bằng công nghệ OCR (Tesseract.js) và nút copy dữ liệu nhanh.

---

## 2. Danh Sách Tính Năng Nổi Bật (Core Features)

### 📊 1. Màn hình Tổng quan & Điểm số Sleep Score (0 - 100)
- **Đồng hồ điểm số Sleep Score**: Thuật toán tự động tính điểm sức khỏe giấc ngủ dựa trên thời lượng ngủ, Screen Time, thời gian tắt máy trước ngủ và phút vận động.
- **6 Thẻ chỉ số chính (6 Metrics Grid)**: Thời lượng ngủ, Screen Time, Thời gian tắt máy trước ngủ, Phút vận động, Thời gian chơi game, Điểm tâm trạng (1-5).
- **Biểu đồ xu hướng 7 / 14 / 30 Ngày**: Trực quan hóa các đường xu hướng đa sắc màu giúp bạn theo dõi sự tiến bộ từng ngày.
- **Phân tích tương quan AI (Correlation Insights)**: Đưa ra nhận xét khoa học về tác động giữa các thói quen.
- **Thiết lập mục tiêu & Nhắc nhở**: Cho phép bạn chọn mục tiêu cá nhân và đặt giờ nhắc nhở nhập nhật ký hàng ngày.

### 📋 2. Nhật Ký Thói Quen & Giảm Ma Sát Nhập Liệu
- **Nút "Copy từ hôm qua"**: Chỉ cần 1 click để sao chép số liệu từ ngày hôm trước và chỉnh sửa nhanh.
- **Hỗ trợ chọn ngày (Backdate entry)**: Cho phép nhập bù nhật ký cho các ngày trong quá khứ.
- **Thang điểm tâm trạng 1-5**: Chọn biểu tượng cảm xúc (😫, 🙁, 😐, 🙂, 🤩) kèm ghi chú sinh hoạt.
- **Gợi ý AI DeepSeek tức thì**: Nhấn nút *Phân Tích AI DeepSeek* để nhận phản hồi khoa học dành riêng cho bạn.
- **Biến gợi ý thành Cam Kết**: Chuyển trực tiếp gợi ý của AI thành Mục tiêu cam kết cho ngày hôm nay.
- **Bảng lịch sử & Xuất CSV**: Xem danh sách phân trang và tải xuống dữ liệu dạng file CSV.

### 🏆 3. Động Lực & Kỷ Luật (Motivation Hub)
- **Huy hiệu kỷ luật (Motivational Badges)**: Mở khóa các danh hiệu như *Khởi đầu xanh*, *Bền bỉ 3 ngày*, *Master Tắt Máy*, *Năng lượng sống*.
- **Cam kết hành động (Action Commitments)**: Đặt mục tiêu nhỏ (ví dụ: *Tắt máy lúc 22:30*) và đánh dấu "Đã làm / Chưa làm" để duy trì chuỗi Streak.
- **Thư động lực cá nhân hóa (AI Letter)**: AI DeepSeek tự động viết một lá thư tiếp sức mạnh tinh thần dài 250 - 350 từ dựa trên lịch sử 14 ngày của bạn.

### 📷 4. Quét Ảnh OCR Tự Động (Screen Time OCR)
- Kéo thả hoặc tải lên ảnh chụp màn hình **Thời gian sử dụng (iOS Screen Time / Android Digital Wellbeing)**.
- Thư viện **Tesseract.js** chạy trực tiếp trên trình duyệt sẽ tự động bóc tách:
  - Tổng giờ Screen Time
  - Ứng dụng ngốn nhiều thời gian nhất (TikTok, YouTube, Facebook...)
  - Số lần cầm máy (Pickups)
- Nhấn *Điền tự động* để tự đổ dữ liệu vào Form nhập thói quen.

### 💬 5. Trợ Lý AI Hypnara Trò Chuyện 24/7 (AI Coach Drawer)
- Khung chat nổi ở góc màn hình cho phép bạn hỏi đáp mọi thắc mắc về giấc ngủ, cách vượt qua mệt mỏi, mẹo ngắt kết nối với điện thoại.

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
Yêu cầu: Node.js >= 18 và Postgres đang chạy ở cổng 5432.

1. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```
2. Kiểm tra file `.env` chứa chuỗi kết nối Database và API Key DeepSeek:
   ```env
   DATABASE_URL=postgres://hypnara:hypnara@localhost:5432/hypnara
   DEEPSEEK_API_KEY=sk-xxxxxx...
   PORT=3000
   ```
3. Khởi chạy ở chế độ phát triển (Development):
   ```bash
   npm run dev
   ```
4. Truy cập ứng dụng tại: **[http://localhost:3000](http://localhost:3000)**

---

## 4. Hướng Dẫn Trải Nghiệm Người Dùng Theo Các Bước (Step-by-Step User Journey)

1. **Bước 1: Đăng nhập / Đăng ký tài khoản**
   - Nhấn nút **Đăng nhập** ở góc phải thanh điều hướng.
   - Nhập Username và Password mong muốn để tạo tài khoản mới.

2. **Bước 2: Quét ảnh OCR hoặc Nhập thói quen**
   - Vào mục **Quét OCR**, kéo thả ảnh màn hình Screen Time từ điện thoại -> Nhấn **Điền tự động vào Form**.
   - Hoặc vào mục **Thói quen**, chọn nút **Copy từ hôm qua** để điền nhanh các thông số.

3. **Bước 3: Nhận tư vấn AI & Tạo cam kết**
   - Sau khi nhập xong các số liệu hôm nay, nhấn nút **Phân Tích AI DeepSeek**.
   - Đọc gợi ý của AI và nhấn **Biến thành Cam Kết Hành Động** để đưa vào danh sách mục tiêu cần hoàn thành tối nay.

4. **Bước 4: Theo dõi xu hướng & Điểm số**
   - Chuyển sang màn hình **Tổng quan** để xem biểu đồ đường 7/30 ngày và kiểm tra điểm **Sleep Score**.
   - Đánh dấu hoàn thành các cam kết để tăng tỷ lệ Compliance và duy trì chuỗi Streak!
