import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { yesterdayStr } from '@/lib/date';
import { getDbPool, habitRowToJSON } from '@/lib/db';

export async function GET() {
  const username = getSessionUser();
  if (!username) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  try {
    const yesterdayDate = yesterdayStr();

    const pool = await getDbPool();
    const result = await pool.query('SELECT * FROM habits WHERE username = $1 AND date = $2', [username, yesterdayDate]);

    if (result.rows.length === 0) {
      return NextResponse.json({ habit: null });
    }
    return NextResponse.json({ habit: habitRowToJSON(result.rows[0]) });
  } catch (err: any) {
    return NextResponse.json({ error: 'Lỗi lấy dữ liệu hôm qua' }, { status: 500 });
  }
}
