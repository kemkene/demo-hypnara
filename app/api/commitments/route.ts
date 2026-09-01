import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDbPool } from '@/lib/db';

export async function GET() {
  const username = getSessionUser();
  if (!username) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  try {
    const pool = await getDbPool();
    const result = await pool.query('SELECT * FROM action_commitments WHERE username = $1 ORDER BY target_date DESC', [username]);
    return NextResponse.json({ commitments: result.rows });
  } catch (err: any) {
    return NextResponse.json({ error: 'Lỗi lấy danh sách cam kết' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const username = getSessionUser();
  if (!username) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  try {
    const { title, targetDate } = await request.json();
    if (!title || !targetDate) {
      return NextResponse.json({ error: 'Thiếu thông tin tiêu đề hoặc ngày cam kết' }, { status: 400 });
    }

    const pool = await getDbPool();
    const result = await pool.query(
      'INSERT INTO action_commitments (username, title, target_date) VALUES ($1, $2, $3) RETURNING *',
      [username, title.trim(), targetDate]
    );

    return NextResponse.json({ commitment: result.rows[0], message: 'Đã tạo cam kết mới' });
  } catch (err: any) {
    return NextResponse.json({ error: 'Lỗi tạo cam kết' }, { status: 500 });
  }
}
