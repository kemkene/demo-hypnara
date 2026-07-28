# Plan: Login đơn giản + Lưu lịch sử thói quen cho AI prompt
**Based on:** specs/001-login-habit-history/spec.md | **Status:** Approved

## 1. Technical Approach
Giữ nguyên triết lý "zero dependency" của project: dùng `fs` để đọc/ghi 2 file JSON làm "DB" (`data/users.json`, `data/habits.json`). Auth siêu tối giản: cookie plaintext chứa username, set qua header `Set-Cookie`, đọc lại qua parse header `Cookie` (không dùng lib). Không hash password, không ký cookie — đúng scope demo giảng dạy đã chốt trong spec.

Server hiện là 1 file `server.js` dùng `http.createServer` với if/else theo `req.url`. Sẽ mở rộng theo pattern đang có (thêm nhánh route), không refactor sang router/framework.

## 2. Architecture Changes
- `server.js` — thêm:
  - helpers: `readJSON(file, fallback)`, `writeJSON(file, data)`, `parseCookies(req)`, `getSessionUser(req)`.
  - routes mới: `POST /api/register`, `POST /api/login`, `POST /api/logout`, `GET /api/me`, `POST /api/habits`, `GET /api/habits`.
  - sửa `POST /api/suggest`: check session, lấy lịch sử 7 ngày qua `readJSON`, gộp vào `buildUserPrompt`.
- `data/` — thư mục mới chứa `users.json`, `habits.json` (tạo lazy nếu chưa tồn tại). Thêm `.gitignore` nếu project chưa có (tránh commit data thật).
- `public/index.html` — thêm khối UI login/register (ẩn/hiện bằng JS, không router phía client), khối hiển thị lịch sử ngắn.
- Không thêm file mới ngoài các mục trên (giữ ít file theo ponytail).

## 3. Component Design
**server.js**
- `readJSON(filePath, fallback)`: đọc file, nếu không tồn tại/parse lỗi → trả `fallback`.
- `writeJSON(filePath, data)`: `fs.writeFileSync` với `JSON.stringify(data, null, 2)`.
- `parseCookies(req)`: parse header `Cookie: a=1; b=2` → object.
- `getSessionUser(req)`: `parseCookies(req).session || null`.
- `requireAuth(req, res)`: helper trả về username hoặc tự viết 401 JSON và trả `null` cho caller biết để `return`.
- `todayStr()`: `new Date().toISOString().slice(0,10)`.
- `buildUserPrompt` — thêm tham số `history` (mảng bản ghi cũ), format thêm đoạn "Lịch sử N ngày gần nhất: ...".
- `fallbackSuggestions` — không cần đổi (rule-based vẫn chỉ dựa hôm nay, đủ cho demo).

**public/index.html**
- Thêm `<div id="authScreen">` (form login/register, toggle bằng 1 nút "Chưa có tài khoản? / Đã có tài khoản?").
- Thêm `<div id="appScreen" style="display:none">` bọc quanh form thói quen hiện có + thêm header hiện `Xin chào, {username}` + nút "Đăng xuất".
- Thêm khối `<div id="historyList">` hiển thị vài ngày gần nhất sau khi submit hoặc khi load trang (gọi `/api/habits`).
- JS: gọi `/api/me` khi load trang để quyết định hiện `authScreen` hay `appScreen`.

## 4. Dependencies & Risks
- Không thêm dependency nào (đúng yêu cầu).
- Risk: cookie không ký → user có thể tự sửa cookie giả làm người khác. Đã chấp nhận trong spec (demo, không bảo mật). Ghi 1 comment `ponytail:` trong code nêu rõ giới hạn này + hướng nâng cấp (session token ký, hash password) để giảng viên có thể trích dẫn khi dạy.
- Risk: ghi file đồng thời — bỏ qua (spec đã chấp nhận), không cần lock file.

## 5. Test Strategy
Không có test framework trong project (zero dependency). Theo rule "Non-trivial logic → 1 runnable check": viết 1 script nhỏ thủ công bằng `curl` để verify luồng chính (register → login → post habit → suggest có history) chạy qua, không cần file test riêng lưu lại lâu dài — chạy tay khi implement xong.

## 6. Implementation Order
- Step 1: Thêm JSON storage helpers + `data/` dir + `.gitignore`.
- Step 2: Route auth (`register`, `login`, `logout`, `me`).
- Step 3: Route habits (`POST/GET /api/habits`), sửa `/api/suggest` để yêu cầu auth + gộp lịch sử vào prompt.
- Step 4: Frontend — auth screen, gate app screen, hiển thị lịch sử.
- Step 5: Verify tay bằng curl + browser, cập nhật README (ghi chú Buổi 8 giờ có thể nói về dữ liệu ĐÃ lưu thật).
