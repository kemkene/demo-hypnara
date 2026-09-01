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

Lịch sử các ngày gần đây (tối đa 14 ngày gần nhất):
${historyText}

Hãy phân tích xu hướng và đưa ra gợi ý tối ưu giấc ngủ & Digital Wellbeing phù hợp nhất.`;
}
