import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSleepScore, getScoreBadge } from '../lib/scoring';

test('calculateSleepScore returns null when countSleep is 0', () => {
  const result = calculateSleepScore({
    countSleep: 0,
    avgSleep: 0,
    avgScreen: 5,
    avgGame: 1,
    avgCutoff: 30,
    avgExercise: 40,
  });
  assert.equal(result, null);
});

test('calculateSleepScore awards excellent score for healthy habits', () => {
  const score = calculateSleepScore({
    countSleep: 7,
    avgSleep: 8.0, // Optimal
    avgScreen: 3.5, // Low
    avgGame: 0.5, // Low
    avgCutoff: 45, // Excellent cutoff >= 15
    avgExercise: 35, // Excellent exercise >= 30 (bonus -5 penalty)
  });
  assert.notEqual(score, null);
  assert.ok(score! >= 95, `Expected score >= 95, got ${score}`);

  const badge = getScoreBadge(score);
  assert.equal(badge.label, 'Xuất sắc');
  assert.equal(badge.class, 'status-excellent');
});

test('calculateSleepScore applies penalties for sleep deprivation and late night screen time', () => {
  const score = calculateSleepScore({
    countSleep: 5,
    avgSleep: 5.0, // Under 7h -> penalty (7-5)*12 = 24
    avgScreen: 8.5, // > 6h -> penalty (8.5-6)*4 = 10
    avgGame: 4.5, // > 3h -> penalty (4.5-3)*5 = 7.5
    avgCutoff: 5, // < 15m -> penalty 10
    avgExercise: 10, // < 20m -> penalty 8
  });
  assert.notEqual(score, null);
  // Expected base 100 - (24 + 10 + 7.5 + 10 + 8) = 100 - 59.5 = 40.5 -> 41
  assert.ok(score! <= 50, `Expected score <= 50, got ${score}`);

  const badge = getScoreBadge(score);
  assert.equal(badge.label, 'Cần cải thiện');
  assert.equal(badge.class, 'status-poor');
});

test('calculateSleepScore clamps within 30 to 99 range', () => {
  // Extreme worst case
  const minScore = calculateSleepScore({
    countSleep: 1,
    avgSleep: 1.0,
    avgScreen: 20,
    avgGame: 15,
    avgCutoff: 0,
    avgExercise: 0,
  });
  assert.equal(minScore, 30);

  // Extreme best case
  const maxScore = calculateSleepScore({
    countSleep: 7,
    avgSleep: 8.0,
    avgScreen: 1.0,
    avgGame: 0,
    avgCutoff: 60,
    avgExercise: 60,
  });
  assert.ok(maxScore! <= 99);
});

test('getScoreBadge correctly categorizes all score ranges', () => {
  assert.deepEqual(getScoreBadge(null), { class: 'status-neutral', label: 'Chưa có dữ liệu' });
  assert.deepEqual(getScoreBadge(92), { class: 'status-excellent', label: 'Xuất sắc' });
  assert.deepEqual(getScoreBadge(85), { class: 'status-excellent', label: 'Xuất sắc' });
  assert.deepEqual(getScoreBadge(78), { class: 'status-good', label: 'Tốt' });
  assert.deepEqual(getScoreBadge(70), { class: 'status-good', label: 'Tốt' });
  assert.deepEqual(getScoreBadge(65), { class: 'status-fair', label: 'Trung bình' });
  assert.deepEqual(getScoreBadge(50), { class: 'status-fair', label: 'Trung bình' });
  assert.deepEqual(getScoreBadge(45), { class: 'status-poor', label: 'Cần cải thiện' });
  assert.deepEqual(getScoreBadge(30), { class: 'status-poor', label: 'Cần cải thiện' });
});
