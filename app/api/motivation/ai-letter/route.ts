import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDbPool, habitRowToJSON } from '@/lib/db';
import { callDeepSeekAPI } from '@/lib/deepseek';

export async function POST() {
  const username = getSessionUser();
  if (!username) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  try {
    const pool = await getDbPool();
    const [habitsRes, profileRes] = await Promise.all([
      pool.query('SELECT * FROM habits WHERE username = $1 ORDER BY date DESC LIMIT 14', [username]),
      pool.query('SELECT * FROM user_profiles WHERE username = $1', [username]),
    ]);

    const habits = habitsRes.rows.map(habitRowToJSON);
    const profile = profileRes.rows[0] || null;

    const systemPrompt = `Bạn là Chuyên gia Tâm lý & Huấn luyện viên Kỷ luật Giấc ngủ Hypnara.
Hãy viết một **Thư Động Lực Chân Thành & Truyền Cảm Hứng (Motivational Letter)** dài khoảng 250 - 350 từ gửi riêng cho người dùng "${username}".

Cấu trúc thư:
1. Lời chào ấm áp & ghi nhận sự nỗ lực duy trì kỷ luật.
2. Nhận xét tinh tế dựa trên dữ liệu thật (thời lượng ngủ, screen time, thói quen tắt máy).
3. Lời khuyên & thông điệp tiếp sức mạnh mẽ giúp học viên vượt qua sự mệt mỏi, làm chủ thiết bị số và kiên trì với mục tiêu lớn.
4. Lời chúc buổi tối đầy năng lượng tích cực.`;

    const userPrompt = `Tên học viên: ${username}
Mục tiêu cá nhân: ${profile?.primary_goal || 'Tối ưu giấc ngủ và kỷ luật bản thân'}
Lịch sử thói quen 14 ngày qua:
${habits.map((h: any) => `- ${h.date}: Ngủ ${h.sleepHours || '?'}h, ScreenTime ${h.screenTime || '?'}h, Cutoff ${h.phoneCutoffMins ?? '?'}p, Mood ${h.moodScore || h.mood || '?'}`).join('\n')}`;

    const letter = await callDeepSeekAPI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    return NextResponse.json({ letter });
  } catch (err: any) {
    console.error('Lỗi tạo thư động lực:', err);
    return NextResponse.json({ error: 'Lỗi tạo thư động lực từ AI: ' + err.message }, { status: 500 });
  }
}
