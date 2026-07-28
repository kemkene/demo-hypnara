# Spec: Container hoá app (FE+BE) vào docker-compose
**Status:** Approved | Priority: P2
**Created:** 2026-07-28

## 1. Objective
Từ [[002-postgres-storage]], `docker-compose up` chỉ khởi động Postgres — vẫn phải chạy `npm start` riêng cho Node app (server phục vụ cả static frontend `public/` lẫn API, không có server FE tách biệt). Đưa luôn Node app vào `docker-compose.yml` để 1 lệnh `docker-compose up` là chạy đủ cả app lẫn DB, giảm bước setup khi demo.

## 2. User Stories
- As người chạy demo, tôi chỉ cần `docker-compose up` (không cần `npm install`/`npm start` riêng) là có app chạy đầy đủ ở `http://localhost:3000`.
- As người chạy demo, tôi vẫn có thể chạy app trực tiếp bằng `npm start` (không qua Docker) khi cần sửa code nhanh, mà không bị docker-compose can thiệp.

## 3. Functional Requirements
- FR-001: Thêm `Dockerfile` build image cho `server.js` (Node >= 18, khớp `.nvmrc`/`engines`).
- FR-002: Thêm service `app` vào `docker-compose.yml`: build từ `Dockerfile`, map port `3000:3000`, `depends_on` service `db` (chờ Postgres sẵn sàng qua healthcheck thay vì đoán thời gian).
- FR-003: Service `app` nhận `DATABASE_URL` trỏ tới service `db` qua tên service (`db`, không phải `localhost`) vì trong mạng Docker Compose, `db` là hostname. `DEEPSEEK_API_KEY` lấy từ `.env` ở host qua cơ chế biến môi trường của docker-compose.
- FR-004: Không phá luồng chạy local hiện có (`npm start` sau khi `docker-compose up -d` chỉ chạy `db`) — người dùng chọn 1 trong 2 cách, README nêu rõ cả hai.

## 4. Non-Functional Requirements
- Không thêm dependency runtime mới cho app (chỉ thêm `Dockerfile`/`.dockerignore` ở tầng hạ tầng).
- Không bake secret (`.env`, `DEEPSEEK_API_KEY`) vào image — inject qua biến môi trường lúc chạy container.

## 5. Acceptance Criteria
- [ ] `docker-compose up` (không cần `npm install` trước) → cả `db` và `app` chạy, mở `http://localhost:3000` thấy trang login.
- [ ] Toàn bộ luồng register/login/habits/suggest hoạt động đúng khi chạy qua `docker-compose up` (kết nối được Postgres qua hostname `db`).
- [ ] `docker-compose up -d db && npm start` (cách chạy cũ, app chạy trực tiếp trên host) vẫn hoạt động bình thường, không bị ảnh hưởng.
- [ ] Sửa code `server.js`/`public/` và `docker-compose up --build` → thấy thay đổi (không bị cache image cũ).

## 6. Edge Cases & Risks
- App container khởi động trước khi Postgres sẵn sàng nhận kết nối → dùng `healthcheck` + `depends_on: condition: service_healthy` thay vì chỉ dựa vào retry trong code (dù retry trong `initSchema()` vẫn là lớp bảo vệ thứ 2).
- `.dockerignore` thiếu → context build kéo theo `node_modules`/`.env`/`data` không cần thiết, làm image nặng hoặc lộ secret — cần khai rõ.
