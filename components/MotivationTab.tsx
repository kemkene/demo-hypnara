'use client';

import React, { useEffect, useState } from 'react';
import { Award, Plus, CheckCircle2, Trash2, Mail, Sparkles, Quote } from 'lucide-react';

export default function MotivationTab({ user }: { user: string | null }) {
  const todayStr = typeof window !== 'undefined'
    ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date())
    : new Date().toISOString().slice(0, 10);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState(todayStr);
  const [addingCommitment, setAddingCommitment] = useState(false);
  const [commitmentError, setCommitmentError] = useState('');

  const [letter, setLetter] = useState('');
  const [letterLoading, setLetterLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchMotivation = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/motivation');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMotivation();
  }, [user]);

  const handleAddCommitment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetDate) return;
    setAddingCommitment(true);
    setCommitmentError('');
    try {
      const res = await fetch('/api/commitments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, targetDate }),
      });
      const json = await res.json();
      if (res.ok) {
        setTitle('');
        fetchMotivation();
      } else {
        setCommitmentError(json.error || 'Lỗi tạo cam kết');
      }
    } catch (err: any) {
      setCommitmentError(err.message || 'Lỗi mạng');
    } finally {
      setAddingCommitment(false);
    }
  };

  const handleCheckin = async (id: number, completed: boolean) => {
    setCommitmentError('');
    try {
      const res = await fetch(`/api/commitments/${id}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });
      const json = await res.json();
      if (res.ok) {
        fetchMotivation();
      } else {
        setCommitmentError(json.error || 'Lỗi điểm danh');
      }
    } catch (err: any) {
      setCommitmentError(err.message || 'Lỗi mạng');
    }
  };

  const handleDeleteCommitment = async (id: number) => {
    try {
      const res = await fetch(`/api/commitments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchMotivation();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateAiLetter = async () => {
    setLetterLoading(true);
    setError('');
    try {
      const res = await fetch('/api/motivation/ai-letter', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Lỗi tạo thư AI');
      setLetter(json.letter);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLetterLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2 style={{ fontSize: 20, fontWeight: 800 }}>Chưa đăng nhập</h2>
        <p style={{ color: 'var(--text-muted)' }}>Vui lòng đăng nhập để theo dõi chuỗi thành tích và mở khóa huy hiệu kỷ luật.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải dữ liệu động lực...</div>;
  }

  return (
    <div>
      {data?.dailyQuote && (
        <div className="card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, #1e1b4b 0%, #111827 100%)', border: '1px solid rgba(139,92,246,0.3)' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <Quote size={32} color="#8b5cf6" style={{ flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 15, fontStyle: 'italic', fontWeight: 600, color: '#f3e8ff', marginBottom: 6 }}>
                "{data.dailyQuote.text}"
              </p>
              <div style={{ fontSize: 12, color: 'var(--accent-violet)', fontWeight: 700 }}>— {data.dailyQuote.author}</div>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title" style={{ marginBottom: 16 }}>
          <Award size={18} color="#f59e0b" /> Huy Hiệu Kỷ Luật & Thành Tích
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {data?.badges?.map((b: any) => (
            <div
              key={b.id}
              style={{
                padding: 14,
                borderRadius: 'var(--radius-md)',
                background: b.unlocked ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                border: b.unlocked ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid var(--border-color)',
                opacity: b.unlocked ? 1 : 0.45,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span style={{ fontSize: 28 }}>{b.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: b.unlocked ? '#fbbf24' : 'var(--text-muted)' }}>
                  {b.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title" style={{ marginBottom: 16 }}>
          🎯 Thêm Cam Kết Hành Động Mới
        </div>
        <form onSubmit={handleAddCommitment} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          <input
            type="text"
            className="form-control"
            placeholder="Nội dung cam kết (Ví dụ: Tắt máy lúc 22:30)..."
            style={{ flex: 1, minWidth: 240 }}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <input
            type="date"
            className="form-control"
            style={{ width: 160 }}
            value={targetDate}
            min={todayStr}
            onChange={(e) => setTargetDate(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary" disabled={addingCommitment}>
            <Plus size={16} /> Tạo cam kết
          </button>
        </form>

        {commitmentError && (
          <div style={{ padding: '8px 12px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#f87171', borderRadius: 8, fontSize: 12.5, marginBottom: 14 }}>
            ⚠️ {commitmentError}
          </div>
        )}

        <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 10 }}>
          Danh sách cam kết ({data?.commitments?.length || 0})
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data?.commitments?.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-sub)' }}>Chưa có cam kết nào được tạo.</div>
          ) : (
            data?.commitments?.map((c: any) => {
              const isFuture = c.target_date > todayStr;
              return (
                <div key={c.id} className="commitment-item" style={{ marginTop: 0 }}>
                  <div>
                    <div style={{ fontWeight: 700, textDecoration: c.completed ? 'line-through' : 'none', color: c.completed ? 'var(--text-sub)' : 'var(--text-main)' }}>
                      {c.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>Hạn chót: {c.target_date}</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {c.completed === true ? (
                      <span style={{ fontSize: 11, color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={14} /> Hoàn thành
                      </span>
                    ) : isFuture ? (
                      <span style={{ fontSize: 11, color: 'var(--text-sub)', background: 'rgba(255,255,255,0.06)', padding: '4px 8px', borderRadius: 4 }}>
                        ⏳ Chưa đến hạn
                      </span>
                    ) : (
                      <>
                        <button className="btn-checkin btn-checkin-yes" onClick={() => handleCheckin(c.id, true)}>
                          Đã làm
                        </button>
                        <button className="btn-checkin btn-checkin-no" onClick={() => handleCheckin(c.id, false)}>
                          Chưa
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDeleteCommitment(c.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', marginLeft: 8 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header-flex">
          <div className="card-title">
            <Mail size={18} color="#8b5cf6" /> Thư Động Lực Riêng Cho Học Viên (AI Letter)
          </div>
          <button className="btn-primary" onClick={handleGenerateAiLetter} disabled={letterLoading}>
            <Sparkles size={16} /> {letterLoading ? 'AI đang viết thư...' : 'Tạo Thư Động Lực DeepSeek'}
          </button>
        </div>

        {error && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</div>}

        {letter ? (
          <div style={{ padding: 20, background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: 'var(--radius-lg)', lineHeight: 1.8, fontSize: 14, color: '#f3e8ff', whiteSpace: 'pre-line' }}>
            {letter}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--text-sub)' }}>
            Nhấn nút để yêu cầu AI DeepSeek viết thư cá nhân hóa động viên bạn dựa trên lịch sử giấc ngủ & kỷ luật 14 ngày qua.
          </div>
        )}
      </div>
    </div>
  );
}
