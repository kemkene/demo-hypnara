# 🌙 Hypnara — AI Sleep & Digital Health Platform

> **Nền tảng AI tối ưu hóa giấc ngủ và sức khỏe số.** Giúp bạn phân tích mối tương quan giữa thói quen sử dụng điện thoại, vận động thể chất và chất lượng giấc ngủ để xây dựng các vi thói quen bền vững (Tiny Habits).

---

## 🚀 Hướng Dẫn Khởi Động Nhanh

### 1. Chuẩn bị môi trường
```bash
cd hypnara-demo
cp .env.example .env
```
Mở file `.env` và điền `DEEPSEEK_API_KEY` (xem hướng dẫn chi tiết cách lấy key tại [doc.md](doc.md)).

---

### 2. Cách Chạy Ứng Dụng

#### 🌟 Cách 1: Chỉ chạy Postgres qua Docker + Chạy app Node trực tiếp (Khuyên dùng)
Tiện lợi khi phát triển, test tính năng và theo dõi logs trực tiếp:

```bash
# Khởi động PostgreSQL database
docker-compose up -d db

# Cài đặt thư viện dependencies
npm install

# Khởi động máy chủ ứng dụng
npm start
```

#### 🐳 Cách 2: Chạy toàn bộ ứng dụng và Database qua Docker Compose
Dành cho việc triển khai tự động hoặc demo nhanh không cần cài đặt Node.js:

```bash
docker-compose up --build
```

---

### 3. Truy Cập Ứng Dụng
Mở trình duyệt tại địa chỉ: 👉 **[http://localhost:3000](http://localhost:3000)**

*(Nếu chưa có API Key, hệ thống vẫn hoạt động đầy đủ với bộ quy tắc dự phòng rule-based offline).*

---

## 🛠️ Xử Lý Lỗi Thường Gặp (Troubleshooting)

- **Lỗi `port is already allocated` (Trùng port 5432 hoặc 3000):**
  - Nếu đã có container Postgres khác đang chạy trên máy, hãy dừng container đó (`docker stop <container_id>`) trước khi chạy `docker-compose up -d db`.
  - Nếu port 3000 đang bận: Kiểm tra bằng `lsof -i :3000` và tắt process cũ bằng `kill -9 <PID>`.
- **Lỗi `ECONNREFUSED 127.0.0.1:5432`:**
  - Hãy đảm bảo database Postgres đã được khởi động bằng lệnh `docker-compose up -d db`.
- **Lỗi `fetch is not defined` trên Node.js đời cũ (Node < 18):**
  - Ứng dụng đã được tối ưu hóa bằng module chuẩn `https.request` của Node.js, tương thích hoàn toàn từ Node 14/16/18/20/22+.

---

## 📂 Cấu Trúc Dự Án

```text
hypnara-demo/
├── server.js               # Backend Pure Node.js (HTTP + PostgreSQL + DeepSeek API)
├── public/
│   └── index.html          # Single Page Application Dashboard (Vanilla JS + CSS)
├── doc.md                  # Hướng dẫn chi tiết sử dụng ứng dụng & Đăng ký API Key
├── Dockerfile              # Docker container build cho Node.js app
├── docker-compose.yml      # Service PostgreSQL (db) & Application (app)
├── .env.example            # Mẫu cấu hình biến môi trường
└── package.json            # Cấu hình dự án & thư viện (pg)
```

---

## 📖 Tài Liệu Hướng Dẫn Chi Tiết

Vui lòng đọc file **[doc.md](doc.md)** để xem hướng dẫn chi tiết về:
- Cách đăng ký tài khoản & lấy **DeepSeek API Key**.
- Cách sử dụng tính năng **Trích xuất ảnh Screen Time OCR**.
- Khám phá hệ thống **Gamification, Cấp độ, Huy hiệu & Lịch nhiệt độ 30 ngày (Heatmap)**.
- Phân tích biểu đồ tương quan hành vi & tương tác với **AI Health Coach**.