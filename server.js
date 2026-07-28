// Hypnara demo server — Node core (http) + pg (Postgres client), khong dung framework/ORM.
const http = require("http");
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
const DEEPSEEK_MODEL = "deepseek-v4-flash"; // deepseek-chat bi deprecate 2026/07/24
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const HISTORY_DAYS = 10; // so ban ghi gan nhat (theo ngay) dua vao prompt AI, khong lien quan phan trang UI
const LIST_PAGE_SIZE_DEFAULT = 10;
const LIST_PAGE_SIZE_MAX = 50;

if (!process.env.DATABASE_URL) {
  console.error("Thieu DATABASE_URL trong .env — xem .env.example.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// pg emit 'error' tren idle client khi mat ket noi ngoai y muon (vd Postgres restart) —
// khong bat se lam crash ca process (unhandled 'error' event).
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
    `);
  } catch (err) {
    if (retriesLeft <= 0) {
      console.error("Khong ket noi duoc Postgres:", err.message);
      process.exit(1);
    }
    // Postgres co the chua san sang ngay sau "docker-compose up" — cho roi thu lai.
    await new Promise((r) => setTimeout(r, 1000));
    return initSchema(retriesLeft - 1);
  }
}

function habitRowToJSON(row) {
  return {
    username: row.username,
    date: row.date,
    sleepHours: row.sleep_hours,
    screenTime: row.screen_time,
    gameTime: row.game_time,
    exerciseMinutes: row.exercise_minutes,
    mood: row.mood,
    schedule: row.schedule,
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

// ponytail: cookie session la plaintext username, khong ky/khong hash/khong het han.
// Demo giang day theo yeu cau (khong can bao mat) — nang cap thuc te can: cookie ky (HMAC)
// hoac token ngau nhien tra cuu server-side, va hash password (bcrypt/scrypt).
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

const SYSTEM_PROMPT = `Ban la Hypnara, mot AI coach suc khoe so than thien, dua theo mo hinh hanh vi Fogg (Dong luc - Kha nang - Kich hoat) va nguyen tac "thoi quen nho".
Dua tren thoi quen va lich trinh hom nay cua nguoi dung, hay dua ra 2-3 goi y THAY DOI NHO, cu the, kha thi ngay hom nay (vi du: "ngu som hon 30 phut", "giam choi game buoi toi 20 phut", "di bo 10 phut sau bua trua").
Yeu cau:
- Khong phan xet, khong noi giao dieu, giong dieu gan gui nhu mot nguoi ban.
- Moi goi y chi 1-2 cau, neu ro HANH DONG CU THE va vi sao no giup ich.
- Tra loi bang tieng Viet, dinh dang danh sach ngan gon, khong thua chu.
- Day la demo giang day, KHONG duoc dua ra chan doan hay loi khuyen y te.`;

function formatHistory(history) {
  if (!history || history.length === 0) {
    return "Chua co du lieu thoi quen truoc do (nguoi dung moi).";
  }
  return history
    .map(
      (h) =>
        `  - ${h.date}: ngu ${h.sleepHours || "?"}h, man hinh ${h.screenTime || "?"}h, game ${
          h.gameTime || "?"
        }h, van dong ${h.exerciseMinutes || "?"}phut, tam trang: ${h.mood || "khong ro"}`
    )
    .join("\n");
}

function buildUserPrompt({ sleepHours, screenTime, gameTime, exerciseMinutes, mood, schedule }, history) {
  return `Lich su thoi quen ${HISTORY_DAYS} ngay gan nhat cua nguoi dung (khong tinh hom nay):
${formatHistory(history)}

Du lieu thoi quen hom nay cua nguoi dung:
- So gio ngu dem qua: ${sleepHours || "khong ro"} gio
- Tong thoi gian dung man hinh: ${screenTime || "khong ro"} gio
- Thoi gian choi game: ${gameTime || "khong ro"} gio
- Thoi gian van dong: ${exerciseMinutes || "khong ro"} phut
- Tam trang hom nay: ${mood || "khong ro"}
- Lich trinh / ke hoach hom nay: ${schedule || "khong co ghi chu"}

Hay dua ra goi y thay doi nho de cai thien, co the nhac den xu huong tu lich su neu phu hop.`;
}

function fallbackSuggestions(input) {
  const out = [];
  const sleep = parseFloat(input.sleepHours);
  const game = parseFloat(input.gameTime);
  const exercise = parseFloat(input.exerciseMinutes);
  if (!isNaN(sleep) && sleep < 7) {
    out.push(`Ban ngu ${sleep}h, hoi it. Thu di ngu som hon 30 phut toi nay va tat thong bao dien thoai truoc gio ngu.`);
  }
  if (!isNaN(game) && game > 2) {
    out.push(`Thoi gian choi game hom nay kha nhieu (${game}h). Thu dat bao thuc 20 phut truoc khi choi de tu nhac minh dung dung luc.`);
  }
  if (!isNaN(exercise) && exercise < 20) {
    out.push("Van dong hom nay con it. Mot cuoc di bo 10 phut sau bua an cung du tao khac biet.");
  }
  if (out.length === 0) {
    out.push("Thoi quen hom nay kha on dinh! Duy tri nhip nay va thu them 1 thay doi nho moi tuan.");
  }
  return out;
}

async function callDeepSeek(input, history) {
  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(input, history) },
      ],
      stream: false,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`DeepSeek API ${res.status}: ${errText}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "Khong nhan duoc goi y.";
}

const MIME = { ".html": "text/html", ".css": "text/css", ".js": "application/javascript" };

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
  if (req.method === "POST" && req.url === "/api/register") {
    readBody(req).then(async ({ username, password }) => {
      if (!username || !password) return sendJSON(res, 400, { error: "Thieu username hoac password" });
      try {
        await pool.query("INSERT INTO users (username, password) VALUES ($1, $2)", [username, password]);
        sendJSON(res, 200, { username }, { "Set-Cookie": `session=${encodeURIComponent(username)}; Path=/` });
      } catch (err) {
        if (err.code === "23505") return sendJSON(res, 409, { error: "Username da ton tai" });
        console.error(err);
        sendJSON(res, 500, { error: "Loi server" });
      }
    }, () => sendJSON(res, 400, { error: "JSON khong hop le" }));
    return;
  }

  if (req.method === "POST" && req.url === "/api/login") {
    readBody(req).then(async ({ username, password }) => {
      const { rows } = await pool.query("SELECT password FROM users WHERE username = $1", [username]);
      const user = rows[0];
      if (!user || user.password !== password) return sendJSON(res, 401, { error: "Sai username hoac password" });
      sendJSON(res, 200, { username }, { "Set-Cookie": `session=${encodeURIComponent(username)}; Path=/` });
    }, () => sendJSON(res, 400, { error: "JSON khong hop le" }));
    return;
  }

  if (req.method === "POST" && req.url === "/api/logout") {
    sendJSON(res, 200, { ok: true }, { "Set-Cookie": "session=; Path=/; Max-Age=0" });
    return;
  }

  if (req.method === "GET" && req.url === "/api/me") {
    sendJSON(res, 200, { username: getSessionUser(req) });
    return;
  }

  if (req.method === "POST" && req.url === "/api/habits") {
    const username = requireAuth(req, res);
    if (!username) return;
    readBody(req).then(async (input) => {
      let date = todayStr();
      if (input.date) {
        if (!isValidDateStr(input.date)) return sendJSON(res, 400, { error: "Ngay khong hop le" });
        date = input.date;
      }
      const { rows } = await pool.query(
        `INSERT INTO habits (username, date, sleep_hours, screen_time, game_time, exercise_minutes, mood, schedule)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (username, date) DO UPDATE SET
           sleep_hours = EXCLUDED.sleep_hours,
           screen_time = EXCLUDED.screen_time,
           game_time = EXCLUDED.game_time,
           exercise_minutes = EXCLUDED.exercise_minutes,
           mood = EXCLUDED.mood,
           schedule = EXCLUDED.schedule
         RETURNING *`,
        [username, date, input.sleepHours, input.screenTime, input.gameTime, input.exerciseMinutes, input.mood, input.schedule]
      );
      sendJSON(res, 200, { ok: true, record: habitRowToJSON(rows[0]) });
    }, () => sendJSON(res, 400, { error: "JSON khong hop le" }));
    return;
  }

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

  if (req.method === "POST" && req.url === "/api/suggest") {
    const username = requireAuth(req, res);
    if (!username) return;
    readBody(req).then(async (input) => {
      const { rows } = await pool.query(
        "SELECT * FROM habits WHERE username = $1 AND date <> $2 ORDER BY date DESC LIMIT $3",
        [username, todayStr(), HISTORY_DAYS]
      );
      const history = rows.map(habitRowToJSON);

      if (!DEEPSEEK_API_KEY) {
        return sendJSON(res, 200, {
          suggestions: fallbackSuggestions(input),
          source: "rule-based (chua cau hinh DEEPSEEK_API_KEY)",
        });
      }

      try {
        const text = await callDeepSeek(input, history);
        sendJSON(res, 200, { suggestions: text, source: "deepseek" });
      } catch (err) {
        console.error(err);
        sendJSON(res, 502, { error: "Loi goi API DeepSeek", detail: String(err) });
      }
    }, () => sendJSON(res, 400, { error: "JSON khong hop le" }));
    return;
  }

  serveStatic(req, res);
});

initSchema().then(() => {
  server.listen(PORT, () => {
    console.log(`Hypnara demo dang chay: http://localhost:${PORT}`);
  });
});
