# Tasks: Phân trang lịch sử thói quen
**Based on:** plans/003-history-pagination/plan.md

### Phase 1: Backend
- [x] 🟢 1.1 `GET /api/habits` nhận `page`/`pageSize`, trả `{habits, page, pageSize, total}`
- [x] 🟢 1.2 Clamp `page`/`pageSize` hợp lệ

### Phase 2: Frontend
- [x] 🟢 2.1 `loadHistory(page)` gọi API kèm query, render danh sách
- [x] 🟢 2.2 Nút Trước/Sau + label trang, ẩn khi không cần

### Phase 3: Verify
- [x] 🟢 3.1 Verify tay (seed nhiều bản ghi, test chuyển trang, test `/api/suggest` không đổi)
