import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDbPool } from '@/lib/db';

export async function GET() {
  const username = getSessionUser();
  if (!username) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  try {
    const pool = await getDbPool();
    const res = await pool.query('SELECT * FROM user_profiles WHERE username = $1', [username]);
    return NextResponse.json({ profile: res.rows[0] || null });
  } catch (err: any) {
    return NextResponse.json({ error: 'Lỗi lấy profile' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const username = getSessionUser();
  if (!username) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  try {
    const { primaryGoal, reminderTime, reminders } = await request.json();
    const pool = await getDbPool();
    const remindersJson = reminders && Array.isArray(reminders) ? JSON.stringify(reminders) : null;
    const primaryReminderTime = reminderTime || (reminders && reminders[0]?.time) || '22:00';

    await pool.query(
      `INSERT INTO user_profiles (username, primary_goal, reminder_time, reminders, updated_at)
       VALUES ($1, $2, $3, COALESCE($4::jsonb, '[]'::jsonb), now())
       ON CONFLICT (username) DO UPDATE SET
         primary_goal = EXCLUDED.primary_goal,
         reminder_time = EXCLUDED.reminder_time,
         reminders = COALESCE($4::jsonb, user_profiles.reminders, '[]'::jsonb),
         updated_at = now()`,
      [username, primaryGoal || '', primaryReminderTime, remindersJson]
    );

    return NextResponse.json({ message: 'Lưu profile thành công' });
  } catch (err: any) {
    return NextResponse.json({ error: 'Lỗi lưu profile' }, { status: 500 });
  }
}
