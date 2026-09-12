import React from 'react';
import { useAuctionStore } from '../../store/useAuctionStore';
import { api } from '../../services/api';
import { PlayCircle, Shuffle } from 'lucide-react';

export default function SetQueueStrip() {
  const { auctionState, sets, fetchAuctionState } = useAuctionStore();

  const currentSet = sets.find(
    (s) => String(s._id) === String(auctionState?.activeSet?._id || auctionState?.activeSet)
  );

  const players = currentSet?.players || [];
  const currentId = auctionState?.currentPlayer?._id;

  const handleSelectPlayer = async (playerId) => {
    try {
      await api.setCurrentPlayer(playerId);
      fetchAuctionState();
    } catch (e) {
      console.error(e);
    }
  };

  if (!players.length) return null;

  return (
    <div className="bg-hpl-card/80 border border-hpl-border rounded-xl p-2.5 mb-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-hpl-cyan uppercase tracking-wider">
            Queue: {currentSet?.name}
          </span>
          <span className="text-[11px] text-hpl-text-muted">
            ({players.filter((p) => p.status === 'sold').length}/{players.length} sold)
          </span>
        </div>
        <span className="text-[10px] text-hpl-text-muted hidden sm:inline">
          Tap any player to jump to block
        </span>
      </div>

      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-thin">
        {players.map((p, idx) => {
          const isCurrent = String(p._id) === String(currentId);
          const isSold = p.status === 'sold';
          const isUnsold = p.status === 'unsold';

          let statusBg = 'border-hpl-border bg-hpl-surface/80 opacity-80';
          let badgeColor = 'bg-slate-700 text-slate-300';
          if (isCurrent) {
            statusBg = 'border-hpl-cyan bg-cyan-950/40 shadow-hud ring-1 ring-cyan-400 opacity-100';
            badgeColor = 'bg-hpl-cyan text-black font-bold';
          } else if (isSold) {
            statusBg = 'border-amber-500/40 bg-amber-950/20 opacity-60';
            badgeColor = 'bg-amber-500/30 text-amber-300';
          } else if (isUnsold) {
            statusBg = 'border-red-500/40 bg-red-950/20 opacity-50';
            badgeColor = 'bg-red-500/30 text-red-300';
          }

          return (
            <button
              key={p._id}
              onClick={() => handleSelectPlayer(p._id)}
              className={`shrink-0 flex items-center space-x-2 px-2.5 py-1.5 rounded-lg border transition-all hover:opacity-100 text-left ${statusBg}`}
            >
              <img
                src={p.photo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + p.name}
                alt={p.name}
                className="w-7 h-7 rounded-full object-cover border border-white/10"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate max-w-[100px]">
                  {p.name.split(' ')[0]}
                </p>
                <div className="flex items-center space-x-1">
                  <span className={`text-[9px] px-1 rounded ${badgeColor}`}>
                    {isCurrent ? 'LIVE' : p.status}
                  </span>
                  <span className="text-[10px] text-hpl-gold font-bold">
                    {p.soldPrice ? `${p.soldPrice}pt` : `${p.basePrice}pt`}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
