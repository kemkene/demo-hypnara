import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDbPool, habitRowToJSON } from '@/lib/db';

export async function GET() {
  const username = getSessionUser();
  if (!username) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  try {
    const pool = await getDbPool();
    const result = await pool.query('SELECT * FROM habits WHERE username = $1 ORDER BY date DESC', [username]);
    const habits = result.rows.map(habitRowToJSON);

    const headers = ['Date', 'Sleep Hours', 'Screen Time (h)', 'Game Time (h)', 'Exercise (m)', 'Phone Cutoff (m)', 'Phone Pickups', 'Top App', 'Mood Score', 'Mood Note', 'Schedule'];
    const rows = habits.map((h: any) => [
      h.date,
      h.sleepHours || '',
      h.screenTime || '',
      h.gameTime || '',
      h.exerciseMinutes || '',
      h.phoneCutoffMins !== null ? h.phoneCutoffMins : '',
      h.phonePickups !== null ? h.phonePickups : '',
      `"${(h.topApp || '').replace(/"/g, '""')}"`,
      h.moodScore || '',
      `"${(h.moodNote || '').replace(/"/g, '""')}"`,
      `"${(h.schedule || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="hypnara-habits-${username}.csv"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Lỗi xuất dữ liệu' }, { status: 500 });
  }
}
