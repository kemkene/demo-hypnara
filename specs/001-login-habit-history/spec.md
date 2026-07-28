# Spec: Login đơn giản + Lưu lịch sử thói quen cho AI prompt
**Status:** Approved | Priority: P1
**Created:** 2026-07-26

## 1. Objective
Hiện tại Hypnara demo không có tài khoản, mỗi lần nhập thói quen đều là "ẩn danh" và không lưu gì (đúng như ghi chú Buổi 8 trong README). Để minh hoạ tiếp bước "cá nhân hoá theo lịch sử", cần:
- Cho phép người dùng đăng nhập bằng username/password (demo giảng dạy, **không cần bảo mật** — không hash, không mã hoá, không HTTPS-only).
- Lưu lại thói quen hàng ngày người dùng nhập vào theo từng tài khoản.
- Đưa lịch sử thói quen gần đây vào prompt gửi AI, để gợi ý phản ánh xu hướng nhiều ngày chứ không chỉ 1 lần nhập.

## 2. User Stories
- As a học viên/người dùng demo, tôi muốn đăng ký username/password đơn giản để có một danh tính riêng trong app.
- As a người dùng đã đăng nhập, tôi muốn nhập thói quen hôm nay và thấy nó được lưu lại theo tài khoản của tôi.
- As a người dùng, tôi muốn gợi ý từ AI có tính đến vài ngày gần đây (không chỉ hôm nay) để lời khuyên sát hơn.
- As giảng viên, tôi muốn chỉ ra rõ trong code đoạn "lịch sử → prompt" để minh hoạ vòng lặp cá nhân hoá (Buổi 4/8).

## 3. Functional Requirements
- FR-001: `POST /api/register` — tạo user mới với `{username, password}`, lưu plaintext vào `data/users.json`. Trùng username → lỗi 409.
- FR-002: `POST /api/login` — so khớp username/password plaintext; nếu đúng, set cookie `session=<username>` (không ký, không hash, không hạn — demo only).
- FR-003: `POST /api/logout` — xoá cookie session.
- FR-004: `GET /api/me` — trả username hiện tại dựa vào cookie, hoặc `null` nếu chưa đăng nhập.
- FR-005: `POST /api/habits` — yêu cầu đã đăng nhập; lưu 1 bản ghi thói quen hôm nay `{username, date, sleepHours, screenTime, gameTime, exerciseMinutes, mood, schedule, createdAt}` vào `data/habits.json` (append). Nếu đã có bản ghi cùng `username+date`, ghi đè (cho phép sửa lại trong ngày).
- FR-006: `GET /api/habits` — trả về N bản ghi gần nhất (mặc định 7) của user đang đăng nhập, sort theo ngày giảm dần.
- FR-007: `POST /api/suggest` — yêu cầu đã đăng nhập; lấy thêm lịch sử 7 ngày gần nhất (không tính hôm nay) của user, đưa vào user prompt gửi AI dưới dạng tóm tắt, cùng với dữ liệu hôm nay như hiện tại. *(Cập nhật 2026-07-28: đổi thành 10 bản ghi gần nhất theo yêu cầu người dùng — xem `HISTORY_DAYS` trong `server.js`.)*
- FR-008: Frontend: thêm màn hình đăng nhập/đăng ký (1 form, tab chuyển đổi) che trước form thói quen; sau khi đăng nhập hiện username + nút đăng xuất; hiện danh sách lịch sử ngắn dưới kết quả gợi ý.

## 4. Non-Functional Requirements
- Không thêm npm dependency (giữ đúng tinh thần "zero dependency, chỉ dùng Node core" của project).
- Không cần bcrypt/hash, không cần JWT, không cần HTTPS, không cần rate-limit — **đây là yêu cầu rõ ràng của người dùng cho mục đích giảng dạy**, không phải thiếu sót.
- Dữ liệu lưu trong file JSON (`data/users.json`, `data/habits.json`), thư mục `data/` được gitignore (không commit dữ liệu demo thật).
- Đơn giản, dễ đọc để giảng viên demo trực tiếp trong lớp.

## 5. Acceptance Criteria
- [ ] Đăng ký username mới → tạo được tài khoản, tự động đăng nhập.
- [ ] Đăng ký username đã tồn tại → báo lỗi rõ ràng.
- [ ] Đăng nhập đúng username/password → vào được form thói quen.
- [ ] Đăng nhập sai → báo lỗi, không vào được form.
- [ ] Nhập thói quen hôm nay khi đã đăng nhập → lưu thành công, gọi lại `/api/habits` thấy bản ghi mới.
- [ ] Nhập thói quen khi CHƯA đăng nhập → bị chặn (redirect về màn login hoặc lỗi 401).
- [ ] Gợi ý AI (hoặc fallback rule-based) phản ánh có dùng dữ liệu lịch sử (verify qua log prompt hoặc qua nội dung gợi ý nhắc tới xu hướng nhiều ngày).
- [ ] Đăng xuất → không còn truy cập được `/api/habits`, `/api/suggest`.

## 6. Edge Cases & Risks
- Không có lịch sử (user mới, lần đầu nhập) → prompt vẫn chạy bình thường, phần lịch sử ghi "chưa có dữ liệu trước đó".
- Nhập nhiều lần trong 1 ngày → ghi đè bản ghi ngày đó (không tạo duplicate), theo FR-005.
- File JSON đồng thời bị nhiều request ghi → demo scale nhỏ, chấp nhận rủi ro race-condition tối thiểu (không cần lock), ghi chú lại là điểm để thảo luận đạo đức/kỹ thuật giống ghi chú Buổi 8 sẵn có.
- Mất file `data/*.json` giữa buổi demo → chấp nhận (không cần backup), reset về trạng thái trống là ổn cho mục đích dạy.
