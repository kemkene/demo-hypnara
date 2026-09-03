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

*(Nếu chưa có API Key hoặc mất kết nối mạng, hệ thống vẫn hoạt động đầy đủ 100% nhờ bộ quy tắc dự phòng rule-based offline chuyên nghiệp tại `lib/fallback-ai.ts`).*

---

## 🛠️ Xử Lý Lỗi Thường Gặp (Troubleshooting)

- **Lỗi `port is already allocated` (Trùng port 5432 hoặc 3000):**
  - Nếu đã có container Postgres khác đang chạy trên máy, hãy dừng container đó (`docker stop <container_id>`) trước khi chạy `docker-compose up -d db`.
  - Nếu port 3000 đang bận: Kiểm tra bằng `lsof -i :3000` và tắt process cũ bằng `kill -9 <PID>`.
- **Lỗi `ECONNREFUSED 127.0.0.1:5432`:**
  - Hãy đảm bảo database Postgres đã được khởi động bằng lệnh `docker-compose up -d db`.

---

## 📂 Cấu Trúc Dự Án (Next.js App Router)

```text
hypnara-demo/
├── app/                        # Next.js App Router & API Route Handlers
│   ├── api/                    # REST API endpoints (/api/suggest, /api/habits, /api/chat...)
│   ├── globals.css             # Design system, CSS variables & tokens
│   ├── layout.tsx              # Root HTML layout & font metadata
│   └── page.tsx                # Trang điều khiển chính (Dashboard SPA)
├── components/                 # React UI Components (Overview, Habits, Motivation, OCR...)
├── lib/                        # Core backend services & utilities
│   ├── auth.ts                 # Session auth & input validation
│   ├── date.ts                 # Chuẩn hóa múi giờ VN (UTC+7) & tính toán streak
│   ├── db.ts                   # PostgreSQL client pool & schema migrations
│   ├── deepseek.ts             # DeepSeek API client & prompts
│   └── fallback-ai.ts          # Rule-Based AI Offline Engines
├── specs/                      # Đặc tả kỹ thuật và yêu cầu chức năng (FR-001 -> FR-005)
├── tests/                      # Bộ Unit Test Suites chuẩn hóa
├── Dockerfile                  # Multi-stage Docker container build
├── docker-compose.yml          # Dịch vụ PostgreSQL và ứng dụng Next.js
└── package.json                # Quản lý dependencies & scripts (test, build, dev)
```

---

## 📖 Tài Liệu Hướng Dẫn Chi Tiết

Vui lòng đọc file **[doc.md](doc.md)** để xem hướng dẫn chi tiết về:
- Cách đăng ký tài khoản & lấy **DeepSeek API Key**.
- Cách sử dụng tính năng **Trích xuất ảnh Screen Time OCR**.
- Khám phá hệ thống **Gamification, Cấp độ, Huy hiệu & Lịch nhiệt độ 30 ngày (Heatmap)**.
- Phân tích biểu đồ tương quan hành vi & tương tác với **AI Health Coach**.