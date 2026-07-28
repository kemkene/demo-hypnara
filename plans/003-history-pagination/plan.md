# Plan: Phân trang lịch sử thói quen
**Based on:** specs/003-history-pagination/spec.md | **Status:** Approved

## 1. Technical Approach
Thêm 1 hằng số `LIST_PAGE_SIZE_DEFAULT = 10` tách biệt khỏi `HISTORY_DAYS = 7` (dùng riêng cho prompt AI, không đổi). `GET /api/habits` đọc `page`/`pageSize` từ query string, dùng `LIMIT/OFFSET` + 1 query `COUNT(*)` để trả `total`. Frontend thêm state `currentPage`, nút Trước/Sau gọi lại `loadHistory(page)`.

## 2. Architecture Changes
- `server.js`:
  - Thêm `LIST_PAGE_SIZE_DEFAULT`, `LIST_PAGE_SIZE_MAX`.
  - Sửa route `GET /api/habits`: parse query (`new URL(req.url, "http://x")`), clamp `page`/`pageSize`, query `SELECT ... LIMIT $ OFFSET $` + `SELECT COUNT(*)`.
  - Route `POST /api/suggest` giữ nguyên (vẫn query riêng, LIMIT `HISTORY_DAYS`, không dùng chung code với route habits GET).
- `public/index.html`:
  - `loadHistory(page)` nhận tham số trang, gọi `/api/habits?page=...&pageSize=...`.
  - Thêm khối pagination (2 nút + label "Trang X/Y") dưới `#historyList`, ẩn khi `total <= pageSize`.

## 3. Component Design
- Query string: `/api/habits?page=2&pageSize=10`.
- Response: `{ habits: [...], page: 2, pageSize: 10, total: 23 }`.
- Clamp: `page = Math.max(1, parseInt(...) || 1)`, `pageSize = Math.min(50, Math.max(1, parseInt(...) || 10))`.
- SQL: `SELECT * FROM habits WHERE username=$1 ORDER BY date DESC LIMIT $2 OFFSET $3` và `SELECT COUNT(*) FROM habits WHERE username=$1`.
- Frontend: `totalPages = Math.ceil(total / pageSize)`; nút Trước disable khi `page<=1`, nút Sau disable khi `page>=totalPages`.

## 4. Dependencies & Risks
- Không thêm dependency.
- Risk: nhầm lẫn giữa "lịch sử cho prompt" (7 ngày cố định) và "lịch sử hiển thị" (phân trang) nếu lỡ tay dùng chung 1 query — code tách rõ 2 route, không refactor dùng chung hàm để tránh nhầm.

## 5. Test Strategy
Verify tay: seed > 10 bản ghi cho 1 user (qua vòng lặp curl với ngày khác nhau, chèn thẳng qua `psql` cho nhanh), gọi `/api/habits?page=1` và `?page=2`, kiểm tra `total`/dữ liệu đúng; verify `/api/suggest` vẫn không đổi hành vi.

## 6. Implementation Order
- Step 1: Sửa `GET /api/habits` (server) — pagination + total.
- Step 2: Sửa frontend — `loadHistory(page)` + UI nút chuyển trang.
- Step 3: Verify tay end-to-end.
