import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDbPool, habitRowToJSON } from '@/lib/db';

export async function GET() {
  const username = getSessionUser();
  if (!username) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  try {
    const pool = await getDbPool();
    const [habitsResult, commitmentsResult, profileResult] = await Promise.all([
      pool.query('SELECT * FROM habits WHERE username = $1 ORDER BY date DESC LIMIT 60', [username]),
      pool.query('SELECT * FROM action_commitments WHERE username = $1 ORDER BY target_date DESC LIMIT 30', [username]),
      pool.query('SELECT * FROM user_profiles WHERE username = $1', [username]),
    ]);

    const habits = habitsResult.rows.map(habitRowToJSON);
    const commitments = commitmentsResult.rows;
    const userProfile = profileResult.rows[0] || null;
    const totalCount = habits.length;

    let habitStreak = 0;
    if (habits.length > 0) {
      const dates = new Set(habits.map((h: any) => h.date));
      let checkDate = new Date();
      const checkStr = checkDate.toISOString().slice(0, 10);
      if (!dates.has(checkStr)) checkDate.setDate(checkDate.getDate() - 1);
      while (true) {
        const s = checkDate.toISOString().slice(0, 10);
        if (dates.has(s)) {
          habitStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else break;
      }
    }

    const recent7 = habits.slice(0, 7);
    let sumSleep = 0, countSleep = 0;
    let sumScreen = 0, countScreen = 0;
    let sumGame = 0, countGame = 0;
    let sumExercise = 0, countExercise = 0;
    let sumCutoff = 0, countCutoff = 0;
    let sumPickups = 0, countPickups = 0;
    let sumMoodScore = 0, countMoodScore = 0;
    const appCounts: Record<string, number> = {};

    for (const h of habits) {
      if (h.topApp) appCounts[h.topApp] = (appCounts[h.topApp] || 0) + 1;
    }

    for (const h of recent7) {
      const s = parseFloat(h.sleepHours);
      if (!isNaN(s)) { sumSleep += s; countSleep++; }
      const sc = parseFloat(h.screenTime);
      if (!isNaN(sc)) { sumScreen += sc; countScreen++; }
      const g = parseFloat(h.gameTime);
      if (!isNaN(g)) { sumGame += g; countGame++; }
      const e = parseFloat(h.exerciseMinutes);
      if (!isNaN(e)) { sumExercise += e; countExercise++; }
      if (h.phoneCutoffMins !== null) { sumCutoff += h.phoneCutoffMins; countCutoff++; }
      if (h.phonePickups !== null) { sumPickups += h.phonePickups; countPickups++; }
      if (h.moodScore !== null) { sumMoodScore += h.moodScore; countMoodScore++; }
    }

    const avgSleep = countSleep ? +(sumSleep / countSleep).toFixed(1) : 0;
    const avgScreen = countScreen ? +(sumScreen / countScreen).toFixed(1) : 0;
    const avgGame = countGame ? +(sumGame / countGame).toFixed(1) : 0;
    const avgExercise = countExercise ? Math.round(sumExercise / countExercise) : 0;
    const avgCutoff = countCutoff ? Math.round(sumCutoff / countCutoff) : 0;
    const avgPickups = countPickups ? Math.round(sumPickups / countPickups) : 0;
    const avgMoodScore = countMoodScore ? +(sumMoodScore / countMoodScore).toFixed(1) : 0;

    let mostFrequentTopApp = Object.keys(appCounts).sort((a, b) => appCounts[b] - appCounts[a])[0] || 'Chưa có';

    let sleepScore = 85;
    if (countSleep > 0) {
      let penalty = 0;
      if (avgSleep < 7) penalty += (7 - avgSleep) * 12;
      else if (avgSleep > 9) penalty += (avgSleep - 9) * 6;

      if (avgScreen > 6) penalty += (avgScreen - 6) * 4;
      if (avgGame > 3) penalty += (avgGame - 3) * 5;
      if (avgCutoff < 15) penalty += 10;
      if (avgExercise < 20) penalty += 8;
      else if (avgExercise >= 30) penalty -= 5;

      sleepScore = Math.max(30, Math.min(99, Math.round(100 - penalty)));
    } else {
      sleepScore = 0;
    }

    const correlations: any[] = [];
    const cutoffLow = habits.filter((h: any) => h.phoneCutoffMins !== null && h.phoneCutoffMins < 15 && parseFloat(h.sleepHours));
    const cutoffHigh = habits.filter((h: any) => h.phoneCutoffMins !== null && h.phoneCutoffMins >= 30 && parseFloat(h.sleepHours));
    if (cutoffLow.length >= 2 && cutoffHigh.length >= 2) {
      const avgSleepLow = cutoffLow.reduce((a: number, b: any) => a + parseFloat(b.sleepHours), 0) / cutoffLow.length;
      const avgSleepHigh = cutoffHigh.reduce((a: number, b: any) => a + parseFloat(b.sleepHours), 0) / cutoffHigh.length;
      const diff = +(avgSleepHigh - avgSleepLow).toFixed(1);
      if (diff > 0.3) {
        correlations.push({
          type: 'positive',
          title: 'Tắt điện thoại sớm giúp ngủ nhiều hơn',
          insight: `Những ngày bạn tắt điện thoại trước khi ngủ ≥ 30 phút, thời lượng ngủ trung bình cao hơn **${diff} giờ** so với những ngày dùng sát giờ ngủ.`,
        });
      }
    }

    const chronHabits = [...habits].sort((a: any, b: any) => a.date.localeCompare(b.date));
    let screenAfterShortSleep: number[] = [], screenAfterNormalSleep: number[] = [];
    for (let i = 0; i < chronHabits.length - 1; i++) {
      const current = chronHabits[i];
      const next = chronHabits[i + 1];
      const sleep = parseFloat(current.sleepHours);
      const nextScreen = parseFloat(next.screenTime);
      if (!isNaN(sleep) && !isNaN(nextScreen)) {
        if (sleep < 6.5) screenAfterShortSleep.push(nextScreen);
        else if (sleep >= 7.0) screenAfterNormalSleep.push(nextScreen);
      }
    }

    if (screenAfterShortSleep.length >= 2 && screenAfterNormalSleep.length >= 2) {
      const avgScreenShort = screenAfterShortSleep.reduce((a, b) => a + b, 0) / screenAfterShortSleep.length;
      const avgScreenNorm = screenAfterNormalSleep.reduce((a, b) => a + b, 0) / screenAfterNormalSleep.length;
      const diff = +(avgScreenShort - avgScreenNorm).toFixed(1);
      if (diff > 0.5) {
        correlations.push({
          type: 'warning',
          title: 'Thiếu ngủ làm tăng Screen Time hôm sau',
          insight: `Khi đêm trước bạn ngủ dưới 6.5h, thời gian dùng màn hình ngày hôm sau có xu hướng tăng thêm **${diff} giờ** do mệt mỏi và giảm khả năng tập trung.`,
        });
      }
    }

    const withExercise = habits.filter((h: any) => parseFloat(h.exerciseMinutes) >= 30 && h.moodScore);
    const withoutExercise = habits.filter((h: any) => parseFloat(h.exerciseMinutes) < 15 && h.moodScore);
    if (withExercise.length >= 2 && withoutExercise.length >= 2) {
      const avgMoodEx = withExercise.reduce((a: number, b: any) => a + b.moodScore, 0) / withExercise.length;
      const avgMoodNo = withoutExercise.reduce((a: number, b: any) => a + b.moodScore, 0) / withoutExercise.length;
      const diff = +(avgMoodEx - avgMoodNo).toFixed(1);
      if (diff > 0.4) {
        correlations.push({
          type: 'positive',
          title: 'Vận động nâng cao tâm trạng rõ rệt',
          insight: `Những ngày có vận động ≥ 30 phút, điểm tâm trạng trung bình của bạn cao hơn **${diff} điểm (thang 5)**.`,
        });
      }
    }

    if (correlations.length === 0) {
      correlations.push({
        type: 'info',
        title: 'Quy tắc vàng 30 phút trước ngủ',
        insight: 'Dữ liệu y học cho thấy việc ngừng dùng điện thoại 30 phút trước khi ngủ giúp rút ngắn thời gian vào giấc 40% và ngủ sâu hơn.',
      });
    }

    const totalCommitments = commitments.length;
    const completedCommitments = commitments.filter((c: any) => c.completed === true).length;
    const completionRate = totalCommitments > 0 ? Math.round((completedCommitments / totalCommitments) * 100) : 0;

    const totalExerciseWeek = recent7.reduce((a: number, b: any) => a + (parseFloat(b.exerciseMinutes) || 0), 0);
    const weeklyCompliance = {
      sleepAvg: avgSleep,
      sleepTarget: '7.0 - 9.0h',
      sleepStatus: avgSleep >= 7 && avgSleep <= 9 ? 'Đạt chuẩn' : avgSleep < 7 ? 'Thiếu ngủ' : 'Ngủ nhiều',
      exerciseTotalWeek: totalExerciseWeek,
      exerciseTarget: '≥ 150 phút / tuần (WHO)',
      exerciseStatus: totalExerciseWeek >= 150 ? 'Đạt chuẩn WHO' : `Cần thêm ${150 - totalExerciseWeek}p`,
    };

    return NextResponse.json({
      totalDays: totalCount,
      streak: habitStreak,
      stats: {
        avgSleep,
        avgScreen,
        avgGame,
        avgExercise,
        avgCutoff,
        avgPickups,
        avgMoodScore,
        mostFrequentTopApp,
        sleepScore,
      },
      correlations,
      weeklyCompliance,
      commitments: {
        total: totalCommitments,
        completed: completedCommitments,
        rate: completionRate,
        recent: commitments.slice(0, 5),
      },
      chartData7: habits.slice(0, 7).reverse(),
      chartData14: habits.slice(0, 14).reverse(),
      chartData30: habits.slice(0, 30).reverse(),
    });
  } catch (err: any) {
    console.error('Lỗi overview:', err);
    return NextResponse.json({ error: 'Lỗi lấy dữ liệu tổng quan' }, { status: 500 });
  }
}
