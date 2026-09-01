# 📘 HƯỚNG DẪN GIẢNG DẠY & PHÂN TÍCH MÃ NGUỒN HYPNARA DEMO
> **Dành cho Giáo viên & Học sinh / Sinh viên học Lập trình Web Fullstack (Next.js 14, TypeScript, React, PostgreSQL, AI Integration & Docker)**

---

## 1. Tổng Quan Kiến Trúc Dự Án (Architecture Overview)

Dự án **Hypnara** được xây dựng theo kiến trúc **Fullstack Next.js App Router** hiện đại:

```
[Trình duyệt Web (Client)]
       │
       ├── (1) Render React UI Components (Dashboard, OCR, Habits, Motivation, Chat)
       │
       ├── (2) Gọi REST API Route (/api/habits, /api/suggest, /api/chat...)
       │
       ▼
[Next.js Backend Server (App Router)]
       │
       ├── (3) Xử lý Session Cookies & Validation (lib/auth.ts)
       │
       ├── (4) Truy vấn / Cập nhật PostgreSQL Database (lib/db.ts)
       │
       └── (5) Gửi Prompt tới DeepSeek AI API (lib/deepseek.ts)
```

---

## 2. Cấu Trúc Thư Mục & Vai Trò Các Thành Phần

```
hypnara-demo/
├── app/                      # Cấu trúc App Router của Next.js 14
│   ├── page.tsx              # Trang Single Page Application (SPA) chính
│   ├── layout.tsx            # Khung Layout dùng chung (Meta, Fonts, HTML root)
│   ├── globals.css           # Design System (Biến CSS, Dark mode, Animation)
│   └── api/                  # 14 REST API Route Handlers
│       ├── habits/           # API lấy/lưu nhật ký thói quen & copy hôm qua
│       ├── overview/         # API tính điểm Sleep Score & dữ liệu biểu đồ
│       ├── suggest/          # API phân tích AI DeepSeek
│       ├── chat/             # API trợ lý AI trò chuyện 24/7
│       ├── motivation/       # API huy hiệu thành tích & thư động lực AI
│       └── export/           # API xuất dữ liệu ra file CSV
├── components/               # Các React Component giao diện UI
│   ├── Navbar.tsx            # Thanh điều hướng & trạng thái tài khoản
│   ├── OverviewTab.tsx       # Màn hình Tổng quan (Score Gauge, 6 Metrics)
│   ├── HabitsTab.tsx         # Màn hình Nhập nhật ký & Lịch sử phân trang
│   ├── MotivationTab.tsx     # Màn hình Động lực (Badges, Commitments, AI Letter)
│   ├── OCRTab.tsx            # Màn hình Quét OCR ảnh chụp Screen Time
│   ├── AIChatDrawer.tsx      # Khung trò chuyện Trợ lý AI nổi
│   ├── AuthModal.tsx         # Hộp thoại Đăng nhập / Đăng ký
│   └── dashboard/
│       └── TrendChart.tsx    # Biểu đồ đường SVG xu hướng 7/14/30 ngày
├── lib/                      # Các Module xử lý nghiệp vụ chung (Backend Helpers)
│   ├── db.ts                 # Kết nối PostgreSQL Pool & Khởi tạo Schema
│   ├── auth.ts               # Quản lý Cookie Session & Validate dữ liệu
│   └── deepseek.ts           # Tích hợp API DeepSeek & Xây dựng Prompt
├── Dockerfile                # Cấu hình đóng gói Container Docker (Multi-stage build)
└── docker-compose.yml        # Điều phối 2 container: Web App (Node 22) + Database (Postgres 16)
```

---

## 3. Phân Tích Chi Tiết Mã Nguồn Cho Bài Giảng

### 🔹 Bài 1: Kết nối PostgreSQL bằng Connection Pool & Tự động Migration (`lib/db.ts`)

**Khái niệm học sinh cần nắm:**
1. **Connection Pool**: Thay vì tạo kết nối mới mỗi khi có request (rất tốn tài nguyên), `Pool` duy trì một tập hợp các kết nối có sẵn để tái sử dụng.
2. **Xử lý múi giờ kiểu `DATE` trong Postgres**: Mặc định thư viện `pg` parse kiểu `DATE` thành đối tượng `Date` ở local midnight, sau đó `.toISOString()` có thể bị lệch lùi 1 ngày nếu máy chủ ở múi giờ UTC+ (như Việt Nam UTC+7). Đoạn code `types.setTypeParser(1082, val => val)` ép Postgres giữ nguyên chuỗi `"YYYY-MM-DD"`.

```typescript
// lib/db.ts
import { Pool, types } from 'pg';

// Parse kiểu DATE (ID: 1082) về chuỗi nguyên bản "YYYY-MM-DD"
types.setTypeParser(1082, (val: string) => val);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://hypnara:hypnara@localhost:5432/hypnara',
});

// Tự động kiểm tra và khởi tạo bảng nếu chưa có (Migration)
export async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      password TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS habits (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL REFERENCES users(username),
      date DATE NOT NULL,
      sleep_hours TEXT,
      screen_time TEXT,
      exercise_minutes TEXT,
      phone_cutoff_mins INTEGER,
      phone_pickups INTEGER,
      mood_score INTEGER,
      UNIQUE (username, date)
    );
  `);
}
```

---

### 🔹 Bài 2: Tạo API Route Handlers trong Next.js App Router (`app/api/habits/route.ts`)

**Khái niệm học sinh cần nắm:**
- Trong Next.js 14 App Router, mỗi file `route.ts` xuất ra các hàm tương ứng với HTTP Methods: `GET`, `POST`, `PUT`, `DELETE`.
- Sử dụng `NextResponse.json()` để trả phản hồi JSON chuẩn.
- Bắt lỗi vi phạm ràng buộc cơ sở dữ liệu (`ON CONFLICT (username, date) DO UPDATE`).

```typescript
// app/api/habits/route.ts
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDbPool } from '@/lib/db';

export async function POST(request: Request) {
  const username = getSessionUser();
  if (!username) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const body = await request.json();
  const pool = await getDbPool();

  // Thao tác INSERT hoặc UPDATE nếu trùng ngày (UPSERT)
  const result = await pool.query(
    `INSERT INTO habits (username, date, sleep_hours, screen_time, phone_cutoff_mins)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (username, date) DO UPDATE SET
       sleep_hours = EXCLUDED.sleep_hours,
       screen_time = EXCLUDED.screen_time,
       phone_cutoff_mins = EXCLUDED.phone_cutoff_mins
     RETURNING *`,
    [username, body.date, body.sleepHours, body.screenTime, body.phoneCutoffMins]
  );

  return NextResponse.json({ habit: result.rows[0] });
}
```

---

### 🔹 Bài 3: Tích hợp AI DeepSeek & Kỹ thuật Prompt Engineering (`lib/deepseek.ts`)

**Khái niệm học sinh cần nắm:**
1. **System Prompt**: Quy định vai trò, giọng văn và định dạng đầu ra của AI (đóng vai Chuyên gia Giấc ngủ & Wellbeing).
2. **Context Window (Đưa 14 ngày lịch sử vào Prompt)**: Nếu chỉ gửi dữ liệu 1 ngày, gợi ý sẽ chung chung. Bằng cách nối lịch sử 14 ngày gần nhất, AI có thể phát hiện các chuỗi thói quen (ví dụ: *"3 ngày liên tiếp bạn ngủ dưới 6 tiếng..."*).

```typescript
// lib/deepseek.ts
export function buildUserPrompt(currentHabits: any, habitHistory: any[] = []) {
  const historyText = habitHistory.map(h => 
    `- Ngày ${h.date}: Ngủ ${h.sleepHours}h | Screen ${h.screenTime}h | Cutoff ${h.phoneCutoffMins}p`
  ).join('\n');

  return `Dữ liệu hôm nay: Ngủ ${currentHabits.sleepHours}h, Screen ${currentHabits.screenTime}h.
Lịch sử 14 ngày gần đây:
${historyText}

Hãy phân tích xu hướng và đưa ra 3 hành động cụ thể giúp cải thiện giấc ngủ.`;
}
```

---

### 🔹 Bài 4: Nhận Diện Văn Bản (OCR) từ Ảnh Chụp Màn Hình bằng Tesseract.js (`components/OCRTab.tsx`)

**Khái niệm học sinh cần nắm:**
- **Dynamic Import**: Nhập thư viện `tesseract.js` ở phía Client khi người dùng tải ảnh lên để tối ưu tốc độ tải trang ban đầu.
- **Bóc tách dữ liệu bằng Regular Expression (RegEx)**: Nhận diện mẫu chuỗi như `"5h 20m"` hoặc `"85 pickups"` từ kết quả văn bản thô của OCR.

```typescript
// components/OCRTab.tsx
const processOCR = async (file: File) => {
  const Tesseract = (await import('tesseract.js')).default;
  const res = await Tesseract.recognize(file, 'eng+vie');
  const text = res.data.text || '';

  // Dùng RegEx bóc tách giờ ngủ / screen time (ví dụ: "5h 30m" -> 5.5)
  const match = text.match(/(\d{1,2})\s*(h|giờ)\s*(\d{1,2})?\s*(m|phút)?/i);
  if (match) {
    const hours = parseInt(match[1], 10);
    const mins = match[3] ? parseInt(match[3], 10) : 0;
    const totalHours = (hours + mins / 60).toFixed(1);
    console.log("Extracted Screen Time:", totalHours);
  }
};
```

---

### 🔹 Bài 5: Tự Vẽ Biểu Đồ Đường (SVG Multi-Line Chart) Không Dùng Thư Viện Tốn Dung Lượng (`components/dashboard/TrendChart.tsx`)

**Khái niệm học sinh cần nắm:**
- Toán học đồ họa: Ánh xạ giá trị dữ liệu `(value)` sang tọa độ màn hình `(x, y)` theo tỷ lệ `(width, height)`.
- Thẻ `<svg>`, `<path d="M x1 y1 L x2 y2 ...">` vẽ đường gấp khúc xu hướng.

```typescript
// components/dashboard/TrendChart.tsx
const points = data.map((d, i) => {
  const x = paddingLeft + (i / (data.length - 1)) * chartW;
  const y = paddingTop + chartH - (d.sleepHours / maxVal) * chartH;
  return { x, y };
});

const pathD = points.reduce((acc, pt, idx) => 
  idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`, ''
);

// Render trong JSX: <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="3" />
```

---

## 4. Câu Hỏi Thảo Luận & Bài Tập Thực Hành Cho Học Sinh

1. **Bài tập 1 (Backend - Beginner)**: Viết thêm API `POST /api/profile/goal` để lưu mục tiêu số giờ ngủ mong muốn của học sinh.
2. **Bài tập 2 (Frontend - Intermediate)**: Thêm biểu đồ hình tròn (Pie Chart) hiển thị tỷ lệ ứng dụng được sử dụng nhiều nhất (Top Apps).
3. **Bài tập 3 (AI - Advanced)**: Chỉnh sửa `systemPrompt` trong `lib/deepseek.ts` để AI đưa ra phản hồi bằng phong cách Hài Hước (Humorous) hoặc Nghiêm Túc (Strict Coach).
