/**
 * Web Audio Chime & Web Notification Engine for Hypnara.
 * Uses Web Audio API for a soothing, zen chime and handles browser notification permissions.
 */

export function playChimeSound() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // First tone: E5 (659.25Hz) - Gentle bell
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.25, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.75);

    // Second harmonic tone: B5 (987.77Hz) - Soothing resolution
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.12);
    gain2.gain.setValueAtTime(0, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.3, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 1.25);
  } catch (err) {
    console.warn('[Hypnara] Web Audio chime playback error:', err);
  }
}

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export function getNotificationPermissionStatus(): NotificationPermissionStatus {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission as NotificationPermissionStatus;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission as NotificationPermissionStatus;
  } catch (err) {
    console.warn('[Hypnara] Request permission error:', err);
    return Notification.permission as NotificationPermissionStatus;
  }
}

export interface ShowNotificationResult {
  shown: boolean;
  permission: NotificationPermissionStatus;
  message?: string;
}

export async function showHypnaraNotification(
  title: string,
  body: string,
  playAudio: boolean = true
): Promise<ShowNotificationResult> {
  if (playAudio) {
    playChimeSound();
  }

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { shown: false, permission: 'unsupported', message: 'Trình duyệt này không hỗ trợ Web Notification.' };
  }

  let currentPermission = Notification.permission;
  if (currentPermission === 'default') {
    currentPermission = await Notification.requestPermission();
  }

  if (currentPermission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
      });
      return { shown: true, permission: 'granted' };
    } catch (err: any) {
      console.warn('[Hypnara] Failed to create Notification instance:', err);
      return { shown: false, permission: 'granted', message: 'Không thể tạo popup thông báo từ trình duyệt.' };
    }
  }

  if (currentPermission === 'denied') {
    return {
      shown: false,
      permission: 'denied',
      message: 'Thông báo bị Chặn (Denied). Vui lòng bấm vào icon ổ khóa 🔒 bên trái thanh địa chỉ URL trình duyệt > bật Cho phép thông báo (Notifications).',
    };
  }

  return { shown: false, permission: 'default', message: 'Bạn chưa cấp quyền nhận thông báo.' };
}
