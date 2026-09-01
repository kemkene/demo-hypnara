import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Thiếu username hoặc password' }, { status: 400 });
    }

    const pool = await getDbPool();
    const result = await pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username.trim(), password]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Sai username hoặc password' }, { status: 401 });
    }

    const response = NextResponse.json({ username: username.trim() });
    response.cookies.set('session', username.trim(), {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
    });
    return response;
  } catch (err: any) {
    console.error('Lỗi login:', err);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
