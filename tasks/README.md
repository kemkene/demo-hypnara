# tasks/ — Project Checkpoint

| # | Feature | Spec | Plan | Tasks | Status |
|---|---------|------|------|-------|--------|
| 001 | Login đơn giản + lưu lịch sử thói quen | [specs/001-login-habit-history](../specs/001-login-habit-history/spec.md) | [plans/001-login-habit-history](../plans/001-login-habit-history/plan.md) | [tasks/001-login-habit-history](001-login-habit-history/tasks.md) | 🟡 (thiếu verify browser thủ công) |
| 002 | Chuyển lưu trữ sang Postgres | [specs/002-postgres-storage](../specs/002-postgres-storage/spec.md) | [plans/002-postgres-storage](../plans/002-postgres-storage/plan.md) | [tasks/002-postgres-storage](002-postgres-storage/tasks.md) | 🟢 |
| 003 | Phân trang lịch sử thói quen | [specs/003-history-pagination](../specs/003-history-pagination/spec.md) | [plans/003-history-pagination](../plans/003-history-pagination/plan.md) | [tasks/003-history-pagination](003-history-pagination/tasks.md) | 🟢 |
| 004 | Chọn ngày khi nhập (nhập bù quá khứ) | [specs/004-backdate-entry](../specs/004-backdate-entry/spec.md) | [plans/004-backdate-entry](../plans/004-backdate-entry/plan.md) | [tasks/004-backdate-entry](004-backdate-entry/tasks.md) | 🟡 (thiếu verify browser thủ công) |
| 005 | Container hoá app (FE+BE) vào docker-compose | [specs/005-dockerize-app](../specs/005-dockerize-app/spec.md) | [plans/005-dockerize-app](../plans/005-dockerize-app/plan.md) | [tasks/005-dockerize-app](005-dockerize-app/tasks.md) | 🟢 |

🔴 Not Started | 🟡 In Progress | 🟢 Done | ⚫ Cancelled

## Ghi chú
- 001: toàn bộ luồng đã verify bằng curl; chưa tự tay click qua browser (5.2).
- 002: đã thay hoàn toàn file JSON storage bằng Postgres (`docker-compose.yml` + bảng `users`/`habits`), verify bằng curl + `psql` trực tiếp.
- 004: phát hiện + sửa 1 bug thật khi verify (không thuộc scope 004 nhưng lộ ra lúc này) — cột `DATE` từ Postgres bị `pg` parse thành `Date` object rồi `.toISOString()` làm lệch lùi 1 ngày trên máy chạy timezone UTC+ (vd `Asia/Saigon`). Đã fix bằng `types.setTypeParser(1082, v => v)` để giữ nguyên chuỗi `YYYY-MM-DD`, không qua `Date` object nữa.
- 004: chưa tự tay verify qua browser (chỉ verify bằng curl).
- 005: `docker-compose up --build` giờ chạy được cả app lẫn Postgres (không cần `npm install`/`npm start` riêng); đã verify cả 2 cách chạy (full Docker và Postgres-Docker-only + app trên host) hoạt động đúng, không đụng nhau.
- 2026-07-28: `HISTORY_DAYS` (số bản ghi gần nhất đưa vào prompt AI) đổi từ 7 → 10 theo yêu cầu, xem `server.js`. Đã verify bằng cách seed 12 bản ghi, xác nhận query chỉ lấy đúng 10 bản ghi mới nhất.
- 2026-07-28: form thói quen tách nút "Cập nhật dữ liệu" (chỉ `POST /api/habits`) và "Nhận gợi ý" (chỉ `POST /api/suggest`) — thay cho auto-branch theo ngày ở [[004-backdate-entry]]. 2 hành động độc lập hoàn toàn, verify bằng curl mô phỏng đúng 2 lệnh gọi tách rời.
- Chạy `docker-compose up --build` (all-in-Docker) HOẶC `docker-compose up -d db` + `npm start` (app trên host) — chỉ chọn 1 trong 2, không chạy song song (đụng port 3000).
