import { NextResponse } from 'next/server';
import { getSessionUser, todayStr, isValidDateStr } from '@/lib/auth';
import { getDbPool, habitRowToJSON } from '@/lib/db';
import { callDeepSeekAPI, buildUserPrompt } from '@/lib/deepseek';

export async function POST(request: Request) {
  const username = getSessionUser();
  if (!username) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  try {
    const currentHabits = await request.json();
    const targetDate = currentHabits.date ? String(currentHabits.date).trim() : todayStr();

    if (!isValidDateStr(targetDate)) {
      return NextResponse.json({ error: 'Ngày không hợp lệ.' }, { status: 400 });
    }

    const pool = await getDbPool();
    const [historyRes, profileRes] = await Promise.all([
      pool.query('SELECT * FROM habits WHERE username = $1 AND date < $2 ORDER BY date DESC LIMIT 14', [username, targetDate]),
      pool.query('SELECT * FROM user_profiles WHERE username = $1', [username]),
    ]);

    const habitHistory = historyRes.rows.map(habitRowToJSON);
    const userProfile = profileRes.rows[0] || null;

    const userPrompt = buildUserPrompt(currentHabits, habitHistory, userProfile);

    const systemPrompt = `Bạn là Chuyên gia Tối ưu Giấc ngủ và Digital Wellbeing của Hypnara.
Nhiệm vụ: Phân tích thói quen (ngủ, screen time, game, vận động, tắt điện thoại trước ngủ) và lịch sử của người dùng để đưa ra phản hồi khoa học, thực tế, dễ áp dụng.

Yêu cầu định dạng phản hồi HTML ngắn gọn (dùng các thẻ <p>, <ul>, <li>, <strong>, <em>, không dùng markdown code block):
1. **Phân tích ngắn**: Điểm sáng và nguy cơ (đặc biệt nhấn mạnh việc tắt máy trước ngủ & vận động).
2. **3 Gợi ý hành động**: Cụ thể, khả thi ngay hôm nay.
3. **Lời chúc / Động lực ngắn**.`;

    const suggestion = await callDeepSeekAPI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    return NextResponse.json({ suggestion });
  } catch (err: any) {
    console.error('Lỗi suggest API:', err);
    return NextResponse.json({ error: 'Lỗi lấy gợi ý AI: ' + err.message }, { status: 500 });
  }
}
