// Hypnara demo server — Node core (http) + pg (Postgres client), khong dung framework/ORM.
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { Pool, types } = require("pg");

// pg mac dinh parse cot DATE thanh JS Date o local midnight, roi .toISOString() lech qua UTC
// se sai ngay khi may chay o timezone > UTC (vd Asia/Saigon +7). DATE khong co gio/timezone
// nen giu nguyen dang chuoi "YYYY-MM-DD" tho la dung nhat.
types.setTypeParser(1082, (val) => val);

// --- doc file .env don gian (khong can package dotenv) ---
(function loadEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
})();

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const HISTORY_DAYS = 14; // mo rong lich su dua vao prompt AI len 14 ngay
const LIST_PAGE_SIZE_DEFAULT = 10;
const LIST_PAGE_SIZE_MAX = 50;

if (!process.env.DATABASE_URL) {
  console.error("Thieu DATABASE_URL trong .env — xem .env.example.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.on("error", (err) => console.error("Loi Postgres pool (idle client):", err.message));

async function initSchema(retriesLeft = 10) {
  try {
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
        game_time TEXT,
        exercise_minutes TEXT,
        mood TEXT,
        schedule TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (username, date)
      );

      -- Migration: Bo sung cac cot quan trong cho suc khoe so & giac ngu
      ALTER TABLE habits ADD COLUMN IF NOT EXISTS phone_cutoff_mins INTEGER;
      ALTER TABLE habits ADD COLUMN IF NOT EXISTS phone_pickups INTEGER;
      ALTER TABLE habits ADD COLUMN IF NOT EXISTS top_app TEXT;
      ALTER TABLE habits ADD COLUMN IF NOT EXISTS mood_score INTEGER;
      ALTER TABLE habits ADD COLUMN IF NOT EXISTS mood_note TEXT;

      -- Bang muc tieu cam ket hanh dong (Action Commitments)
      CREATE TABLE IF NOT EXISTS action_commitments (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL REFERENCES users(username),
        title TEXT NOT NULL,
        target_date DATE NOT NULL,
        completed BOOLEAN DEFAULT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      -- Bang profile muc tieu nguoi dung (Onboarding & Reminders)
      CREATE TABLE IF NOT EXISTS user_profiles (
        username TEXT PRIMARY KEY REFERENCES users(username),
        primary_goal TEXT,
        reminder_time TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
  } catch (err) {
    if (retriesLeft <= 0) {
      console.error("Khong ket noi duoc Postgres:", err.message);
      process.exit(1);
    }
    await new Promise((r) => setTimeout(r, 1000));
    return initSchema(retriesLeft - 1);
  }
}

function habitRowToJSON(row) {
  return {
    id: row.id,
    username: row.username,
    date: row.date,
    sleepHours: row.sleep_hours,
    screenTime: row.screen_time,
    gameTime: row.game_time,
    exerciseMinutes: row.exercise_minutes,
    mood: row.mood,
    schedule: row.schedule,
    phoneCutoffMins: row.phone_cutoff_mins !== null && row.phone_cutoff_mins !== undefined ? Number(row.phone_cutoff_mins) : null,
    phonePickups: row.phone_pickups !== null && row.phone_pickups !== undefined ? Number(row.phone_pickups) : null,
    topApp: row.top_app || "",
    moodScore: row.mood_score !== null && row.mood_score !== undefined ? Number(row.mood_score) : null,
    moodNote: row.mood_note || "",
    createdAt: row.created_at,
  };
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  const out = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

function getSessionUser(req) {
  return parseCookies(req).session || null;
}

function requireAuth(req, res) {
  const username = getSessionUser(req);
  if (!username) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Chua dang nhap" }));
    return null;
  }
  return username;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function isValidDateStr(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && s <= todayStr();
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (err) {
        reject(err);
      }
    });
  });
}

function sendJSON(res, status, obj, extraHeaders) {
  res.writeHead(status, { "Content-Type": "application/json", ...extraHeaders });
  res.end(JSON.stringify(obj));
}

// --- VALIDATION CHẶT CHẼ ---
function validateHabitInput(input) {
  const errors = [];

  // Sleep hours
  if (input.sleepHours !== undefined && input.sleepHours !== null && input.sleepHours !== "") {
    const sleep = parseFloat(input.sleepHours);
    if (isNaN(sleep)) {
      errors.push("Giờ ngủ phải là số hợp lệ.");
    } else if (sleep < 1.0) {
      errors.push("Giờ ngủ không thể nhỏ hơn 1 giờ (ngủ 0h không hợp lệ).");
    } else if (sleep > 18.0) {
      errors.push("Giờ ngủ tối đa là 18 giờ.");
    }
  }

  // Screen time
  let screen = null;
  if (input.screenTime !== undefined && input.screenTime !== null && input.screenTime !== "") {
    screen = parseFloat(input.screenTime);
    if (isNaN(screen)) {
      errors.push("Thời gian màn hình phải là số hợp lệ.");
    } else if (screen < 0) {
      errors.push("Thời gian màn hình không thể âm.");
    } else if (screen > 24.0) {
      errors.push("Thời gian màn hình tối đa là 24 giờ / ngày.");
    }
  }

  // Game time
  if (input.gameTime !== undefined && input.gameTime !== null && input.gameTime !== "") {
    const game = parseFloat(input.gameTime);
    if (isNaN(game)) {
      errors.push("Thời gian chơi game phải là số hợp lệ.");
    } else if (game < 0) {
      errors.push("Thời gian chơi game không thể âm.");
    } else if (game > 24.0) {
      errors.push("Thời gian chơi game tối đa là 24 giờ.");
    } else if (screen !== null && game > screen) {
      errors.push(`Thời gian chơi game (${game}h) không thể lớn hơn tổng thời gian màn hình (${screen}h).`);
    }
  }

  // Exercise minutes
  if (input.exerciseMinutes !== undefined && input.exerciseMinutes !== null && input.exerciseMinutes !== "") {
    const exercise = parseFloat(input.exerciseMinutes);
    if (isNaN(exercise)) {
      errors.push("Thời gian vận động phải là số hợp lệ.");
    } else if (exercise < 0 || exercise > 720) {
      errors.push("Thời gian vận động từ 0 đến 720 phút.");
    }
  }

  // Phone cutoff mins
  if (input.phoneCutoffMins !== undefined && input.phoneCutoffMins !== null && input.phoneCutoffMins !== "") {
    const cutoff = parseInt(input.phoneCutoffMins, 10);
    if (isNaN(cutoff) || cutoff < 0 || cutoff > 360) {
      errors.push("Thời gian tắt điện thoại trước khi ngủ từ 0 đến 360 phút.");
    }
  }

  // Phone pickups
  if (input.phonePickups !== undefined && input.phonePickups !== null && input.phonePickups !== "") {
    const pickups = parseInt(input.phonePickups, 10);
    if (isNaN(pickups) || pickups < 0 || pickups > 500) {
      errors.push("Số lần mở máy phải từ 0 đến 500 lần.");
    }
  }

  // Mood score (1 - 5)
  if (input.moodScore !== undefined && input.moodScore !== null && input.moodScore !== "") {
    const score = parseInt(input.moodScore, 10);
    if (isNaN(score) || score < 1 || score > 5) {
      errors.push("Thang điểm tâm trạng phải từ 1 (Rất tệ) đến 5 (Tuyệt vời).");
    }
  }

  return errors;
}

const SYSTEM_PROMPT = `Ban la Hypnara, mot AI coach suc khoe so va giac ngu chuyen sau, dua theo mo hinh hanh vi Fogg (Dong luc - Kha nang - Kich hoat) va nguyen tac "thoi quen nho" (Tiny Habits).
Dua tren thoi quen va lich su nhieu ngay cua nguoi dung (dac biet chu y gio tat man hinh truoc khi ngu, so lan mo may, app ton nhieu thoi gian nhat, va cam ket truoc do), hay dua ra 2-3 goi y THAY DOI NHO, cuc ky cu the, de lam ngay hom nay.
Yeu cau quan trong:
- Nhan dien xu huong lien tuc neu co (vi du: "3 ngay qua ban deu dung dien thoai sat gio ngu...", "gio ngu duy tri tot 7.5h...").
- Neu nguoi dung co cam ket muc tieu gan nhat, hay dong vien hoac nhac nho nhe nhang.
- Moi goi y can kem theo HANH DONG KHOI DAU (Micro-trigger) de nguoi dung co the chon lam Muc Tieu Hom Nay.
- Tra loi bang tieng Viet chuan, dinh dang danh sach ngan gon, de hieu.
- Day la ung dung ho tro thoi quen, khong thay the chan doan y te.`;

function formatHistory(history, commitments = [], userProfile = null) {
  let text = "";
  if (userProfile && userProfile.primary_goal) {
    text += `[Mục tiêu chính của người dùng]: ${userProfile.primary_goal}\n\n`;
  }

  if (commitments && commitments.length > 0) {
    text += `[Cam kết mục tiêu gần đây]:\n`;
    text += commitments.map((c) => `  - Ngày ${c.target_date}: "${c.title}" -> ${c.completed === true ? "Đã hoàn thành ✅" : c.completed === false ? "Chưa hoàn thành ❌" : "Đang thực hiện ⏳"}`).join("\n");
    text += "\n\n";
  }

  if (!history || history.length === 0) {
    text += "Chua co du lieu thoi quen truoc do (nguoi dung moi).";
    return text;
  }

  text += `[Lịch sử ${history.length} ngày gần nhất (từ mới đến cũ)]:\n`;
  text += history
    .map(
      (h) =>
        `  - Ngày ${h.date}: Ngủ ${h.sleepHours || "?"}h, Màn hình ${h.screenTime || "?"}h, Game ${
          h.gameTime || "?"
        }h, Vận động ${h.exerciseMinutes || "?"}p, Tắt điện thoại trước ngủ ${
          h.phoneCutoffMins !== null ? h.phoneCutoffMins + "p" : "không rõ"
        }, Mở máy ${h.phonePickups !== null ? h.phonePickups + " lần" : "không rõ"}, App nhiều nhất: ${
          h.topApp || "không rõ"
        }, Tâm trạng: ${h.moodScore ? h.moodScore + "/5" : h.mood || "?"} (${h.moodNote || ""})`
    )
    .join("\n");

  return text;
}

function buildUserPrompt(todayInput, history, commitments, userProfile) {
  return `${formatHistory(history, commitments, userProfile)}

[Dữ liệu hôm nay (${todayInput.date || todayStr()})]:
- Giờ ngủ: ${todayInput.sleepHours || "chưa nhập"} giờ
- Thời gian màn hình: ${todayInput.screenTime || "chưa nhập"} giờ
- Thời gian chơi game: ${todayInput.gameTime || "chưa nhập"} giờ
- Vận động: ${todayInput.exerciseMinutes || "chưa nhập"} phút
- Tắt điện thoại trước ngủ: ${todayInput.phoneCutoffMins !== undefined ? todayInput.phoneCutoffMins + " phút" : "chưa rõ"}
- Số lần mở máy: ${todayInput.phonePickups !== undefined ? todayInput.phonePickups + " lần" : "chưa rõ"}
- App dùng nhiều nhất: ${todayInput.topApp || "chưa rõ"}
- Điểm tâm trạng: ${todayInput.moodScore ? todayInput.moodScore + "/5" : todayInput.mood || "chưa rõ"} ${todayInput.moodNote ? "(" + todayInput.moodNote + ")" : ""}
- Kế hoạch / ghi chú: ${todayInput.schedule || "không có"}

Dựa trên toàn bộ xu hướng nhiều ngày trên, hãy đưa ra phân tích và 2-3 gợi ý hành động nhỏ để cải thiện ngay hôm nay.`;
}

function fallbackSuggestions(input, history) {
  const out = [];
  const sleep = parseFloat(input.sleepHours);
  const game = parseFloat(input.gameTime);
  const exercise = parseFloat(input.exerciseMinutes);
  const cutoff = parseInt(input.phoneCutoffMins, 10);
  const pickups = parseInt(input.phonePickups, 10);

  if (!isNaN(cutoff) && cutoff < 15) {
    out.push("Tắt điện thoại trước khi ngủ 20 phút: Để sạc cách xa giường để tránh ánh sáng xanh làm gián đoạn sản sinh melatonin.");
  }
  if (!isNaN(sleep) && sleep < 7) {
    out.push(`Bạn chỉ ngủ ${sleep}h. Tối nay hãy đặt báo thức đi ngủ sớm hơn 30 phút và đọc 2 trang sách để dễ vào giấc.`);
  }
  if (!isNaN(pickups) && pickups > 70) {
    out.push(`Số lần mở máy hôm nay khá cao (${pickups} lần). Hãy tắt bớt thông báo từ các app mạng xã hội.`);
  }
  if (!isNaN(game) && game > 2) {
    out.push(`Thời gian chơi game ${game}h. Đặt micro-timer 25 phút để chủ động dừng lại nghỉ ngơi.`);
  }
  if (!isNaN(exercise) && exercise < 20) {
    out.push("Vận động hôm nay còn ít. Hãy đi bộ nhẹ nhàng 10 phút sau bữa tối để hỗ trợ tiêu hoá và giấc ngủ.");
  }
  if (out.length === 0) {
    out.push("Thói quen hôm nay rất cân bằng! Hãy duy trì nếp sinh hoạt này và tiếp tục ghi nhận đều đặn.");
  }
  return out;
}

function callDeepSeek(todayInput, history, commitments, userProfile) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(todayInput, history, commitments, userProfile) },
      ],
      stream: false,
    });

    const url = new URL(DEEPSEEK_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`DeepSeek API ${res.statusCode}: ${data}`));
        }
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.choices?.[0]?.message?.content || "Không nhận được gợi ý.");
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.write(postData);
    req.end();
  });
}

const CHAT_SYSTEM_PROMPT = `Ban la Hypnara AI Health & Sleep Coach - chuyen gia co van giac ngu, thoi quen lanh manh va suc khoe so.
Nguyen tac tu van:
1. Dua tren mo hinh hanh vi Fogg (Dong luc - Kha nang - Kich hoat) va phuong phap Tiny Habits (Thoi quen nho de thuc hien).
2. Ca nhan hoa theo du lieu thoi quen va xu huong 7-14 ngay qua cua nguoi dung.
3. Luon nhac den cac chi so quan trong nhu: gio tat may truoc khi ngu, app chiem nhieu gio nhat, so lan mo may, va muc tieu cam ket.
4. Giong dieu than thien, thau hieu, dong vien nhu mot nguoi ban dong hanh chuyen nghiep.
5. Trinh bay ro rang, de doc bang markdown (dung bullet points, in dam tu khoa chinh).`;

function fallbackChatResponse(message, history, userProfile) {
  const lower = (message || "").toLowerCase();
  if (lower.includes("ngủ") || lower.includes("sleep") || lower.includes("mất ngủ") || lower.includes("khó ngủ") || lower.includes("thức giấc")) {
    return "💡 **Bí quyết cho giấc ngủ sâu & tự nhiên:**\n\n1. **Tắt màn hình trước 30-45 phút:** Ánh sáng xanh ức chế sản sinh melatonin.\n2. **Nhiệt độ phòng mát mẻ (khoảng 22-25°C):** Giúp cơ thể hạ nhiệt tự nhiên.\n3. **Kỹ thuật thở 4-7-8:** Hít vào 4 giây, giữ 7 giây, thở ra 8 giây giúp xoa dịu hệ thần kinh.";
  }
  if (lower.includes("màn hình") || lower.includes("điện thoại") || lower.includes("game") || lower.includes("tiktok")) {
    return "📱 **Kiểm soát thời gian màn hình & số lần mở máy:**\n\n1. **Đổi vị trí sạc điện thoại:** Đặt cách xa giường ngủ.\n2. **Quy tắc 30 phút buổi tối:** Đặt báo thức 22:30 để tắt toàn bộ mạng xã hội.\n3. **Giảm kích thích Dopamine:** Chuyển màn hình điện thoại sang chế độ trắng đen (Grayscale) vào buổi tối.";
  }
  if (lower.includes("vận động") || lower.includes("thể dục") || lower.includes("tập")) {
    return "🏃‍♂️ **Vận động khoa học để hỗ trợ giấc ngủ:**\n\n- Khuyến nghị tối thiểu: **150 phút/tuần** (khoảng 20-30 phút/ngày).\n- Nên vận động vào buổi sáng hoặc đầu giờ chiều; tránh tập nặng sát giờ ngủ (dưới 2 tiếng).";
  }
  return "Chào bạn! Tôi là **Hypnara Coach**. Hãy đặt mục tiêu nhỏ mỗi ngày để cải thiện giấc ngủ và thói quen kỹ thuật số. Bạn muốn thảo luận về giấc ngủ hôm nay hay lập kế hoạch giảm thời gian dùng điện thoại?";
}

function callDeepSeekChat(messages, history, commitments, userProfile) {
  return new Promise((resolve, reject) => {
    const formattedHistory = formatHistory(history, commitments, userProfile);
    const systemContent = `${CHAT_SYSTEM_PROMPT}\n\n[Bối cảnh dữ liệu người dùng]:\n${formattedHistory}`;

    const apiMessages = [
      { role: "system", content: systemContent },
      ...messages.map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      })),
    ];

    const postData = JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: apiMessages,
      stream: false,
    });

    const url = new URL(DEEPSEEK_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`DeepSeek API ${res.statusCode}: ${data}`));
        }
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.choices?.[0]?.message?.content || "Không nhận được phản hồi.");
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.write(postData);
    req.end();
  });
}

const MIME = { ".html": "text/html", ".css": "text/css", ".js": "application/javascript", ".json": "application/json", ".csv": "text/csv" };

function serveStatic(req, res) {
  let filePath = req.url === "/" ? "/index.html" : req.url;
  filePath = path.join(PUBLIC_DIR, decodeURIComponent(filePath.split("?")[0]));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("Not found");
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  // 1. REGISTER
  if (req.method === "POST" && req.url === "/api/register") {
    readBody(req).then(async ({ username, password }) => {
      if (!username || !password) return sendJSON(res, 400, { error: "Thiếu username hoặc password" });
      try {
        await pool.query("INSERT INTO users (username, password) VALUES ($1, $2)", [username, password]);
        sendJSON(res, 200, { username }, { "Set-Cookie": `session=${encodeURIComponent(username)}; Path=/` });
      } catch (err) {
        if (err.code === "23505") return sendJSON(res, 409, { error: "Username đã tồn tại" });
        console.error(err);
        sendJSON(res, 500, { error: "Lỗi server" });
      }
    }, () => sendJSON(res, 400, { error: "JSON không hợp lệ" }));
    return;
  }

  // 2. LOGIN
  if (req.method === "POST" && req.url === "/api/login") {
    readBody(req).then(async ({ username, password }) => {
      const { rows } = await pool.query("SELECT password FROM users WHERE username = $1", [username]);
      const user = rows[0];
      if (!user || user.password !== password) return sendJSON(res, 401, { error: "Sai username hoặc password" });
      sendJSON(res, 200, { username }, { "Set-Cookie": `session=${encodeURIComponent(username)}; Path=/` });
    }, () => sendJSON(res, 400, { error: "JSON không hợp lệ" }));
    return;
  }

  // 3. LOGOUT
  if (req.method === "POST" && req.url === "/api/logout") {
    sendJSON(res, 200, { ok: true }, { "Set-Cookie": "session=; Path=/; Max-Age=0" });
    return;
  }

  // 4. ME
  if (req.method === "GET" && req.url === "/api/me") {
    sendJSON(res, 200, { username: getSessionUser(req) });
    return;
  }

  // 5. USER PROFILE & ONBOARDING TARGET
  if (req.method === "GET" && req.url === "/api/profile") {
    const username = requireAuth(req, res);
    if (!username) return;
    const { rows } = await pool.query("SELECT * FROM user_profiles WHERE username = $1", [username]);
    sendJSON(res, 200, rows[0] || { primary_goal: "Cải thiện giấc ngủ & giảm thời gian màn hình", reminder_time: "22:00" });
    return;
  }

  if (req.method === "POST" && req.url === "/api/profile") {
    const username = requireAuth(req, res);
    if (!username) return;
    readBody(req).then(async ({ primaryGoal, reminderTime }) => {
      await pool.query(
        `INSERT INTO user_profiles (username, primary_goal, reminder_time, updated_at)
         VALUES ($1, $2, $3, now())
         ON CONFLICT (username) DO UPDATE SET
           primary_goal = EXCLUDED.primary_goal,
           reminder_time = EXCLUDED.reminder_time,
           updated_at = now()`,
        [username, primaryGoal, reminderTime]
      );
      sendJSON(res, 200, { ok: true });
    }, () => sendJSON(res, 400, { error: "JSON không hợp lệ" }));
    return;
  }

  // 6. COPY YESTERDAY RECORD
  if (req.method === "GET" && req.url === "/api/habits/yesterday") {
    const username = requireAuth(req, res);
    if (!username) return;
    const { rows } = await pool.query(
      "SELECT * FROM habits WHERE username = $1 ORDER BY date DESC LIMIT 1",
      [username]
    );
    if (!rows.length) {
      return sendJSON(res, 404, { error: "Chưa có bản ghi nào trước đó để sao chép." });
    }
    sendJSON(res, 200, habitRowToJSON(rows[0]));
    return;
  }

  // 7. SAVE HABIT (WITH FULL VALIDATION & OVERWRITE DETECTION)
  if (req.method === "POST" && req.url === "/api/habits") {
    const username = requireAuth(req, res);
    if (!username) return;
    readBody(req).then(async (input) => {
      let date = todayStr();
      if (input.date) {
        if (!isValidDateStr(input.date)) return sendJSON(res, 400, { error: "Ngày không hợp lệ (không được chọn ngày trong tương lai)." });
        date = input.date;
      }

      // Run validation
      const valErrors = validateHabitInput(input);
      if (valErrors.length > 0) {
        return sendJSON(res, 400, { error: valErrors.join(" ") });
      }

      // Check if existing record
      const existing = await pool.query("SELECT id FROM habits WHERE username = $1 AND date = $2", [username, date]);
      const isUpdate = existing.rows.length > 0;

      const { rows } = await pool.query(
        `INSERT INTO habits (username, date, sleep_hours, screen_time, game_time, exercise_minutes, mood, schedule, phone_cutoff_mins, phone_pickups, top_app, mood_score, mood_note)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (username, date) DO UPDATE SET
           sleep_hours = EXCLUDED.sleep_hours,
           screen_time = EXCLUDED.screen_time,
           game_time = EXCLUDED.game_time,
           exercise_minutes = EXCLUDED.exercise_minutes,
           mood = EXCLUDED.mood,
           schedule = EXCLUDED.schedule,
           phone_cutoff_mins = EXCLUDED.phone_cutoff_mins,
           phone_pickups = EXCLUDED.phone_pickups,
           top_app = EXCLUDED.top_app,
           mood_score = EXCLUDED.mood_score,
           mood_note = EXCLUDED.mood_note
         RETURNING *`,
        [
          username,
          date,
          input.sleepHours || null,
          input.screenTime || null,
          input.gameTime || null,
          input.exerciseMinutes || null,
          input.mood || null,
          input.schedule || null,
          input.phoneCutoffMins !== undefined && input.phoneCutoffMins !== "" ? parseInt(input.phoneCutoffMins, 10) : null,
          input.phonePickups !== undefined && input.phonePickups !== "" ? parseInt(input.phonePickups, 10) : null,
          input.topApp || null,
          input.moodScore !== undefined && input.moodScore !== "" ? parseInt(input.moodScore, 10) : null,
          input.moodNote || null,
        ]
      );

      sendJSON(res, 200, {
        ok: true,
        action: isUpdate ? "updated" : "created",
        message: isUpdate ? `Đã cập nhật đè bản ghi ngày ${date}.` : `Đã tạo bản ghi mới ngày ${date}.`,
        record: habitRowToJSON(rows[0]),
      });
    }, () => sendJSON(res, 400, { error: "JSON không hợp lệ" }));
    return;
  }

  // 8. LIST HABITS PAGINATED
  if (req.method === "GET" && req.url.startsWith("/api/habits")) {
    const username = requireAuth(req, res);
    if (!username) return;
    const query = new URL(req.url, "http://localhost").searchParams;
    const page = Math.max(1, parseInt(query.get("page"), 10) || 1);
    const pageSize = Math.min(LIST_PAGE_SIZE_MAX, Math.max(1, parseInt(query.get("pageSize"), 10) || LIST_PAGE_SIZE_DEFAULT));
    const [{ rows }, countResult] = await Promise.all([
      pool.query("SELECT * FROM habits WHERE username = $1 ORDER BY date DESC LIMIT $2 OFFSET $3", [
        username,
        pageSize,
        (page - 1) * pageSize,
      ]),
      pool.query("SELECT COUNT(*) FROM habits WHERE username = $1", [username]),
    ]);
    sendJSON(res, 200, {
      habits: rows.map(habitRowToJSON),
      page,
      pageSize,
      total: parseInt(countResult.rows[0].count, 10),
    });
    return;
  }

  // 9. ACTION COMMITMENTS (MỤC TIÊU HÀNH ĐỘNG TỪ GỢI Ý AI)
  if (req.method === "GET" && req.url === "/api/commitments") {
    const username = requireAuth(req, res);
    if (!username) return;
    const { rows } = await pool.query(
      "SELECT * FROM action_commitments WHERE username = $1 ORDER BY target_date DESC, id DESC LIMIT 20",
      [username]
    );
    sendJSON(res, 200, rows);
    return;
  }

  if (req.method === "POST" && req.url === "/api/commitments") {
    const username = requireAuth(req, res);
    if (!username) return;
    readBody(req).then(async ({ title, targetDate }) => {
      if (!title) return sendJSON(res, 400, { error: "Thiếu tiêu đề cam kết" });
      const date = targetDate || todayStr();
      const { rows } = await pool.query(
        "INSERT INTO action_commitments (username, title, target_date) VALUES ($1, $2, $3) RETURNING *",
        [username, title.trim(), date]
      );
      sendJSON(res, 200, { ok: true, commitment: rows[0] });
    }, () => sendJSON(res, 400, { error: "JSON không hợp lệ" }));
    return;
  }

  if (req.method === "POST" && req.url.startsWith("/api/commitments/") && req.url.endsWith("/checkin")) {
    const username = requireAuth(req, res);
    if (!username) return;
    const id = parseInt(req.url.split("/")[3], 10);
    readBody(req).then(async ({ completed }) => {
      const { rows } = await pool.query(
        "UPDATE action_commitments SET completed = $1 WHERE id = $2 AND username = $3 RETURNING *",
        [completed === true, id, username]
      );
      if (!rows.length) return sendJSON(res, 404, { error: "Không tìm thấy cam kết" });
      sendJSON(res, 200, { ok: true, commitment: rows[0] });
    }, () => sendJSON(res, 400, { error: "JSON không hợp lệ" }));
    return;
  }

  // 10. OVERVIEW & CORRELATION ANALYTICS
  if (req.method === "GET" && req.url === "/api/overview") {
    const username = requireAuth(req, res);
    if (!username) return;

    try {
      const [habitsResult, commitmentsResult, profileResult] = await Promise.all([
        pool.query("SELECT * FROM habits WHERE username = $1 ORDER BY date DESC LIMIT 60", [username]),
        pool.query("SELECT * FROM action_commitments WHERE username = $1 ORDER BY target_date DESC LIMIT 30", [username]),
        pool.query("SELECT * FROM user_profiles WHERE username = $1", [username]),
      ]);

      const habits = habitsResult.rows.map(habitRowToJSON);
      const commitments = commitmentsResult.rows;
      const userProfile = profileResult.rows[0] || null;
      const totalCount = habits.length;

      // Streak thói quen
      let habitStreak = 0;
      if (habits.length > 0) {
        const dates = new Set(habits.map((h) => h.date));
        let checkDate = new Date();
        const checkStr = checkDate.toISOString().slice(0, 10);
        if (!dates.has(checkStr)) checkDate.setDate(checkDate.getDate() - 1);
        while (true) {
          const s = checkDate.toISOString().slice(0, 10);
          if (dates.has(s)) {
            habitStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else break;
        }
      }

      // Thống kê 7 ngày gần nhất
      const recent7 = habits.slice(0, 7);
      let sumSleep = 0, countSleep = 0;
      let sumScreen = 0, countScreen = 0;
      let sumGame = 0, countGame = 0;
      let sumExercise = 0, countExercise = 0;
      let sumCutoff = 0, countCutoff = 0;
      let sumPickups = 0, countPickups = 0;
      let sumMoodScore = 0, countMoodScore = 0;
      const appCounts = {};

      for (const h of habits) {
        if (h.topApp) appCounts[h.topApp] = (appCounts[h.topApp] || 0) + 1;
      }

      for (const h of recent7) {
        const s = parseFloat(h.sleepHours);
        if (!isNaN(s)) { sumSleep += s; countSleep++; }
        const sc = parseFloat(h.screenTime);
        if (!isNaN(sc)) { sumScreen += sc; countScreen++; }
        const g = parseFloat(h.gameTime);
        if (!isNaN(g)) { sumGame += g; countGame++; }
        const e = parseFloat(h.exerciseMinutes);
        if (!isNaN(e)) { sumExercise += e; countExercise++; }
        if (h.phoneCutoffMins !== null) { sumCutoff += h.phoneCutoffMins; countCutoff++; }
        if (h.phonePickups !== null) { sumPickups += h.phonePickups; countPickups++; }
        if (h.moodScore !== null) { sumMoodScore += h.moodScore; countMoodScore++; }
      }

      const avgSleep = countSleep ? +(sumSleep / countSleep).toFixed(1) : 0;
      const avgScreen = countScreen ? +(sumScreen / countScreen).toFixed(1) : 0;
      const avgGame = countGame ? +(sumGame / countGame).toFixed(1) : 0;
      const avgExercise = countExercise ? Math.round(sumExercise / countExercise) : 0;
      const avgCutoff = countCutoff ? Math.round(sumCutoff / countCutoff) : 0;
      const avgPickups = countPickups ? Math.round(sumPickups / countPickups) : 0;
      const avgMoodScore = countMoodScore ? +(sumMoodScore / countMoodScore).toFixed(1) : 0;

      // Top app phổ biến nhất
      let mostFrequentTopApp = Object.keys(appCounts).sort((a, b) => appCounts[b] - appCounts[a])[0] || "Chưa có";

      // Sleep score (0 - 100)
      let sleepScore = 85;
      if (countSleep > 0) {
        let penalty = 0;
        if (avgSleep < 7) penalty += (7 - avgSleep) * 12;
        else if (avgSleep > 9) penalty += (avgSleep - 9) * 6;

        if (avgScreen > 6) penalty += (avgScreen - 6) * 4;
        if (avgGame > 3) penalty += (avgGame - 3) * 5;
        if (avgCutoff < 15) penalty += 10;
        if (avgExercise < 20) penalty += 8;
        else if (avgExercise >= 30) penalty -= 5;

        sleepScore = Math.max(30, Math.min(99, Math.round(100 - penalty)));
      } else {
        sleepScore = 0;
      }

      // Correlations
      const correlations = [];
      const cutoffLow = habits.filter((h) => h.phoneCutoffMins !== null && h.phoneCutoffMins < 15 && parseFloat(h.sleepHours));
      const cutoffHigh = habits.filter((h) => h.phoneCutoffMins !== null && h.phoneCutoffMins >= 30 && parseFloat(h.sleepHours));
      if (cutoffLow.length >= 2 && cutoffHigh.length >= 2) {
        const avgSleepLow = cutoffLow.reduce((a, b) => a + parseFloat(b.sleepHours), 0) / cutoffLow.length;
        const avgSleepHigh = cutoffHigh.reduce((a, b) => a + parseFloat(b.sleepHours), 0) / cutoffHigh.length;
        const diff = +(avgSleepHigh - avgSleepLow).toFixed(1);
        if (diff > 0.3) {
          correlations.push({
            type: "positive",
            title: "Tắt điện thoại sớm giúp ngủ nhiều hơn",
            insight: `Những ngày bạn tắt điện thoại trước khi ngủ ≥ 30 phút, thời lượng ngủ trung bình cao hơn **${diff} giờ** so với những ngày dùng sát giờ ngủ.`,
          });
        }
      }

      const chronHabits = [...habits].sort((a, b) => a.date.localeCompare(b.date));
      let screenAfterShortSleep = [], screenAfterNormalSleep = [];
      for (let i = 0; i < chronHabits.length - 1; i++) {
        const current = chronHabits[i];
        const next = chronHabits[i + 1];
        const sleep = parseFloat(current.sleepHours);
        const nextScreen = parseFloat(next.screenTime);
        if (!isNaN(sleep) && !isNaN(nextScreen)) {
          if (sleep < 6.5) screenAfterShortSleep.push(nextScreen);
          else if (sleep >= 7.0) screenAfterNormalSleep.push(nextScreen);
        }
      }

      if (screenAfterShortSleep.length >= 2 && screenAfterNormalSleep.length >= 2) {
        const avgScreenShort = screenAfterShortSleep.reduce((a, b) => a + b, 0) / screenAfterShortSleep.length;
        const avgScreenNorm = screenAfterNormalSleep.reduce((a, b) => a + b, 0) / screenAfterNormalSleep.length;
        const diff = +(avgScreenShort - avgScreenNorm).toFixed(1);
        if (diff > 0.5) {
          correlations.push({
            type: "warning",
            title: "Thiếu ngủ làm tăng Screen Time hôm sau",
            insight: `Khi đêm trước bạn ngủ dưới 6.5h, thời gian dùng màn hình ngày hôm sau có xu hướng tăng thêm **${diff} giờ** do mệt mỏi và giảm khả năng tập trung.`,
          });
        }
      }

      const withExercise = habits.filter((h) => parseFloat(h.exerciseMinutes) >= 30 && h.moodScore);
      const withoutExercise = habits.filter((h) => parseFloat(h.exerciseMinutes) < 15 && h.moodScore);
      if (withExercise.length >= 2 && withoutExercise.length >= 2) {
        const avgMoodEx = withExercise.reduce((a, b) => a + b.moodScore, 0) / withExercise.length;
        const avgMoodNo = withoutExercise.reduce((a, b) => a + b.moodScore, 0) / withoutExercise.length;
        const diff = +(avgMoodEx - avgMoodNo).toFixed(1);
        if (diff > 0.4) {
          correlations.push({
            type: "positive",
            title: "Vận động nâng cao tâm trạng rõ rệt",
            insight: `Những ngày có vận động ≥ 30 phút, điểm tâm trạng trung bình của bạn cao hơn **${diff} điểm (thang 5)**.`,
          });
        }
      }

      if (correlations.length === 0) {
        correlations.push({
          type: "info",
          title: "Quy tắc vàng 30 phút trước ngủ",
          insight: "Dữ liệu y học cho thấy việc ngừng dùng điện thoại 30 phút trước khi ngủ giúp rút ngắn thời gian vào giấc 40% và ngủ sâu hơn.",
        });
      }

      const totalCommitments = commitments.length;
      const completedCommitments = commitments.filter((c) => c.completed === true).length;
      const completionRate = totalCommitments > 0 ? Math.round((completedCommitments / totalCommitments) * 100) : 0;

      const totalExerciseWeek = recent7.reduce((a, b) => a + (parseFloat(b.exerciseMinutes) || 0), 0);
      const weeklyCompliance = {
        sleepAvg: avgSleep,
        sleepTarget: "7.0 - 9.0h",
        sleepStatus: avgSleep >= 7 && avgSleep <= 9 ? "Đạt chuẩn" : avgSleep < 7 ? "Thiếu ngủ" : "Ngủ nhiều",
        exerciseTotalWeek: totalExerciseWeek,
        exerciseTarget: "≥ 150 phút / tuần (WHO)",
        exerciseStatus: totalExerciseWeek >= 150 ? "Đạt chuẩn WHO" : `Cần thêm ${150 - totalExerciseWeek}p`,
      };

      sendJSON(res, 200, {
        totalDays: totalCount,
        streak: habitStreak,
        stats: {
          avgSleep,
          avgScreen,
          avgGame,
          avgExercise,
          avgCutoff,
          avgPickups,
          avgMoodScore,
          mostFrequentTopApp,
          sleepScore,
        },
        correlations,
        weeklyCompliance,
        commitments: {
          total: totalCommitments,
          completed: completedCommitments,
          rate: completionRate,
          recent: commitments.slice(0, 5),
        },
        chartData7: habits.slice(0, 7).reverse(),
        chartData14: habits.slice(0, 14).reverse(),
        chartData30: habits.slice(0, 30).reverse(),
      });
    } catch (err) {
      console.error(err);
      sendJSON(res, 500, { error: "Lỗi lấy dữ liệu tổng quan" });
    }
    return;
  }

  // 10.1 MOTIVATION, GAMIFICATION & GOALS HUB
  if (req.method === "GET" && req.url === "/api/motivation") {
    const username = requireAuth(req, res);
    if (!username) return;

    try {
      const [habitsRes, commRes, profRes] = await Promise.all([
        pool.query("SELECT * FROM habits WHERE username = $1 ORDER BY date DESC", [username]),
        pool.query("SELECT * FROM action_commitments WHERE username = $1 ORDER BY target_date DESC, id DESC", [username]),
        pool.query("SELECT * FROM user_profiles WHERE username = $1", [username]),
      ]);

      const habits = habitsRes.rows.map(habitRowToJSON);
      const commitments = commRes.rows;
      const userProfile = profRes.rows[0] || null;

      // 1. Tính EXP & Level
      const totalLoggedDays = habits.length;
      const completedGoals = commitments.filter((c) => c.completed === true).length;
      const totalGoals = commitments.length;
      const expPoints = totalLoggedDays * 30 + completedGoals * 50;

      let levelNum = 1;
      let levelTitle = "Người Khởi Đầu";
      let nextLevelExp = 150;
      let prevLevelExp = 0;
      let levelIcon = "🌱";

      if (expPoints >= 1500) {
        levelNum = 5;
        levelTitle = "Huyền Thoại Hypnara";
        levelIcon = "👑";
        nextLevelExp = 2500;
        prevLevelExp = 1500;
      } else if (expPoints >= 800) {
        levelNum = 4;
        levelTitle = "Bậc Thầy Giấc Ngủ";
        levelIcon = "🧘";
        nextLevelExp = 1500;
        prevLevelExp = 800;
      } else if (expPoints >= 400) {
        levelNum = 3;
        levelTitle = "Chiến Binh Kỷ Luật Số";
        levelIcon = "🛡️";
        nextLevelExp = 800;
        prevLevelExp = 400;
      } else if (expPoints >= 150) {
        levelNum = 2;
        levelTitle = "Xây Dựng Thói Quen";
        levelIcon = "⚡";
        nextLevelExp = 400;
        prevLevelExp = 150;
      }

      const progressPercent = Math.min(100, Math.round(((expPoints - prevLevelExp) / (nextLevelExp - prevLevelExp)) * 100));

      // 2. Danh hiệu & Huy hiệu (Badges)
      const badges = [
        {
          id: "first_log",
          name: "Khởi Đầu Hoàn Hảo",
          icon: "🌱",
          desc: "Nhập bản ghi thói quen đầu tiên",
          unlocked: totalLoggedDays >= 1,
        },
        {
          id: "streak_3",
          name: "Chuỗi Kiên Trì 3 Ngày",
          icon: "🔥",
          desc: "Duy trì ghi nhận 3 ngày liên tiếp",
          unlocked: totalLoggedDays >= 3,
        },
        {
          id: "streak_7",
          name: "Kỷ Luật Thép 7 Ngày",
          icon: "⚡",
          desc: "Duy trì chuỗi ghi nhận 7 ngày",
          unlocked: totalLoggedDays >= 7,
        },
        {
          id: "sleep_master",
          name: "Giấc Ngủ Vàng (7-9h)",
          icon: "🌙",
          desc: "Có ít nhất 3 ngày ngủ đủ 7 - 9 giờ",
          unlocked: habits.filter((h) => parseFloat(h.sleepHours) >= 7 && parseFloat(h.sleepHours) <= 9).length >= 3,
        },
        {
          id: "digital_detox",
          name: "Bậc Thầy Cai Nghiện Màn Hình",
          icon: "📵",
          desc: "Tắt điện thoại trước khi ngủ ≥ 30p ít nhất 2 ngày",
          unlocked: habits.filter((h) => h.phoneCutoffMins !== null && h.phoneCutoffMins >= 30).length >= 2,
        },
        {
          id: "action_hero",
          name: "Người Giữ Lời Hứa",
          icon: "🎯",
          desc: "Hoàn thành thành công 3 mục tiêu cam kết",
          unlocked: completedGoals >= 3,
        },
        {
          id: "who_hero",
          name: "Năng Lượng Bền Bỉ (WHO)",
          icon: "🏃‍♂️",
          desc: "Tích lũy đủ 150 phút vận động trong tuần",
          unlocked: habits.slice(0, 7).reduce((a, b) => a + (parseFloat(b.exerciseMinutes) || 0), 0) >= 150,
        },
      ];

      // 3. Heatmap 30 Ngày
      const habitDateMap = new Map();
      habits.forEach((h) => habitDateMap.set(h.date, h));
      const commitmentDateMap = new Map();
      commitments.forEach((c) => {
        if (!commitmentDateMap.has(c.target_date)) commitmentDateMap.set(c.target_date, []);
        commitmentDateMap.get(c.target_date).push(c);
      });

      const heatmap30 = [];
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const h = habitDateMap.get(dateStr);
        const coms = commitmentDateMap.get(dateStr) || [];
        const completedComs = coms.filter((c) => c.completed === true).length;

        let intensity = 0;
        if (h) {
          intensity = 1;
          const s = parseFloat(h.sleepHours);
          if (s >= 7 && s <= 9) intensity = 2;
          if (completedComs > 0) intensity = 3;
        }

        heatmap30.push({
          date: dateStr,
          isLogged: !!h,
          sleepHours: h ? h.sleepHours : null,
          completedGoals: completedComs,
          intensity,
        });
      }

      // 4. So sánh Tuần này vs Tuần trước (Before vs After)
      const thisWeek = habits.slice(0, 7);
      const lastWeek = habits.slice(7, 14);

      const avgThisWeek = (field) => {
        const valid = thisWeek.filter((h) => h[field] !== null && !isNaN(parseFloat(h[field])));
        return valid.length ? valid.reduce((a, b) => a + parseFloat(b[field]), 0) / valid.length : null;
      };
      const avgLastWeek = (field) => {
        const valid = lastWeek.filter((h) => h[field] !== null && !isNaN(parseFloat(h[field])));
        return valid.length ? valid.reduce((a, b) => a + parseFloat(b[field]), 0) / valid.length : null;
      };

      const comparison = {
        sleepThis: avgThisWeek("sleepHours") ? +avgThisWeek("sleepHours").toFixed(1) : 0,
        sleepLast: avgLastWeek("sleepHours") ? +avgLastWeek("sleepHours").toFixed(1) : 0,
        screenThis: avgThisWeek("screenTime") ? +avgThisWeek("screenTime").toFixed(1) : 0,
        screenLast: avgLastWeek("screenTime") ? +avgLastWeek("screenTime").toFixed(1) : 0,
        cutoffThis: avgThisWeek("phoneCutoffMins") ? Math.round(avgThisWeek("phoneCutoffMins")) : 0,
        cutoffLast: avgLastWeek("phoneCutoffMins") ? Math.round(avgLastWeek("phoneCutoffMins")) : 0,
        exerciseThis: avgThisWeek("exerciseMinutes") ? Math.round(avgThisWeek("exerciseMinutes")) : 0,
        exerciseLast: avgLastWeek("exerciseMinutes") ? Math.round(avgLastWeek("exerciseMinutes")) : 0,
      };

      // 5. Trích dẫn Động lực Khoa học Hành vi (Quotes)
      const quotes = [
        {
          quote: "Thành công là tổng hòa của những nỗ lực nhỏ được lặp đi lặp lại mỗi ngày.",
          author: "Robert Collier • Nguyên tắc Tiny Habits",
        },
        {
          quote: "Giấc ngủ là chiếc đòn bẩy vĩ đại nhất để nâng cấp sức khỏe thể chất và khả năng nhận thức của não bộ.",
          author: "Dr. Matthew Walker • Why We Sleep",
        },
        {
          quote: "Đừng đợi có động lực mới bắt đầu. Hãy biến hành động nhỏ đến mức bạn không thể nói 'Không'.",
          author: "Dr. BJ Fogg • Stanford Behavior Design Lab",
        },
        {
          quote: "Mỗi lần bạn tắt màn hình sớm 30 phút là một phiếu bầu cho phiên bản khỏe mạnh và sảng khoái của chính mình ngày mai.",
          author: "James Clear • Atomic Habits",
        },
      ];
      const dailyQuote = quotes[new Date().getDate() % quotes.length];

      sendJSON(res, 200, {
        gamification: {
          levelNum,
          levelTitle,
          levelIcon,
          expPoints,
          prevLevelExp,
          nextLevelExp,
          progressPercent,
          badges,
        },
        heatmap30,
        comparison,
        dailyQuote,
        goalsSummary: {
          total: totalGoals,
          completed: completedGoals,
          inProgress: commitments.filter((c) => c.completed === null).length,
          rate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
        },
        goalsList: commitments,
      });
    } catch (err) {
      console.error(err);
      sendJSON(res, 500, { error: "Lỗi lấy dữ liệu động lực & mục tiêu" });
    }
    return;
  }

  // 10.2 AI MOTIVATION LETTER & COACHING NUDGE
  if (req.method === "POST" && req.url === "/api/motivation/ai-letter") {
    const username = requireAuth(req, res);
    if (!username) return;

    try {
      const [habitsRes, commRes, profRes] = await Promise.all([
        pool.query("SELECT * FROM habits WHERE username = $1 ORDER BY date DESC LIMIT 14", [username]),
        pool.query("SELECT * FROM action_commitments WHERE username = $1 ORDER BY target_date DESC LIMIT 10", [username]),
        pool.query("SELECT * FROM user_profiles WHERE username = $1", [username]),
      ]);

      const habits = habitsRes.rows.map(habitRowToJSON);
      const commitments = commRes.rows;
      const userProfile = profRes.rows[0] || null;

      const prompt = `Bạn là Hypnara Health Coach. Hãy viết một BỨC TÂM THƯ TẠO ĐỘNG LỰC NGẮN (khoảng 3-4 đoạn văn, ấm áp, truyền cảm hứng) gửi riêng cho ${username}.
Dữ liệu của người dùng:
${formatHistory(habits, commitments, userProfile)}

Yêu cầu:
1. Ghi nhận và khen ngợi những nỗ lực dù là nhỏ nhất của người dùng trong tuần qua.
2. Nêu bật 1 điểm sáng nhất (ví dụ: chuỗi ghi nhận kiên trì, số ngày ngủ ngon, hoặc giảm giờ màn hình).
3. Đưa ra lời khuyên truyền cảm hứng theo triết lý 'Thói quen nhỏ tạo nên kỳ tích' (Tiny Habits).
4. Giọng điệu như một người cố vấn tâm huyết, chân thành, tràn đầy năng lượng tích cực. Trình bày bằng markdown đẹp mắt.`;

      if (!DEEPSEEK_API_KEY) {
        return sendJSON(res, 200, {
          letter: `Chào ${username} thân mến! 🌟\n\nTôi rất tự hào khi thấy bạn đang từng ngày chú tâm hơn đến giấc ngủ và sức khỏe số của mình. Hành trình xây dựng một lối sống lành mạnh không đến từ những thay đổi vĩ mô trong một đêm, mà là kết quả của việc bạn kiên trì tắt điện thoại sớm hơn 15 phút, đặt sạc ra xa giường và đi ngủ đúng giờ.\n\nCho dù có những ngày chưa đạt 100% mục tiêu, việc bạn vẫn quay lại đây và ghi nhận đã là một chiến thắng lớn của kỷ luật bản thân. Hãy tin tưởng vào tiến trình và tiếp tục nỗ lực nhé!\n\n*— Hypnara Coach đồng hành cùng bạn 🌙*`,
        });
      }

      const letter = await callDeepSeekChat([{ role: "user", content: prompt }], habits, commitments, userProfile);
      sendJSON(res, 200, { letter });
    } catch (err) {
      console.error(err);
      sendJSON(res, 500, { error: "Lỗi tạo thư động lực" });
    }
    return;
  }

  // 10.3 DELETE COMMITMENT
  if (req.method === "DELETE" && req.url.startsWith("/api/commitments/")) {
    const username = requireAuth(req, res);
    if (!username) return;
    const id = parseInt(req.url.split("/")[3], 10);
    await pool.query("DELETE FROM action_commitments WHERE id = $1 AND username = $2", [id, username]);
    sendJSON(res, 200, { ok: true });
    return;
  }

  // 11. EXPORT CSV / JSON
  if (req.method === "GET" && req.url.startsWith("/api/export")) {
    const username = requireAuth(req, res);
    if (!username) return;
    const format = new URL(req.url, "http://localhost").searchParams.get("format") || "csv";

    try {
      const { rows } = await pool.query("SELECT * FROM habits WHERE username = $1 ORDER BY date ASC", [username]);
      const habits = rows.map(habitRowToJSON);

      if (format === "json") {
        res.writeHead(200, {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="hypnara_data_${username}.json"`,
        });
        return res.end(JSON.stringify(habits, null, 2));
      } else {
        const header = "Date,Sleep_Hours,Screen_Time_Hours,Game_Time_Hours,Exercise_Minutes,Phone_Cutoff_Minutes,Phone_Pickups,Top_App,Mood_Score,Mood,Schedule\n";
        const lines = habits.map((h) =>
          [
            h.date,
            h.sleepHours || "",
            h.screenTime || "",
            h.gameTime || "",
            h.exerciseMinutes || "",
            h.phoneCutoffMins !== null ? h.phoneCutoffMins : "",
            h.phonePickups !== null ? h.phonePickups : "",
            `"${(h.topApp || "").replace(/"/g, '""')}"`,
            h.moodScore || "",
            `"${(h.mood || "").replace(/"/g, '""')}"`,
            `"${(h.schedule || "").replace(/"/g, '""')}"`,
          ].join(",")
        );
        res.writeHead(200, {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="hypnara_data_${username}.csv"`,
        });
        return res.end("\uFEFF" + header + lines.join("\n"));
      }
    } catch (err) {
      console.error(err);
      sendJSON(res, 500, { error: "Lỗi xuất dữ liệu" });
    }
    return;
  }

  // 12. AI SUGGEST
  if (req.method === "POST" && req.url === "/api/suggest") {
    const username = requireAuth(req, res);
    if (!username) return;
    readBody(req).then(async (input) => {
      const [habitsRes, commRes, profRes] = await Promise.all([
        pool.query("SELECT * FROM habits WHERE username = $1 AND date <> $2 ORDER BY date DESC LIMIT $3", [
          username,
          input.date || todayStr(),
          HISTORY_DAYS,
        ]),
        pool.query("SELECT * FROM action_commitments WHERE username = $1 ORDER BY target_date DESC LIMIT 5", [username]),
        pool.query("SELECT * FROM user_profiles WHERE username = $1", [username]),
      ]);

      const history = habitsRes.rows.map(habitRowToJSON);
      const commitments = commRes.rows;
      const userProfile = profRes.rows[0] || null;

      if (!DEEPSEEK_API_KEY) {
        return sendJSON(res, 200, {
          suggestions: fallbackSuggestions(input, history),
          source: "rule-based (chưa cấu hình DEEPSEEK_API_KEY)",
        });
      }

      try {
        const text = await callDeepSeek(input, history, commitments, userProfile);
        sendJSON(res, 200, { suggestions: text, source: "deepseek" });
      } catch (err) {
        console.error(err);
        sendJSON(res, 200, {
          suggestions: fallbackSuggestions(input, history),
          source: "fallback (lỗi kết nối API)",
          detail: String(err),
        });
      }
    }, () => sendJSON(res, 400, { error: "JSON không hợp lệ" }));
    return;
  }

  // 13. AI CHAT
  if (req.method === "POST" && req.url === "/api/chat") {
    const username = requireAuth(req, res);
    if (!username) return;

    readBody(req).then(async (body) => {
      const messages = body.messages || [];
      const userMessage = messages[messages.length - 1]?.content || "";

      try {
        const [habitsRes, commRes, profRes] = await Promise.all([
          pool.query("SELECT * FROM habits WHERE username = $1 ORDER BY date DESC LIMIT $2", [username, HISTORY_DAYS]),
          pool.query("SELECT * FROM action_commitments WHERE username = $1 ORDER BY target_date DESC LIMIT 5", [username]),
          pool.query("SELECT * FROM user_profiles WHERE username = $1", [username]),
        ]);

        const history = habitsRes.rows.map(habitRowToJSON);
        const commitments = commRes.rows;
        const userProfile = profRes.rows[0] || null;

        if (!DEEPSEEK_API_KEY) {
          const reply = fallbackChatResponse(userMessage, history, userProfile);
          return sendJSON(res, 200, { reply, source: "rule-based (offline/no key)" });
        }

        try {
          const reply = await callDeepSeekChat(messages, history, commitments, userProfile);
          sendJSON(res, 200, { reply, source: "deepseek" });
        } catch (err) {
          console.error("DeepSeek Chat Error:", err);
          const fallback = fallbackChatResponse(userMessage, history, userProfile);
          sendJSON(res, 200, {
            reply: `${fallback}\n\n*(Lưu ý: Đang dùng phản hồi dự phòng do gián đoạn mạng)*`,
            source: "fallback",
          });
        }
      } catch (err) {
        console.error(err);
        sendJSON(res, 500, { error: "Lỗi xử lý chat" });
      }
    }, () => sendJSON(res, 400, { error: "JSON không hợp lệ" }));
    return;
  }

  serveStatic(req, res);
});

initSchema().then(() => {
  server.listen(PORT, () => {
    console.log(`Hypnara demo dang chay: http://localhost:${PORT}`);
  });
});
