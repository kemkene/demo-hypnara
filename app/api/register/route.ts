import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Thiếu username hoặc password' }, { status: 400 });
    }

    const pool = await getDbPool();
    await pool.query('INSERT INTO users(username, password) VALUES($1, $2)', [username.trim(), password]);

    const response = NextResponse.json({ username: username.trim(), message: 'Đăng ký thành công' });
    response.cookies.set('session', username.trim(), {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
    });
    return response;
  } catch (err: any) {
    if (err.code === '23505') {
      return NextResponse.json({ error: 'Username đã tồn tại' }, { status: 409 });
    }
    console.error('Lỗi register:', err);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
