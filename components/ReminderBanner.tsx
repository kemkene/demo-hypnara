'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Moon, X, ArrowRight } from 'lucide-react';

interface ReminderItem {
  id: string;
  time: string;
  label: string;
  enabled: boolean;
}

interface ReminderBannerProps {
  user: string | null;
  onNavigateToHabits: () => void;
}

export default function ReminderBanner({ user, onNavigateToHabits }: ReminderBannerProps) {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [activeReminder, setActiveReminder] = useState<ReminderItem | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [alreadyLoggedToday, setAlreadyLoggedToday] = useState(false);
  const [dismissedReminders, setDismissedReminders] = useState<Record<string, string>>({});

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

  // Fetch user profile to get reminders list and check today's habit log
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
          if (p.profile?.reminders && Array.isArray(p.profile.reminders) && p.profile.reminders.length > 0) {
            setReminders(p.profile.reminders);
          } else if (p.profile?.reminder_time) {
            setReminders([
              {
                id: 'default-1',
                time: p.profile.reminder_time,
                label: 'Tắt màn hình & Ghi chép nhật ký thói quen hôm nay',
                enabled: true,
              },
            ]);
          } else {
            setReminders([
              {
                id: 'default-1',
                time: '22:00',
                label: 'Tắt màn hình & Ghi chép nhật ký thói quen hôm nay',
                enabled: true,
              },
            ]);
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

  // Periodic interval check against all enabled reminders
  useEffect(() => {
    if (!user || reminders.length === 0) {
      setShowBanner(false);
      return;
    }

    const checkReminder = () => {
      const today = getVnToday();
      const currentTime = getVnTime();

      // Find any enabled reminder that is due and not dismissed today
      const due = reminders.find((r) => {
        if (!r.enabled) return false;
        if (dismissedReminders[r.id] === today) return false;
        // If it's the log habit reminder and user already logged, skip
        if (r.label.toLowerCase().includes('nhật ký') && alreadyLoggedToday) return false;
        return currentTime >= r.time;
      });

      if (due) {
        setActiveReminder(due);
        setShowBanner(true);

        // Web Notification trigger
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          const notifiedKey = `hypnara_notified_${today}_${due.id}_${due.time}`;
          if (!sessionStorage.getItem(notifiedKey)) {
            new Notification('🌙 Hypnara - Nhắc Nhở Kỷ Luật', {
              body: `Đã đến ${due.time}! ${due.label}`,
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
    const interval = setInterval(checkReminder, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [user, reminders, alreadyLoggedToday, dismissedReminders]);

  const handleDismiss = () => {
    if (activeReminder) {
      const today = getVnToday();
      setDismissedReminders((prev) => ({ ...prev, [activeReminder.id]: today }));
    }
    setShowBanner(false);
  };

  if (!showBanner || !activeReminder) return null;

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
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'rgba(168, 85, 247, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: '1px solid rgba(168, 85, 247, 0.4)',
          }}
        >
          <Moon size={20} color="#c084fc" />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⏰ Nhắc nhở lúc {activeReminder.time}</span>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'rgba(192, 132, 252, 0.2)', color: '#e9d5ff' }}>Đang kích hoạt</span>
          </div>
          <div style={{ fontSize: 13, color: '#e9d5ff', marginTop: 2 }}>
            {activeReminder.label}
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
