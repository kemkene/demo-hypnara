import { NextResponse } from 'next/server';
import { getSessionUser, todayStr, isValidDateStr, validateHabitInput } from '@/lib/auth';
import { getDbPool, habitRowToJSON } from '@/lib/db';

export async function GET(request: Request) {
  const username = getSessionUser();
  if (!username) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    let page = parseInt(searchParams.get('page') || '1', 10);
    let pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(pageSize) || pageSize < 1) pageSize = 10;
    if (pageSize > 50) pageSize = 50;

    const offset = (page - 1) * pageSize;
    const pool = await getDbPool();

    const [listRes, countRes] = await Promise.all([
      pool.query('SELECT * FROM habits WHERE username = $1 ORDER BY date DESC LIMIT $2 OFFSET $3', [username, pageSize, offset]),
      pool.query('SELECT COUNT(*) AS total FROM habits WHERE username = $1', [username]),
    ]);

    const habits = listRes.rows.map(habitRowToJSON);
    const total = parseInt(countRes.rows[0].total, 10);

    return NextResponse.json({ habits, page, pageSize, total });
  } catch (err: any) {
    return NextResponse.json({ error: 'Lỗi lấy danh sách thói quen' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const username = getSessionUser();
  if (!username) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  try {
    const body = await request.json();
    const entryDate = body.date ? String(body.date).trim() : todayStr();

    if (!isValidDateStr(entryDate)) {
      return NextResponse.json({ error: 'Ngày nhập không hợp lệ. Định dạng YYYY-MM-DD và không quá ngày hôm nay.' }, { status: 400 });
    }

    const validationErrors = validateHabitInput(body);
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: validationErrors.join(' ') }, { status: 400 });
    }

    const sleepHours = body.sleepHours !== undefined && body.sleepHours !== null ? String(body.sleepHours).trim() : null;
    const screenTime = body.screenTime !== undefined && body.screenTime !== null ? String(body.screenTime).trim() : null;
    const gameTime = body.gameTime !== undefined && body.gameTime !== null ? String(body.gameTime).trim() : null;
    const exerciseMinutes = body.exerciseMinutes !== undefined && body.exerciseMinutes !== null ? String(body.exerciseMinutes).trim() : null;
    const mood = body.mood !== undefined && body.mood !== null ? String(body.mood).trim() : null;
    const schedule = body.schedule !== undefined && body.schedule !== null ? String(body.schedule).trim() : null;
    const phoneCutoffMins = body.phoneCutoffMins !== undefined && body.phoneCutoffMins !== null && body.phoneCutoffMins !== '' ? parseInt(body.phoneCutoffMins, 10) : null;
    const phonePickups = body.phonePickups !== undefined && body.phonePickups !== null && body.phonePickups !== '' ? parseInt(body.phonePickups, 10) : null;
    const topApp = body.topApp !== undefined && body.topApp !== null ? String(body.topApp).trim() : null;
    const moodScore = body.moodScore !== undefined && body.moodScore !== null && body.moodScore !== '' ? parseInt(body.moodScore, 10) : null;
    const moodNote = body.moodNote !== undefined && body.moodNote !== null ? String(body.moodNote).trim() : null;

    const pool = await getDbPool();
    const result = await pool.query(
      `INSERT INTO habits (
        username, date, sleep_hours, screen_time, game_time, exercise_minutes, mood, schedule,
        phone_cutoff_mins, phone_pickups, top_app, mood_score, mood_note
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
        entryDate,
        sleepHours,
        screenTime,
        gameTime,
        exerciseMinutes,
        mood,
        schedule,
        phoneCutoffMins,
        phonePickups,
        topApp,
        moodScore,
        moodNote,
      ]
    );

    return NextResponse.json({ habit: habitRowToJSON(result.rows[0]), message: 'Đã lưu thói quen thành công' });
  } catch (err: any) {
    console.error('Lỗi lưu habits:', err);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
