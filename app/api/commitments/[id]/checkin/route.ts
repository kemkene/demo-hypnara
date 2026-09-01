import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDbPool } from '@/lib/db';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const username = getSessionUser();
  if (!username) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  try {
    const { completed } = await request.json();
    const id = parseInt(params.id, 10);
    if (isNaN(id)) return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 });

    const pool = await getDbPool();
    const result = await pool.query(
      'UPDATE action_commitments SET completed = $1 WHERE id = $2 AND username = $3 RETURNING *',
      [completed === true, id, username]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy cam kết' }, { status: 404 });
    }

    return NextResponse.json({ commitment: result.rows[0], message: 'Đã điểm danh cam kết' });
  } catch (err: any) {
    return NextResponse.json({ error: 'Lỗi điểm danh' }, { status: 500 });
  }
}
