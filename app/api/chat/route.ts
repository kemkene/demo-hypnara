import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDbPool, habitRowToJSON } from '@/lib/db';
import { callDeepSeekAPI } from '@/lib/deepseek';

export async function POST(request: Request) {
  const username = getSessionUser();
  if (!username) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  try {
    const { messages = [] } = await request.json();

    const pool = await getDbPool();
    const [habitsRes, profileRes] = await Promise.all([
      pool.query('SELECT * FROM habits WHERE username = $1 ORDER BY date DESC LIMIT 7', [username]),
      pool.query('SELECT * FROM user_profiles WHERE username = $1', [username]),
    ]);

    const habits = habitsRes.rows.map(habitRowToJSON);
    const profile = profileRes.rows[0] || null;

    const habitContext = habits.length > 0
      ? habits.map((h: any) => `- ${h.date}: Ngủ ${h.sleepHours || '?'}h, Screen ${h.screenTime || '?'}h, Game ${h.gameTime || '?'}h, Exercise ${h.exerciseMinutes || '?'}m, Cutoff ${h.phoneCutoffMins ?? '?'}m`).join('\n')
      : 'Chưa có dữ liệu thói quen';

    const systemPrompt = `Bạn là Trợ lý AI Hypnara — Chuyên gia giấc ngủ và thói quen sinh hoạt số.
Học viên hiện tại: "${username}"
Mục tiêu cá nhân: "${profile?.primary_goal || 'Tối ưu giấc ngủ'}"
Thói quen 7 ngày gần nhất:
${habitContext}

Hãy tư vấn thân thiện, ngắn gọn (dưới 200 từ), tập trung vào giải pháp cụ thể giúp cải thiện chất lượng giấc ngủ và làm chủ công nghệ.`;

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-10), // Giữ 10 tin nhắn gần nhất
    ];

    const reply = await callDeepSeekAPI(apiMessages);
    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error('Lỗi chat API:', err);
    return NextResponse.json({ error: 'Lỗi trợ lý AI: ' + err.message }, { status: 500 });
  }
}
