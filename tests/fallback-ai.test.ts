import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateRuleBasedSuggestion,
  generateRuleBasedChat,
  generateRuleBasedMotivationalLetter,
} from '../lib/fallback-ai';

test('generateRuleBasedSuggestion returns properly formatted HTML with 3 action items', () => {
  const current = {
    sleepHours: '6.0',
    screenTime: '7.5',
    gameTime: '2.5',
    exerciseMinutes: '15',
    phoneCutoffMins: 10,
    phonePickups: 70,
    topApp: 'TikTok',
    moodScore: 2,
  };

  const html = generateRuleBasedSuggestion(current, [], {
    primary_goal: 'Ngủ đủ 8 tiếng',
    reminder_time: '22:30',
  });

  // Verify HTML tags
  assert.ok(html.includes('<p><strong>Phân tích thói quen'), 'Should contain analysis header');
  assert.ok(html.includes('<ul>'), 'Should contain unordered list');
  assert.ok(html.includes('</ul>'), 'Should close unordered list');

  // Verify exactly 3 <li> action items
  const liMatches = html.match(/<li>/g);
  assert.notEqual(liMatches, null);
  assert.equal(liMatches!.length, 3, 'Should have exactly 3 actionable suggestions');

  // Verify content addresses sleep deficit and late cutoff
  assert.ok(html.includes('6h') || html.includes('melatonin') || html.includes('TikTok') || html.includes('30 phút'));
});

test('generateRuleBasedChat responds to different health & sleep contexts', () => {
  const habits = [
    {
      date: '2026-09-03',
      sleepHours: '6.5',
      screenTime: '5',
      gameTime: '1',
      exerciseMinutes: '30',
      phoneCutoffMins: 20,
    },
  ];
  const profile = { primary_goal: 'Tối ưu giấc ngủ', reminder_time: '22:00' };

  // Greeting
  const greeting = generateRuleBasedChat([{ role: 'user', content: 'Xin chào trợ lý' }], habits, profile, 'Minh');
  assert.ok(greeting.includes('Minh'));
  assert.ok(greeting.includes('Hypnara'));

  // Insomnia / trouble sleeping
  const insomnia = generateRuleBasedChat([{ role: 'user', content: 'Tôi bị mất ngủ thì phải làm sao?' }], habits, profile, 'Minh');
  assert.ok(insomnia.includes('20 phút') || insomnia.includes('thở 4-7-8') || insomnia.includes('giường'));

  // Screen time
  const screenTimeReply = generateRuleBasedChat([{ role: 'user', content: 'Làm sao để giảm screen time điện thoại trước khi ngủ?' }], habits, profile, 'Minh');
  assert.ok(screenTimeReply.includes('melatonin') || screenTimeReply.includes('22:00') || screenTimeReply.includes('ánh sáng xanh'));

  // Score evaluation
  const scoreReply = generateRuleBasedChat([{ role: 'user', content: 'Điểm giấc ngủ của tôi được tính thế nào?' }], habits, profile, 'Minh');
  assert.ok(scoreReply.includes('Sleep Score') || scoreReply.includes('6.5h'));
});

test('generateRuleBasedMotivationalLetter generates inspiring letter with proper word count', () => {
  const habits = [
    { date: '2026-09-03', sleepHours: '7.5', screenTime: '4', phoneCutoffMins: 35, moodScore: 4 },
    { date: '2026-09-02', sleepHours: '8.0', screenTime: '3.5', phoneCutoffMins: 30, moodScore: 5 },
  ];
  const profile = { primary_goal: 'Kỷ luật công nghệ và ngủ sớm', reminder_time: '22:15' };

  const letter = generateRuleBasedMotivationalLetter('Hoàng Nam', profile, habits);

  // Contains student name and goal
  assert.ok(letter.includes('Hoàng Nam'));
  assert.ok(letter.includes('Kỷ luật công nghệ và ngủ sớm'));

  // Word count check (aiming for 200 - 400 words)
  const words = letter.trim().split(/\s+/).filter(Boolean);
  assert.ok(words.length >= 180 && words.length <= 450, `Expected 180-450 words, got ${words.length}`);
});

test('generateRuleBasedMotivationalLetter generates inspiring welcome letter for new users with 0 habits', () => {
  const profile = { primary_goal: 'Tối ưu giấc ngủ 8 tiếng', reminder_time: '22:00' };
  const letter = generateRuleBasedMotivationalLetter('truongnx2', profile, []);

  assert.ok(letter.includes('truongnx2'));
  assert.ok(letter.includes('Chào mừng bạn'));
  assert.ok(letter.includes('khởi đầu'));
  // Must NOT claim they used the app for 10 days or 0 days completed
  assert.ok(!letter.includes('10 ngày'));
  assert.ok(!letter.includes('0 ngày'));

  const words = letter.trim().split(/\s+/).filter(Boolean);
  assert.ok(words.length >= 180 && words.length <= 450, `Expected 180-450 words, got ${words.length}`);
});
