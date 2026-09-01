import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDbPool } from '@/lib/db';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const username = getSessionUser();
  if (!username) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 });

    const pool = await getDbPool();
    await pool.query('DELETE FROM action_commitments WHERE id = $1 AND username = $2', [id, username]);

    return NextResponse.json({ message: 'Đã xóa cam kết' });
  } catch (err: any) {
    return NextResponse.json({ error: 'Lỗi xóa cam kết' }, { status: 500 });
  }
}
