# Tasks: Chuyển lưu trữ từ file JSON sang Postgres
**Based on:** plans/002-postgres-storage/plan.md

### Phase 1: Hạ tầng Postgres
- [x] 🟢 1.1 `docker-compose.yml` (service `db`, volume, port 5432)
- [x] 🟢 1.2 `.env.example` thêm `DATABASE_URL`
- [x] 🟢 1.3 `docker-compose up -d`, verify connect bằng `psql` trong container

### Phase 2: Kết nối + schema
- [x] 🟢 2.1 Thêm dependency `pg`, `npm install`
- [x] 🟢 2.2 `Pool` setup + `initSchema()` (CREATE TABLE IF NOT EXISTS users, habits) trong `server.js`
- [x] 🟢 2.3 Xoá `readJSON`/`writeJSON`/`DATA_DIR`/`USERS_FILE`/`HABITS_FILE`

### Phase 3: Chuyển route sang SQL
- [x] 🟢 3.1 `POST /api/register` → INSERT + bắt lỗi trùng username (23505)
- [x] 🟢 3.2 `POST /api/login` → SELECT + so khớp password
- [x] 🟢 3.3 `POST /api/habits` → INSERT ... ON CONFLICT DO UPDATE
- [x] 🟢 3.4 `GET /api/habits` → SELECT ORDER BY date DESC LIMIT
- [x] 🟢 3.5 `POST /api/suggest` → SELECT lịch sử (loại trừ hôm nay) cho prompt

### Phase 4: Dọn dẹp & verify
- [x] 🟢 4.1 Xoá thư mục `data/`, sửa `.gitignore`
- [x] 🟢 4.2 Cập nhật `package.json` description + README (hướng dẫn `docker-compose up -d` trước `npm start`)
- [x] 🟢 4.3 Verify tay end-to-end (curl + psql) toàn bộ luồng register/login/habits/suggest/logout
