import React, { useEffect } from 'react';
import { useAuctionStore } from './store/useAuctionStore';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import MobileTabBar from './components/layout/MobileTabBar';
import AdminView from './components/admin/AdminView';
import TeamDashboardView from './components/team/TeamDashboardView';
import UserPublicView from './components/user/UserPublicView';
import AdminLoginPage from './components/auth/AdminLoginPage';
import TeamLoginPage from './components/auth/TeamLoginPage';
import SpectatorView from './components/spectator/SpectatorView';
import { Loader2 } from 'lucide-react';

export default function App() {
  const {
    activeTab,
    currentRole,
    adminUser,
    teamUser,
    fetchAllData,
    initSocketListeners,
    isLoading,
  } = useAuctionStore();

  useEffect(() => {
    fetchAllData();
    initSocketListeners();
  }, [fetchAllData, initSocketListeners]);

  // Full-screen Projector / Spectator Mode
  if (activeTab === 'spectator') {
    return (
      <div className="relative">
        <button
          onClick={() => useAuctionStore.getState().setActiveTab('live')}
          className="fixed top-4 right-4 z-50 px-3 py-1.5 rounded-lg bg-black/60 hover:bg-black/90 border border-white/20 text-xs text-white font-bold backdrop-blur-md transition-colors"
        >
          ✕ Exit Projector View
        </button>
        <SpectatorView />
      </div>
    );
  }

  const isAdminAuthenticated = currentRole === 'admin' && adminUser;
  const isTeamAuthenticated = currentRole === 'team' && teamUser;

  return (
    <div className="min-h-screen bg-hpl-bg bg-hud-grid flex flex-col font-manrope text-white antialiased">
      {/* Top Header with 3-Role Switcher (Viewer / Franchise / Admin) */}
      <Header />

      <div className="flex-1 flex overflow-hidden">
        {/* Persistent Desktop Sidebar (Only visible in Admin Mode when Authenticated) */}
        {isAdminAuthenticated && <Sidebar />}

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-5 md:py-6 max-w-7xl mx-auto w-full">
          {isLoading && (
            <div className="flex items-center justify-center space-x-2 py-8 text-hpl-cyan">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-semibold">Connecting to HPL Stadium Grid...</span>
            </div>
          )}

          {/* INTERFACE 1: USER / PUBLIC PANEL (No login required) */}
          {currentRole === 'user' && <UserPublicView />}

          {/* INTERFACE 2: TEAM / FRANCHISE PANEL (Requires Franchise Login) */}
          {currentRole === 'team' && (
            isTeamAuthenticated ? <TeamDashboardView /> : <TeamLoginPage />
          )}

          {/* INTERFACE 3: ADMIN PANEL (Requires Admin Login) */}
          {currentRole === 'admin' && (
            isAdminAuthenticated ? <AdminView /> : <AdminLoginPage />
          )}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar (Only in Admin Mode when Authenticated) */}
      {isAdminAuthenticated && <MobileTabBar />}
    </div>
  );
}
