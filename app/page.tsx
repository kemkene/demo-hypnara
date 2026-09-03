'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import AuthModal from '@/components/AuthModal';
import OverviewTab from '@/components/OverviewTab';
import HabitsTab from '@/components/HabitsTab';
import MotivationTab from '@/components/MotivationTab';
import OCRTab from '@/components/OCRTab';
import AIChatDrawer from '@/components/AIChatDrawer';
import ReminderBanner from '@/components/ReminderBanner';

export default function Home() {
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [ocrPrefillData, setOcrPrefillData] = useState<any>(null);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.username);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      setUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFillHabitForm = (data: any) => {
    setOcrPrefillData(data);
    setActiveTab('habits');
  };

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onToggleChat={() => setChatDrawerOpen(!chatDrawerOpen)}
      />

      <main>
        <ReminderBanner user={user} onNavigateToHabits={() => setActiveTab('habits')} />
        {activeTab === 'overview' && <OverviewTab user={user} />}
        {activeTab === 'habits' && <HabitsTab user={user} prefillData={ocrPrefillData} />}
        {activeTab === 'motivation' && <MotivationTab user={user} />}
        {activeTab === 'ocr' && <OCRTab onFillHabitForm={handleFillHabitForm} />}
      </main>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(username) => {
          setUser(username);
          setAuthModalOpen(false);
        }}
      />

      <AIChatDrawer
        isOpen={chatDrawerOpen}
        onClose={() => setChatDrawerOpen(false)}
        user={user}
      />
    </div>
  );
}
