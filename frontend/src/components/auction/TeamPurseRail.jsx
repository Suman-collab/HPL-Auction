import React from 'react';
import { useAuctionStore } from '../../store/useAuctionStore';
import { Users, Coins, TrendingDown } from 'lucide-react';

export default function TeamPurseRail({ leadingTeamId }) {
  const { teams } = useAuctionStore();

  // Sort teams descending by remaining purse
  const sortedTeams = [...teams].sort((a, b) => b.remainingPurse - a.remainingPurse);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center space-x-2">
          <Coins className="w-4 h-4 text-hpl-gold" />
          <h3 className="font-heading font-bold text-base text-white tracking-wide uppercase">
            Team Purses
          </h3>
        </div>
        <span className="text-xs text-hpl-text-muted">
          {sortedTeams.length} Franchises
        </span>
      </div>

      {/* Responsive layout: Grid/Cards on desktop, Swipeable row on mobile */}
      <div className="grid grid-cols-1 gap-2.5 sm:overflow-y-auto max-h-[580px] pr-1">
        {sortedTeams.map((team) => {
          const isLeading = String(team._id) === String(leadingTeamId);
          const percentRemaining = Math.max(
            0,
            Math.min(100, (team.remainingPurse / (team.totalPurse || 100)) * 100)
          );

          return (
            <div
              key={team._id}
              className={`p-3 rounded-xl border transition-all duration-300 relative overflow-hidden ${
                isLeading
                  ? 'bg-cyan-950/30 border-hpl-cyan shadow-hud ring-1 ring-cyan-400'
                  : 'bg-hpl-card border-hpl-border hover:border-hpl-borderHighlight'
              }`}
            >
              {/* Subtle top indicator bar in team primary color */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: team.primaryColor || '#22D3EE' }}
              />

              <div className="flex items-center justify-between">
                {/* Team Info */}
                <div className="flex items-center space-x-3">
                  <img
                    src={team.logo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + team.name}
                    alt={team.name}
                    className="w-9 h-9 rounded-lg object-contain bg-black/40 p-1 border border-white/10"
                  />
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <h4 className="font-heading font-bold text-sm text-white truncate max-w-[140px]">
                        {team.name}
                      </h4>
                      {isLeading && (
                        <span className="bg-cyan-500/20 text-cyan-300 text-[9px] font-bold px-1.5 py-0.2 rounded border border-cyan-400/40 uppercase">
                          BID
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-[11px] text-hpl-text-muted">
                      <span>{team.shortCode}</span>
                      <span>•</span>
                      <span className="flex items-center space-x-0.5">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>{team.roster?.length || 0} squad</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Purse Stat */}
                <div className="text-right">
                  <div className="flex items-baseline justify-end space-x-1">
                    <span className="font-heading font-extrabold text-xl text-hpl-gold leading-none">
                      {team.remainingPurse}
                    </span>
                    <span className="text-[10px] text-amber-200/60 font-semibold uppercase">
                      / {team.totalPurse}
                    </span>
                  </div>
                  <span className="text-[10px] text-hpl-text-muted block mt-0.5 font-mono">
                    {(100 - percentRemaining).toFixed(0)}% spent
                  </span>
                </div>
              </div>

              {/* Purse Progress Bar */}
              <div className="w-full bg-hpl-surface h-1.5 rounded-full mt-2.5 overflow-hidden border border-white/5">
                <div
                  className="h-full transition-all duration-500 rounded-full"
                  style={{
                    width: `${percentRemaining}%`,
                    backgroundColor:
                      percentRemaining < 20
                        ? '#EF4444'
                        : percentRemaining < 50
                        ? '#F59E0B'
                        : team.primaryColor || '#22D3EE',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
