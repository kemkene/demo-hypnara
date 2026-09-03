import test from 'node:test';
import assert from 'node:assert/strict';
import { validateHabitInput } from '../lib/auth';

test('validateHabitInput accepts valid inputs with zero errors', () => {
  const input = {
    sleepHours: '8',
    screenTime: '4.5',
    gameTime: '1',
    exerciseMinutes: '30',
    phoneCutoffMins: '30',
    phonePickups: '40',
    moodScore: 4,
    moodNote: 'Hôm nay cảm thấy rất thoải mái',
    schedule: 'Làm việc 8h-17h, tập gym 18h',
  };
  const errors = validateHabitInput(input);
  assert.equal(errors.length, 0);
});

test('validateHabitInput accepts empty or null optional fields', () => {
  const input = {
    sleepHours: '',
    screenTime: null,
    gameTime: undefined,
    phoneCutoffMins: null,
  };
  const errors = validateHabitInput(input);
  assert.equal(errors.length, 0);
});

test('validateHabitInput validates sleep hours boundaries', () => {
  assert.equal(validateHabitInput({ sleepHours: '0.5' }).length, 1);
  assert.equal(validateHabitInput({ sleepHours: '19' }).length, 1);
  assert.equal(validateHabitInput({ sleepHours: 'abc' }).length, 1);
  assert.equal(validateHabitInput({ sleepHours: '7.5' }).length, 0);
});

test('validateHabitInput validates screen time and game time boundaries', () => {
  assert.equal(validateHabitInput({ screenTime: '-1' }).length, 1);
  assert.equal(validateHabitInput({ screenTime: '25' }).length, 1);
  assert.equal(validateHabitInput({ screenTime: '6' }).length, 0);

  assert.equal(validateHabitInput({ gameTime: '-2' }).length, 1);
  assert.equal(validateHabitInput({ gameTime: '26' }).length, 1);
  assert.equal(validateHabitInput({ gameTime: '2.5' }).length, 0);
});

test('validateHabitInput validates exercise, cutoff, and pickups boundaries', () => {
  assert.equal(validateHabitInput({ exerciseMinutes: '-10' }).length, 1);
  assert.equal(validateHabitInput({ exerciseMinutes: '1500' }).length, 1);
  assert.equal(validateHabitInput({ exerciseMinutes: '45' }).length, 0);

  assert.equal(validateHabitInput({ phoneCutoffMins: '-5' }).length, 1);
  assert.equal(validateHabitInput({ phoneCutoffMins: '400' }).length, 1);
  assert.equal(validateHabitInput({ phoneCutoffMins: '45' }).length, 0);

  assert.equal(validateHabitInput({ phonePickups: '-1' }).length, 1);
  assert.equal(validateHabitInput({ phonePickups: '600' }).length, 1);
  assert.equal(validateHabitInput({ phonePickups: '50' }).length, 0);
});

test('validateHabitInput validates mood score 1 to 5', () => {
  assert.equal(validateHabitInput({ moodScore: 0 }).length, 1);
  assert.equal(validateHabitInput({ moodScore: 6 }).length, 1);
  assert.equal(validateHabitInput({ moodScore: 1 }).length, 0);
  assert.equal(validateHabitInput({ moodScore: 5 }).length, 0);
});
