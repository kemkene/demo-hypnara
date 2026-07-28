# Spec: Phân trang lịch sử thói quen
**Status:** Approved | Priority: P2
**Created:** 2026-07-28

## 1. Objective
[[001-login-habit-history]] giới hạn cứng `GET /api/habits` ở 7 bản ghi gần nhất (dùng chung `HISTORY_DAYS` với phần đưa lịch sử vào prompt AI). Khối "Lịch sử gần đây" trên UI vì vậy không bao giờ hiển thị quá 7 ngày dù user đã dùng app lâu hơn. Cần tách 2 khái niệm: (1) lịch sử đưa vào AI prompt — giữ nguyên ngắn (7 ngày, không đổi vì ảnh hưởng chi phí/chất lượng prompt), (2) lịch sử hiển thị cho user xem lại — cho xem nhiều hơn, phân trang khi cần.

## 2. User Stories
- As người dùng, tôi muốn xem lại toàn bộ lịch sử thói quen đã nhập, không chỉ 7 ngày gần nhất.
- As người dùng, khi lịch sử dài, tôi muốn chuyển trang thay vì tải hết một lúc.

## 3. Functional Requirements
- FR-001: `GET /api/habits` nhận query param `page` (mặc định 1) và `pageSize` (mặc định 10, tối đa 50), trả về `{ habits, page, pageSize, total }`.
- FR-002: Không đổi hành vi `POST /api/suggest` — vẫn dùng đúng N ngày gần nhất (không tính hôm nay, N = `HISTORY_DAYS`, ban đầu 7, đổi thành 10 từ 2026-07-28) cho prompt AI, tách biệt khỏi endpoint xem lịch sử.
- FR-003: Frontend hiển thị danh sách lịch sử theo trang hiện tại, kèm nút "Trang trước / Trang sau" (hoặc số trang), chỉ hiện điều khiển phân trang khi `total > pageSize`.

## 4. Non-Functional Requirements
- Không thêm dependency mới.
- Giữ nguyên response shape cũ về mặt tương thích tối thiểu (mảng `habits` vẫn ở đúng field đó, chỉ thêm field mới `page/pageSize/total`).

## 5. Acceptance Criteria
- [ ] User có > 10 bản ghi lịch sử → trang 1 hiển thị 10 bản ghi mới nhất, có nút sang trang 2.
- [ ] Chuyển trang 2 → hiển thị đúng 10 bản ghi tiếp theo (cũ hơn).
- [ ] User có ≤ 10 bản ghi → không hiện điều khiển phân trang.
- [ ] Gợi ý AI (`/api/suggest`) vẫn chỉ dựa trên 7 ngày gần nhất như trước, không bị ảnh hưởng bởi thay đổi phân trang.

## 6. Edge Cases & Risks
- `page` vượt quá số trang thực tế → trả mảng rỗng (không lỗi).
- `pageSize` do client gửi lên bất thường (âm, quá lớn) → clamp về khoảng hợp lệ (1–50) phía server.
