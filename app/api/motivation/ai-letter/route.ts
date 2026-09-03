import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDbPool, habitRowToJSON } from '@/lib/db';
import { getAiMotivationalLetter, HISTORY_DAYS } from '@/lib/deepseek';

export async function POST() {
  const username = getSessionUser();
  if (!username) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  try {
    const pool = await getDbPool();
    const [habitsRes, profileRes] = await Promise.all([
      pool.query('SELECT * FROM habits WHERE username = $1 ORDER BY date DESC LIMIT $2', [username, HISTORY_DAYS]),
      pool.query('SELECT * FROM user_profiles WHERE username = $1', [username]),
    ]);

    const habits = habitsRes.rows.map(habitRowToJSON);
    const profile = profileRes.rows[0] || null;

    const { letter, isOffline } = await getAiMotivationalLetter(username, profile, habits);

    return NextResponse.json({ letter, isOffline });
  } catch (err: any) {
    console.error('Lỗi tạo thư động lực:', err);
    return NextResponse.json({ error: 'Lỗi tạo thư động lực từ AI: ' + err.message }, { status: 500 });
  }
}
