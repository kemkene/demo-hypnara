# 📑 TÀI LIỆU KỸ THUẬT DỰ ÁN HYPNARA DEMO
> **Hệ Thống Phân Tích Giấc Ngủ & Quản Lý Kỷ Luật Kỹ Thuật Số (AI Sleep & Digital Wellbeing Coach)**  
> **Phiên bản:** 2.0.0 | **Framework:** Next.js 14 App Router | **Ngôn ngữ:** TypeScript | **Cơ sở dữ liệu:** PostgreSQL 16

---

## 1. Tổng Quan Kiến Trúc Hệ Thống (System Architecture)

Hệ thống Hypnara được xây dựng theo mô hình **Monolithic hiện đại dựa trên Next.js App Router**, tích hợp Server-Side Route Handlers, Client Components và Tầng trung gian AI linh hoạt:

```mermaid
graph TD
    Client["Trình duyệt (React Client Components)"]
    SW["Web Notifications API & Timer Listener"]
    Router["Next.js App Router (Server-side API Handlers)"]
    DateLib["Date & Timezone Engine (Asia/Ho_Chi_Minh)"]
    ScoreLib["Sleep Score Engine (lib/scoring.ts)"]
    DBPool["PostgreSQL Connection Pool (pg)"]
    Postgres[("PostgreSQL 16 Database")]
    AIOrchestrator["AI Orchestrator (lib/deepseek.ts)"]
    DeepSeekAPI["DeepSeek Chat API (Cloud)"]
    OfflineAI["Rule-Based Offline Engine (lib/fallback-ai.ts)"]

    Client --> Router
    SW --> Client
    Router --> DateLib
    Router --> ScoreLib
    Router --> DBPool
    DBPool --> Postgres
    Router --> AIOrchestrator
    AIOrchestrator -->|Có API Key & Online| DeepSeekAPI
    AIOrchestrator -->|Thiếu Key / Lỗi mạng| OfflineAI
```

### Các nguyên lý thiết kế then chốt:
1. **Khả năng chịu lỗi cao (Fault Tolerance & Graceful Degradation):** Tuyệt đối không để sự cố mạng hay việc thiếu cấu hình API Key của bên thứ ba làm sập ứng dụng (HTTP 500). Hệ thống luôn có tầng Rule-Based Offline dự phòng.
2. **Tính đúng đắn về thời gian (Temporal Correctness):** Toàn bộ logic lịch và ngày tháng được cố định theo múi giờ `Asia/Ho_Chi_Minh` (UTC+7), không bị ảnh hưởng bởi múi giờ UTC của server hay container Docker.
3. **Tuân thủ đặc tả kỹ thuật (Spec Compliance):** Mọi endpoint tuân thủ chặt chẽ các điều kiện trong tài liệu `specs/` (ví dụ: giới hạn 10 ngày cho prompt AI, cấm gọi gợi ý AI cho ngày quá khứ).

---

## 2. Thiết Kế Cơ Sở Dữ Liệu (Database Schema)

Hệ thống sử dụng PostgreSQL với cơ chế tự động khởi tạo và nâng cấp schema (Migration on Startup) tại [lib/db.ts](file:///Users/truongcon/Desktop/hypnara-demo/lib/db.ts).

### 2.1. Bảng `users` (Quản lý tài khoản)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `username` | `TEXT` | `PRIMARY KEY` | Tên đăng nhập duy nhất |
| `password` | `TEXT` | `NOT NULL` | Mật khẩu xác thực |

### 2.2. Bảng `habits` (Nhật ký thói quen hàng ngày)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Định danh bản ghi |
| `username` | `TEXT` | `REFERENCES users(username)` | Người sở hữu |
| `date` | `DATE` | `NOT NULL` | Ngày ghi nhận (YYYY-MM-DD) |
| `sleep_hours` | `TEXT` | Khả dụng `NULL` | Thời lượng ngủ (giờ) |
| `screen_time` | `TEXT` | Khả dụng `NULL` | Thời gian dùng màn hình (giờ) |
| `game_time` | `TEXT` | Khả dụng `NULL` | Thời gian chơi game (giờ) |
| `exercise_minutes`| `TEXT` | Khả dụng `NULL` | Thời gian vận động thể chất (phút) |
| `phone_cutoff_mins`| `INTEGER` | Khả dụng `NULL` | Thời gian tắt máy trước khi ngủ (phút) |
| `phone_pickups` | `INTEGER` | Khả dụng `NULL` | Số lần cầm máy trong ngày |
| `top_app` | `TEXT` | Khả dụng `NULL` | Ứng dụng dùng nhiều nhất |
| `mood_score` | `INTEGER` | `1 <= mood_score <= 5` | Điểm tâm trạng (thang 1 - 5) |
| `mood_note` | `TEXT` | Khả dụng `NULL` | Ghi chú sinh hoạt, cảm xúc |
| `schedule` | `TEXT` | Khả dụng `NULL` | Lịch trình học tập / làm việc |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT now()` | Thời điểm tạo bản ghi |
| **Ràng buộc:** | `UNIQUE (username, date)` | Đảm bảo mỗi người chỉ có 1 bản ghi/ngày, hỗ trợ UPSERT |

### 2.3. Bảng `action_commitments` (Cam kết hành động)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Định danh cam kết |
| `username` | `TEXT` | `REFERENCES users(username)` | Người sở hữu |
| `title` | `TEXT` | `NOT NULL` | Nội dung cam kết |
| `target_date` | `DATE` | `NOT NULL` | Ngày đến hạn hoàn thành cam kết |
| `completed` | `BOOLEAN` | Khả dụng `NULL` | Trạng thái: `true` (đã làm), `false` (chưa), `null` (mới tạo) |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT now()` | Thời điểm tạo |

### 2.4. Bảng `user_profiles` (Mục tiêu & Giờ nhắc nhở)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `username` | `TEXT` | `PRIMARY KEY REFERENCES users` | Người dùng |
| `primary_goal` | `TEXT` | Khả dụng `NULL` | Mục tiêu cải thiện lớn |
| `reminder_time` | `TEXT` | `DEFAULT '22:00'` | Khung giờ nhắc nhở (HH:mm) |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT now()` | Thời điểm cập nhật |

---

## 3. Động Cơ Xử Lý Thời Gian & Múi Giờ (`lib/date.ts`)

### 3.1. Phân tích bài toán
- Trình duyệt và Server chạy Docker/Cloud thường có múi giờ khác nhau (Server thường là UTC, trong khi người dùng ở Việt Nam là UTC+7).
- Nếu sử dụng `new Date().toISOString().slice(0, 10)`, khoảng thời gian từ `00:00:00` đến `06:59:59` giờ Việt Nam sẽ bị coi là ngày hôm trước.
- **Hệ quả nếu không xử lý:**
  1. Người dùng nhập dữ liệu buổi sáng bị chặn với lỗi "không được nhập ngày tương lai".
  2. Chuỗi kỷ luật (Streak) bị đứt gãy hoặc lệch 1 ngày quanh nửa đêm.
  3. API `/api/habits/yesterday` lấy sai dữ liệu thành ngày hôm kia.

### 3.2. Giải pháp kỹ thuật trong `lib/date.ts`
- **Hàm `todayStr(tz = 'Asia/Ho_Chi_Minh')`:**
  Sử dụng `Intl.DateTimeFormat` chuẩn `en-CA` (định dạng chuẩn YYYY-MM-DD) với timezone cố định `Asia/Ho_Chi_Minh`.
- **Hàm `addDays(dateStr, days)`:**
  Tách các thành phần năm, tháng, ngày rồi khởi tạo đối tượng `Date(Date.UTC(y, m - 1, d))`, sau đó dùng `setUTCDate` để cộng trừ ngày. Phương pháp này loại trừ hoàn toàn rủi ro sai lệch do Daylight Saving Time (DST) hoặc local timezone offset.
- **Hàm `calculateStreak(dates, today)`:**
  Kiểm tra ngày `today`. Nếu đã nhập thì gán mốc kiểm tra là `today` và tăng streak; nếu chưa nhập thì lùi mốc kiểm tra về `yesterday` (vẫn giữ chuỗi nếu hôm qua có nhập). Sau đó dùng vòng lặp `while (dates.has(checkStr))` lùi từng ngày một bằng `addDays(checkStr, -1)`.

---

## 4. Tầng AI & Cơ Chế Dự Phòng (AI Orchestration & Offline Engine)

### 4.1. Luồng điều phối thông minh ([lib/deepseek.ts](file:///Users/truongcon/Desktop/hypnara-demo/lib/deepseek.ts))
Khi client gọi các tính năng AI, hệ thống thực thi qua pipeline sau:
1. Kiểm tra biến môi trường `DEEPSEEK_API_KEY`:
   - Nếu có key: Đóng gói System Prompt và User Context, gọi tới `https://api.deepseek.com/chat/completions` với timeout và temperature 0.7.
   - Nếu gọi API thành công: Trả về kết quả với cờ `isOffline: false`.
2. Nếu không có key, hoặc nếu DeepSeek API trả về mã lỗi (401, 429, 503...) hoặc lỗi kết nối:
   - Ghi nhật ký cảnh báo `console.warn`.
   - Tự động kích hoạt hàm sinh nội dung tương ứng từ [lib/fallback-ai.ts](file:///Users/truongcon/Desktop/hypnara-demo/lib/fallback-ai.ts).
   - Trả về phản hồi cho client với cờ `isOffline: true`.
3. Client luôn nhận được HTTP status `200` với nội dung chuẩn cấu trúc.

### 4.2. Các Engine Rule-Based trong [lib/fallback-ai.ts](file:///Users/truongcon/Desktop/hypnara-demo/lib/fallback-ai.ts)
- **`generateRuleBasedSuggestion(current, history, profile)`**:
  - Phân tích 7 chỉ số hành vi y khoa (thời lượng ngủ, screen time, game time, pre-bed cutoff, thể thao, pickups, mood).
  - Trả về định dạng HTML chuẩn: Phân tích điểm sáng/nguy cơ, 3 hành động cụ thể cho hôm nay, lời chúc/lời khuyên bế mạc.
- **`generateRuleBasedChat(messages, habits, profile, username)`**:
  - Sử dụng Regex biên từ `\b(hi|hello|hey)\b` và phân loại chủ đề (mất ngủ, khó ngủ, screen time, điện thoại, vận động, điểm số).
  - Trả về tư vấn súc tích dưới 200 từ dựa trên khuyến nghị của Sleep Foundation & Matthew Walker.
- **`generateRuleBasedMotivationalLetter(username, profile, habits)`**:
  - Sinh thư cá nhân hóa độ dài 250 - 350 từ dẫn chứng mục tiêu cá nhân, số ngày tham gia và thời lượng ngủ trung bình của học viên.

---

## 5. Thuật Toán Nghiệp Vụ Cốt Lõi

### 5.1. Thuật toán Sleep Score ([lib/scoring.ts](file:///Users/truongcon/Desktop/hypnara-demo/lib/scoring.ts))
Điểm Sleep Score nằm trong khoảng từ **30 đến 99**.

$$\text{Base Score} = 100$$
$$\text{Penalties} = P_{\text{sleep}} + P_{\text{screen}} + P_{\text{game}} + P_{\text{cutoff}} + P_{\text{exercise}}$$

Chi tiết cách tính điểm phạt:
1. **Thời lượng ngủ ($P_{\text{sleep}}$)**:
   - Nếu $\text{avgSleep} < 7.0\text{h}$: $P_{\text{sleep}} = (7.0 - \text{avgSleep}) \times 12$
   - Nếu $\text{avgSleep} > 9.0\text{h}$: $P_{\text{sleep}} = (\text{avgSleep} - 9.0) \times 6$
2. **Screen Time ($P_{\text{screen}}$)**:
   - Nếu $\text{avgScreen} > 6.0\text{h}$: $P_{\text{screen}} = (\text{avgScreen} - 6.0) \times 4$
3. **Game Time ($P_{\text{game}}$)**:
   - Nếu $\text{avgGame} > 3.0\text{h}$: $P_{\text{game}} = (\text{avgGame} - 3.0) \times 5$
4. **Tắt máy trước ngủ ($P_{\text{cutoff}}$)**:
   - Nếu $\text{avgCutoff} < 15\text{ phút}$: $P_{\text{cutoff}} = 10$
5. **Vận động thể chất ($P_{\text{exercise}}$)**:
   - Nếu $\text{avgExercise} < 20\text{ phút}$: Phạt $+8$ điểm
   - Nếu $\text{avgExercise} \ge 30\text{ phút}$: Thưởng giảm $-5$ điểm phạt
6. **Xử lý đặc biệt khi chưa có dữ liệu:**
   - Nếu `countSleep === 0` (7 ngày qua chưa nhập giờ ngủ), hàm trả về `null`. Giao diện hiển thị `--` và badge `"Chưa có dữ liệu"`.

### 5.2. Ràng buộc Action Commitments
- **Tạo mới:** `targetDate` phải đúng định dạng `YYYY-MM-DD`, không được chọn ngày quá khứ (`targetDate >= todayStr()`), và không được vượt quá 90 ngày tới.
- **Điểm danh (`checkin`):**
  - Nếu `commitment.target_date > todayStr()`: Bị chặn với lỗi `400` ("Chưa đến ngày thực hiện cam kết").
  - Nếu `commitment.completed === true` và gửi yêu cầu hủy: Bị chặn với lỗi `400` để đảm bảo tính bất biến của dữ liệu kỷ luật.

---

## 6. Danh Mục REST API Handlers

| Endpoint | Method | Chức năng | Tham số / Payload chính | Mã trả về |
| :--- | :---: | :--- | :--- | :--- |
| `/api/register` | `POST` | Đăng ký tài khoản | `{ username, password }` | 200, 400, 409 |
| `/api/login` | `POST` | Đăng nhập hệ thống | `{ username, password }` | 200, 400, 401 |
| `/api/logout` | `POST` | Đăng xuất, xóa session | Không | 200 |
| `/api/me` | `GET` | Kiểm tra session hiện tại | Không | 200, 401 |
| `/api/habits` | `GET` | Lấy lịch sử thói quen phân trang | Query: `page`, `pageSize` (tối đa 50) | 200, 401 |
| `/api/habits` | `POST` | Lưu nhật ký thói quen | `{ date, sleepHours, screenTime... }` | 200, 400, 401 |
| `/api/habits/yesterday`| `GET` | Lấy dữ liệu ngày hôm qua | Không | 200, 401 |
| `/api/overview` | `GET` | Dữ liệu tổng quan, Sleep Score, charts | Không | 200, 401 |
| `/api/suggest` | `POST` | Phân tích gợi ý AI (Spec FR-005) | `{ date?: todayStr, sleepHours... }` | 200, 400, 401 |
| `/api/chat` | `POST` | Trò chuyện với trợ lý AI | `{ messages: [...] }` | 200, 401 |
| `/api/motivation` | `GET` | Lấy streak, huy hiệu, cam kết | Không | 200, 401 |
| `/api/motivation/ai-letter`| `POST`| Sinh thư động lực cá nhân hóa | Không | 200, 401 |
| `/api/commitments` | `GET` | Danh sách cam kết hành động | Không | 200, 401 |
| `/api/commitments` | `POST` | Tạo cam kết hành động mới | `{ title, targetDate }` | 200, 400, 401 |
| `/api/commitments/[id]/checkin`| `POST`| Điểm danh cam kết | `{ completed: boolean }` | 200, 400, 404 |
| `/api/commitments/[id]`| `DELETE`| Xóa cam kết hành động | Không | 200, 401 |
| `/api/profile` | `GET` | Lấy mục tiêu & giờ nhắc nhở | Không | 200, 401 |
| `/api/profile` | `POST` | Lưu mục tiêu & giờ nhắc nhở | `{ primaryGoal, reminderTime }` | 200, 401 |
| `/api/export` | `GET` | Xuất file CSV lịch sử | Không | 200, 401 |

---

## 7. Hệ Thống Kiểm Thử Tự Động (Unit Testing Suite)

Hệ thống sử dụng **Node.js Native Test Runner** kết hợp cùng `tsx` để thực thi trực tiếp các file TypeScript mà không cần cấu hình phức tạp:

```bash
npm test
```

### Danh mục 6 bộ Test Suites (`tests/`):
1. **`tests/date.test.ts` (5 tests):** Kiểm tra tính đúng đắn của timezone `Asia/Ho_Chi_Minh`, phép cộng trừ ngày `addDays` qua tháng nhuận/năm mới, validation ngày lịch, và thuật toán tính streak liên tục hoặc có ngắt quãng.
2. **`tests/validation.test.ts` (5 tests):** Kiểm tra các cận trên/dưới của dữ liệu đầu vào: giờ ngủ (1–18h), screen time (0–24h), game time (0–24h), vận động (0–1440p), tắt máy (0–360p), cầm máy (0–500), tâm trạng (1–5).
3. **`tests/sleep-score.test.ts` (5 tests):** Kiểm tra trả về `null` khi `countSleep === 0`, tính điểm thói quen tốt (> 85), tính phạt thói quen xấu, cận ép [30, 99], và phân loại badge.
4. **`tests/commitments.test.ts` (6 tests):** Kiểm tra validate tạo cam kết (ngày hợp lệ, cấm quá khứ, cấm > 90 ngày) và kiểm tra checkin (cấm checkin sớm trước hạn, cấm hủy cam kết đã xong).
5. **`tests/fallback-ai.test.ts` (3 tests):** Kiểm tra cấu trúc HTML gợi ý AI (có đủ 3 thẻ `<li>`), kiểm tra nhận diện từ khóa của Chat engine, và kiểm tra độ dài thư động lực (250–350 từ).
6. **`tests/spec-compliance.test.ts` (2 tests):** Kiểm tra `HISTORY_DAYS === 10` theo spec `003-history-pagination` và kiểm tra chặn ngày quá khứ trong `/api/suggest` theo spec `004-backdate-entry` FR-005.

**Kết quả thực tế:** `27/27 tests PASS (100%)`, thời gian chạy ~450ms.

---

## 8. Hướng Dẫn Triển Khai & Vận Hành (DevOps)

### 8.1. Chạy với Docker Compose
```bash
docker-compose up -d --build
```
- Container `hypnara-db`: PostgreSQL 16 Alpine, port `5432:5432`, volume `postgres_data`.
- Container `hypnara-app`: Node 22 Alpine, multi-stage build, port `3000:3000`.

### 8.2. Cấu hình biến môi trường (`.env`)
```env
DATABASE_URL=postgres://hypnara:hypnara@localhost:5432/hypnara
DEEPSEEK_API_KEY=sk-xxxxxx  # Tùy chọn (để trống vẫn chạy mượt qua Offline Fallback)
DEEPSEEK_MODEL=deepseek-chat
PORT=3000
```
