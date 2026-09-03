/**
 * Offline Rule-Based AI Fallback Engine for Hypnara.
 * Activated when DEEPSEEK_API_KEY is missing or when the API call fails/times out.
 * 
 * Generates evidence-based sleep & digital wellbeing recommendations
 * conforming to scientific literature (Matthew Walker, WHO, Sleep Foundation).
 */

export interface HabitEntry {
  date?: string;
  sleepHours?: string | number | null;
  screenTime?: string | number | null;
  gameTime?: string | number | null;
  exerciseMinutes?: string | number | null;
  phoneCutoffMins?: number | null;
  phonePickups?: number | null;
  topApp?: string | null;
  moodScore?: number | null;
  mood?: string | null;
  moodNote?: string | null;
  schedule?: string | null;
}

export interface UserProfile {
  primary_goal?: string | null;
  reminder_time?: string | null;
}

/**
 * 1. Generates rule-based suggestion for daily habits.
 * Returns valid HTML matching the required system prompt format:
 * - Short analysis with highlights and risks
 * - 3 concrete actionable recommendations
 * - Short motivational closing / well wishes
 */
export function generateRuleBasedSuggestion(
  current: HabitEntry,
  history: HabitEntry[] = [],
  profile: UserProfile | null = null
): string {
  const sleep = parseFloat(String(current.sleepHours || '0'));
  const screen = parseFloat(String(current.screenTime || '0'));
  const game = parseFloat(String(current.gameTime || '0'));
  const exercise = parseFloat(String(current.exerciseMinutes || '0'));
  const cutoff = current.phoneCutoffMins !== null && current.phoneCutoffMins !== undefined ? Number(current.phoneCutoffMins) : null;
  const pickups = current.phonePickups !== null && current.phonePickups !== undefined ? Number(current.phonePickups) : null;
  const moodScore = current.moodScore ? Number(current.moodScore) : null;

  // Highlights & Risks Analysis
  const highlights: string[] = [];
  const risks: string[] = [];

  // Sleep evaluation
  if (sleep >= 7 && sleep <= 9) {
    highlights.push(`Thời lượng ngủ lý tưởng (${sleep}h), đạt chuẩn vàng 7–9 tiếng giúp phục hồi tế bào thần kinh và củng cố trí nhớ.`);
  } else if (sleep > 0 && sleep < 7) {
    risks.push(`Thời lượng ngủ chỉ ${sleep}h (dưới ngưỡng 7h khuyến nghị), có nguy cơ làm tăng nồng độ cortisol và giảm khả năng tập trung ngày kế tiếp.`);
  } else if (sleep > 9) {
    risks.push(`Ngủ kéo dài ${sleep}h có thể phản ánh sự bù đắp mệt mỏi tích tụ (sleep debt) hoặc chu kỳ thức ngủ bị gián đoạn.`);
  }

  // Screen & Cutoff evaluation
  if (cutoff !== null) {
    if (cutoff >= 30) {
      highlights.push(`Tuyệt vời! Việc tắt máy trước ngủ ${cutoff} phút giúp giải phóng melatonin tự nhiên và rút ngắn 40% thời gian chìm vào giấc ngủ.`);
    } else if (cutoff < 15) {
      risks.push(`Chỉ tắt thiết bị ${cutoff} phút trước khi ngủ — ánh sáng xanh bước sóng 450–480nm làm ức chế tiết hormone melatonin, khiến giấc ngủ chập chờn.`);
    }
  }

  if (screen > 6) {
    risks.push(`Thời gian sử dụng màn hình cao (${screen}h/ngày) làm hệ thần kinh thị giác bị quá tải.`);
  } else if (screen > 0 && screen <= 4) {
    highlights.push(`Kiểm soát screen time rất tốt (${screen}h), giảm áp lực kỹ thuật số lên não bộ.`);
  }

  // Exercise & Game evaluation
  if (exercise >= 30) {
    highlights.push(`Vận động thể chất ${exercise} phút giúp kích hoạt adenosine (áp lực buồn ngủ lành mạnh), hỗ trợ giấc ngủ sâu NREM.`);
  } else if (exercise < 15) {
    risks.push(`Vận động thể chất ít (${exercise} phút) có thể khiến cơ thể khó giải phóng năng lượng dư thừa vào buổi tối.`);
  }

  if (game > 2) {
    risks.push(`Chơi game ${game}h kích thích tiết dopamine và adrenaline, làm nhịp tim khó hạ về mức nghỉ ngơi trước khi ngủ.`);
  }

  // 3 Actionable Suggestions
  const actions: string[] = [];

  if (cutoff === null || cutoff < 30) {
    actions.push(`<strong>Quy tắc "Vùng đệm 30 phút":</strong> Đặt điện thoại ở chế độ Máy bay hoặc để ngoài tầm với trước giờ ngủ 30 phút (lý tưởng lúc ${profile?.reminder_time || '22:00'}).`);
  } else {
    actions.push(`<strong>Duy trì mỏ neo buổi tối:</strong> Tiếp tục thói quen tắt máy trước ngủ ${cutoff}p và thay thế bằng đọc sách giấy hoặc nghe âm thanh trắng nhẹ nhàng.`);
  }

  if (exercise < 20) {
    actions.push(`<strong>Vận động nâng cao áp lực ngủ:</strong> Dành 20–30 phút đi bộ nhanh hoặc tập giãn cơ vào buổi chiều để tối ưu hóa chu kỳ giấc ngủ sâu ban đêm.`);
  } else {
    actions.push(`<strong>Cố định khung giờ thức dậy:</strong> Giữ khung giờ thức dậy cố định ngay cả vào cuối tuần để đồng bộ hóa nhịp sinh học circadian.`);
  }

  if (pickups && pickups > 60) {
    actions.push(`<strong>Cắt giảm phản xạ cầm máy vô thức:</strong> Hiện bạn cầm máy ${pickups} lần/ngày; hãy tắt thông báo từ app "${current.topApp || 'mạng xã hội'}" sau 21:00.`);
  } else if (game > 1.5) {
    actions.push(`<strong>Quy định giờ giới nghiêm chơi game:</strong> Ngừng hoàn toàn các tựa game thi đấu/hành động trước 21:30 để não bộ có thời gian hạ nhiệt.`);
  } else {
    actions.push(`<strong>Tối ưu môi trường phòng ngủ:</strong> Giữ nhiệt độ phòng khoảng 20–22°C, hạn chế tối đa đèn LED nhấp nháy để đạt giấc ngủ REM trọn vẹn.`);
  }

  // Ensure exactly 3 actionable suggestions
  const finalActions = actions.slice(0, 3);

  // Motivational quote / closing
  const closings = [
    'Giấc ngủ chất lượng hôm nay là bệ phóng cho trí tuệ sáng suốt và năng lượng đỉnh cao ngày mai.',
    'Chiến thắng việc làm chủ thiết bị trước khi ngủ chính là bước đầu tiên để làm chủ ngày mới của bạn.',
    'Kỷ luật nhỏ mỗi tối sẽ tạo nên sự chuyển biến lớn trong sức khỏe và tinh thần dài hạn.',
  ];
  const chosenClosing = closings[Math.abs((current.moodScore || 3) * 7) % closings.length];

  return `<p><strong>Phân tích thói quen (Chuyên gia Hypnara Offline):</strong></p>
<p>${highlights.length > 0 ? '✨ <em>Điểm sáng:</em> ' + highlights.join(' ') : 'Bạn đã duy trì việc ghi chép thói quen để theo dõi sức khỏe.'}</p>
${risks.length > 0 ? `<p>⚠️ <em>Nguy cơ cần lưu ý:</em> ${risks.join(' ')}</p>` : ''}
<p><strong>3 Gợi ý hành động hôm nay:</strong></p>
<ul>
  ${finalActions.map((a) => `<li>${a}</li>`).join('\n  ')}
</ul>
<p><em>💡 Lời khuyên: ${chosenClosing}</em></p>`;
}

/**
 * 2. Generates context-aware rule-based replies for AI Chat assistant.
 */
export function generateRuleBasedChat(
  messages: Array<{ role: string; content: string }>,
  habits: HabitEntry[] = [],
  profile: UserProfile | null = null,
  username: string = 'học viên'
): string {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content?.toLowerCase() || '';

  const recentHabit = habits[0] || null;
  const recentSleep = recentHabit?.sleepHours ? parseFloat(String(recentHabit.sleepHours)) : null;
  const recentScreen = recentHabit?.screenTime ? parseFloat(String(recentHabit.screenTime)) : null;

  if (
    lastUserMsg.includes('chào') ||
    /\b(hi|hello|hey)\b/i.test(lastUserMsg)
  ) {
    return `Chào ${username}! Tôi là Trợ lý Giấc ngủ Hypnara (Chế độ Rule-Based Offline). Tôi có thể giúp bạn phân tích thời lượng ngủ, cách giảm screen time, phương pháp cai điện thoại trước khi ngủ và kỹ thuật ngủ sâu. Bạn cần hỗ trợ về vấn đề gì hôm nay?`;
  }

  if (lastUserMsg.includes('mất ngủ') || lastUserMsg.includes('khó ngủ') || lastUserMsg.includes('không ngủ được')) {
    return `Khi khó ngủ, nguyên tắc quan trọng nhất là "Không ép bản thân nằm trằn trọc quá 20 phút". Hãy:
1. Rời khỏi giường, sang phòng khác với ánh sáng vàng mờ.
2. Đọc vài trang sách giấy hoặc thực hành thở 4-7-8 (hít vào 4s, giữ 7s, thở ra 8s).
3. Tuyệt đối không bật điện thoại xem đồng hồ — điều này kích thích lo âu thời gian. Quay lại giường khi mí mắt đã thực sự nặng.`;
  }

  if (lastUserMsg.includes('điện thoại') || lastUserMsg.includes('screen') || lastUserMsg.includes('tắt máy') || lastUserMsg.includes('màn hình')) {
    return `Ánh sáng xanh từ màn hình làm giảm 80% nồng độ melatonin trong máu. Để giải quyết:
1. Thiết lập "Giờ giới nghiêm thiết bị" lúc ${profile?.reminder_time || '22:00'}.
2. Đổi màn hình điện thoại sang chế độ Đơn sắc (Grayscale) vào buổi tối để triệt tiêu sức hút màu sắc.
3. Cắm sạc điện thoại ở góc xa giường ngủ để tránh với tay lướt mạng trong vô thức.`;
  }

  if (lastUserMsg.includes('thể dục') || lastUserMsg.includes('vận động') || lastUserMsg.includes('tập')) {
    return `Vận động thể chất là công cụ điều hòa giấc ngủ tự nhiên tốt nhất:
- Nên hoàn thành bài tập thể lực ít nhất 3 tiếng trước giờ ngủ để thân nhiệt có đủ thời gian hạ thấp.
- Vận động nhẹ (yoga, đi dạo) sau bữa tối giúp cải thiện hệ tiêu hóa và tăng thời lượng ngủ sâu NREM thêm 15–20%.`;
  }

  if (lastUserMsg.includes('điểm') || lastUserMsg.includes('score') || lastUserMsg.includes('đánh giá')) {
    if (recentSleep !== null) {
      return `Dữ liệu gần nhất ghi nhận bạn ngủ ${recentSleep}h và dùng màn hình ${recentScreen || 0}h. Để nâng điểm Sleep Score trên 85: hãy ngủ đều đặn 7.5–8.5h, tắt máy trước ngủ ≥ 30 phút và vận động ≥ 30 phút mỗi ngày!`;
    }
    return `Điểm Sleep Score trên Hypnara tổng hợp từ 6 chỉ số: thời lượng ngủ, screen time, thời gian tắt máy trước ngủ, vận động, game time và tâm trạng. Hãy nhập nhật ký thói quen hàng ngày để xem bảng xếp hạng chi tiết!`;
  }

  // General scientific fallback response
  return `Theo nghiên cứu từ Viện Y học Giấc ngủ & Matthew Walker: Giấc ngủ tối ưu đòi hỏi 3 yếu tố cốt lõi:
1. Nhịp điệu cố định (ngủ và thức cùng một giờ mỗi ngày).
2. Môi trường tối và mát (20–22°C).
3. Cai thiết bị điện tử tối thiểu 30–45 phút trước khi lên giường.
Bạn hãy kiên trì áp dụng các bước này, chất lượng giấc ngủ và năng lượng ngày mới của bạn sẽ cải thiện rõ rệt!`;
}

/**
 * 3. Generates personalized motivational letter (250 - 350 words).
 */
export function generateRuleBasedMotivationalLetter(
  username: string,
  profile: UserProfile | null,
  habits: HabitEntry[] = []
): string {
  const goal = profile?.primary_goal || 'Làm chủ giấc ngủ và xây dựng lối sống số lành mạnh';
  const totalEntries = habits.length;

  const validSleep = habits.map((h) => parseFloat(String(h.sleepHours || '0'))).filter((n) => n > 0);
  const avgSleep = validSleep.length > 0 ? (validSleep.reduce((a, b) => a + b, 0) / validSleep.length).toFixed(1) : null;
  const hasGoodCutoff = habits.some((h) => Number(h.phoneCutoffMins) >= 30);

  return `Thân gửi ${username},

Hành trình xây dựng kỷ luật bản thân chưa bao giờ là dễ dàng, đặc biệt là trong một thế giới ngập tràn những chiếc màn hình luôn tìm cách lôi kéo sự chú ý của bạn. Thế nhưng, việc bạn có mặt ở đây và kiên trì ghi nhận từng thói quen nhỏ hàng ngày đã là một lời khẳng định mạnh mẽ cho quyết tâm thay đổi.

Nhìn lại hành trình gần đây với mục tiêu lớn "${goal}", hệ thống ghi nhận bạn đã hoàn thành ${totalEntries} ngày nhật ký thói quen.${avgSleep ? ` Thời lượng ngủ trung bình của bạn đang duy trì ở mức ${avgSleep} giờ/đêm.` : ''}${hasGoodCutoff ? ' Bạn đã có những đêm xuất sắc khi chủ động rời xa điện thoại trước giờ ngủ 30 phút — đó là bằng chứng cho thấy bạn hoàn toàn có năng lực làm chủ thiết bị thay vì để thiết bị điều khiển mình.' : ''}

Đừng quá nản lòng nếu có những ngày bạn thức khuya hay lỡ tay lướt mạng xã hội quá giờ. Kỷ luật không phải là sự hoàn hảo tuyệt đối trong một ngày, mà là sự kiên định quay trở lại quỹ đạo vào ngày hôm sau. Khi bạn đặt điện thoại xuống trước giờ ngủ, bạn không hề bỏ lỡ điều gì trên thế giới ảo — bạn chỉ đang trao cho não bộ và tâm trí mình cơ hội quý giá nhất để được chữa lành và tái tạo.

Tối nay, hãy dành tặng bản thân một giấc ngủ trọn vẹn, không ánh sáng xanh, không thông báo làm phiền. Ngày mai bạn sẽ thức dậy với tinh thần sảng khoái và sự tự tin cao nhất.

Chúc bạn một buổi tối bình yên và giấc ngủ thật sâu!`;
}
