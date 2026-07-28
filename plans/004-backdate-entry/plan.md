# Plan: Chọn ngày khi nhập thói quen
**Based on:** specs/004-backdate-entry/spec.md | **Status:** Approved

## 1. Technical Approach
Thêm 1 input `date` vào form + payload. Server dùng `date` từ body nếu hợp lệ, fallback `todayStr()` nếu thiếu. Validate bằng regex `YYYY-MM-DD` đơn giản + so sánh chuỗi với `todayStr()` (so sánh string ISO ngày là đủ, không cần parse Date phức tạp vì cùng định dạng). Frontend quyết định có gọi `/api/suggest` hay không dựa trên so sánh ngày chọn với ngày hôm nay (tính ở client bằng `new Date().toISOString().slice(0,10)`).

## 2. Architecture Changes
- `server.js`:
  - Thêm hàm `isValidDateStr(s)` (regex `YYYY-MM-DD` + không tương lai so với `todayStr()`).
  - Route `POST /api/habits`: đọc `input.date`, validate qua `isValidDateStr`, dùng thay `todayStr()` khi hợp lệ; nếu field có mặt nhưng không hợp lệ → 400.
- `public/index.html`:
  - Thêm `<input type="date" id="entryDate">` vào `habitForm`, set `value`/`max` = hôm nay lúc load.
  - Sửa handler submit: đọc `entryDate`, so sánh với hôm nay để quyết định luồng (gọi thêm `/api/suggest` hay chỉ lưu + hiện thông báo).

## 3. Component Design
- `isValidDateStr(s)`:
  ```js
  function isValidDateStr(s) {
    return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && s <= todayStr();
  }
  ```
- `POST /api/habits` handler: `const date = isValidDateStr(input.date) ? input.date : (input.date ? null : todayStr());` — nếu `date` là `null` (có gửi nhưng sai) → trả 400 `{error: "Ngay khong hop le"}`.
- Frontend submit handler:
  ```js
  const entryDate = document.getElementById("entryDate").value || todayClientStr();
  const isToday = entryDate === todayClientStr();
  // luon POST /api/habits voi { ...payload, date: entryDate }
  // chi POST /api/suggest + hien ket qua neu isToday, nguoc lai hien thong bao "Da luu du lieu cho ngay {entryDate}"
  ```
- `result` card: thêm nhánh render khác khi không phải hôm nay (ẩn `sourceTag`, đổi text `suggestionBox` thành xác nhận lưu).

## 4. Dependencies & Risks
- Không thêm dependency.
- Risk: nếu người dùng để trống ô ngày → JS lấy `.value` rỗng, cần fallback về hôm nay ở cả client và server (đã có ở FR-002/thiết kế trên).

## 5. Test Strategy
Verify tay: curl `POST /api/habits` với `date` hợp lệ quá khứ, ngày tương lai (expect 400), ngày sai định dạng (expect 400), thiếu field (expect dùng hôm nay). Verify UI: chọn ngày quá khứ → không thấy gọi `/api/suggest` (check Network tab hoặc chỉ dựa vào response UI), chọn hôm nay → luồng cũ y nguyên.

## 6. Implementation Order
- Step 1: Server — `isValidDateStr` + sửa `POST /api/habits`.
- Step 2: Frontend — input ngày + logic rẽ nhánh submit.
- Step 3: Verify tay (curl + browser).
