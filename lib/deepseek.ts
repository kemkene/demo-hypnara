import {
  generateRuleBasedSuggestion,
  generateRuleBasedChat,
  generateRuleBasedMotivationalLetter,
  HabitEntry,
  UserProfile,
} from './fallback-ai';

export const HISTORY_DAYS = 10;

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

export async function callDeepSeekAPI(messages: any[], temperature = 0.7): Promise<string> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('Chưa cấu hình DEEPSEEK_API_KEY trong file .env');
  }

  const response = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages,
      temperature,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Lỗi DeepSeek API (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('DeepSeek API trả về phản hồi rỗng.');
  }

  return content;
}

export function buildUserPrompt(currentHabits: any, habitHistory: any[] = [], userProfile: any = null): string {
  const historyText =
    habitHistory.length > 0
      ? habitHistory
          .map(
            (h: any) =>
              `- Ngày ${h.date}: Ngủ ${h.sleepHours || '?'}h | Screen ${h.screenTime || '?'}h | Game ${h.gameTime || '?'}h | Vận động ${h.exerciseMinutes || '?'}p | Cutoff ${h.phoneCutoffMins ?? '?'}p | Cầm máy ${h.phonePickups ?? '?'} lần | Mood ${h.moodScore ? h.moodScore + '/5' : h.mood || '?'}`
          )
          .join('\n')
      : 'Chưa có lịch sử.';

  const profileText = userProfile
    ? `Mục tiêu lớn: "${userProfile.primary_goal || 'Tối ưu giấc ngủ'}", Giờ nhắc nhở mong muốn: "${userProfile.reminder_time || '22:00'}"`
    : 'Chưa đặt mục tiêu cá nhân.';

  return `Dữ liệu thói quen hôm nay:
- Giờ ngủ: ${currentHabits.sleepHours || 'Chưa nhập'} giờ
- Screen time: ${currentHabits.screenTime || 'Chưa nhập'} giờ
- Game time: ${currentHabits.gameTime || 'Chưa nhập'} giờ
- Vận động: ${currentHabits.exerciseMinutes || 'Chưa nhập'} phút
- Tắt màn hình trước khi ngủ: ${currentHabits.phoneCutoffMins !== null ? currentHabits.phoneCutoffMins + ' phút' : 'Chưa nhập'}
- Số lần cầm điện thoại: ${currentHabits.phonePickups !== null ? currentHabits.phonePickups + ' lần' : 'Chưa nhập'}
- App dùng nhiều nhất: ${currentHabits.topApp || 'Chưa nhập'}
- Điểm tâm trạng: ${currentHabits.moodScore ? currentHabits.moodScore + '/5' : currentHabits.mood || 'Chưa nhập'}
- Ghi chú tâm trạng: ${currentHabits.moodNote || 'Không có'}
- Lịch trình: ${currentHabits.schedule || 'Không có'}

Mục tiêu cá nhân:
${profileText}

Lịch sử các ngày gần đây (tối đa ${HISTORY_DAYS} ngày gần nhất):
${historyText}

Hãy phân tích xu hướng và đưa ra gợi ý tối ưu giấc ngủ & Digital Wellbeing phù hợp nhất.`;
}

/**
 * High-resilience AI Suggestion with automatic Rule-Based fallback.
 */
export async function getAiSuggestion(
  currentHabits: HabitEntry,
  habitHistory: HabitEntry[] = [],
  userProfile: UserProfile | null = null
): Promise<{ suggestion: string; isOffline: boolean }> {
  if (DEEPSEEK_API_KEY) {
    try {
      const userPrompt = buildUserPrompt(currentHabits, habitHistory, userProfile);
      const systemPrompt = `Bạn là Chuyên gia Tối ưu Giấc ngủ và Digital Wellbeing của Hypnara.
Nhiệm vụ: Phân tích thói quen (ngủ, screen time, game, vận động, tắt điện thoại trước ngủ) và lịch sử của người dùng để đưa ra phản hồi khoa học, thực tế, dễ áp dụng.

Yêu cầu định dạng phản hồi HTML ngắn gọn (dùng các thẻ <p>, <ul>, <li>, <strong>, <em>, không dùng markdown code block):
1. **Phân tích ngắn**: Điểm sáng và nguy cơ (đặc biệt nhấn mạnh việc tắt máy trước ngủ & vận động).
2. **3 Gợi ý hành động**: Cụ thể, khả thi ngay hôm nay.
3. **Lời chúc / Động lực ngắn**.`;

      const suggestion = await callDeepSeekAPI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);
      return { suggestion, isOffline: false };
    } catch (err: any) {
      console.warn('[Hypnara AI] DeepSeek API failed, falling back to rule-based offline engine:', err.message);
    }
  }

  // Seamless offline fallback
  const suggestion = generateRuleBasedSuggestion(currentHabits, habitHistory, userProfile);
  return { suggestion, isOffline: true };
}

/**
 * High-resilience AI Chat with automatic Rule-Based fallback.
 */
export async function getAiChatReply(
  messages: Array<{ role: string; content: string }>,
  habits: HabitEntry[] = [],
  profile: UserProfile | null = null,
  username: string = 'học viên'
): Promise<{ reply: string; isOffline: boolean }> {
  if (DEEPSEEK_API_KEY) {
    try {
      const habitContext =
        habits.length > 0
          ? habits
              .map(
                (h: any) =>
                  `- ${h.date}: Ngủ ${h.sleepHours || '?'}h, Screen ${h.screenTime || '?'}h, Game ${h.gameTime || '?'}h, Exercise ${h.exerciseMinutes || '?'}m, Cutoff ${h.phoneCutoffMins ?? '?'}m`
              )
              .join('\n')
          : 'Chưa có dữ liệu thói quen';

      const systemPrompt = `Bạn là Trợ lý AI Hypnara — Chuyên gia giấc ngủ và thói quen sinh hoạt số.
Học viên hiện tại: "${username}"
Mục tiêu cá nhân: "${profile?.primary_goal || 'Tối ưu giấc ngủ'}"
Thói quen 10 ngày gần nhất:
${habitContext}

Hãy tư vấn thân thiện, ngắn gọn (dưới 200 từ), tập trung vào giải pháp cụ thể giúp cải thiện chất lượng giấc ngủ và làm chủ công nghệ.`;

      const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-10),
      ];

      const reply = await callDeepSeekAPI(apiMessages);
      return { reply, isOffline: false };
    } catch (err: any) {
      console.warn('[Hypnara AI] DeepSeek Chat API failed, falling back to rule-based engine:', err.message);
    }
  }

  // Seamless offline fallback
  const reply = generateRuleBasedChat(messages, habits, profile, username);
  return { reply, isOffline: true };
}

/**
 * High-resilience AI Motivational Letter with automatic Rule-Based fallback.
 */
export async function getAiMotivationalLetter(
  username: string,
  profile: UserProfile | null,
  habits: HabitEntry[] = []
): Promise<{ letter: string; isOffline: boolean }> {
  if (DEEPSEEK_API_KEY) {
    try {
      const systemPrompt = `Bạn là Chuyên gia Tâm lý & Huấn luyện viên Kỷ luật Giấc ngủ Hypnara.
Hãy viết một **Thư Động Lực Chân Thành & Truyền Cảm Hứng (Motivational Letter)** dài khoảng 250 - 350 từ gửi riêng cho người dùng "${username}".

Cấu trúc thư:
1. Lời chào ấm áp & ghi nhận sự nỗ lực duy trì kỷ luật.
2. Nhận xét tinh tế dựa trên dữ liệu thật (thời lượng ngủ, screen time, thói quen tắt máy).
3. Lời khuyên & thông điệp tiếp sức mạnh mẽ giúp học viên vượt qua sự mệt mỏi, làm chủ thiết bị số và kiên trì với mục tiêu lớn.
4. Lời chúc buổi tối đầy năng lượng tích cực.`;

      const userPrompt = `Tên học viên: ${username}
Mục tiêu cá nhân: ${profile?.primary_goal || 'Tối ưu giấc ngủ và kỷ luật bản thân'}
Lịch sử thói quen 10 ngày qua:
${habits.map((h: any) => `- ${h.date}: Ngủ ${h.sleepHours || '?'}h, ScreenTime ${h.screenTime || '?'}h, Cutoff ${h.phoneCutoffMins ?? '?'}p, Mood ${h.moodScore || h.mood || '?'}`).join('\n')}`;

      const letter = await callDeepSeekAPI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);
      return { letter, isOffline: false };
    } catch (err: any) {
      console.warn('[Hypnara AI] DeepSeek Letter API failed, falling back to rule-based engine:', err.message);
    }
  }

  // Seamless offline fallback
  const letter = generateRuleBasedMotivationalLetter(username, profile, habits);
  return { letter, isOffline: true };
}
