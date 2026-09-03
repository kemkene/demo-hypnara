'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  const [dataVersion, setDataVersion] = useState(0);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [ocrPrefillData, setOcrPrefillData] = useState<any>(null);

  const triggerRefresh = useCallback(() => {
    setDataVersion((v) => v + 1);
  }, []);

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
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      triggerRefresh();
      // Reload immediately to reset all in-memory states and cookies
      window.location.reload();
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
        setActiveTab={(tab) => {
          setActiveTab(tab);
          triggerRefresh();
        }}
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onToggleChat={() => setChatDrawerOpen(!chatDrawerOpen)}
      />

      <main>
        <ReminderBanner
          key={`rb-${user}-${dataVersion}`}
          user={user}
          dataVersion={dataVersion}
          onNavigateToHabits={() => setActiveTab('habits')}
        />
        {activeTab === 'overview' && (
          <OverviewTab
            key={`ov-${user}-${dataVersion}`}
            user={user}
            dataVersion={dataVersion}
            onProfileSaved={triggerRefresh}
          />
        )}
        {activeTab === 'habits' && (
          <HabitsTab
            key={`hb-${user}`}
            user={user}
            dataVersion={dataVersion}
            prefillData={ocrPrefillData}
            onHabitSaved={triggerRefresh}
            onCommitmentAdded={triggerRefresh}
          />
        )}
        {activeTab === 'motivation' && (
          <MotivationTab
            key={`mv-${user}-${dataVersion}`}
            user={user}
            dataVersion={dataVersion}
            onDataChange={triggerRefresh}
          />
        )}
        {activeTab === 'ocr' && <OCRTab onFillHabitForm={handleFillHabitForm} />}
      </main>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(username) => {
          setUser(username);
          setAuthModalOpen(false);
          triggerRefresh();
          window.location.reload();
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
