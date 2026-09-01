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
    const { primaryGoal, reminderTime } = await request.json();
    const pool = await getDbPool();
    await pool.query(
      `INSERT INTO user_profiles (username, primary_goal, reminder_time, updated_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (username) DO UPDATE SET
         primary_goal = EXCLUDED.primary_goal,
         reminder_time = EXCLUDED.reminder_time,
         updated_at = now()`,
      [username, primaryGoal || '', reminderTime || '22:00']
    );

    return NextResponse.json({ message: 'Lưu profile thành công' });
  } catch (err: any) {
    return NextResponse.json({ error: 'Lỗi lưu profile' }, { status: 500 });
  }
}
