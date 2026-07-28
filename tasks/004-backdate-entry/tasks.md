# Tasks: Chọn ngày khi nhập thói quen
**Based on:** plans/004-backdate-entry/plan.md

### Phase 1: Backend
- [x] 🟢 1.1 `isValidDateStr()` + sửa `POST /api/habits` dùng `date` từ body (validate, 400 nếu sai)

### Phase 2: Frontend
- [x] 🟢 2.1 Thêm input ngày vào form (`max` = hôm nay)
- [x] 🟢 2.2 Submit handler: rẽ nhánh gọi `/api/suggest` chỉ khi chọn hôm nay, hiện thông báo lưu khi chọn ngày khác

### Phase 3: Verify
- [x] 🟡 3.1 Verify bằng curl (ngày hợp lệ quá khứ / tương lai / sai định dạng / thiếu field) — OK. Chưa tự tay test qua browser (2 nhánh isToday/không).
