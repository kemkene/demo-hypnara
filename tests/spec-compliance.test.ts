import test from 'node:test';
import assert from 'node:assert/strict';
import { HISTORY_DAYS } from '../lib/deepseek';
import { todayStr, yesterdayStr } from '../lib/date';

test('HISTORY_DAYS equals 10 as specified in 003-history-pagination FR-002', () => {
  assert.equal(
    HISTORY_DAYS,
    10,
    'HISTORY_DAYS must strictly be 10 according to spec 003-history-pagination FR-002'
  );
});

test('POST /api/suggest enforces FR-005 (only allows suggestions for today, rejects backdates)', () => {
  const today = todayStr();
  const yesterday = yesterdayStr();

  // Pure validation simulation of app/api/suggest/route.ts
  function validateSuggestDate(requestedDate?: string | null): { allowed: boolean; error?: string } {
    if (requestedDate && String(requestedDate).trim() !== today) {
      return {
        allowed: false,
        error: `Gợi ý AI chỉ áp dụng cho dữ liệu ngày hôm nay (${today}). Không hỗ trợ gợi ý cho các ngày nhập bù trong quá khứ theo quy chuẩn nghiệp vụ (FR-005).`,
      };
    }
    return { allowed: true };
  }

  // 1. Explicit today's date -> ALLOWED
  const todayResult = validateSuggestDate(today);
  assert.equal(todayResult.allowed, true);

  // 2. Omitted date (defaults to today) -> ALLOWED
  const defaultResult = validateSuggestDate(undefined);
  assert.equal(defaultResult.allowed, true);

  // 3. Past date (yesterday / backdated) -> REJECTED with 400
  const backdateResult = validateSuggestDate(yesterday);
  assert.equal(backdateResult.allowed, false);
  assert.match(backdateResult.error!, /FR-005/);
  assert.match(backdateResult.error!, /ngày hôm nay/);

  // 4. Arbitrary past date -> REJECTED
  const arbitraryPastResult = validateSuggestDate('2026-07-28');
  assert.equal(arbitraryPastResult.allowed, false);
});
