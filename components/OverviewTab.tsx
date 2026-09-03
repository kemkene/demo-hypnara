'use client';

import React, { useEffect, useState } from 'react';
import { Moon, Monitor, Gamepad2, Activity, Smartphone, Smile, Sparkles, CheckCircle2, Circle, Target, Bell } from 'lucide-react';
import TrendChart from '@/components/dashboard/TrendChart';

export default function OverviewTab({ user }: { user: string | null }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Profile Goal & Reminder state
  const [primaryGoal, setPrimaryGoal] = useState('Tối ưu giấc ngủ 7-9h');
  const [reminderTime, setReminderTime] = useState('22:00');
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
          if (pfJson.profile.primary_goal) setPrimaryGoal(pfJson.profile.primary_goal);
          if (pfJson.profile.reminder_time) setReminderTime(pfJson.profile.reminder_time);
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setProfileSavedMsg('');
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryGoal, reminderTime }),
      });
      if (res.ok) {
        setProfileSavedMsg('✅ Đã lưu mục tiêu & nhắc nhở!');
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
          <Target size={18} color="#06b6d4" /> Thiết Thiết Lập Mục Tiêu & Giờ Nhắc Nhở Nhập Nhật Ký
        </div>
        {profileSavedMsg && (
          <div style={{ color: '#34d399', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{profileSavedMsg}</div>
        )}
        <form onSubmit={handleSaveProfile} style={{ display: 'grid', gridTemplateColumns: '1fr 200px auto', gap: 12, alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Mục tiêu cá nhân ưu tiên</label>
            <select
              className="form-control"
              value={primaryGoal}
              onChange={(e) => setPrimaryGoal(e.target.value)}
            >
              <option value="Tối ưu giấc ngủ 7-9h">Tối ưu giấc ngủ 7.0 - 9.0h / đêm</option>
              <option value="Giảm giờ dùng điện thoại & game">Giảm thời gian xem màn hình & chơi game</option>
              <option value="Tắt máy trước khi ngủ 30 phút">Tắt máy trước khi ngủ ít nhất 30 phút</option>
              <option value="Tăng vận động thể thao ≥ 150p/tuần">Tăng vận động thể thao ≥ 150 phút / tuần</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Giờ nhắc nhở hàng ngày</label>
            <input
              type="time"
              className="form-control"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ padding: '10px 16px' }} disabled={savingProfile}>
            <Bell size={15} /> Lưu mục tiêu
          </button>
        </form>

        <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5, color: '#c7d2fe', flexWrap: 'wrap', gap: 10 }}>
          <span>🔔 Hệ thống sẽ tự động kích hoạt thông báo lúc <strong>{reminderTime || '22:00'}</strong> mỗi tối để nhắc bạn rời màn hình & ghi nhật ký thói quen.</span>
          {typeof window !== 'undefined' && 'Notification' in window && (
            <button
              type="button"
              className="btn-action"
              onClick={() => {
                if (typeof Notification !== 'undefined') {
                  Notification.requestPermission().then((permission) => {
                    if (permission === 'granted') {
                      new Notification('Hypnara', { body: '✅ Đã kích hoạt thông báo nhắc nhở thành công!' });
                    }
                  });
                }
              }}
              style={{ fontSize: 11.5, padding: '5px 12px', background: 'rgba(99, 102, 241, 0.2)', color: '#fff', border: '1px solid rgba(99, 102, 241, 0.4)' }}
            >
              {typeof Notification !== 'undefined' && Notification.permission === 'granted' ? '✅ Thông báo Web: Đã bật' : '🔔 Bật thông báo Web'}
            </button>
          )}
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
