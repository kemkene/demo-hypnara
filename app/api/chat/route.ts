import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDbPool, habitRowToJSON } from '@/lib/db';
import { getAiChatReply, HISTORY_DAYS } from '@/lib/deepseek';

export async function POST(request: Request) {
  const username = getSessionUser();
  if (!username) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  try {
    const { messages = [] } = await request.json();

    const pool = await getDbPool();
    const [habitsRes, profileRes] = await Promise.all([
      pool.query('SELECT * FROM habits WHERE username = $1 ORDER BY date DESC LIMIT $2', [username, HISTORY_DAYS]),
      pool.query('SELECT * FROM user_profiles WHERE username = $1', [username]),
    ]);

    const habits = habitsRes.rows.map(habitRowToJSON);
    const profile = profileRes.rows[0] || null;

    const { reply, isOffline } = await getAiChatReply(messages, habits, profile, username);
    return NextResponse.json({ reply, isOffline });
  } catch (err: any) {
    console.error('Lỗi chat API:', err);
    return NextResponse.json({ error: 'Lỗi trợ lý AI: ' + err.message }, { status: 500 });
  }
}
