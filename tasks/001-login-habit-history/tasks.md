# Tasks: Login đơn giản + Lưu lịch sử thói quen cho AI prompt
**Based on:** plans/001-login-habit-history/plan.md

### Phase 1: Storage helpers
- [x] 🟢 1.1 Thêm `data/` dir + `.gitignore` cho `data/*.json`
- [x] 🟢 1.2 `readJSON` / `writeJSON` / `parseCookies` / `getSessionUser` / `todayStr` trong `server.js`

### Phase 2: Auth routes
- [x] 🟢 2.1 `POST /api/register`
- [x] 🟢 2.2 `POST /api/login`
- [x] 🟢 2.3 `POST /api/logout`
- [x] 🟢 2.4 `GET /api/me`

### Phase 3: Habit history + AI prompt
- [x] 🟢 3.1 `POST /api/habits` (upsert theo username+date)
- [x] 🟢 3.2 `GET /api/habits` (N ngày gần nhất)
- [x] 🟢 3.3 Sửa `POST /api/suggest`: require auth, gộp lịch sử vào `buildUserPrompt`

### Phase 4: Frontend
- [x] 🟢 4.1 Auth screen (login/register toggle)
- [x] 🟢 4.2 Gate app screen theo `/api/me`, hiện username + nút đăng xuất
- [x] 🟢 4.3 Hiển thị lịch sử ngắn (danh sách N ngày)

### Phase 5: Verify
- [x] 🟢 5.1 Verify tay bằng curl (register → login → post habit → suggest)
- [ ] 🔴 5.2 Verify trên browser (luồng đầy đủ, edge case chưa login)
- [x] 🟢 5.3 Cập nhật README (ghi chú Buổi 8)
