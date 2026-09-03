import test from 'node:test';
import assert from 'node:assert/strict';
import { todayStr, yesterdayStr, addDays, isValidDateStr, calculateStreak } from '../lib/date';

test('todayStr returns YYYY-MM-DD in Asia/Ho_Chi_Minh timezone', () => {
  const today = todayStr();
  assert.match(today, /^\d{4}-\d{2}-\d{2}$/);

  // Timezone check: Verify against Intl with Asia/Ho_Chi_Minh
  const expected = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
  assert.equal(today, expected);
});

test('yesterdayStr returns exactly 1 day before todayStr', () => {
  const today = todayStr();
  const yesterday = yesterdayStr();
  assert.equal(addDays(today, -1), yesterday);
});

test('addDays handles calendar boundaries correctly', () => {
  // End of month
  assert.equal(addDays('2026-01-31', 1), '2026-02-01');
  assert.equal(addDays('2026-02-28', 1), '2026-03-01'); // Non-leap year 2026
  // Leap year
  assert.equal(addDays('2024-02-28', 1), '2024-02-29');
  assert.equal(addDays('2024-02-29', 1), '2024-03-01');
  // End of year
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-01-01', -1), '2025-12-31');
  // Multiple days
  assert.equal(addDays('2026-09-03', -7), '2026-08-27');
  assert.equal(addDays('2026-09-03', 10), '2026-09-13');
});

test('isValidDateStr validates format, real dates and future date limits', () => {
  const today = todayStr();
  const yesterday = yesterdayStr();
  const tomorrow = addDays(today, 1);

  // Valid dates
  assert.equal(isValidDateStr(today, today), true);
  assert.equal(isValidDateStr(yesterday, today), true);
  assert.equal(isValidDateStr('2026-01-01', today), true);

  // Future date should be rejected
  assert.equal(isValidDateStr(tomorrow, today), false);

  // Invalid formats and fake calendar dates
  assert.equal(isValidDateStr('2026/09/03'), false);
  assert.equal(isValidDateStr('03-09-2026'), false);
  assert.equal(isValidDateStr('invalid-date'), false);
  assert.equal(isValidDateStr(''), false);
  assert.equal(isValidDateStr(null), false);
  assert.equal(isValidDateStr(undefined), false);
  assert.equal(isValidDateStr(12345), false);
  assert.equal(isValidDateStr('2026-02-31'), false); // February doesn't have 31 days
});

test('calculateStreak calculates continuous habit streaks deterministically', () => {
  const today = '2026-09-03';

  // Case 1: Empty dates
  assert.equal(calculateStreak(new Set(), today), 0);

  // Case 2: Only logged today
  assert.equal(calculateStreak(new Set(['2026-09-03']), today), 1);

  // Case 3: Logged today and consecutive past days (3 days)
  assert.equal(calculateStreak(new Set(['2026-09-03', '2026-09-02', '2026-09-01']), today), 3);

  // Case 4: Not logged today yet, but logged yesterday (streak alive: 2 days)
  assert.equal(calculateStreak(new Set(['2026-09-02', '2026-09-01']), today), 2);

  // Case 5: Broken streak (missed yesterday and today)
  assert.equal(calculateStreak(new Set(['2026-09-01', '2026-08-31']), today), 0);

  // Case 6: Broken gap (logged today and 2 days ago, missed yesterday)
  assert.equal(calculateStreak(new Set(['2026-09-03', '2026-09-01']), today), 1);

  // Case 7: Long streak across month boundary (August to September)
  const augustStreak = new Set([
    '2026-09-03',
    '2026-09-02',
    '2026-09-01',
    '2026-08-31',
    '2026-08-30',
    '2026-08-29',
    '2026-08-28',
  ]);
  assert.equal(calculateStreak(augustStreak, today), 7);
});
