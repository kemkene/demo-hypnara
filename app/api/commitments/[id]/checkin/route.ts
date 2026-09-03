import { NextResponse } from 'next/server';
import { getSessionUser, todayStr } from '@/lib/auth';
import { getDbPool } from '@/lib/db';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const username = getSessionUser();
  if (!username) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  try {
    const { completed } = await request.json();
    const id = parseInt(params.id, 10);
    if (isNaN(id)) return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 });

    const pool = await getDbPool();
    const checkRes = await pool.query(
      'SELECT * FROM action_commitments WHERE id = $1 AND username = $2',
      [id, username]
    );

    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy cam kết' }, { status: 404 });
    }

    const commitment = checkRes.rows[0];
    const today = todayStr();

    // Constraint 1: Cannot complete a commitment before its target date arrives
    if (commitment.target_date > today) {
      return NextResponse.json(
        {
          error: `Chưa đến ngày thực hiện cam kết (${commitment.target_date}). Bạn chỉ có thể điểm danh vào hoặc sau ngày này.`,
        },
        { status: 400 }
      );
    }

    // Constraint 2: Cannot repeatedly toggle completed back and forth to manipulate completion rate
    if (commitment.completed === true && completed === false) {
      return NextResponse.json(
        {
          error: 'Cam kết này đã được ghi nhận hoàn thành và không thể hủy để đảm bảo tính trung thực của chỉ số kỷ luật.',
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      'UPDATE action_commitments SET completed = $1 WHERE id = $2 AND username = $3 RETURNING *',
      [completed === true, id, username]
    );

    return NextResponse.json({ commitment: result.rows[0], message: 'Đã điểm danh cam kết thành công' });
  } catch (err: any) {
    return NextResponse.json({ error: 'Lỗi điểm danh: ' + err.message }, { status: 500 });
  }
}
