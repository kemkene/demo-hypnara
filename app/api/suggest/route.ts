import { NextResponse } from 'next/server';
import { getSessionUser, todayStr, isValidDateStr } from '@/lib/auth';
import { getDbPool, habitRowToJSON } from '@/lib/db';
import { getAiSuggestion, HISTORY_DAYS } from '@/lib/deepseek';

export async function POST(request: Request) {
  const username = getSessionUser();
  if (!username) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  try {
    const currentHabits = await request.json();
    const today = todayStr();

    // Spec FR-005: AI suggestions are strictly for "today", not for backdated past entries
    if (currentHabits.date && String(currentHabits.date).trim() !== today) {
      return NextResponse.json(
        {
          error: `Gợi ý AI chỉ áp dụng cho dữ liệu ngày hôm nay (${today}). Không hỗ trợ gợi ý cho các ngày nhập bù trong quá khứ theo quy chuẩn nghiệp vụ (FR-005).`,
        },
        { status: 400 }
      );
    }

    const pool = await getDbPool();
    const [historyRes, profileRes] = await Promise.all([
      pool.query(
        'SELECT * FROM habits WHERE username = $1 AND date < $2 ORDER BY date DESC LIMIT $3',
        [username, today, HISTORY_DAYS]
      ),
      pool.query('SELECT * FROM user_profiles WHERE username = $1', [username]),
    ]);

    const habitHistory = historyRes.rows.map(habitRowToJSON);
    const userProfile = profileRes.rows[0] || null;

    const { suggestion, isOffline, notice } = await getAiSuggestion(currentHabits, habitHistory, userProfile);

    return NextResponse.json({ suggestion, isOffline, notice });
  } catch (err: any) {
    console.error('Lỗi suggest API:', err);
    return NextResponse.json({ error: 'Lỗi lấy gợi ý AI: ' + err.message }, { status: 500 });
  }
}
