# 📘 Hướng Dẫn Sử Dụng Ứng Dụng & Đăng Ký API Key — HYPNARA

---

## 🌟 Giới Thiệu Về Hypnara

**Hypnara** là nền tảng AI thông minh hỗ trợ tối ưu hóa chất lượng giấc ngủ và kiểm soát sức khỏe số (Digital Wellbeing). Hệ thống phân tích mối tương quan giữa thời gian sử dụng màn hình điện thoại, thói quen tắt máy trước khi ngủ, vận động thể chất và giấc ngủ để đưa ra các giải pháp hành vi thiết thực (Tiny Habits).

---

## 📑 Mục Lục
1. [Hướng dẫn Đăng ký & Cấu hình API Key](#-1-hướng-dẫn-đăng-ký--cấu-hình-api-key)
2. [Cách Khởi Động Ứng Dụng](#-2-cách-khởi-động-ứng-dụng)
3. [Hướng Dẫn Sử Dụng Chi Tiết Các Tính Năng](#-3-hướng-dẫn-sử-dụng-chi-tiết-các-tính-năng)
   - [Màn hình 📊 Tổng quan (Dashboard)](#31-màn-hình--tổng-quan-dashboard)
   - [Màn hình ✍️ Nhập thói quen (Habit Logger & OCR)](#32-màn-hình-️-nhập-thói-quen-habit-logger--ocr)
   - [Màn hình 🎯 Mục tiêu & Động lực (Gamification & Goals Hub)](#33-màn-hình--mục-tiêu--động-lực-gamification--goals-hub)
   - [Màn hình 💬 AI Health Coach](#34-màn-hình--ai-health-coach)
4. [Các Mẹo Sử Dụng Hiệu Quả Nhất](#-4-các-mẹo-sử-dụng-hiệu-quả-nhất)

---

## 🔑 1. Hướng Dẫn Đăng Ký & Cấu Hình API Key

Ứng dụng Hypnara sử dụng mô hình trí tuệ nhân tạo **DeepSeek-V3 (`deepseek-chat`)** để phân tích xu hướng 14 ngày, đưa ra vi mục tiêu và phản hồi trực tiếp trong phần Chat.

### Bước 1: Đăng ký tài khoản DeepSeek Platform
1. Truy cập vào trang quản lý chính thức: 👉 **[https://platform.deepseek.com](https://platform.deepseek.com)**
2. Nhấn **Sign Up** (hoặc Log In nếu đã có tài khoản). Bạn có thể đăng ký nhanh bằng Google hoặc Email.

### Bước 2: Nạp credit hoặc nhận token dùng thử
- Tài khoản mới đăng ký thường được tặng sẵn số lượng token miễn phí để trải nghiệm.
- Chi phí của DeepSeek cực kỳ tiết kiệm (chỉ khoảng vài nghìn VNĐ cho hàng triệu từ phân tích).

### Bước 3: Tạo API Key
1. Tại menu bên trái của Dashboard DeepSeek, chọn **API keys** (hoặc truy cập trực tiếp [https://platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)).
2. Nhấn nút **`Create new API key`**.
3. Đặt tên gợi nhớ cho key (ví dụ: `Hypnara-Demo`) và nhấn **Create**.
4. **Sao chép (Copy) chuỗi API Key** vừa tạo (chuỗi sẽ có định dạng bắt đầu bằng `sk-...`).
   > ⚠️ *Lưu ý: Bạn chỉ nhìn thấy toàn bộ chuỗi key này một lần duy nhất lúc vừa tạo, hãy lưu lại cẩn thận.*

### Bước 4: Cấu hình vào ứng dụng Hypnara
1. Mở thư mục dự án `hypnara-demo`.
2. Tạo file `.env` từ file mẫu `.env.example` (nếu chưa có):
   ```bash
   cp .env.example .env
   ```
3. Mở file `.env` bằng bất kỳ trình soạn thảo nào và dán API key của bạn vào:
   ```env
   PORT=3000
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hypnara
   DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   DEEPSEEK_MODEL=deepseek-chat
   ```
4. Lưu file `.env` lại. Khi khởi động ứng dụng, AI Coach sẽ tự động nhận diện và hoạt động với toàn bộ sức mạnh của DeepSeek.

---

## 🚀 2. Cách Khởi Động Ứng Dụng

### Cách 1: Chạy trực tiếp trên máy với Postgres qua Docker (Khuyên dùng)
```bash
# 1. Khởi động database PostgreSQL
docker-compose up -d db

# 2. Cài đặt thư viện (chỉ cần chạy lần đầu)
npm install

# 3. Khởi động máy chủ Hypnara
npm start
```
Truy cập ứng dụng tại: 👉 **[http://localhost:3000](http://localhost:3000)**

### Cách 2: Chạy toàn bộ qua Docker Compose
```bash
docker-compose up --build
```

---

## 🖥️ 3. Hướng Dẫn Sử Dụng Chi Tiết Các Tính Năng

### 3.1. Màn hình 📊 Tổng quan (Dashboard)
Màn hình tổng quan cung cấp cái nhìn 360 độ về sức khỏe giấc ngủ và kỷ luật số:

1. **Điểm Chất lượng Giấc ngủ (Sleep Score 0–100)**:
   - Được chấm điểm tự động dựa trên: Thời lượng ngủ thực tế, độ trễ tắt máy trước ngủ, tổng thời gian màn hình và mức độ vận động.
   - Thang phân loại: *Rất tốt (85+)*, *Khá (70-84)*, *Cần cải thiện (<70)*.
2. **6 Chỉ số Trọng yếu (Key KPI Cards)**:
   - Giờ ngủ TB, Screen Time TB, Chơi game TB, Tắt điện thoại trước ngủ, Số lần mở máy (Pickups), Điểm tâm trạng TB (1–5).
3. **🎯 Mục tiêu Cam kết Hành động**:
   - Theo dõi các cam kết trong ngày.
   - Hỗ trợ check-in nhanh: **`Đã làm ✅`** hoặc **`Chưa ❌`**.
   - Bấm **`+ Thêm mục tiêu mới`** để mở popup thiết lập mục tiêu trực quan.
4. **🧠 Công cụ Khám phá Tương quan Hành vi (Correlation Engine)**:
   - Tự động phân tích các mối liên hệ thực tế từ dữ liệu của chính bạn:
     - *Tắt điện thoại sớm ≥ 30p giúp tăng trung bình bao nhiêu giờ ngủ sâu.*
     - *Thiếu ngủ (<6.5h) làm tăng bao nhiêu giờ dùng màn hình vô thức vào ngày hôm sau.*
     - *Vận động thể chất ≥ 30p cải thiện bao nhiêu điểm tâm trạng.*
5. **Biểu đồ Đường Trực quan (SVG Interactive Charts)**:
   - Chuyển đổi linh hoạt giữa các mốc **7 ngày**, **14 ngày**, **30 ngày**.
   - Biểu diễn đồng thời 2 đường xu hướng: *Thời lượng ngủ (Xanh dương)* và *Thời gian dùng màn hình (Tím)*.
6. **Bảng Báo cáo Tuần theo Chuẩn Y Tế (WHO Compliance)**:
   - Đo lường mức độ tuân thủ mục tiêu ngủ 7–9h và chỉ tiêu vận động ≥ 150 phút/tuần của Tổ chức Y tế Thế giới.
7. **📥 Xuất File Dữ liệu**:
   - Bấm nút **`📥 Xuất File`** ở góc trên bên phải để tải toàn bộ lịch sử dạng **CSV (Excel)** hoặc **JSON**.

---

### 3.2. Màn hình ✍️ Nhập thói quen (Habit Logger & OCR)
Được tối ưu để giảm tối đa ma sát nhập liệu:

1. **📋 Nút Copy Dữ liệu Hôm qua (1-Click Copy)**:
   - Tự động điền lại toàn bộ thông số của ngày gần nhất chỉ với 1 click, giúp bạn chỉ cần sửa đổi những con số chênh lệch.
2. **📸 Trích xuất Screen Time bằng AI OCR (Tesseract.js)**:
   - Kéo & thả hoặc tải lên ảnh chụp màn hình *Screen Time (iOS)* hoặc *Digital Wellbeing (Android)*.
   - Hệ thống tự động đọc và nhận dạng số giờ màn hình, số lần mở khóa máy và ứng dụng tiêu tốn thời gian nhất.
3. **Thanh lựa chọn Tắt điện thoại trước ngủ (Cutoff Presets)**:
   - Bấm chọn nhanh: `Ngay trước ngủ (0m)`, `15 phút`, `30 phút`, `60 phút`.
4. **Thang đánh giá Tâm trạng (1–5 Emojis)**:
   - 😫 *1. Rất tệ* | 🥱 *2. Mệt mỏi* | 😐 *3. Bình thường* | 😊 *4. Vui vẻ* | 🤩 *5. Tuyệt vời*.
5. **✨ Phân tích & Gợi ý AI**:
   - Bấm nút để AI Coach tổng hợp lịch sử 14 ngày và đưa ra các vi mục tiêu khả thi.
   - Bạn có thể bấm nút **`+ Nhận mục tiêu này`** dưới mỗi gợi ý để đưa thẳng vào bảng cam kết tối nay.

---

### 3.3. Màn hình 🎯 Mục tiêu & Động lực (Gamification & Goals Hub)
Phân hệ chuyên biệt giúp duy trì động lực bền bỉ:

1. **🏆 Hệ thống Cấp độ & Điểm EXP**:
   - **Ghi nhận 1 ngày thói quen**: Nhận ngay **`+30 EXP`**.
   - **Hoàn thành 1 mục tiêu cam kết**: Nhận ngay **`+50 EXP`**.
   - **5 Cấp độ tiến hóa**:
     - 🌱 *Cấp 1: Người Khởi Đầu (0 - 150 EXP)*
     - ⚡ *Cấp 2: Xây Dựng Thói Quen (151 - 400 EXP)*
     - 🛡️ *Cấp 3: Kỷ Luật Kỹ Thuật Số (401 - 800 EXP)*
     - 🧘 *Cấp 4: Bậc Thầy Giấc Ngủ (801 - 1500 EXP)*
     - 👑 *Cấp 5: Huyền Thoại Hypnara (1501+ EXP)*
2. **🏅 Bộ sưu tập 7 Huy hiệu Thành tựu (Badges)**:
   - Mở khóa các danh hiệu khi đạt các mốc kỷ lục: Chuỗi 3 ngày, Kỷ luật thép 7 ngày, Giấc ngủ vàng 7-9h, Cai nghiện màn hình trước ngủ, Đạt chuẩn WHO 150p...
3. **🗓️ Lịch Nhiệt độ Kỷ luật 30 Ngày (Habit Heatmap)**:
   - Lưới ô vuông trực quan tương tự GitHub Heatmap, ngày nào bạn sinh hoạt khoa học và hoàn thành cam kết ô sẽ phát sáng màu xanh ngọc rực rỡ.
4. **⚖️ So Sánh Tiến Bộ (Tuần này vs Tuần trước)**:
   - Theo dõi từng chỉ số cụ thể đã được cải thiện như thế nào qua từng tuần.
5. **🎯 Trung tâm Quản lý Mục tiêu**:
   - Xem thống kê tỉ lệ thành công %, lọc danh sách mục tiêu (*Tất cả / Đang làm / Đã hoàn thành*), tạo mục tiêu mới và check-in.
6. **💌 Bức Tâm thư Động viên từ AI Coach**:
   - Bấm **`✨ Nhận Tâm thư Động viên từ AI Coach`** để nhận một bức thư truyền cảm hứng cá nhân hóa từ AI dựa trên sự cố gắng của bạn trong tuần.

---

### 3.4. Màn hình 💬 AI Health Coach
Không gian tương tác chuyên sâu với trợ lý sức khỏe:

- AI nắm toàn bộ ngữ cảnh 14 ngày qua của bạn (thời lượng ngủ, app dùng nhiều nhất, thói quen tắt máy, tâm trạng...).
- Hỗ trợ các câu hỏi gợi ý nhanh (Chips):
  - *📱 Tác động của điện thoại tới giấc ngủ của tôi?*
  - *📊 Đánh giá xu hướng 14 ngày qua và đưa ra lộ trình?*
  - *🧘 Gợi ý lịch trình 45 phút thư giãn tối nay trước khi lên giường?*
- Bạn có thể thoải mái đặt bất kỳ câu hỏi nào liên quan đến nhịp sinh học, dinh dưỡng, thư giãn và năng suất.

---

## 💡 4. Các Mẹo Sử Dụng Hiệu Quả Nhất

1. **Nguyên tắc "30 phút vàng"**: Hãy cam kết tắt điện thoại hoặc đặt sạc cách xa giường ít nhất 30 phút trước khi ngủ. Sau 3 ngày, hãy vào Dashboard để xem biểu đồ tương quan của bạn thay đổi kỳ diệu như thế nào.
2. **Sử dụng OCR hằng ngày**: Vào ứng dụng chụp ảnh màn hình Screen Time trên điện thoại mỗi sáng, kéo thả vào Hypnara — bạn chỉ mất chưa đầy 10 giây để ghi nhận toàn bộ dữ liệu trong ngày!
3. **Bắt đầu với Vi thói quen (Tiny Habits)**: Đừng đặt mục tiêu quá lớn. Hãy bắt đầu bằng các mục tiêu nhỏ như *"Tắt máy trước 23h"*, *"Đi bộ 10 phút"*, hoàn thành chúng để nhận EXP và thăng cấp đều đặn.

---

*Chúc bạn có những giấc ngủ thật trọn vẹn và tràn đầy năng lượng cùng Hypnara! 🌙*
