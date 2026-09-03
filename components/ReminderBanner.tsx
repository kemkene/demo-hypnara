'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Moon, X, ArrowRight } from 'lucide-react';

interface ReminderBannerProps {
  user: string | null;
  onNavigateToHabits: () => void;
}

export default function ReminderBanner({ user, onNavigateToHabits }: ReminderBannerProps) {
  const [reminderTime, setReminderTime] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [alreadyLoggedToday, setAlreadyLoggedToday] = useState(false);
  const [dismissedDate, setDismissedDate] = useState<string | null>(null);

  const getVnToday = () => {
    return typeof window !== 'undefined'
      ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date())
      : new Date().toISOString().slice(0, 10);
  };

  const getVnTime = () => {
    return typeof window !== 'undefined'
      ? new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Asia/Ho_Chi_Minh',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(new Date())
      : '22:00';
  };

  // Fetch user profile to get reminder_time and check today's habit log
  useEffect(() => {
    if (!user) {
      setShowBanner(false);
      return;
    }

    const checkData = async () => {
      try {
        const [profRes, habitsRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/habits?page=1&pageSize=1'),
        ]);

        if (profRes.ok) {
          const p = await profRes.json();
          if (p.profile?.reminder_time) {
            setReminderTime(p.profile.reminder_time);
          } else {
            setReminderTime('22:00');
          }
        }

        if (habitsRes.ok) {
          const h = await habitsRes.json();
          const today = getVnToday();
          const hasToday = h.habits?.some((item: any) => item.date === today);
          setAlreadyLoggedToday(Boolean(hasToday));
        }
      } catch (err) {
        console.error('Error fetching reminder context:', err);
      }
    };

    checkData();
  }, [user]);

  // Periodic interval check
  useEffect(() => {
    if (!user || !reminderTime || alreadyLoggedToday) {
      setShowBanner(false);
      return;
    }

    const checkReminder = () => {
      const today = getVnToday();
      if (dismissedDate === today) {
        setShowBanner(false);
        return;
      }

      const currentTime = getVnTime();
      // Compare current time with reminderTime
      if (currentTime >= reminderTime) {
        setShowBanner(true);

        // Web Notification trigger
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          const notifiedKey = `hypnara_notified_${today}_${reminderTime}`;
          if (!sessionStorage.getItem(notifiedKey)) {
            new Notification('🌙 Hypnara - Giờ Tối Ưu Giấc Ngủ', {
              body: `Đã đến ${reminderTime}! Hãy tắt màn hình, thư giãn mắt và hoàn thành nhật ký thói quen hôm nay.`,
              icon: '/favicon.ico',
            });
            sessionStorage.setItem(notifiedKey, 'true');
          }
        }
      } else {
        setShowBanner(false);
      }
    };

    checkReminder();
    const interval = setInterval(checkReminder, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, [user, reminderTime, alreadyLoggedToday, dismissedDate]);

  const handleDismiss = () => {
    setDismissedDate(getVnToday());
    setShowBanner(false);
  };

  if (!showBanner || !reminderTime) return null;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)',
        border: '1px solid rgba(168, 85, 247, 0.4)',
        boxShadow: '0 8px 24px rgba(168, 85, 247, 0.25)',
        color: '#f3e8ff',
        padding: '12px 20px',
        borderRadius: 'var(--radius-md)',
        margin: '0 0 20px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        animation: 'slideDown 0.3s ease-out',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(168, 85, 247, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Moon size={20} color="#c084fc" />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#ffffff' }}>
            Đã đến giờ nhắc nhở buổi tối ({reminderTime})!
          </div>
          <div style={{ fontSize: 12.5, color: '#e9d5ff', opacity: 0.9 }}>
            Đã đến lúc tạm dừng các thiết bị số, tắt đèn màn hình và ghi lại nhật ký thói quen hôm nay để bảo vệ chuỗi kỷ luật.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          className="btn-primary"
          onClick={() => {
            onNavigateToHabits();
            setShowBanner(false);
          }}
          style={{
            padding: '8px 14px',
            fontSize: 12.5,
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
          }}
        >
          Nhập thói quen ngay <ArrowRight size={14} />
        </button>
        <button
          onClick={handleDismiss}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            color: '#e9d5ff',
            width: 30,
            height: 30,
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Đóng thông báo"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
