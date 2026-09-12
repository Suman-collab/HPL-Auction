import React from 'react';
import { useAuctionStore } from '../../store/useAuctionStore';
import {
  Gavel,
  Shield,
  Users,
  Layers,
  SlidersHorizontal,
  History,
  RotateCcw,
} from 'lucide-react';

export default function Sidebar() {
  const { activeTab, setActiveTab, undoLastAction, logs } = useAuctionStore();

  const navItems = [
    { id: 'live', label: 'Live Auction', icon: Gavel, color: 'text-hpl-cyan' },
    { id: 'teams', label: 'Teams', icon: Shield, color: 'text-amber-400' },
    { id: 'players', label: 'Players', icon: Users, color: 'text-emerald-400' },
    { id: 'sets', label: 'Auction Sets', icon: Layers, color: 'text-purple-400' },
    { id: 'override', label: 'Override Panel', icon: SlidersHorizontal, color: 'text-rose-400' },
    { id: 'audit', label: 'Audit Log', icon: History, color: 'text-sky-400' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-20 lg:w-64 bg-hpl-surface border-r border-hpl-border select-none z-20 shrink-0">
      {/* Navigation Links */}
      <div className="flex-1 py-6 px-3 lg:px-4 space-y-2">
        <div className="hidden lg:block text-[11px] font-bold text-hpl-text-muted uppercase tracking-wider px-3 mb-3">
          Control Center
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl font-medium transition-all group relative ${
                isActive
                  ? 'bg-hpl-card border border-hpl-cyan/40 text-white shadow-hud'
                  : 'text-hpl-text-secondary hover:bg-hpl-card/50 hover:text-white border border-transparent'
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? item.color : 'text-hpl-text-muted'
                }`}
              />
              <span className="hidden lg:inline text-sm font-semibold tracking-wide">
                {item.label}
              </span>
              {isActive && (
                <span className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full bg-hpl-cyan box-cyan-glow" />
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Global Undo Bar */}
      <div className="p-3 lg:p-4 border-t border-hpl-border bg-hpl-bg/40">
        <button
          onClick={undoLastAction}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-hpl-card border border-hpl-border hover:border-amber-400 hover:text-amber-300 text-hpl-text-secondary transition-all group"
          title="Undo the last auction bid, sale, or override"
        >
          <RotateCcw className="w-4 h-4 shrink-0 text-amber-400 group-hover:-rotate-45 transition-transform" />
          <span className="hidden lg:inline">Undo Last Action</span>
        </button>
        <p className="hidden lg:block text-[10px] text-center text-hpl-text-muted mt-2">
          {logs.length} audit actions recorded
        </p>
      </div>
    </aside>
  );
}
