import test from 'node:test';
import assert from 'node:assert/strict';
import { addDays } from '../lib/date';

/**
 * Pure business rule validator for Commitment creation.
 */
export function validateCommitmentCreation(title: string, targetDate: string, today: string): { valid: boolean; error?: string } {
  if (!title || !title.trim()) {
    return { valid: false, error: 'Thiếu thông tin tiêu đề hoặc ngày cam kết' };
  }
  const trimmedDate = String(targetDate).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
    return { valid: false, error: 'Định dạng ngày cam kết không hợp lệ (YYYY-MM-DD)' };
  }
  if (trimmedDate < today) {
    return { valid: false, error: 'Ngày cam kết không thể là một ngày trong quá khứ' };
  }
  const maxFuture = addDays(today, 90);
  if (trimmedDate > maxFuture) {
    return { valid: false, error: 'Ngày cam kết không được vượt quá 90 ngày trong tương lai' };
  }
  return { valid: true };
}

/**
 * Pure business rule validator for Commitment checkin.
 */
export function validateCommitmentCheckin(
  commitment: { target_date: string; completed: boolean | null },
  newCompleted: boolean,
  today: string
): { canCheckin: boolean; error?: string } {
  if (commitment.target_date > today) {
    return {
      canCheckin: false,
      error: `Chưa đến ngày thực hiện cam kết (${commitment.target_date}). Bạn chỉ có thể điểm danh vào hoặc sau ngày này.`,
    };
  }
  if (commitment.completed === true && newCompleted === false) {
    return {
      canCheckin: false,
      error: 'Cam kết này đã được ghi nhận hoàn thành và không thể hủy để đảm bảo tính trung thực của chỉ số kỷ luật.',
    };
  }
  return { canCheckin: true };
}

test('validateCommitmentCreation allows valid today or near future target dates', () => {
  const today = '2026-09-03';
  const tomorrow = '2026-09-04';
  const nextMonth = '2026-10-01';

  assert.equal(validateCommitmentCreation('Tắt máy lúc 22:30', today, today).valid, true);
  assert.equal(validateCommitmentCreation('Đi ngủ lúc 23:00', tomorrow, today).valid, true);
  assert.equal(validateCommitmentCreation('Không chơi game sau 21h', nextMonth, today).valid, true);
});

test('validateCommitmentCreation rejects empty title or past dates', () => {
  const today = '2026-09-03';
  const yesterday = '2026-09-02';

  assert.equal(validateCommitmentCreation('', today, today).valid, false);
  assert.equal(validateCommitmentCreation('   ', today, today).valid, false);

  const pastCheck = validateCommitmentCreation('Cam kết hôm qua', yesterday, today);
  assert.equal(pastCheck.valid, false);
  assert.match(pastCheck.error!, /quá khứ/);
});

test('validateCommitmentCreation rejects dates beyond 90 days in the future', () => {
  const today = '2026-09-03';
  const farFuture = addDays(today, 95);

  const res = validateCommitmentCreation('Cam kết năm sau', farFuture, today);
  assert.equal(res.valid, false);
  assert.match(res.error!, /90 ngày/);
});

test('validateCommitmentCheckin rejects early checkin for future commitments', () => {
  const today = '2026-09-03';
  const futureCommitment = { target_date: '2026-09-10', completed: null };

  const check = validateCommitmentCheckin(futureCommitment, true, today);
  assert.equal(check.canCheckin, false);
  assert.match(check.error!, /Chưa đến ngày/);
});

test('validateCommitmentCheckin allows checkin when target date is reached or passed', () => {
  const today = '2026-09-03';
  const todayCommitment = { target_date: '2026-09-03', completed: null };
  const pastCommitment = { target_date: '2026-09-02', completed: null };

  assert.equal(validateCommitmentCheckin(todayCommitment, true, today).canCheckin, true);
  assert.equal(validateCommitmentCheckin(pastCommitment, true, today).canCheckin, true);
});

test('validateCommitmentCheckin prevents undoing already completed commitments', () => {
  const today = '2026-09-03';
  const completedCommitment = { target_date: '2026-09-02', completed: true };

  const undoAttempt = validateCommitmentCheckin(completedCommitment, false, today);
  assert.equal(undoAttempt.canCheckin, false);
  assert.match(undoAttempt.error!, /không thể hủy/);
});
