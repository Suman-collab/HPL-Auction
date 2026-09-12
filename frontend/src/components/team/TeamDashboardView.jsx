import React, { useState } from 'react';
import { useAuctionStore } from '../../store/useAuctionStore';
import {
  Shield,
  Coins,
  Users,
  TrendingUp,
  Activity,
  Layers,
  Search,
  Filter,
  Award,
  ChevronRight,
  Clock,
} from 'lucide-react';

export default function TeamDashboardView() {
  const {
    teams,
    auctionState,
    players,
    sets,
    selectedTeamViewId,
    setSelectedTeamViewId,
  } = useAuctionStore();

  const [teamSearch, setTeamSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Default to first team if none selected
  const activeTeamId = selectedTeamViewId || teams[0]?._id;
  const currentTeam = teams.find((t) => String(t._id) === String(activeTeamId)) || teams[0];

  const currentPlayer = auctionState?.currentPlayer;
  const currentBid = auctionState?.currentBid || 0;
  const leadingTeam = auctionState?.leadingTeam;

  // Role counts in current team's roster
  const roster = currentTeam?.roster || [];
  const battersCount = roster.filter((r) => r.player?.role === 'Batter').length;
  const bowlersCount = roster.filter((r) => r.player?.role === 'Bowler').length;
  const allRoundersCount = roster.filter((r) => r.player?.role === 'All-rounder').length;
  const wkCount = roster.filter((r) => r.player?.role === 'Wicket-keeper').length;

  const totalSpent = currentTeam
    ? Math.round((currentTeam.totalPurse - currentTeam.remainingPurse) * 10) / 10
    : 0;

  // Filtered tournament players for scouting
  const scoutPlayers = players.filter((p) => {
    const matchSearch =
      !teamSearch || p.name.toLowerCase().includes(teamSearch.toLowerCase());
    const matchRole = roleFilter === 'ALL' || p.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleColors = {
    Batter: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    Bowler: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'All-rounder': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'Wicket-keeper': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Franchise Switcher Bar */}
      <div className="bg-hpl-card border border-hpl-border rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <Shield className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <span className="text-xs font-bold text-hpl-text-muted uppercase block">
              Franchise Portal
            </span>
            <span className="text-sm font-heading font-bold text-white">
              Select Your Team To Monitor Purse & Squad
            </span>
          </div>
        </div>

        {/* Team Selector Dropdown */}
        <select
          value={activeTeamId}
          onChange={(e) => setSelectedTeamViewId(e.target.value)}
          className="w-full sm:w-64 bg-hpl-surface border border-hpl-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-hpl-cyan font-semibold"
        >
          {teams.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name} ({t.remainingPurse} pt remaining)
            </option>
          ))}
        </select>
      </div>

      {currentTeam ? (
        <>
          {/* Main Franchise HUD: Purse + Squad Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Giant Purse Status Card (7 of 12 cols) */}
            <div className="lg:col-span-7 bg-gradient-to-br from-hpl-card via-hpl-surface to-hpl-card border border-hpl-border rounded-3xl p-6 relative overflow-hidden shadow-xl">
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: currentTeam.primaryColor || '#06B6D4' }}
              />

              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center space-x-3">
                  <img
                    src={
                      currentTeam.logo ||
                      'https://api.dicebear.com/7.x/identicon/svg?seed=' + currentTeam.name
                    }
                    alt={currentTeam.name}
                    className="w-14 h-14 rounded-2xl object-contain bg-black/40 p-1.5 border border-white/10"
                  />
                  <div>
                    <h2 className="font-heading font-extrabold text-2xl text-white">
                      {currentTeam.name}
                    </h2>
                    <div className="flex items-center space-x-2 text-xs text-hpl-text-muted mt-0.5">
                      <span
                        className="font-bold px-2 py-0.2 rounded font-mono"
                        style={{
                          backgroundColor: `${currentTeam.primaryColor}25`,
                          color: currentTeam.primaryColor,
                        }}
                      >
                        {currentTeam.shortCode}
                      </span>
                      {currentTeam.owner && <span>Owner: {currentTeam.owner}</span>}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-hpl-text-muted uppercase font-bold block">
                    Total Purse
                  </span>
                  <span className="font-heading font-bold text-lg text-slate-300">
                    {currentTeam.totalPurse} pts
                  </span>
                </div>
              </div>

              {/* Big Remaining Purse Highlight */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-hpl-surface/80 rounded-2xl border border-hpl-border text-center mb-4">
                <div>
                  <span className="text-xs text-amber-300/80 uppercase font-bold block mb-0.5">
                    Remaining Budget
                  </span>
                  <span className="font-heading font-extrabold text-3xl sm:text-4xl text-hpl-gold">
                    {currentTeam.remainingPurse}
                    <span className="text-sm font-normal text-amber-300/60 ml-1">pts</span>
                  </span>
                </div>

                <div>
                  <span className="text-xs text-hpl-text-muted uppercase font-bold block mb-0.5">
                    Spent So Far
                  </span>
                  <span className="font-heading font-extrabold text-3xl sm:text-4xl text-white">
                    {totalSpent}
                    <span className="text-sm font-normal text-slate-400 ml-1">pts</span>
                  </span>
                </div>

                <div>
                  <span className="text-xs text-cyan-300/80 uppercase font-bold block mb-0.5">
                    Players Bought
                  </span>
                  <span className="font-heading font-extrabold text-3xl sm:text-4xl text-hpl-cyan">
                    {roster.length}
                  </span>
                </div>
              </div>

              {/* Squad Role Distribution Pill Strip */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 bg-blue-950/20 border border-blue-500/20 rounded-xl">
                  <span className="text-[10px] text-blue-400 block font-bold">BATTERS</span>
                  <span className="font-heading font-bold text-lg text-white">{battersCount}</span>
                </div>
                <div className="p-2 bg-emerald-950/20 border border-emerald-500/20 rounded-xl">
                  <span className="text-[10px] text-emerald-400 block font-bold">BOWLERS</span>
                  <span className="font-heading font-bold text-lg text-white">{bowlersCount}</span>
                </div>
                <div className="p-2 bg-purple-950/20 border border-purple-500/20 rounded-xl">
                  <span className="text-[10px] text-purple-400 block font-bold">ALL-ROUNDERS</span>
                  <span className="font-heading font-bold text-lg text-white">
                    {allRoundersCount}
                  </span>
                </div>
                <div className="p-2 bg-amber-950/20 border border-amber-500/20 rounded-xl">
                  <span className="text-[10px] text-amber-400 block font-bold">WK</span>
                  <span className="font-heading font-bold text-lg text-white">{wkCount}</span>
                </div>
              </div>
            </div>

            {/* Right: Live Auction Snip (5 of 12 cols) */}
            <div className="lg:col-span-5 bg-hpl-card border border-hpl-border rounded-3xl p-5 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-hpl-cyan uppercase tracking-wider flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-hpl-cyan" />
                    <span>Live On The Block</span>
                  </span>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-bold px-2 py-0.5 rounded-full uppercase">
                    Auction Feed
                  </span>
                </div>

                {currentPlayer ? (
                  <div className="flex items-center space-x-3 p-3 bg-hpl-surface rounded-2xl border border-hpl-border">
                    <img
                      src={
                        currentPlayer.photo ||
                        'https://api.dicebear.com/7.x/identicon/svg?seed=' + currentPlayer.name
                      }
                      alt={currentPlayer.name}
                      className="w-14 h-14 rounded-xl object-cover border border-white/10"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-heading font-bold text-base text-white truncate">
                        {currentPlayer.name}
                      </h4>
                      <p className="text-xs text-hpl-text-muted">
                        {currentPlayer.role} • {currentPlayer.year} Year (Base: {currentPlayer.basePrice} pt)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-hpl-text-muted text-xs italic bg-hpl-surface rounded-2xl border border-dashed border-hpl-border">
                    Auction is currently between sets.
                  </div>
                )}
              </div>

              {/* Price Ticker Snip */}
              <div className="mt-4 pt-4 border-t border-hpl-border text-center">
                <span className="text-[11px] text-hpl-text-muted uppercase font-bold block mb-1">
                  Current Highest Bid
                </span>
                <div className="font-heading text-4xl font-extrabold text-hpl-gold">
                  {currentBid || 0} PTS
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  Holding Bid:{' '}
                  <strong className="text-hpl-cyan">
                    {leadingTeam ? leadingTeam.name : 'Awaiting Opening Bid'}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Your Current Squad Roster */}
          <div className="bg-hpl-card border border-hpl-border rounded-2xl p-5">
            <h3 className="font-heading font-bold text-lg text-white mb-4 flex items-center space-x-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <span>{currentTeam.name} Purchased Squad ({roster.length} Players)</span>
            </h3>

            {roster.length === 0 ? (
              <div className="text-center py-8 text-hpl-text-muted text-sm italic">
                No players purchased yet by this franchise.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {roster.map((item, idx) => {
                  const p = item.player || {};
                  return (
                    <div
                      key={idx}
                      className="p-3 bg-hpl-surface border border-hpl-border rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={
                            p.photo ||
                            'https://api.dicebear.com/7.x/identicon/svg?seed=' + p.name
                          }
                          alt={p.name}
                          className="w-10 h-10 rounded-full object-cover border border-white/10"
                        />
                        <div>
                          <p className="font-heading font-bold text-sm text-white">
                            {p.name || 'Player'}
                          </p>
                          <span className="text-[10px] text-hpl-text-muted">
                            {p.role} • {p.year} Year
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-heading font-bold text-base text-hpl-gold block">
                          {item.price} pt
                        </span>
                        <span className="text-[9px] text-hpl-text-muted font-mono">
                          {item.boughtAt ? new Date(item.boughtAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Tournament Player Scout Directory */}
          <div className="bg-hpl-card border border-hpl-border rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-heading font-bold text-lg text-white flex items-center space-x-2">
                  <Award className="w-5 h-5 text-emerald-400" />
                  <span>Auction Scouting Pool</span>
                </h3>
                <p className="text-xs text-hpl-text-secondary">
                  Track upcoming and completed players across all sets to plan your bids.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Search players..."
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  className="bg-hpl-surface border border-hpl-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-hpl-cyan"
                />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-hpl-surface border border-hpl-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-hpl-cyan"
                >
                  <option value="ALL">All Roles</option>
                  <option value="Batter">Batter</option>
                  <option value="Bowler">Bowler</option>
                  <option value="All-rounder">All-rounder</option>
                  <option value="Wicket-keeper">Wicket-keeper</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto pr-1">
              {scoutPlayers.map((p) => {
                const isSold = p.status === 'sold';
                return (
                  <div
                    key={p._id}
                    className="p-3 bg-hpl-surface border border-hpl-border rounded-xl flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2.5 mb-2">
                        <img
                          src={
                            p.photo ||
                            'https://api.dicebear.com/7.x/identicon/svg?seed=' + p.name
                          }
                          alt={p.name}
                          className="w-9 h-9 rounded-full object-cover border border-white/10"
                        />
                        <div className="min-w-0 flex-1">
                          <h5 className="font-heading font-bold text-sm text-white truncate">
                            {p.name}
                          </h5>
                          <span className="text-[10px] text-hpl-text-muted">
                            {p.role} • {p.year} Year
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-hpl-border/60 flex items-center justify-between text-xs">
                      <span
                        className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                          isSold
                            ? 'bg-amber-500/20 text-amber-400'
                            : p.status === 'unsold'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {p.status}
                      </span>
                      <span className="font-heading font-bold text-hpl-gold">
                        {isSold ? `${p.soldPrice} pt` : `Base: ${p.basePrice} pt`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-hpl-card border border-hpl-border rounded-3xl p-12 text-center text-hpl-text-muted">
          <Shield className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <h3 className="font-heading text-xl font-bold text-white mb-1">
            No Franchise Registered Yet
          </h3>
          <p className="text-xs text-hpl-text-secondary max-w-sm mx-auto">
            Once tournament officials register your team, your live franchise dashboard, remaining budget, and squad roster will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
