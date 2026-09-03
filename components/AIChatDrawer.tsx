'use client';

import React, { useState, useRef, useEffect } from 'react';

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: string | null;
}

export default function AIChatDrawer({ isOpen, onClose, user }: AIChatDrawerProps) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    {
      role: 'assistant',
      content: 'Xin chào! Tôi là Trợ lý AI Hypnara — chuyên gia tư vấn giấc ngủ và thói quen sinh hoạt số.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatNotice, setChatNotice] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsgText = input.trim();
    const userMessage = { role: 'user', content: userMsgText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi trợ lý AI');

      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
      if (data.notice) {
        setChatNotice(data.notice);
      }
    } catch (err: any) {
      setMessages([...newMessages, { role: 'assistant', content: 'Lỗi: ' + err.message }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div style={{ position: 'fixed', right: 20, bottom: 20, width: 390, height: 530, background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-focus)', zIndex: 200, display: 'flex', flexDirection: 'column', boxShadow: '0 12px 36px rgba(0,0,0,0.6)' }}>
      <div style={{ padding: 14, background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>✨ Trợ lý AI Hypnara</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button>
      </div>

      <div style={{ flex: 1, padding: 14, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', padding: '8px 12px', borderRadius: 10, fontSize: 13, background: m.role === 'user' ? '#6366f1' : 'rgba(255,255,255,0.08)' }}>
            {m.content}
          </div>
        ))}
        {loading && <div style={{ fontSize: 12, color: 'var(--accent-cyan)' }}>Đang suy nghĩ...</div>}
        <div ref={messagesEndRef} />
      </div>

      {chatNotice && (
        <div style={{ padding: '8px 12px', background: 'rgba(245, 158, 11, 0.12)', borderTop: '1px solid rgba(245, 158, 11, 0.3)', fontSize: 11.5, color: '#fde68a' }}>
          <div style={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>⚠️ Đang dùng AI Offline</span>
            <a href={chatNotice.guide.url} target="_blank" rel="noreferrer" style={{ color: '#67e8f9', textDecoration: 'underline' }}>Lấy DeepSeek Key →</a>
          </div>
          <div style={{ opacity: 0.9, marginTop: 3 }}>
            Cấu hình <code>DEEPSEEK_API_KEY</code> trong <code>.env</code> để trò chuyện trực tiếp với DeepSeek Cloud.
          </div>
        </div>
      )}

      <form onSubmit={handleSend} style={{ padding: 12, display: 'flex', gap: 8 }}>
        <input
          type="text"
          className="form-control"
          placeholder="Nhập câu hỏi..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="btn-primary" disabled={loading}>Gửi</button>
      </form>
    </div>
  );
}
