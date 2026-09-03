'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, Sparkles, ChevronLeft, ChevronRight, Save, Copy, PlusCircle } from 'lucide-react';

export default function HabitsTab({ user, prefillData }: { user: string | null; prefillData?: any }) {
  const todayStr = typeof window !== 'undefined'
    ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date())
    : new Date().toISOString().slice(0, 10);

  const [date, setDate] = useState(todayStr);
  const isBackdate = date !== todayStr;
  const [sleepHours, setSleepHours] = useState('');
  const [screenTime, setScreenTime] = useState('');
  const [gameTime, setGameTime] = useState('');
  const [exerciseMinutes, setExerciseMinutes] = useState('');
  const [phoneCutoffMins, setPhoneCutoffMins] = useState('');
  const [phonePickups, setPhonePickups] = useState('');
  const [topApp, setTopApp] = useState('');
  const [moodScore, setMoodScore] = useState<number | null>(null);
  const [moodNote, setMoodNote] = useState('');
  const [schedule, setSchedule] = useState('');

  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [createdCommitmentMsg, setCreatedCommitmentMsg] = useState('');

  // History Pagination
  const [habitsList, setHabitsList] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalHabits, setTotalHabits] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    if (prefillData) {
      if (prefillData.screenTime) setScreenTime(String(prefillData.screenTime));
      if (prefillData.topApp) setTopApp(String(prefillData.topApp));
      if (prefillData.phonePickups) setPhonePickups(String(prefillData.phonePickups));
    }
  }, [prefillData]);

  const loadHistory = async (p = 1) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/habits?page=${p}&pageSize=${pageSize}`);
      if (res.ok) {
        const json = await res.json();
        setHabitsList(json.habits || []);
        setTotalHabits(json.total || 0);
        setPage(json.page || 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadHistory(page);
  }, [user, page]);

  const handleCopyYesterday = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/habits/yesterday');
      if (res.ok) {
        const json = await res.json();
        if (json.habit) {
          const h = json.habit;
          if (h.sleepHours) setSleepHours(String(h.sleepHours));
          if (h.screenTime) setScreenTime(String(h.screenTime));
          if (h.gameTime) setGameTime(String(h.gameTime));
          if (h.exerciseMinutes) setExerciseMinutes(String(h.exerciseMinutes));
          if (h.phoneCutoffMins !== null) setPhoneCutoffMins(String(h.phoneCutoffMins));
          if (h.phonePickups !== null) setPhonePickups(String(h.phonePickups));
          if (h.topApp) setTopApp(h.topApp);
          if (h.moodScore !== null) setMoodScore(h.moodScore);
          setMessage('📋 Đã sao chép dữ liệu từ ngày hôm qua! Hãy điều chỉnh lại vài con số cho hôm nay.');
        } else {
          setErrorMessage('Không tìm thấy dữ liệu thói quen của ngày hôm qua.');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setMessage('');
    setErrorMessage('');
    setSaving(true);

    const payload = {
      date,
      sleepHours,
      screenTime,
      gameTime,
      exerciseMinutes,
      phoneCutoffMins,
      phonePickups,
      topApp,
      moodScore,
      moodNote,
      schedule,
    };

    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi lưu thói quen');
      }

      setMessage('✅ Đã lưu dữ liệu thói quen ngày ' + date);
      loadHistory(page);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleGetAISuggestion = async () => {
    if (!user) return;
    if (isBackdate) {
      setErrorMessage(`Theo quy tắc hệ thống (Spec FR-005), gợi ý AI chỉ áp dụng cho dữ liệu ngày hôm nay (${todayStr}). Ngày quá khứ chỉ dùng lưu trữ lịch sử.`);
      return;
    }
    setAiLoading(true);
    setAiSuggestion('');
    setErrorMessage('');

    const payload = {
      date,
      sleepHours,
      screenTime,
      gameTime,
      exerciseMinutes,
      phoneCutoffMins,
      phonePickups,
      topApp,
      moodScore,
      moodNote,
      schedule,
    };

    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Lỗi lấy gợi ý AI');
      }

      setAiSuggestion(data.suggestion);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleConvertSuggestionToCommitment = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/commitments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Tắt máy đúng giờ & Tối ưu giấc ngủ theo gợi ý AI',
          targetDate: todayStr,
        }),
      });
      if (res.ok) {
        setCreatedCommitmentMsg('🎯 Đã biến gợi ý AI thành mục tiêu cam kết hôm nay! Kiểm tra ở mục Động lực.');
        setTimeout(() => setCreatedCommitmentMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2 style={{ fontSize: 20, fontWeight: 800 }}>Chưa đăng nhập</h2>
        <p style={{ color: 'var(--text-muted)', margin: '10px 0' }}>Vui lòng đăng nhập để ghi chép thói quen và nhận gợi ý AI.</p>
      </div>
    );
  }

  const moodEmojis = [
    { score: 1, emoji: '😫', label: 'Mệt mỏi' },
    { score: 2, emoji: '🙁', label: 'Hơi uể oải' },
    { score: 3, emoji: '😐', label: 'Bình thường' },
    { score: 4, emoji: '🙂', label: 'Tốt' },
    { score: 5, emoji: '🤩', label: 'Tuyệt vời' },
  ];

  const totalPages = Math.ceil(totalHabits / pageSize) || 1;

  return (
    <div>
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header-flex">
          <div className="card-title">
            <Calendar size={18} color="#6366f1" /> Nhập Nhật Ký Thói Quen Hàng Ngày
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="btn-action" onClick={handleCopyYesterday} title="Sao chép số liệu từ hôm qua để giảm ma sát nhập dữ liệu">
              <Copy size={14} /> Copy từ hôm qua
            </button>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)' }}>Ngày nhập:</label>
            <input
              type="date"
              className="form-control"
              style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
              value={date}
              max={todayStr}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        {message && (
          <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
            {message}
          </div>
        )}

        {errorMessage && (
          <div style={{ padding: '10px 14px', background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', color: '#f87171', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSaveHabit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <div className="form-group">
              <label>Thời lượng ngủ (giờ)</label>
              <input
                type="number"
                step="0.1"
                className="form-control"
                placeholder="Ví dụ: 7.5"
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Screen Time tổng (giờ)</label>
              <input
                type="number"
                step="0.1"
                className="form-control"
                placeholder="Ví dụ: 5.2"
                value={screenTime}
                onChange={(e) => setScreenTime(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Tắt máy trước ngủ (phút)</label>
              <input
                type="number"
                className="form-control"
                placeholder="Ví dụ: 30"
                value={phoneCutoffMins}
                onChange={(e) => setPhoneCutoffMins(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Vận động (phút)</label>
              <input
                type="number"
                className="form-control"
                placeholder="Ví dụ: 45"
                value={exerciseMinutes}
                onChange={(e) => setExerciseMinutes(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Chơi game (giờ)</label>
              <input
                type="number"
                step="0.1"
                className="form-control"
                placeholder="Ví dụ: 1.5"
                value={gameTime}
                onChange={(e) => setGameTime(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Số lần cầm máy (pickups)</label>
              <input
                type="number"
                className="form-control"
                placeholder="Ví dụ: 65"
                value={phonePickups}
                onChange={(e) => setPhonePickups(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 10 }}>
            <label>App sử dụng nhiều nhất</label>
            <input
              type="text"
              className="form-control"
              placeholder="TikTok, YouTube, Facebook, Liên Quân..."
              value={topApp}
              onChange={(e) => setTopApp(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Điểm tâm trạng hôm nay (Thang 1 - 5)</label>
            <div className="mood-scale-grid">
              {moodEmojis.map((m) => (
                <div
                  key={m.score}
                  className={`mood-scale-btn ${moodScore === m.score ? 'selected' : ''}`}
                  onClick={() => setMoodScore(m.score)}
                >
                  <span style={{ fontSize: 24 }}>{m.emoji}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Ghi chú tâm trạng & Lịch trình sinh hoạt</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Hôm nay cảm thấy thế nào, uống cà phê lúc mấy giờ, suy nghĩ trước khi ngủ..."
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="submit" className="btn-primary" disabled={saving}>
              <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu Thói Quen'}
            </button>

            <button
              type="button"
              className="btn-primary"
              style={{
                background: isBackdate
                  ? 'rgba(148, 163, 184, 0.2)'
                  : 'linear-gradient(135deg, #06b6d4, #10b981)',
                cursor: isBackdate ? 'not-allowed' : 'pointer',
                opacity: isBackdate ? 0.6 : 1,
              }}
              onClick={handleGetAISuggestion}
              disabled={aiLoading || isBackdate}
              title={isBackdate ? 'Gợi ý AI chỉ áp dụng cho ngày hôm nay (FR-005)' : 'Nhận phân tích gợi ý từ AI'}
            >
              <Sparkles size={16} /> {aiLoading ? 'AI đang phân tích...' : 'Phân Tích AI DeepSeek'}
            </button>

            {isBackdate && (
              <span style={{ fontSize: 12, color: 'var(--accent-amber)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                ℹ️ Đang chọn ngày quá khứ: Chỉ lưu lịch sử, không tạo gợi ý AI (Spec FR-005).
              </span>
            )}
          </div>
        </form>

        {/* AI Suggestion Box */}
        {aiSuggestion && (
          <div style={{ marginTop: 24, padding: 20, background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--accent-cyan)', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={18} /> DeepSeek AI Gợi Ý Tối Ưu Giấc Ngủ
              </span>
              <button className="btn-action" onClick={handleConvertSuggestionToCommitment} style={{ background: 'rgba(16,185,129,0.2)', color: '#34d399', border: '1px solid rgba(16,185,129,0.4)' }}>
                <PlusCircle size={14} /> Biến thành Cam Kết Hành Động
              </button>
            </div>
            {createdCommitmentMsg && (
              <div style={{ color: '#34d399', fontSize: 12.5, fontWeight: 700, marginBottom: 10 }}>{createdCommitmentMsg}</div>
            )}
            <div style={{ fontSize: 13.5, lineHeight: 1.7, color: '#e0f2fe' }} dangerouslySetInnerHTML={{ __html: aiSuggestion }} />
          </div>
        )}
      </div>

      {/* History Table */}
      <div className="card">
        <div className="card-header-flex">
          <div className="card-title">
            📋 Lịch Sử Nhật Ký Thói Quen ({totalHabits} bản ghi)
          </div>
          <a href="/api/export" download className="btn-action" style={{ textDecoration: 'none' }}>
            📥 Xuất File CSV
          </a>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Giờ ngủ</th>
                <th>Screen Time</th>
                <th>Tắt máy trước ngủ</th>
                <th>Vận động</th>
                <th>Top App</th>
                <th>Tâm trạng</th>
              </tr>
            </thead>
            <tbody>
              {habitsList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 20, color: 'var(--text-sub)' }}>
                    Chưa có nhật ký thói quen nào.
                  </td>
                </tr>
              ) : (
                habitsList.map((h: any) => (
                  <tr key={h.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{h.date}</td>
                    <td>{h.sleepHours ? `${h.sleepHours}h` : '-'}</td>
                    <td>{h.screenTime ? `${h.screenTime}h` : '-'}</td>
                    <td>{h.phoneCutoffMins !== null ? `${h.phoneCutoffMins}p` : '-'}</td>
                    <td>{h.exerciseMinutes ? `${h.exerciseMinutes}p` : '-'}</td>
                    <td>{h.topApp || '-'}</td>
                    <td>{h.moodScore ? `${h.moodScore}/5` : h.mood || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <span style={{ fontSize: 12.5, color: 'var(--text-sub)' }}>
              Trang {page} / {totalPages}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn-action"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft size={14} /> Trước
              </button>
              <button
                className="btn-action"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Sau <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
