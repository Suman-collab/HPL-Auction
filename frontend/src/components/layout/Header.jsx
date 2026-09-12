import React from 'react';
import { useAuctionStore } from '../../store/useAuctionStore';
import {
  Users,
  Shield,
  Zap,
  Monitor,
  Wifi,
  WifiOff,
  LogOut,
  Lock,
} from 'lucide-react';

export default function Header() {
  const {
    auctionState,
    socketConnected,
    activeTab,
    setActiveTab,
    currentRole,
    setCurrentRole,
    adminUser,
    teamUser,
    logoutAdmin,
    logoutTeam,
  } = useAuctionStore();

  const activeSetName = auctionState?.activeSet?.name || 'No Set Active';
  const isBidding = auctionState?.status === 'bidding';

  return (
    <header className="h-16 border-b border-hpl-border bg-hpl-surface/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Brand & Live Pill */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-heading font-bold text-lg text-black shadow-hud">
            H
          </div>
          <div className="hidden sm:block">
            <h1 className="font-heading font-bold text-lg tracking-wider text-white leading-none">
              HPL <span className="text-hpl-cyan">AUCTION</span>
            </h1>
            <p className="text-[9px] text-hpl-text-muted uppercase tracking-widest">
              Hostel Premier League
            </p>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center space-x-2 bg-hpl-card border border-hpl-border px-2.5 py-1 rounded-full text-xs">
          <span className="relative flex h-2 w-2">
            {isBidding ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-hpl-cyan opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-hpl-cyan"></span>
              </>
            ) : (
              <span className="inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            )}
          </span>
          <span className="font-semibold text-white truncate max-w-[100px] sm:max-w-[150px]">
            {activeSetName}
          </span>
          {isBidding && (
            <span className="bg-cyan-500/20 text-cyan-300 font-bold px-1 py-0.2 rounded text-[9px] tracking-wider uppercase hidden xs:inline">
              LIVE
            </span>
          )}
        </div>
      </div>

      {/* 3-INTERFACE ROLE SWITCHER (Center / Prominent) */}
      <div className="flex items-center bg-hpl-bg border border-hpl-border rounded-xl p-1 shadow-inner">
        {/* User / Public Panel */}
        <button
          onClick={() => setCurrentRole('user')}
          className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            currentRole === 'user'
              ? 'bg-hpl-cyan text-black shadow-hud'
              : 'text-hpl-text-secondary hover:text-white'
          }`}
          title="Public Viewer: No login required, see live bid & team rankings"
        >
          <Users className="w-3.5 h-3.5" />
          <span>Viewer</span>
        </button>

        {/* Team / Franchise Panel */}
        <button
          onClick={() => setCurrentRole('team')}
          className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            currentRole === 'team'
              ? 'bg-amber-400 text-black shadow-goldGlow'
              : 'text-hpl-text-secondary hover:text-white'
          }`}
          title="Team Panel: Monitor remaining purse, squad breakdown & scouting"
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Franchise</span>
          {!teamUser && <Lock className="w-2.5 h-2.5 opacity-60" />}
        </button>

        {/* Admin Console */}
        <button
          onClick={() => setCurrentRole('admin')}
          className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            currentRole === 'admin'
              ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md'
              : 'text-hpl-text-secondary hover:text-white'
          }`}
          title="Admin Panel: Full auction gavel controls, overrides, management"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Admin</span>
          {!adminUser && <Lock className="w-2.5 h-2.5 opacity-60" />}
        </button>
      </div>

      {/* Right Controls: Auth identity / Logout, Spectator toggle & Connection indicator */}
      <div className="flex items-center space-x-2">
        {/* Auth status & Logout button if logged in as Admin or Team */}
        {currentRole === 'admin' && adminUser && (
          <div className="flex items-center space-x-1.5 bg-purple-950/40 border border-purple-500/40 rounded-xl px-2.5 py-1 text-xs">
            <span className="font-bold text-purple-300 hidden sm:inline">Admin</span>
            <button
              onClick={logoutAdmin}
              className="text-purple-300 hover:text-white p-0.5 rounded hover:bg-purple-900/50"
              title="Log out of Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {currentRole === 'team' && teamUser && (
          <div className="flex items-center space-x-1.5 bg-amber-950/40 border border-amber-500/40 rounded-xl px-2.5 py-1 text-xs">
            <span className="font-bold text-amber-300 truncate max-w-[80px] sm:max-w-[120px]">
              {teamUser.name}
            </span>
            <button
              onClick={logoutTeam}
              className="text-amber-300 hover:text-white p-0.5 rounded hover:bg-amber-900/50"
              title="Log out of Franchise"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Toggle Projector / Live Viewer Screen */}
        <button
          onClick={() => setActiveTab(activeTab === 'spectator' ? 'live' : 'spectator')}
          className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
            activeTab === 'spectator'
              ? 'bg-hpl-cyan text-black border-cyan-400 shadow-hud'
              : 'bg-hpl-card text-hpl-text-secondary border-hpl-border hover:text-white hover:border-hpl-cyan'
          }`}
          title="Stadium HUD Projector Broadcast"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Projector</span>
        </button>

        {/* Socket Status */}
        <div
          className="flex items-center space-x-1 text-xs px-2 py-1 rounded bg-hpl-card border border-hpl-border"
          title={socketConnected ? 'Real-time sync active' : 'Disconnected'}
        >
          {socketConnected ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-rose-400" />
          )}
        </div>
      </div>
    </header>
  );
}
