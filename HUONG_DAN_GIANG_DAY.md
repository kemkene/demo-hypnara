# 📘 HƯỚNG DẪN GIẢNG DẠY & PHÂN TÍCH MÃ NGUỒN HYPNARA DEMO
> **Dành cho Giáo viên & Học sinh / Sinh viên học Lập trình Web Fullstack (Next.js 14, TypeScript, React, PostgreSQL, AI Integration, Timezone Engineering, Unit Testing & Docker)**

---

## 1. Tổng Quan Kiến Trúc Dự Án (Architecture Overview)

Dự án **Hypnara** được xây dựng theo kiến trúc **Fullstack Next.js App Router** hiện đại với khả năng chịu lỗi cao (Fault Tolerance) và xử lý thời gian chuẩn xác:

```
[Trình duyệt Web (Client)]
       │
       ├── (1) Render React UI Components (Overview, Habits, Motivation, OCR, Chat, Reminder)
       │
       ├── (2) Lắng nghe Web Notifications API & Native In-App Reminder Banner
       │
       ├── (3) Gọi REST API Route (/api/habits, /api/suggest, /api/chat...)
       │
       ▼
[Next.js Backend Server (App Router)]
       │
       ├── (4) Xử lý Session Cookies & Validation (lib/auth.ts)
       │
       ├── (5) Chuẩn hóa Múi giờ Việt Nam UTC+7 & Lịch số học (lib/date.ts)
       │
       ├── (6) Truy vấn / Cập nhật PostgreSQL Database Pool (lib/db.ts)
       │
       ├── (7) Tính điểm Sleep Score & Phân loại Badge (lib/scoring.ts)
       │
       └── (8) Điều phối AI: DeepSeek API ⇄ Rule-Based Offline Engine (lib/deepseek.ts & lib/fallback-ai.ts)
```

---

## 2. Cấu Trúc Thư Mục & Vai Trò Các Thành Phần

```text
hypnara-demo/
├── app/                          # Cấu trúc App Router của Next.js 14
│   ├── page.tsx                  # Trang Single Page Application (SPA) chính
│   ├── layout.tsx                # Khung Layout dùng chung (Meta, Fonts, HTML root)
│   ├── globals.css               # Design System (Biến CSS, Dark mode, Animation, Badges)
│   └── api/                      # 14 REST API Route Handlers
│       ├── habits/               # API lấy/lưu nhật ký thói quen (phân trang)
│       │   └── yesterday/        # API copy nhanh thói quen ngày hôm qua
│       ├── overview/             # API tính điểm Sleep Score & phân tích tương quan
│       ├── suggest/              # API phân tích AI (chỉ nhận hôm nay - Spec FR-005)
│       ├── chat/                 # API trợ lý AI trò chuyện 24/7 (hỗ trợ offline)
│       ├── motivation/           # API huy hiệu thành tích & chuỗi streak
│       │   └── ai-letter/        # API sinh thư động lực cá nhân hóa (10 ngày)
│       ├── commitments/          # API tạo cam kết hành động & validate ngày
│       │   └── [id]/checkin/     # API điểm danh cam kết (chặn gian lận trước hạn)
│       ├── profile/              # API lưu mục tiêu lớn & giờ nhắc nhở (reminder_time)
│       ├── export/               # API xuất dữ liệu ra file CSV
│       └── auth/                 # API đăng nhập / đăng ký / đăng xuất / me
├── components/                   # Các React Component giao diện UI
│   ├── Navbar.tsx                # Thanh điều hướng & trạng thái tài khoản
│   ├── OverviewTab.tsx           # Màn hình Tổng quan (Score Gauge, 6 Metrics, cấp quyền Web Push)
│   ├── HabitsTab.tsx             # Màn hình Nhập nhật ký (chặn gợi ý AI ngày quá khứ)
│   ├── MotivationTab.tsx         # Màn hình Động lực (Badges, Commitments theo hạn, AI Letter)
│   ├── OCRTab.tsx                # Màn hình Quét OCR ảnh chụp Screen Time
│   ├── AIChatDrawer.tsx          # Khung trò chuyện Trợ lý AI nổi
│   ├── ReminderBanner.tsx        # Banner & Web Notification nhắc nhở đi ngủ đúng giờ
│   ├── AuthModal.tsx             # Hộp thoại Đăng nhập / Đăng ký
│   └── dashboard/
│       └── TrendChart.tsx        # Biểu đồ cột ghép SVG hiện đại (3 cột, dải chuẩn WHO, bộ lọc)
├── lib/                          # Các Module xử lý nghiệp vụ chung (Backend Helpers)
│   ├── db.ts                     # Kết nối PostgreSQL Pool & Khởi tạo Schema
│   ├── auth.ts                   # Quản lý Cookie Session & Validate dữ liệu đầu vào
│   ├── date.ts                   # Chuẩn hóa múi giờ VN (UTC+7) & tính streak độc lập
│   ├── scoring.ts                # Thuật toán tính điểm Sleep Score (30–99 hoặc null)
│   ├── deepseek.ts               # Điều phối DeepSeek API & hằng số HISTORY_DAYS = 10
│   ├── fallback-ai.ts            # Rule-Based AI Offline Engines (Gợi ý, Chat, Thư)
│   └── notification.ts           # Động cơ chuông Web Audio (E5 ➔ B5) & Web Notification
├── tests/                        # 6 Bộ Unit Test Suites (28 tests, 100% PASS)
│   ├── date.test.ts              # Kiểm tra múi giờ VN, addDays, calculateStreak
│   ├── validation.test.ts        # Kiểm tra validation form thói quen
│   ├── sleep-score.test.ts       # Kiểm tra thuật toán Sleep Score & phân loại badge
│   ├── commitments.test.ts       # Kiểm tra ràng buộc ngày cam kết & chống gian lận
│   ├── fallback-ai.test.ts       # Kiểm tra rule-based suggestion, chat, letter (kèm test 0 ngày)
│   └── spec-compliance.test.ts   # Kiểm tra HISTORY_DAYS = 10 & spec FR-005
├── Dockerfile                    # Cấu hình đóng gói Container Docker
├── docker-compose.yml            # Dịch vụ Web App (Node 22) + Database (Postgres 16)
└── package.json                  # Quản lý dependencies & scripts (test, build, dev)
```

---

## 3. Phân Tích Chi Tiết Mã Nguồn Cho Bài Giảng

### 🔹 Bài 1: Xử Lý Múi Giờ Lịch & Tính Chuỗi Kỷ Luật (Streak) (`lib/date.ts`)

**Khái niệm học sinh cần nắm:**
1. **Lỗi lệch ngày do UTC**: Server chạy Cloud thường đặt timezone là UTC. Nếu dùng `new Date().toISOString().slice(0, 10)` ở Việt Nam (UTC+7), từ 00:00 đến 06:59 sáng, server vẫn trả về ngày "hôm qua". Người dùng thức dậy lúc 6h sáng nhập liệu sẽ bị chặn với lỗi "không thể nhập ngày tương lai".
2. **Giải pháp với `Intl.DateTimeFormat`**: Ép cố định timezone `Asia/Ho_Chi_Minh` để lấy ngày chuẩn.
3. **Phép cộng trừ ngày thuần số học (`addDays`)**: Sử dụng mốc thời gian UTC midnight để bước qua ranh giới tháng/năm/năm nhuận mà không bị co giãn múi giờ.
4. **Thuật toán tính Streak độc lập**: Kiểm tra ngày hôm nay; nếu đã nhập thì tính từ hôm nay, nếu chưa nhập thì tính từ hôm qua lùi dần về trước.

```typescript
// lib/date.ts
export const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

export function todayStr(tz: string = VIETNAM_TIMEZONE): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function calculateStreak(dates: Set<string>, today: string = todayStr()): number {
  if (dates.size === 0) return 0;
  let streak = 0;
  let checkStr = today;

  if (!dates.has(checkStr)) {
    checkStr = addDays(checkStr, -1);
  }

  while (dates.has(checkStr)) {
    streak++;
    checkStr = addDays(checkStr, -1);
  }

  return streak;
}
```

---

### 🔹 Bài 2: Kết nối PostgreSQL Connection Pool & Schema Migrations (`lib/db.ts`)

**Khái niệm học sinh cần nắm:**
- Connection Pooling tái sử dụng kết nối.
- Parse kiểu `DATE` (1082) nguyên dạng chuỗi để tránh việc thư viện tự convert sang múi giờ local bị lệch.

```typescript
// lib/db.ts
import { Pool, types } from 'pg';

types.setTypeParser(1082, (val: string) => val);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://hypnara:hypnara@localhost:5432/hypnara',
});
```

---

### 🔹 Bài 3: Kiến Trúc AI Chịu Lỗi (Graceful Degradation & Rule-Based Fallback) (`lib/fallback-ai.ts` & `lib/deepseek.ts`)

**Khái niệm học sinh cần nắm:**
1. **Single Point of Failure (SPOF)**: Nếu code trực tiếp gọi DeepSeek API mà không có fallback, khi mất mạng, hết hạn ngạch (quota) hoặc người dùng chưa điền `DEEPSEEK_API_KEY`, ứng dụng sẽ sập với lỗi HTTP 500.
2. **Kiến trúc Graceful Degradation**: Khi API bên ngoài gặp sự cố, hệ thống tự động giáng cấp xuống module Rule-Based Offline để tiếp tục phục vụ người dùng trơn tru 100%.
3. **Spec Compliance**:
   - **Spec 003 FR-002**: Lịch sử đưa vào prompt AI giới hạn đúng `HISTORY_DAYS = 10`.
   - **Spec 004 FR-005**: Gợi ý AI chỉ áp dụng cho "Hôm nay", từ chối ngày quá khứ.

```typescript
// lib/deepseek.ts
export const HISTORY_DAYS = 10;

export async function getAiSuggestion(currentHabits, habitHistory, userProfile) {
  if (DEEPSEEK_API_KEY) {
    try {
      // Thử gọi DeepSeek API thật...
      return { suggestion: await callDeepSeekAPI(messages), isOffline: false };
    } catch (err) {
      console.warn('[Hypnara AI] Chuyển hướng sang engine rule-based offline:', err.message);
    }
  }

  // Tự động kích hoạt Rule-Based Offline Engine
  const suggestion = generateRuleBasedSuggestion(currentHabits, habitHistory, userProfile);
  return { suggestion, isOffline: true };
}
```

---

### 🔹 Bài 4: Thuật Toán Tính Điểm Sleep Score Chuẩn Y Khoa (`lib/scoring.ts`)

**Khái niệm học sinh cần nắm:**
- **Xử lý giá trị thiếu (Missing Data vs Worst Case)**: Nếu 7 ngày qua người dùng chưa nhập giờ ngủ, không được ép về điểm 0 (gây hiểu nhầm là sức khỏe cực kỳ tệ), mà phải trả về `null` kèm nhãn `"Chưa có dữ liệu"`.
- Trọng số phạt (penalties) dựa trên nghiên cứu y học giấc ngủ:
  - Thiếu ngủ (< 7h): phạt 12 điểm mỗi giờ thiếu.
  - Thừa ngủ (> 9h): phạt 6 điểm mỗi giờ thừa.
  - Screen Time (> 6h): phạt 4 điểm mỗi giờ vượt.
  - Game Time (> 3h): phạt 5 điểm mỗi giờ vượt.
  - Không tắt máy trước ngủ (< 15p): phạt 10 điểm.
  - Vận động thể chất (>= 30p): thưởng giảm 5 điểm phạt; (< 20p): phạt 8 điểm.

---

### 🔹 Bài 5: Ràng Buộc Nghiệp Vụ & Toàn Vẹn Dữ Liệu Cam Kết Hành Động (`app/api/commitments`)

**Khái niệm học sinh cần nắm:**
- **Chống gian lận Gamification**: Người dùng không thể tạo cam kết vào ngày tuần sau rồi bấm "Đã làm" ngay hôm nay để lấy tỷ lệ hoàn thành 100%.
- Kiểm tra `commitment.target_date <= todayStr()`.
- Chống spam đảo trạng thái cam kết đã hoàn thành.

---

### 🔹 Bài 6: Tự Động Hóa Kiểm Thử Phần Mềm (Unit Testing với Node.js Runner & TSX)

**Khái niệm học sinh cần nắm:**
- Viết Unit Test độc lập không cần khởi động toàn bộ server.
- Sử dụng thư viện chuẩn `node:test` và `node:assert/strict`.
- Chạy 28 test cases bao phủ toàn bộ logic rủi ro cao:
  ```bash
  npm test
  ```

---

### 🔹 Bài 7: Trực Quan Hóa Dữ Liệu Thuần SVG & Động Cơ Chuông Web Audio API (`components/dashboard/TrendChart.tsx` & `lib/notification.ts`)

**Khái niệm học sinh cần nắm:**
- **Vẽ đồ họa bằng toán học thuần SVG**: Cách dùng SVG `<rect>`, `<line>`, `<defs>`, `<linearGradient>` để tự tạo biểu đồ cột ghép đa chỉ số với dải chuẩn WHO mà không cần thêm thư viện Chart cồng kềnh.
- **Sắp xếp theo trục thời gian tăng dần (Chronological ASC)**: Dùng `localeCompare` để đảm bảo dữ liệu luôn hiển thị tuần tự từ ngày cũ đến ngày mới nhất.
- **Tổng hợp âm thanh bằng Web Audio API**: Khởi tạo `AudioContext`, tạo 2 bộ dao động sóng sin (`OscillatorNode`) ở tần số $E_5 (659Hz)$ và $B_5 (987Hz)$, điều biến âm lượng qua `GainNode.exponentialRampToValueAtTime`. Kỹ thuật này giúp phát chuông đôi êm dịu mà không phụ thuộc vào bất kỳ file `.mp3` nào từ bên ngoài.

---

### 🔹 Bài 8: Đồng Bộ Trạng Thái Thời Gian Thực (Reactive State Sync) & Cô Lập Lỗi Trình Duyệt

**Khái niệm học sinh cần nắm:**
- **State Versioning Pattern (`dataVersion`)**: Giải quyết bài toán "Lưu dữ liệu ở Tab A nhưng Tab B vẫn giữ số liệu cũ". Bằng cách dùng biến phiên bản `dataVersion` trong Single Page Application (SPA), mọi hành động Lưu thói quen, Điểm danh hay Đổi mục tiêu đều lập tức kích hoạt làm mới số liệu ở tất cả các tab khác mà không cần người dùng bấm F5.
- **Cô lập lỗi tiện ích trình duyệt (Extension Isolation)**: Lắng nghe ở tầng `<head>` để chặn (`stopImmediatePropagation`) các lỗi ném ra từ script của Chrome extension bên thứ ba (như Urban VPN, MetaMask...), bảo vệ Next.js Dev Error Overlay không bị kích hoạt nhầm lẫn.

---

## 4. Câu Hỏi Thảo Luận & Bài Tập Thực Hành Cho Học Sinh

1. **Bài tập 1 (Backend - Múi giờ)**: Viết test case mô phỏng người dùng ở múi giờ Tokyo (UTC+9) hoặc New York (UTC-5) nhập liệu lúc nửa đêm xem streak có bị lệch không.
2. **Bài tập 2 (AI Engine - Nâng cao)**: Bổ sung thêm quy tắc phân tích mối tương quan giữa điểm tâm trạng (Mood Score 1-5) và số lần cầm máy (Phone Pickups) vào `lib/fallback-ai.ts`.
3. **Bài tập 3 (Frontend - Web Audio)**: Thử nghiệm thay đổi tần số dao động trong `lib/notification.ts` để tạo hợp âm 3 nốt (ví dụ: Đô - Mi - Sol) cho thông báo chúc mừng hoàn thành chuỗi kỷ luật 7 ngày.
