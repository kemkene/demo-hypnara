# Hypnara — Demo

Web demo nhẹ: nhập thói quen & lịch trình hôm nay, nhận gợi ý cải thiện từ AI (DeepSeek).

## Chạy thử (local)

```bash
cd hypnara-demo
cp .env.example .env
# mở .env, dán DEEPSEEK_API_KEY (lấy tại https://platform.deepseek.com/api_keys)
```

**Cách 1 — chỉ cần Docker, không cần cài Node (khuyên dùng để demo nhanh):**

```bash
docker-compose up --build
```

Chạy cả Postgres lẫn app trong container, tự chờ Postgres sẵn sàng (healthcheck) rồi mới start app. Sửa code xong nhớ thêm `--build` để build lại image.

**Cách 2 — chỉ Postgres qua Docker, app chạy trực tiếp trên máy (tiện khi sửa code, có hot reload theo ý muốn):**

```bash
docker-compose up -d db   # chi khoi dong Postgres, khong khoi dong app container
nvm use                   # neu dung nvm, chon dung Node version tu .nvmrc
npm install
npm start
```

Không chạy đồng thời cả 2 cách — sẽ đụng port `3000`.

Mở trình duyệt: http://localhost:3000

Nếu chưa có API key, app vẫn chạy được — sẽ tự dùng gợi ý rule-based đơn giản thay vì gọi AI thật (đủ để demo giao diện và luồng, gắn key vào sau).

## Cấu trúc

- `server.js` — HTTP server bằng Node core (`http`) + `pg` (Postgres client): vừa phục vụ frontend tĩnh (`public/`) vừa xử lý API, không có server FE riêng. Có route đăng nhập/đăng ký, lưu thói quen, và `POST /api/suggest` gọi DeepSeek API (model `deepseek-v4-flash`, endpoint OpenAI-compatible).
- `public/index.html` — 1 trang duy nhất: màn hình đăng nhập/đăng ký, form nhập thói quen + hiển thị gợi ý + lịch sử (HTML/CSS/JS thuần, không cần build).
- `Dockerfile` — build image cho app (Node alpine, không bake `.env`/secret vào image).
- `docker-compose.yml` — service `db` (Postgres, image `postgres:16-alpine`, data giữ qua volume `pgdata`) + service `app` (build từ `Dockerfile`, chờ `db` healthy mới start, nhận `DATABASE_URL` trỏ tới hostname `db` trong mạng Docker Compose).
- `.env.example` — mẫu biến môi trường (API key, port, `DATABASE_URL` dùng khi chạy app trực tiếp trên host — trỏ `localhost`).

## Đăng nhập, lưu lịch sử & Postgres (demo giảng dạy — KHÔNG có bảo mật thật)

- `POST /api/register`, `POST /api/login`: username/password lưu **plaintext** trong bảng `users`, session là cookie **không ký, không mã hoá, không hết hạn**. Đây là lựa chọn có chủ đích cho mục đích giảng dạy, không phải thiếu sót — xem comment `ponytail:` trong `server.js` để biết cần nâng cấp gì (hash password, cookie ký) nếu dùng thật.
- `POST /api/habits`: lưu thói quen hôm nay theo tài khoản vào bảng `habits`, ghi đè nếu nhập lại trong ngày (`ON CONFLICT (username, date) DO UPDATE`).
- `POST /api/suggest`: yêu cầu đã đăng nhập, gộp thêm 10 bản ghi lịch sử gần nhất (theo ngày) của user (query từ Postgres) vào prompt gửi AI (`HISTORY_DAYS` trong `server.js`).
- Server tự tạo bảng (`CREATE TABLE IF NOT EXISTS`) khi khởi động, không cần chạy migration riêng — xem `initSchema()` trong `server.js`.

## Deploy nhanh (tuỳ chọn)

Có thể deploy lên Railway hoặc Render (hỗ trợ Node/Express + Postgres managed trực tiếp, free tier đủ cho demo). Nhớ set biến môi trường `DEEPSEEK_API_KEY` và `DATABASE_URL` trên nền tảng deploy — không commit `.env` thật lên git.

## Ghi chú cho buổi dạy

- Buổi 2 (Ứng dụng web được tạo ra như thế nào): mở F12 trên trang demo để chỉ frontend (`index.html`) và request tới `/api/suggest` (phần "ẩn" phía sau).
- Buổi 4 (AI & cá nhân hóa): chỉ ra `server.js` — dữ liệu người dùng nhập + lịch sử nhiều ngày (query Postgres) → prompt gửi AI (`buildUserPrompt`) → gợi ý trả về, minh hoạ vòng lặp cá nhân hóa theo thời gian.
- Buổi 8 (Đạo đức): giờ dữ liệu ĐÃ được lưu thật (Postgres, username/password plaintext, session không mã hoá) — điểm để thảo luận cụ thể: "nếu đây là app thật, cần đổi gì để bảo vệ dữ liệu người dùng?" (hash password, mã hoá session, ai được xem lịch sử của ai, xoá dữ liệu theo yêu cầu, phân quyền truy vấn DB...).
