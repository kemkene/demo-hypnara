import { cookies } from 'next/headers';

export function getSessionUser(): string | null {
  const cookieStore = cookies();
  const session = cookieStore.get('session');
  return session ? session.value : null;
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isValidDateStr(s: any): boolean {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && s <= todayStr();
}

export function validateHabitInput(input: any): string[] {
  const errors: string[] = [];

  if (input.sleepHours !== undefined && input.sleepHours !== null && input.sleepHours !== '') {
    const sleep = parseFloat(input.sleepHours);
    if (isNaN(sleep)) {
      errors.push('Giờ ngủ phải là số hợp lệ.');
    } else if (sleep < 1.0) {
      errors.push('Giờ ngủ không thể nhỏ hơn 1 giờ.');
    } else if (sleep > 18.0) {
      errors.push('Giờ ngủ tối đa là 18 giờ.');
    }
  }

  if (input.screenTime !== undefined && input.screenTime !== null && input.screenTime !== '') {
    const screen = parseFloat(input.screenTime);
    if (isNaN(screen)) {
      errors.push('Thời gian màn hình phải là số hợp lệ.');
    } else if (screen < 0) {
      errors.push('Thời gian màn hình không thể âm.');
    } else if (screen > 24.0) {
      errors.push('Thời gian màn hình tối đa là 24 giờ / ngày.');
    }
  }

  if (input.gameTime !== undefined && input.gameTime !== null && input.gameTime !== '') {
    const game = parseFloat(input.gameTime);
    if (isNaN(game)) {
      errors.push('Thời gian chơi game phải là số hợp lệ.');
    } else if (game < 0) {
      errors.push('Thời gian chơi game không thể âm.');
    } else if (game > 24.0) {
      errors.push('Thời gian chơi game tối đa là 24 giờ / ngày.');
    }
  }

  if (input.exerciseMinutes !== undefined && input.exerciseMinutes !== null && input.exerciseMinutes !== '') {
    const ex = parseFloat(input.exerciseMinutes);
    if (isNaN(ex)) {
      errors.push('Phút vận động phải là số hợp lệ.');
    } else if (ex < 0) {
      errors.push('Phút vận động không thể âm.');
    } else if (ex > 1440) {
      errors.push('Phút vận động không thể vượt quá 1440 phút (24 giờ).');
    }
  }

  if (input.phoneCutoffMins !== undefined && input.phoneCutoffMins !== null && input.phoneCutoffMins !== '') {
    const cutoff = parseInt(input.phoneCutoffMins, 10);
    if (isNaN(cutoff)) {
      errors.push('Thời gian tắt máy trước ngủ phải là số phút hợp lệ.');
    } else if (cutoff < 0 || cutoff > 360) {
      errors.push('Số phút tắt máy phải từ 0 đến 360 phút.');
    }
  }

  if (input.phonePickups !== undefined && input.phonePickups !== null && input.phonePickups !== '') {
    const pickups = parseInt(input.phonePickups, 10);
    if (isNaN(pickups)) {
      errors.push('Số lần cầm điện thoại phải là số hợp lệ.');
    } else if (pickups < 0 || pickups > 500) {
      errors.push('Số lần cầm điện thoại từ 0 đến 500.');
    }
  }

  if (input.moodScore !== undefined && input.moodScore !== null && input.moodScore !== '') {
    const mood = parseInt(input.moodScore, 10);
    if (isNaN(mood) || mood < 1 || mood > 5) {
      errors.push('Điểm tâm trạng phải từ 1 (Rất mệt) đến 5 (Tuyệt vời).');
    }
  }

  return errors;
}
