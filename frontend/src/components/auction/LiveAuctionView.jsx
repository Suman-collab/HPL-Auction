import React from 'react';
import { useAuctionStore } from '../../store/useAuctionStore';
import SetQueueStrip from './SetQueueStrip';
import CurrentPlayerCard from './CurrentPlayerCard';
import PriceTicker from './PriceTicker';
import TeamPurseRail from './TeamPurseRail';
import ActionBar from './ActionBar';
import { Layers, Play } from 'lucide-react';
import { api } from '../../services/api';

export default function LiveAuctionView() {
  const { auctionState, sets, fetchAuctionState } = useAuctionStore();

  const currentPlayer = auctionState?.currentPlayer;
  const currentBid = auctionState?.currentBid || 0;
  const leadingTeam = auctionState?.leadingTeam;
  const bidHistory = auctionState?.bidHistory || [];

  const handleStartSet = async (setId) => {
    try {
      await api.startSet(setId, false);
      fetchAuctionState();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Set Queue strip on top */}
      <SetQueueStrip />

      {/* Main 12-Column Grid (65% left, 35% right on desktop >= 1024px) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (≈65% on desktop: 8 of 12 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <CurrentPlayerCard player={currentPlayer} />
          <PriceTicker
            currentBid={currentBid}
            leadingTeam={leadingTeam}
            bidHistory={bidHistory}
          />
        </div>

        {/* Right Column (≈35% on desktop: 4 of 12 cols) */}
        <div className="lg:col-span-4 bg-hpl-card/60 border border-hpl-border rounded-2xl p-4 backdrop-blur-sm shadow-lg">
          <TeamPurseRail leadingTeamId={leadingTeam?._id} />

          {/* Set Selector / Switcher if needed */}
          <div className="mt-4 pt-4 border-t border-hpl-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-hpl-text-muted uppercase tracking-wider flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Switch Auction Set</span>
              </span>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {sets.map((s) => {
                const isActive =
                  String(s._id) ===
                  String(auctionState?.activeSet?._id || auctionState?.activeSet);
                return (
                  <button
                    key={s._id}
                    onClick={() => handleStartSet(s._id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      isActive
                        ? 'bg-purple-950/40 border-purple-500 text-purple-300 shadow-hud'
                        : 'bg-hpl-surface border-hpl-border text-hpl-text-secondary hover:text-white hover:border-hpl-borderHighlight'
                    }`}
                  >
                    <span className="truncate">{s.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-hpl-text-muted font-mono">
                      {s.players?.length || 0} players
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <ActionBar
        player={currentPlayer}
        currentBid={currentBid}
        leadingTeam={leadingTeam}
      />
    </div>
  );
}
