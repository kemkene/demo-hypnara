# Plan: Chuyển lưu trữ từ file JSON sang Postgres
**Based on:** specs/002-postgres-storage/spec.md | **Status:** Approved

## 1. Technical Approach
Thêm `pg` (node-postgres) làm dependency duy nhất mới. Tạo pool kết nối 1 lần lúc start server, chạy `CREATE TABLE IF NOT EXISTS` cho `users`/`habits` trước khi `server.listen`. Thay toàn bộ `readJSON`/`writeJSON` bằng hàm async query tương ứng, giữ nguyên chữ ký route handler nhưng chuyển sang `async/await` + `await pool.query(...)`.

## 2. Architecture Changes
- `docker-compose.yml` (mới) — service `db` dùng `postgres:16-alpine`, volume `pgdata`, expose `5432`.
- `package.json` — thêm dependency `pg`; sửa lại `description` (bỏ "zero dependency").
- `.env.example` — thêm `DATABASE_URL=postgres://hypnara:hypnara@localhost:5432/hypnara`.
- `server.js`:
  - Xoá: `DATA_DIR`, `USERS_FILE`, `HABITS_FILE`, `readJSON`, `writeJSON`.
  - Thêm: `db.js`? — **Không**, giữ 1 file `server.js` như hiện tại (project chủ trương ít file), thêm 1 block "DB setup" ở đầu file dùng `pg.Pool`.
  - Thêm `initSchema()` async, gọi trước `server.listen`.
  - Sửa các route handler `register/login/habits(GET/POST)/suggest` sang query SQL.
- Xoá thư mục `data/` (không còn dùng), xoá dòng `data/*.json` khỏi `.gitignore` (không còn cần).
- README — cập nhật hướng dẫn chạy: `docker-compose up -d` trước `npm start`.

## 3. Component Design
**server.js**
- `const { Pool } = require("pg");`
- `const pool = new Pool({ connectionString: process.env.DATABASE_URL });`
- `async function initSchema()`:
  ```sql
  CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS habits (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL REFERENCES users(username),
    date DATE NOT NULL,
    sleep_hours TEXT,
    screen_time TEXT,
    game_time TEXT,
    exercise_minutes TEXT,
    mood TEXT,
    schedule TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (username, date)
  );
  ```
- Route logic đổi tương ứng:
  - `register`: `INSERT INTO users(username, password) VALUES ($1,$2)`, bắt lỗi unique_violation (code `23505`) → 409.
  - `login`: `SELECT password FROM users WHERE username=$1`, so sánh plaintext.
  - `POST /api/habits`: `INSERT INTO habits(...) VALUES (...) ON CONFLICT (username, date) DO UPDATE SET ... RETURNING *`.
  - `GET /api/habits`: `SELECT * FROM habits WHERE username=$1 ORDER BY date DESC LIMIT $2`.
  - `/api/suggest`: `SELECT * FROM habits WHERE username=$1 AND date <> $2 ORDER BY date DESC LIMIT $3`.
- Response JSON field names giữ nguyên camelCase như cũ (map từ snake_case cột DB sang object trả về) để không phải sửa frontend.
- Khởi động: nếu `initSchema()` throw (Postgres chưa sẵn sàng) → log lỗi rõ + `process.exit(1)` thay vì chạy server ở trạng thái hỏng ngầm.

## 4. Dependencies & Risks
- Dependency mới: `pg` (^8.x) — duy nhất, không kèm ORM.
- Risk: `docker-compose up -d` cần thời gian vài giây để Postgres sẵn sàng nhận kết nối → nếu `npm start` chạy ngay sau có thể lỗi connection refused. Xử lý bằng: retry connect vài lần khi `initSchema()` thất bại (backoff đơn giản, không cần thư viện retry).
- Risk: đổi tên field (snake_case DB ↔ camelCase JSON) dễ gõ sai — kiểm tra kỹ khi map kết quả `pool.query`.

## 5. Test Strategy
Không có test framework (giữ nguyên). Verify tay: `docker-compose up -d` → `npm start` → lặp lại đúng bộ lệnh `curl` đã dùng để verify [[001-login-habit-history]] (register/login/habits/suggest/logout), lần này check thêm bằng `docker exec <container> psql -U hypnara -d hypnara -c "select * from habits"` để xác nhận data nằm trong Postgres.

## 6. Implementation Order
- Step 1: `docker-compose.yml` + `.env.example` + start Postgres, xác nhận connect được bằng `psql` trong container.
- Step 2: Thêm `pg` vào `package.json`, cài đặt.
- Step 3: `server.js` — DB setup + `initSchema`, xoá code JSON storage.
- Step 4: Chuyển từng route sang SQL (register → login → habits → suggest).
- Step 5: Verify tay end-to-end, dọn `data/` cũ, cập nhật README.
