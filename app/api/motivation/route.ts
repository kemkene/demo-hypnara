import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { calculateStreak, todayStr } from '@/lib/date';
import { getDbPool, habitRowToJSON } from '@/lib/db';

export async function GET() {
  const username = getSessionUser();
  if (!username) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  try {
    const pool = await getDbPool();
    const [habitsRes, commitmentsRes] = await Promise.all([
      pool.query('SELECT * FROM habits WHERE username = $1 ORDER BY date DESC LIMIT 30', [username]),
      pool.query('SELECT * FROM action_commitments WHERE username = $1 ORDER BY target_date DESC', [username]),
    ]);

    const habits = habitsRes.rows.map(habitRowToJSON);
    const commitments = commitmentsRes.rows;

    const dates = new Set<string>(habits.map((h: any) => h.date));
    const habitStreak = calculateStreak(dates, todayStr());

    const quotes = [
      { text: "Giấc ngủ là chiếc giường êm ái nhất cho những ai chiến thắng chính mình mỗi ngày.", author: "Khuyết danh" },
      { text: "Tương lai thuộc về những ai kỷ luật với sức khỏe và thói quen ban đêm của họ.", author: "Jim Rohn" },
      { text: "Không có chiến thắng nào lớn hơn chiến thắng việc làm chủ chiếc điện thoại trước khi đi ngủ.", author: "Robin Sharma" },
      { text: "Chăm sóc giấc ngủ hôm nay là cách nâng cấp trí tuệ và năng lượng cho ngày mai.", author: "Matthew Walker" },
      { text: "Kỷ luật là cầu nối giữa mục tiêu và thành tựu.", author: "Jim Rohn" },
    ];
    const todayIndex = new Date().getDate() % quotes.length;
    const dailyQuote = quotes[todayIndex];

    const badges = [
      { id: 'first_habit', title: 'Khởi đầu xanh', desc: 'Nhập thói quen ngày đầu tiên', icon: '🌱', unlocked: habits.length >= 1 },
      { id: 'streak_3', title: 'Bền bỉ 3 ngày', desc: 'Giữ chuỗi nhập 3 ngày liên tiếp', icon: '🔥', unlocked: habitStreak >= 3 },
      { id: 'streak_7', title: 'Chiến binh 1 tuần', desc: 'Chuỗi nhập thói quen 7 ngày', icon: '🏆', unlocked: habitStreak >= 7 },
      { id: 'cutoff_master', title: 'Master Tắt Máy', desc: 'Có ngày tắt máy trước ngủ ≥ 30p', icon: '🌙', unlocked: habits.some((h: any) => h.phoneCutoffMins >= 30) },
      { id: 'exercise_pro', title: 'Năng lượng sống', desc: 'Vận động ≥ 45 phút/ngày', icon: '⚡', unlocked: habits.some((h: any) => parseFloat(h.exerciseMinutes) >= 45) },
    ];

    return NextResponse.json({
      streak: habitStreak,
      dailyQuote,
      badges,
      commitments,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Lỗi lấy dữ liệu động lực' }, { status: 500 });
  }
}
