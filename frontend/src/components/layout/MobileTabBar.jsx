import React, { useState } from 'react';
import { useAuctionStore } from '../../store/useAuctionStore';
import {
  Gavel,
  Shield,
  Users,
  MoreHorizontal,
  Layers,
  SlidersHorizontal,
  History,
  RotateCcw,
  X,
} from 'lucide-react';

export default function MobileTabBar() {
  const { activeTab, setActiveTab, undoLastAction } = useAuctionStore();
  const [showMore, setShowMore] = useState(false);

  const mainTabs = [
    { id: 'live', label: 'Live', icon: Gavel },
    { id: 'teams', label: 'Teams', icon: Shield },
    { id: 'players', label: 'Players', icon: Users },
  ];

  return (
    <>
      {/* Drawer for "More" */}
      {showMore && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden flex flex-col justify-end">
          <div className="bg-hpl-surface border-t border-hpl-border rounded-t-2xl p-4 space-y-3 pb-8 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-hpl-border">
              <span className="font-heading font-bold text-base text-white">More Management Tools</span>
              <button
                onClick={() => setShowMore(false)}
                className="p-1 rounded-lg text-hpl-text-muted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                onClick={() => {
                  setActiveTab('sets');
                  setShowMore(false);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border ${
                  activeTab === 'sets'
                    ? 'bg-hpl-card border-hpl-cyan text-white shadow-hud'
                    : 'bg-hpl-card/50 border-hpl-border text-hpl-text-secondary'
                }`}
              >
                <Layers className="w-6 h-6 text-purple-400 mb-1" />
                <span className="text-xs font-semibold">Sets</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('override');
                  setShowMore(false);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border ${
                  activeTab === 'override'
                    ? 'bg-hpl-card border-rose-500 text-white shadow-hud'
                    : 'bg-hpl-card/50 border-hpl-border text-hpl-text-secondary'
                }`}
              >
                <SlidersHorizontal className="w-6 h-6 text-rose-400 mb-1" />
                <span className="text-xs font-semibold">Override</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('audit');
                  setShowMore(false);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border ${
                  activeTab === 'audit'
                    ? 'bg-hpl-card border-sky-500 text-white shadow-hud'
                    : 'bg-hpl-card/50 border-hpl-border text-hpl-text-secondary'
                }`}
              >
                <History className="w-6 h-6 text-sky-400 mb-1" />
                <span className="text-xs font-semibold">Audit Log</span>
              </button>
            </div>

            <button
              onClick={() => {
                undoLastAction();
                setShowMore(false);
              }}
              className="w-full mt-3 py-3 px-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-center space-x-2 font-bold text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Undo Last Auction Action</span>
            </button>
          </div>
        </div>
      )}

      {/* Persistent Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-hpl-surface/95 backdrop-blur-lg border-t border-hpl-border flex items-center justify-around px-2 z-40">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setShowMore(false);
              }}
              className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all ${
                isActive ? 'text-hpl-cyan' : 'text-hpl-text-secondary'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] font-semibold mt-0.5">{tab.label}</span>
              {isActive && <span className="w-1 h-1 rounded-full bg-hpl-cyan mt-0.5" />}
            </button>
          );
        })}

        <button
          onClick={() => setShowMore(true)}
          className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all ${
            ['sets', 'override', 'audit'].includes(activeTab)
              ? 'text-hpl-cyan'
              : 'text-hpl-text-secondary'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[11px] font-semibold mt-0.5">More</span>
          {['sets', 'override', 'audit'].includes(activeTab) && (
            <span className="w-1 h-1 rounded-full bg-hpl-cyan mt-0.5" />
          )}
        </button>
      </nav>
    </>
  );
}
