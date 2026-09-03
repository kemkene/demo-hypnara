'use client';

import React, { useEffect, useState } from 'react';
import { Moon, Monitor, Gamepad2, Activity, Smartphone, Smile, Sparkles, CheckCircle2, Circle, Target, Bell, Plus, X, Check, Clock, Trash2, Volume2 } from 'lucide-react';
import TrendChart from '@/components/dashboard/TrendChart';

interface ReminderItem {
  id: string;
  time: string;
  label: string;
  enabled: boolean;
}

const PRESET_GOALS = [
  'Tối ưu giấc ngủ 7.0 - 9.0h / đêm',
  'Tắt máy trước khi ngủ ít nhất 30 phút',
  'Giảm thời gian xem màn hình & chơi game',
  'Tăng vận động thể thao ≥ 150 phút / tuần',
  'Cố định giờ đi ngủ trước 23:00',
  'Không dùng thiết bị số trong phòng ngủ',
];

const DEFAULT_REMINDERS: ReminderItem[] = [
  { id: 'rem-1', time: '21:30', label: 'Tắt máy & Rời màn hình trước khi ngủ 30 phút', enabled: true },
  { id: 'rem-2', time: '22:00', label: 'Ghi chép nhật ký thói quen sinh hoạt hôm nay', enabled: true },
  { id: 'rem-3', time: '22:30', label: 'Đi ngủ đúng giờ & Bật chế độ không làm phiền', enabled: true },
];

export default function OverviewTab({ user }: { user: string | null }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Profile Goal state (Supports multiple goals)
  const [selectedGoals, setSelectedGoals] = useState<string[]>([
    'Tối ưu giấc ngủ 7.0 - 9.0h / đêm',
    'Tắt máy trước khi ngủ ít nhất 30 phút',
  ]);
  const [customGoalInput, setCustomGoalInput] = useState('');

  // Reminders state (Supports multiple custom reminders)
  const [reminders, setReminders] = useState<ReminderItem[]>(DEFAULT_REMINDERS);
  const [newReminderTime, setNewReminderTime] = useState('21:00');
  const [newReminderLabel, setNewReminderLabel] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSavedMsg, setProfileSavedMsg] = useState('');

  const fetchOverview = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [ovRes, pfRes] = await Promise.all([
        fetch('/api/overview'),
        fetch('/api/profile'),
      ]);

      if (ovRes.ok) {
        const json = await ovRes.json();
        setData(json);
      }

      if (pfRes.ok) {
        const pfJson = await pfRes.json();
        if (pfJson.profile) {
          if (pfJson.profile.primary_goal) {
            const parsed = pfJson.profile.primary_goal
              .split(' • ')
              .map((s: string) => s.trim())
              .filter(Boolean);
            if (parsed.length > 0) {
              setSelectedGoals(parsed);
            } else {
              setSelectedGoals([pfJson.profile.primary_goal]);
            }
          }
          if (pfJson.profile.reminders && Array.isArray(pfJson.profile.reminders) && pfJson.profile.reminders.length > 0) {
            setReminders(pfJson.profile.reminders);
          } else if (pfJson.profile.reminder_time) {
            setReminders([
              { id: 'rem-1', time: pfJson.profile.reminder_time, label: 'Ghi chép nhật ký thói quen sinh hoạt hôm nay', enabled: true },
              { id: 'rem-2', time: '21:30', label: 'Tắt máy & Rời màn hình trước khi ngủ 30 phút', enabled: true },
            ]);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [user]);

  const handleToggleGoal = (goal: string) => {
    if (selectedGoals.includes(goal)) {
      if (selectedGoals.length === 1) return;
      setSelectedGoals(selectedGoals.filter((g) => g !== goal));
    } else {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  const handleAddCustomGoal = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customGoalInput.trim();
    if (!trimmed) return;
    if (!selectedGoals.includes(trimmed)) {
      setSelectedGoals([...selectedGoals, trimmed]);
    }
    setCustomGoalInput('');
  };

  const handleRemoveGoal = (goal: string) => {
    if (selectedGoals.length <= 1) return;
    setSelectedGoals(selectedGoals.filter((g) => g !== goal));
  };

  // Reminder handlers
  const handleToggleReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleUpdateReminderTime = (id: string, time: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, time } : r))
    );
  };

  const handleUpdateReminderLabel = (id: string, label: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, label } : r))
    );
  };

  const handleRemoveReminder = (id: string) => {
    if (reminders.length <= 1) return;
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddReminder = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const label = newReminderLabel.trim() || 'Nhắc nhở tối ưu giấc ngủ';
    const newRem: ReminderItem = {
      id: `rem-${Date.now()}`,
      time: newReminderTime || '22:00',
      label,
      enabled: true,
    };
    setReminders((prev) => [...prev, newRem]);
    setNewReminderLabel('');
  };

  const handleTestNotification = (customText?: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification('🌙 Hypnara - Chuông Nhắc Nhở Thử Nghiệm', {
            body: customText || '✅ Thông báo hoạt động tốt! Bạn sẽ nhận được chuông nhắc đúng các khung giờ đã cài đặt.',
            icon: '/favicon.ico',
          });
        }
      });
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setProfileSavedMsg('');
    try {
      const primaryReminderTime = reminders.find((r) => r.enabled)?.time || '22:00';
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryGoal: selectedGoals.join(' • '),
          reminderTime: primaryReminderTime,
          reminders,
        }),
      });
      if (res.ok) {
        setProfileSavedMsg('✅ Đã lưu toàn bộ mục tiêu & danh sách nhắc nhở!');
        setTimeout(() => setProfileSavedMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
  };

  if (!user) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>Chào mừng đến với Hypnara</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 500, margin: '0 auto 20px' }}>
          Vui lòng đăng nhập để xem thông số phân tích giấc ngủ 6 chỉ số, biểu đồ xu hướng 7/30/60 ngày, điểm Sleep Score và nhận gợi ý thông minh từ DeepSeek AI.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
        Đang tải thông số phân tích giấc ngủ & thói quen...
      </div>
    );
  }

  const stats = data?.stats || {};
  const sleepScore: number | null = stats.sleepScore !== undefined && stats.sleepScore !== null ? stats.sleepScore : null;
  const strokeOffset = sleepScore !== null ? 440 - (440 * sleepScore) / 100 : 440;

  const getScoreBadge = (score: number | null) => {
    if (score === null) return { class: 'status-neutral', label: 'Chưa có dữ liệu' };
    if (score >= 85) return { class: 'status-excellent', label: 'Xuất sắc' };
    if (score >= 70) return { class: 'status-good', label: 'Tốt' };
    if (score >= 50) return { class: 'status-fair', label: 'Trung bình' };
    return { class: 'status-poor', label: 'Cần cải thiện' };
  };
  const badge = getScoreBadge(sleepScore);

  return (
    <div>
      {/* Top Gauge & 6 Metrics */}
      <div className="dashboard-top-grid">
        <div className="card score-card">
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Điểm Giấc Ngủ & Wellbeing
          </div>
          <div className="score-gauge-wrap">
            <svg className="score-gauge-svg" viewBox="0 0 160 160">
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <circle className="score-gauge-bg" cx="80" cy="80" r="70" />
              <circle
                className="score-gauge-bar"
                cx="80"
                cy="80"
                r="70"
                style={{ strokeDashoffset: strokeOffset }}
              />
            </svg>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <div className="score-number">{sleepScore !== null ? sleepScore : '--'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-sub)', fontWeight: 600 }}>/ 100</div>
            </div>
          </div>
          <div className={`score-status-badge ${badge.class}`}>{badge.label}</div>
          <p style={{ fontSize: 12, color: 'var(--text-sub)', margin: 0 }}>
            {sleepScore !== null
              ? (data?.streak > 0 ? `🔥 Chuỗi kỷ luật: ${data.streak} ngày liên tiếp` : 'Nhập thói quen hàng ngày để tăng điểm')
              : 'Chưa có dữ liệu giấc ngủ 7 ngày qua. Hãy nhập thói quen để hệ thống tính điểm.'}
          </p>
        </div>

        {/* 6 Metrics Grid */}
        <div className="metrics-6-grid">
          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Thời lượng ngủ</span>
              <Moon size={16} color="#6366f1" />
            </div>
            <div className="metric-val">
              {stats.avgSleep || 0} <span className="metric-unit">giờ/đêm</span>
            </div>
            <div className="metric-hint">Mục tiêu: 7.0 - 9.0h</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Screen Time</span>
              <Monitor size={16} color="#06b6d4" />
            </div>
            <div className="metric-val">
              {stats.avgScreen || 0} <span className="metric-unit">giờ/ngày</span>
            </div>
            <div className="metric-hint">App top: {stats.mostFrequentTopApp}</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Tắt máy trước ngủ</span>
              <Smartphone size={16} color="#14b8a6" />
            </div>
            <div className="metric-val">
              {stats.avgCutoff || 0} <span className="metric-unit">phút</span>
            </div>
            <div className="metric-hint">Khuyên dùng: ≥ 30p</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Vận động</span>
              <Activity size={16} color="#10b981" />
            </div>
            <div className="metric-val">
              {stats.avgExercise || 0} <span className="metric-unit">phút/ngày</span>
            </div>
            <div className="metric-hint">WHO: ≥ 150p/tuần</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Chơi game / GIẢI TRÍ</span>
              <Gamepad2 size={16} color="#f59e0b" />
            </div>
            <div className="metric-val">
              {stats.avgGame || 0} <span className="metric-unit">giờ/ngày</span>
            </div>
            <div className="metric-hint">Số lần cầm máy: ~{stats.avgPickups || 0} lần</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Tâm trạng</span>
              <Smile size={16} color="#8b5cf6" />
            </div>
            <div className="metric-val">
              {stats.avgMoodScore || 0} <span className="metric-unit">/ 5</span>
            </div>
            <div className="metric-hint">Thang điểm 5</div>
          </div>
        </div>
      </div>

      {/* Line Trend Chart 7 / 14 / 30 Days */}
      <TrendChart
        chartData7={data?.chartData7}
        chartData14={data?.chartData14}
        chartData30={data?.chartData30}
      />

      {/* Onboarding Goal & Daily Reminder Widget */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title" style={{ marginBottom: 14 }}>
          <Target size={18} color="#06b6d4" /> Thiết Lập Mục Tiêu & Giờ Nhắc Nhở Nhập Nhật Ký
        </div>
        {profileSavedMsg && (
          <div style={{ color: '#34d399', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{profileSavedMsg}</div>
        )}

        {/* Multi-goal selection section */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
            🎯 Mục tiêu cải thiện sức khỏe số (Có thể chọn nhiều mục tiêu cùng lúc):
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {PRESET_GOALS.map((goal) => {
              const isSelected = selectedGoals.includes(goal);
              return (
                <button
                  key={goal}
                  type="button"
                  onClick={() => handleToggleGoal(goal)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 13px',
                    borderRadius: 20,
                    fontSize: 12.5,
                    fontWeight: isSelected ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: isSelected ? '1px solid #06b6d4' : '1px solid rgba(255, 255, 255, 0.12)',
                    background: isSelected ? 'rgba(6, 182, 212, 0.16)' : 'rgba(255, 255, 255, 0.04)',
                    color: isSelected ? '#38bdf8' : '#cbd5e1',
                    boxShadow: isSelected ? '0 0 10px rgba(6, 182, 212, 0.25)' : 'none',
                  }}
                >
                  {isSelected ? <Check size={13} color="#38bdf8" /> : <Plus size={13} color="#94a3b8" />}
                  {goal}
                </button>
              );
            })}
          </div>

          {/* Custom goal input */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', maxWidth: 580 }}>
            <input
              type="text"
              className="form-control"
              placeholder="Nhập mục tiêu riêng (ví dụ: Không dùng điện thoại trên giường ngủ)..."
              value={customGoalInput}
              onChange={(e) => setCustomGoalInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomGoal();
                }
              }}
              style={{ fontSize: 12.5, padding: '7px 12px' }}
            />
            <button
              type="button"
              className="btn-action"
              onClick={() => handleAddCustomGoal()}
              style={{ padding: '7px 14px', fontSize: 12.5, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <Plus size={14} /> Thêm
            </button>
          </div>

          {/* Selected goals list display */}
          <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
              Mục tiêu đã kích hoạt ({selectedGoals.length}):
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {selectedGoals.map((g) => (
                <span
                  key={g}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 14,
                    fontSize: 12,
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: '#c7d2fe',
                    border: '1px solid rgba(99, 102, 241, 0.35)',
                  }}
                >
                  {g}
                  {selectedGoals.length > 1 && (
                    <X
                      size={13}
                      style={{ cursor: 'pointer', opacity: 0.7 }}
                      onClick={() => handleRemoveGoal(g)}
                    />
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Multi-reminders management section */}
        <div style={{ paddingTop: 14, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={16} color="#c084fc" /> Thiết lập các mốc nhắc nhở riêng biệt ({reminders.filter((r) => r.enabled).length} đang bật):
            </label>
            <span style={{ fontSize: 12, color: '#a78bfa' }}>
              Mỗi mục tiêu có thể có một khung giờ và nội dung nhắc nhở riêng
            </span>
          </div>

          {/* Reminders List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {reminders.map((rem) => (
              <div
                key={rem.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: rem.enabled ? 'rgba(168, 85, 247, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: rem.enabled ? '1px solid rgba(168, 85, 247, 0.25)' : '1px solid rgba(255, 255, 255, 0.06)',
                  opacity: rem.enabled ? 1 : 0.6,
                  transition: 'all 0.2s ease',
                  flexWrap: 'wrap',
                }}
              >
                {/* Enabled checkbox */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: rem.enabled ? '#c084fc' : '#64748b' }}>
                  <input
                    type="checkbox"
                    checked={rem.enabled}
                    onChange={() => handleToggleReminder(rem.id)}
                    style={{ cursor: 'pointer' }}
                  />
                  {rem.enabled ? 'Bật' : 'Tắt'}
                </label>

                {/* Time picker */}
                <input
                  type="time"
                  value={rem.time}
                  onChange={(e) => handleUpdateReminderTime(rem.id, e.target.value)}
                  className="form-control"
                  style={{
                    width: 105,
                    padding: '4px 8px',
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: rem.enabled ? '#ffffff' : '#94a3b8',
                  }}
                  disabled={!rem.enabled}
                />

                {/* Reminder text label */}
                <input
                  type="text"
                  value={rem.label}
                  onChange={(e) => handleUpdateReminderLabel(rem.id, e.target.value)}
                  className="form-control"
                  style={{
                    flex: 1,
                    minWidth: 200,
                    padding: '5px 10px',
                    fontSize: 12.5,
                    color: rem.enabled ? '#e2e8f0' : '#64748b',
                  }}
                  placeholder="Nội dung lời nhắc..."
                  disabled={!rem.enabled}
                />

                {/* Test button for this reminder */}
                <button
                  type="button"
                  onClick={() => handleTestNotification(`⏰ [${rem.time}] ${rem.label}`)}
                  title="Thử chuông cho mốc này"
                  style={{
                    background: 'rgba(168, 85, 247, 0.15)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    color: '#e9d5ff',
                    padding: '5px 8px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11.5,
                  }}
                >
                  <Volume2 size={13} /> Thử
                </button>

                {/* Delete button */}
                {reminders.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveReminder(rem.id)}
                    title="Xóa mốc nhắc nhở"
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      padding: '5px 8px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Form to add a new custom reminder */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              padding: '10px 14px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed rgba(255, 255, 255, 0.12)',
              marginBottom: 16,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#94a3b8' }}>+ Thêm mốc mới:</span>
            <input
              type="time"
              value={newReminderTime}
              onChange={(e) => setNewReminderTime(e.target.value)}
              className="form-control"
              style={{ width: 105, padding: '5px 8px', fontSize: 12.5 }}
            />
            <input
              type="text"
              value={newReminderLabel}
              onChange={(e) => setNewReminderLabel(e.target.value)}
              placeholder="Nhập nội dung nhắc nhở riêng (ví dụ: Uống nước & đi ngủ lúc 23h)..."
              className="form-control"
              style={{ flex: 1, minWidth: 200, padding: '5px 10px', fontSize: 12.5 }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddReminder();
                }
              }}
            />
            <button
              type="button"
              onClick={() => handleAddReminder()}
              className="btn-action"
              style={{ padding: '6px 14px', fontSize: 12.5, display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <Plus size={14} /> Thêm nhắc nhở
            </button>
          </div>

          {/* Action buttons bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <button
              type="button"
              onClick={handleSaveProfile}
              className="btn-primary"
              style={{ padding: '10px 20px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              disabled={savingProfile}
            >
              <Bell size={16} /> Lưu toàn bộ mục tiêu & danh sách nhắc nhở
            </button>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                type="button"
                className="btn-action"
                onClick={() => handleTestNotification()}
                style={{ fontSize: 12, padding: '7px 12px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <Volume2 size={14} /> Thử chuông tất cả
              </button>

              {typeof window !== 'undefined' && 'Notification' in window && (
                <button
                  type="button"
                  className="btn-action"
                  onClick={() => {
                    if (typeof Notification !== 'undefined') {
                      Notification.requestPermission().then((permission) => {
                        if (permission === 'granted') {
                          handleTestNotification('✅ Đã bật thông báo Web thành công! Bạn sẽ nhận thông báo khi đến giờ.');
                        }
                      });
                    }
                  }}
                  style={{
                    fontSize: 12,
                    padding: '7px 14px',
                    background: typeof Notification !== 'undefined' && Notification.permission === 'granted' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                    borderColor: typeof Notification !== 'undefined' && Notification.permission === 'granted' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(99, 102, 241, 0.4)',
                    color: typeof Notification !== 'undefined' && Notification.permission === 'granted' ? '#34d399' : '#fff',
                  }}
                >
                  {typeof Notification !== 'undefined' && Notification.permission === 'granted' ? '✅ Thông báo Web: Đã bật' : '🔔 Bật thông báo Web'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Correlations Insights */}
      {data?.correlations && data.correlations.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title" style={{ marginBottom: 14 }}>
            <Sparkles size={18} color="#06b6d4" /> Phân Tích Tương Quan Thói Quen (AI Insights)
          </div>
          <div className="correlations-container">
            {data.correlations.map((c: any, i: number) => {
              const cls = c.type === 'positive' ? 'corr-positive' : c.type === 'warning' ? 'corr-warning' : 'corr-info';
              return (
                <div key={i} className={`correlation-item ${cls}`}>
                  <div style={{ fontWeight: 700, minWidth: 200 }}>{c.title}</div>
                  <div style={{ opacity: 0.95 }}>{c.insight}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Commitments Widget */}
      {data?.commitments && (
        <div className="commitment-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>
              🎯 Cam Kết Hành Động Tối Ưu Giấc Ngủ
            </div>
            <div style={{ fontSize: 13, color: 'var(--accent-cyan)', fontWeight: 700 }}>
              Hoàn thành: {data.commitments.completed} / {data.commitments.total} ({data.commitments.rate}%)
            </div>
          </div>
          {data.commitments.recent.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-sub)' }}>Chưa tạo cam kết nào. Vào mục "Động lực" hoặc lấy gợi ý AI để tạo cam kết!</div>
          ) : (
            data.commitments.recent.map((item: any) => (
              <div key={item.id} className="commitment-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {item.completed ? <CheckCircle2 size={16} color="#10b981" /> : <Circle size={16} color="#94a3b8" />}
                  <span style={{ textDecoration: item.completed ? 'line-through' : 'none', opacity: item.completed ? 0.6 : 1 }}>
                    {item.title}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-sub)' }}>Hạn: {item.target_date}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
