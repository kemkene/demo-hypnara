'use client';

import React from 'react';
import { LayoutDashboard, Calendar, Flame, Camera, LogIn, LogOut, MessageSquare } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: string | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onToggleChat: () => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  user,
  onOpenAuth,
  onLogout,
  onToggleChat,
}: NavbarProps) {
  return (
    <header className="main-header">
      <a href="#" className="brand" onClick={(e) => { e.preventDefault(); setActiveTab('overview'); }}>
        <div className="brand-logo">🌙</div>
        <div>
          <div className="brand-title">Hypnara</div>
          <div className="brand-subtitle">Sleep & Digital Wellbeing</div>
        </div>
      </a>

      <nav className="nav-tabs">
        <button
          className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <LayoutDashboard size={16} /> Tổng quan
        </button>
        <button
          className={`nav-btn ${activeTab === 'habits' ? 'active' : ''}`}
          onClick={() => setActiveTab('habits')}
        >
          <Calendar size={16} /> Thói quen
        </button>
        <button
          className={`nav-btn ${activeTab === 'motivation' ? 'active' : ''}`}
          onClick={() => setActiveTab('motivation')}
        >
          <Flame size={16} /> Động lực
        </button>
        <button
          className={`nav-btn ${activeTab === 'ocr' ? 'active' : ''}`}
          onClick={() => setActiveTab('ocr')}
        >
          <Camera size={16} /> Quét OCR
        </button>
      </nav>

      <div className="user-actions">
        <button className="btn-action" onClick={onToggleChat} title="Trợ lý AI Hypnara">
          <MessageSquare size={15} color="#8b5cf6" /> Trợ lý AI
        </button>
        {user ? (
          <>
            <div className="user-pill">
              <span>Xin chào,</span> <strong>{user}</strong>
            </div>
            <button className="btn-action btn-logout" onClick={onLogout}>
              <LogOut size={14} /> Đăng xuất
            </button>
          </>
        ) : (
          <button className="btn-primary" onClick={onOpenAuth} style={{ padding: '8px 16px', fontSize: '13px' }}>
            <LogIn size={15} /> Đăng nhập
          </button>
        )}
      </div>
    </header>
  );
}
