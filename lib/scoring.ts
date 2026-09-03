/**
 * Sleep Score & Wellbeing Algorithm according to behavioral health metrics.
 */

export interface SleepScoreMetrics {
  countSleep: number;
  avgSleep: number;
  avgScreen: number;
  avgGame: number;
  avgCutoff: number;
  avgExercise: number;
}

/**
 * Calculates Sleep Score (30-99).
 * Returns `null` if no sleep data is recorded within the observation window.
 */
export function calculateSleepScore(metrics: SleepScoreMetrics): number | null {
  if (metrics.countSleep === 0) {
    return null;
  }

  let penalty = 0;

  // Sleep duration penalty (Optimal 7.0 - 9.0h)
  if (metrics.avgSleep < 7) {
    penalty += (7 - metrics.avgSleep) * 12;
  } else if (metrics.avgSleep > 9) {
    penalty += (metrics.avgSleep - 9) * 6;
  }

  // Screen time penalty (High > 6h)
  if (metrics.avgScreen > 6) {
    penalty += (metrics.avgScreen - 6) * 4;
  }

  // Gaming penalty (High > 3h)
  if (metrics.avgGame > 3) {
    penalty += (metrics.avgGame - 3) * 5;
  }

  // Pre-bed phone cutoff penalty (< 15 mins)
  if (metrics.avgCutoff < 15) {
    penalty += 10;
  }

  // Exercise reward / penalty (< 20m penalty, >= 30m bonus)
  if (metrics.avgExercise < 20) {
    penalty += 8;
  } else if (metrics.avgExercise >= 30) {
    penalty -= 5;
  }

  return Math.max(30, Math.min(99, Math.round(100 - penalty)));
}

/**
 * Evaluates score badge status.
 */
export function getScoreBadge(score: number | null): { class: string; label: string } {
  if (score === null) return { class: 'status-neutral', label: 'Chưa có dữ liệu' };
  if (score >= 85) return { class: 'status-excellent', label: 'Xuất sắc' };
  if (score >= 70) return { class: 'status-good', label: 'Tốt' };
  if (score >= 50) return { class: 'status-fair', label: 'Trung bình' };
  return { class: 'status-poor', label: 'Cần cải thiện' };
}
