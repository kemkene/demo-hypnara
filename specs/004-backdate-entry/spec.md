# Spec: Chọn ngày khi nhập thói quen (nhập bù lịch sử quá khứ)
**Status:** Approved | Priority: P2
**Created:** 2026-07-28

## 1. Objective
`POST /api/habits` hiện luôn ghi vào ngày hôm nay (`todayStr()`), nên cách duy nhất để có nhiều dòng lịch sử là chờ qua ngày khác — không tiện cho việc chuẩn bị data demo (xem [[003-history-pagination]], [[001-login-habit-history]]). Cho phép người dùng chọn ngày khi nhập, để nhập bù dữ liệu các ngày trong quá khứ, phục vụ minh hoạ "lịch sử nhiều ngày → prompt AI" mà không cần chờ thật.

## 2. User Stories
- As người dùng demo, tôi muốn chọn 1 ngày trong quá khứ và nhập thói quen cho ngày đó, để nhanh chóng có dữ liệu lịch sử nhiều ngày.
- As người dùng, khi tôi nhập cho **hôm nay**, tôi vẫn nhận được gợi ý AI như luồng hiện tại (không đổi).
- As người dùng, khi tôi nhập cho **ngày quá khứ**, tôi không cần/không mong đợi gợi ý AI cho ngày đó — chỉ cần lưu lại làm dữ liệu lịch sử.

## 3. Functional Requirements
- FR-001: Form thêm ô chọn ngày (`<input type="date">`), mặc định = hôm nay, không cho chọn ngày tương lai (`max` = hôm nay).
- FR-002: `POST /api/habits` nhận thêm field `date` (ISO `YYYY-MM-DD`); nếu thiếu → mặc định hôm nay (tương thích ngược); nếu có → dùng ngày đó thay vì luôn `todayStr()`. Validate: đúng định dạng, không phải ngày tương lai — sai → 400.
- FR-003: Vẫn giữ hành vi ghi đè theo `UNIQUE(username, date)` — nhập lại cùng 1 ngày (dù quá khứ hay hôm nay) → ghi đè bản ghi ngày đó (không đổi từ [[001-login-habit-history]]).
- FR-004: Frontend: nếu ngày được chọn = hôm nay → giữ nguyên luồng cũ (lưu + gọi `/api/suggest` + hiện gợi ý). Nếu ngày được chọn khác hôm nay → chỉ lưu (`POST /api/habits`), **không gọi** `/api/suggest`, hiện thông báo xác nhận đã lưu thay cho khối gợi ý. *(Thay thế 2026-07-28: bỏ auto-branch theo ngày, tách thành 2 nút riêng "Cập nhật dữ liệu" / "Nhận gợi ý" — người dùng tự chọn hành động thay vì hệ thống tự quyết theo ngày. Xem mục Frontend trong README/`public/index.html`.)*
- FR-005: `POST /api/suggest` không đổi — vẫn luôn dùng dữ liệu "hôm nay" từ payload + lịch sử N ngày trước đó (loại trừ hôm nay, N = `HISTORY_DAYS`) như hiện tại, không nhận `date` tuỳ ý (gợi ý luôn là cho hôm nay).

## 4. Non-Functional Requirements
- Không thêm dependency.
- Không đổi schema DB (cột `date` đã có sẵn).

## 5. Acceptance Criteria
- [ ] Nhập với ngày = hôm nay → lưu + nhận gợi ý AI như trước.
- [ ] Nhập với ngày quá khứ (vd hôm qua) → lưu thành công, xuất hiện trong `GET /api/habits`, KHÔNG gọi `/api/suggest`.
- [ ] Nhập 2 lần cho cùng 1 ngày quá khứ → ghi đè, không tạo dòng trùng.
- [ ] Chọn ngày tương lai → bị chặn ở cả UI (`max` attribute) và server (400 nếu cố tình gửi thẳng API).
- [ ] `GET /api/habits` hiển thị đúng cả bản ghi hôm nay lẫn các ngày nhập bù, sort giảm dần theo ngày, phân trang vẫn hoạt động đúng ([[003-history-pagination]]).

## 6. Edge Cases & Risks
- Gửi `date` sai định dạng (không parse được) → 400, không crash server.
- Gửi `date` là chuỗi rỗng → coi như thiếu, dùng mặc định hôm nay (không lỗi).
