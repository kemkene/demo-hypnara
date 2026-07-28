# Spec: Chuyển lưu trữ từ file JSON sang Postgres
**Status:** Approved | Priority: P1
**Created:** 2026-07-28

## 1. Objective
[[001-login-habit-history]] hiện lưu `users`/`habits` bằng file JSON (`data/*.json`) — đủ cho demo nhanh nhưng không phản ánh cách app thật lưu dữ liệu, và có rủi ro ghi đồng thời. Chuyển sang Postgres để: (1) minh hoạ mô hình lưu trữ thật cho buổi dạy, (2) query lịch sử/kiểm tra trùng username đáng tin cậy hơn qua constraint của DB thay vì tự viết bằng tay.

## 2. User Stories
- As người dùng demo, hành vi đăng nhập/lưu thói quen/xem lịch sử không đổi — chỉ đổi nơi lưu trữ phía sau.
- As giảng viên, tôi muốn chỉ ra schema Postgres đơn giản (`users`, `habits`) để minh hoạ constraint (`UNIQUE`, `PRIMARY KEY`) thay cho code tự kiểm tra trùng lặp bằng tay.
- As người chạy demo, tôi chỉ cần `docker-compose up -d` là có Postgres sẵn sàng, không cần cài đặt gì thêm ngoài Docker.

## 3. Functional Requirements
- FR-001: Thêm `docker-compose.yml` chạy 1 service Postgres (image chính thức, có volume để giữ data qua các lần restart container).
- FR-002: Server kết nối Postgres qua `DATABASE_URL` (đọc từ `.env`), dùng package `pg` (client Postgres chính thức cho Node, không dùng ORM).
- FR-003: Khi khởi động, server tự tạo bảng nếu chưa có (`CREATE TABLE IF NOT EXISTS`) — không cần chạy migration riêng.
- FR-004: Schema:
  - `users(username PK, password)` — thay cho `users.json`.
  - `habits(id, username FK, date, sleep_hours, screen_time, game_time, exercise_minutes, mood, schedule, created_at, UNIQUE(username, date))` — thay cho `habits.json`, giữ đúng logic "ghi đè nếu nhập lại trong ngày" bằng `ON CONFLICT`.
- FR-005: Toàn bộ route hiện có (`/api/register`, `/api/login`, `/api/habits` GET/POST, `/api/suggest`) giữ nguyên hành vi/response, chỉ đổi cách đọc/ghi dữ liệu (JSON file → SQL query).
- FR-006: Bỏ hoàn toàn code + file JSON storage cũ (`readJSON`, `writeJSON`, thư mục `data/`) — không giữ 2 đường lưu trữ song song.

## 4. Non-Functional Requirements
- Vẫn không cần bảo mật (theo yêu cầu demo giảng dạy đã chốt ở [[001-login-habit-history]]): password plaintext, không hash, cookie session không ký.
- Project không còn "zero dependency" nữa — chấp nhận thêm 1 dependency (`pg`), cập nhật lại mô tả trong `package.json`/README cho đúng thực tế.
- Không dùng ORM/query builder (Prisma, Knex...) — SQL thuần qua `pg`, giữ code đơn giản, dễ giảng.

## 5. Acceptance Criteria
- [ ] `docker-compose up -d` → Postgres sẵn sàng nhận kết nối.
- [ ] `npm start` (sau khi có `DATABASE_URL` trong `.env`) → server tự tạo bảng, chạy được không lỗi.
- [ ] Toàn bộ luồng ở acceptance criteria của [[001-login-habit-history]] (register/login/habits/suggest/logout) vẫn đúng, dữ liệu nằm trong Postgres (verify bằng `docker exec ... psql`).
- [ ] Restart server (không restart container Postgres) → dữ liệu cũ vẫn còn (khác với trước đây file JSON cũng vốn đã persist, nhưng giờ verify qua DB).
- [ ] Không còn file/code nào đọc/ghi `data/*.json`.

## 6. Edge Cases & Risks
- Server khởi động khi Postgres chưa sẵn sàng (race lúc `docker-compose up` + `npm start` gần nhau) → cần retry/log lỗi rõ ràng thay vì crash im lặng.
- `DATABASE_URL` thiếu trong `.env` → báo lỗi rõ ràng khi khởi động, không để lỗi mơ hồ lúc query.
