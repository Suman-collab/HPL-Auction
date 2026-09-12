import React, { useState } from 'react';
import { useAuctionStore } from '../../store/useAuctionStore';
import {
  Gavel,
  Shield,
  Users,
  TrendingUp,
  MapPin,
  Sparkles,
  Activity,
  Award,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UserPublicView() {
  const { auctionState, teams, players, sets } = useAuctionStore();

  const [publicTab, setPublicTab] = useState('live'); // 'live' | 'teams' | 'players'
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [playerSearch, setPlayerSearch] = useState('');
  const [playerRoleFilter, setPlayerRoleFilter] = useState('ALL');
  const [playerStatusFilter, setPlayerStatusFilter] = useState('ALL');

  const currentPlayer = auctionState?.currentPlayer;
  const currentBid = auctionState?.currentBid || 0;
  const leadingTeam = auctionState?.leadingTeam;
  const stats = currentPlayer?.stats || {};
  const isBidding = auctionState?.status === 'bidding';

  // Sort teams by remaining purse descending
  const sortedTeams = [...teams].sort((a, b) => b.remainingPurse - a.remainingPurse);

  // Filtered players
  const filteredPlayers = players.filter((p) => {
    const matchSearch =
      !playerSearch || p.name.toLowerCase().includes(playerSearch.toLowerCase());
    const matchRole = playerRoleFilter === 'ALL' || p.role === playerRoleFilter;
    const matchStatus = playerStatusFilter === 'ALL' || p.status === playerStatusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const roleColors = {
    Batter: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    Bowler: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'All-rounder': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'Wicket-keeper': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };

  const statusColors = {
    pending: 'bg-slate-800 text-slate-300 border-slate-700',
    in_progress: 'bg-cyan-500/20 text-cyan-300 border-cyan-400 font-bold animate-pulse',
    sold: 'bg-amber-500/20 text-amber-400 border-amber-500/40 font-bold',
    unsold: 'bg-red-500/20 text-red-400 border-red-500/40',
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Public Hub Navigation Pill Strip */}
      <div className="flex items-center justify-between bg-hpl-card/90 border border-hpl-border rounded-2xl p-2 backdrop-blur-md">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => setPublicTab('live')}
            className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              publicTab === 'live'
                ? 'bg-hpl-cyan text-black shadow-hud'
                : 'text-hpl-text-secondary hover:text-white'
            }`}
          >
            <Gavel className="w-4 h-4" />
            <span>Live Action</span>
            {isBidding && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping hidden sm:inline-block" />
            )}
          </button>

          <button
            onClick={() => setPublicTab('teams')}
            className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              publicTab === 'teams'
                ? 'bg-hpl-cyan text-black shadow-hud'
                : 'text-hpl-text-secondary hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Franchises & Squads ({teams.length})</span>
          </button>

          <button
            onClick={() => setPublicTab('players')}
            className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              publicTab === 'players'
                ? 'bg-hpl-cyan text-black shadow-hud'
                : 'text-hpl-text-secondary hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Player Registry ({players.length})</span>
          </button>
        </div>

        <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-lg bg-hpl-surface border border-hpl-border text-xs text-hpl-text-muted">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Public Viewer (No Login Required)</span>
        </div>
      </div>

      {/* VIEW 1: LIVE ACTION */}
      {publicTab === 'live' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Player Card (7 of 12 cols) */}
          <div className="lg:col-span-7">
            {currentPlayer ? (
              <div className="bg-hpl-card border border-hpl-border rounded-3xl p-5 sm:p-7 relative overflow-hidden backdrop-blur-xl shadow-2xl">
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  {/* Photo */}
                  <div className="w-full sm:w-56 shrink-0">
                    <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border-2 border-hpl-border shadow-2xl bg-hpl-surface">
                      <img
                        src={
                          currentPlayer.photo ||
                          'https://api.dicebear.com/7.x/identicon/svg?seed=' + currentPlayer.name
                        }
                        alt={currentPlayer.name}
                        className="w-full h-full object-cover object-top"
                      />
                      <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-cyan-500/30">
                        <span className="text-xs font-bold text-hpl-cyan uppercase font-heading">
                          {currentPlayer.year} Year
                        </span>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-md p-1.5 rounded-lg border border-amber-500/30 flex justify-between items-center text-xs">
                        <span className="text-[10px] text-amber-200/70 uppercase">Base Price</span>
                        <span className="font-heading font-bold text-hpl-gold text-base">
                          {currentPlayer.basePrice} PTS
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 w-full min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                          roleColors[currentPlayer.role] || roleColors['All-rounder']
                        }`}
                      >
                        {currentPlayer.role}
                      </span>
                      {stats.hostel && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-hpl-surface border border-hpl-border text-hpl-text-secondary flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-rose-400" />
                          <span>{stats.hostel}</span>
                        </span>
                      )}
                    </div>

                    <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-white uppercase tracking-wide truncate">
                      {currentPlayer.name}
                    </h2>

                    {stats.specialSkill && (
                      <div className="mt-2 flex items-center space-x-1.5 text-xs text-cyan-300 bg-cyan-950/30 border border-cyan-800/40 rounded-lg px-2.5 py-1.5 w-fit">
                        <Sparkles className="w-3.5 h-3.5 text-hpl-cyan shrink-0" />
                        <span>{stats.specialSkill}</span>
                      </div>
                    )}

                    {/* Stats Table */}
                    <div className="mt-5 bg-hpl-surface/80 border border-hpl-border rounded-2xl p-3">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-hpl-text-muted mb-2 flex items-center space-x-1">
                        <Activity className="w-3 h-3 text-hpl-cyan" />
                        <span>Tournament Stats</span>
                      </div>
                      <div className="grid grid-cols-5 gap-2 text-center text-xs">
                        <div className="p-1.5 bg-hpl-card rounded-lg">
                          <span className="text-[10px] text-hpl-text-muted block">MAT</span>
                          <span className="font-heading font-bold text-base text-white">
                            {stats.matches || 0}
                          </span>
                        </div>
                        <div className="p-1.5 bg-hpl-card rounded-lg">
                          <span className="text-[10px] text-hpl-text-muted block">RUNS</span>
                          <span className="font-heading font-bold text-base text-amber-400">
                            {stats.runs || 0}
                          </span>
                        </div>
                        <div className="p-1.5 bg-hpl-card rounded-lg">
                          <span className="text-[10px] text-hpl-text-muted block">WKTS</span>
                          <span className="font-heading font-bold text-base text-emerald-400">
                            {stats.wickets || 0}
                          </span>
                        </div>
                        <div className="p-1.5 bg-hpl-card rounded-lg">
                          <span className="text-[10px] text-hpl-text-muted block">S/R</span>
                          <span className="font-heading font-bold text-base text-cyan-300">
                            {stats.strikeRate || 0}
                          </span>
                        </div>
                        <div className="p-1.5 bg-hpl-card rounded-lg">
                          <span className="text-[10px] text-hpl-text-muted block">ECON</span>
                          <span className="font-heading font-bold text-base text-purple-300">
                            {stats.economy || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-hpl-card border border-hpl-border rounded-3xl p-12 text-center text-hpl-text-muted">
                <Award className="w-12 h-12 text-hpl-cyan mx-auto mb-3 animate-pulse" />
                <h3 className="font-heading text-2xl font-bold text-white mb-1">
                  Awaiting Next Player
                </h3>
                <p className="text-sm text-hpl-text-secondary max-w-sm mx-auto">
                  The auctioneer will bring the next player to the block shortly. Stay tuned!
                </p>
              </div>
            )}
          </div>

          {/* Right: Live Bid Ticker & Leading Franchise (5 of 12 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Live Ticker Card */}
            <div className="bg-gradient-to-br from-hpl-card via-hpl-surface to-hpl-card border border-amber-500/40 rounded-3xl p-6 text-center shadow-2xl">
              <div className="flex items-center justify-center space-x-2 text-xs font-bold text-hpl-gold uppercase tracking-wider mb-2">
                <TrendingUp className="w-4 h-4 text-hpl-gold" />
                <span>Current Live Bid</span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentBid}
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.15, opacity: 0 }}
                  className="font-heading text-6xl sm:text-7xl font-extrabold text-hpl-gold text-gold-glow tracking-tight"
                >
                  {currentBid || 0}
                </motion.div>
              </AnimatePresence>

              <span className="font-heading text-xl font-bold text-amber-200/60 uppercase">
                POINTS
              </span>

              {/* Leading Franchise */}
              <div className="mt-5 pt-4 border-t border-hpl-border">
                <span className="text-[11px] text-hpl-text-muted uppercase font-bold block mb-2">
                  Franchise Holding The Bid
                </span>
                {leadingTeam ? (
                  <div className="flex items-center justify-center space-x-3 bg-hpl-surface border border-hpl-cyan shadow-hud rounded-2xl p-3">
                    <img
                      src={
                        leadingTeam.logo ||
                        'https://api.dicebear.com/7.x/identicon/svg?seed=' + leadingTeam.name
                      }
                      alt={leadingTeam.name}
                      className="w-10 h-10 rounded-lg object-contain bg-black/40 p-1 border border-white/10"
                    />
                    <div className="text-left">
                      <h4 className="font-heading font-bold text-lg text-white leading-tight">
                        {leadingTeam.name}
                      </h4>
                      <span className="text-xs text-hpl-cyan font-mono">
                        {leadingTeam.shortCode} • {leadingTeam.remainingPurse} pts left
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-hpl-text-muted italic">
                    Opening bid at base price
                  </span>
                )}
              </div>
            </div>

            {/* Live Leaderboard Snippet */}
            <div className="bg-hpl-card border border-hpl-border rounded-2xl p-4">
              <h4 className="font-heading font-bold text-sm text-white uppercase tracking-wider mb-3 flex items-center justify-between">
                <span>Franchise Purse Leaderboard</span>
                <button
                  onClick={() => setPublicTab('teams')}
                  className="text-xs text-hpl-cyan hover:underline font-normal"
                >
                  Full Squads &rarr;
                </button>
              </h4>
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {sortedTeams.map((team, idx) => (
                  <div
                    key={team._id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-hpl-surface border border-hpl-border text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-hpl-text-muted font-bold w-4">
                        #{idx + 1}
                      </span>
                      <img
                        src={
                          team.logo ||
                          'https://api.dicebear.com/7.x/identicon/svg?seed=' + team.name
                        }
                        alt={team.name}
                        className="w-6 h-6 rounded-md object-contain bg-black/40"
                      />
                      <span className="font-heading font-bold text-white truncate max-w-[120px]">
                        {team.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-heading font-bold text-hpl-gold">
                        {team.remainingPurse} pt
                      </span>
                      <span className="text-[10px] text-hpl-text-muted block">
                        {team.roster?.length || 0} bought
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: FRANCHISES & SQUADS */}
      {publicTab === 'teams' && (
        <div className="space-y-4">
          {sortedTeams.length === 0 ? (
            <div className="bg-hpl-card border border-hpl-border rounded-3xl p-12 text-center text-hpl-text-muted">
              <Shield className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
              <h3 className="font-heading text-xl font-bold text-white mb-1">
                Franchises Registering
              </h3>
              <p className="text-xs text-hpl-text-secondary max-w-sm mx-auto">
                Franchise rosters and purse standings will appear here once teams are registered by tournament officials.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sortedTeams.map((team, idx) => {
              const isExpanded = selectedTeamId === team._id;
              const percentRemaining = Math.max(
                0,
                Math.min(100, (team.remainingPurse / (team.totalPurse || 100)) * 100)
              );

              return (
                <div
                  key={team._id}
                  className="bg-hpl-card border border-hpl-border rounded-2xl p-5 relative overflow-hidden transition-all shadow-md"
                >
                  {/* Team Top Color bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ backgroundColor: team.primaryColor || '#22D3EE' }}
                  />

                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <img
                        src={
                          team.logo ||
                          'https://api.dicebear.com/7.x/identicon/svg?seed=' + team.name
                        }
                        alt={team.name}
                        className="w-12 h-12 rounded-xl object-contain bg-black/40 p-1 border border-white/10"
                      />
                      <div>
                        <h3 className="font-heading font-bold text-lg text-white leading-tight">
                          {team.name}
                        </h3>
                        <div className="flex items-center space-x-2 text-xs text-hpl-text-muted mt-0.5">
                          <span
                            className="font-bold px-1.5 py-0.2 rounded font-mono"
                            style={{
                              backgroundColor: `${team.primaryColor}25`,
                              color: team.primaryColor,
                            }}
                          >
                            {team.shortCode}
                          </span>
                          <span>Rank #{idx + 1}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Purse Card */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-hpl-surface rounded-xl border border-hpl-border/60 text-xs mb-3">
                    <div>
                      <span className="text-[10px] text-hpl-text-muted block">Remaining Purse</span>
                      <span className="font-heading font-extrabold text-xl text-hpl-gold">
                        {team.remainingPurse} pt
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-hpl-text-muted block">Squad Count</span>
                      <span className="font-heading font-bold text-xl text-white">
                        {team.roster?.length || 0} players
                      </span>
                    </div>
                  </div>

                  {/* Purse bar */}
                  <div className="w-full bg-hpl-surface h-1.5 rounded-full overflow-hidden mb-4">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${percentRemaining}%`,
                        backgroundColor: team.primaryColor || '#22D3EE',
                      }}
                    />
                  </div>

                  {/* Expand Squad Roster Button */}
                  <button
                    onClick={() => setSelectedTeamId(isExpanded ? null : team._id)}
                    className="w-full py-2 px-3 rounded-xl bg-hpl-surface hover:bg-slate-700/60 border border-hpl-border text-xs font-semibold text-hpl-cyan flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <span>{isExpanded ? 'Hide Squad' : 'View Full Squad'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {/* Expanded Squad Roster List */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-hpl-border/80 space-y-2 max-h-[300px] overflow-y-auto">
                      {!team.roster || team.roster.length === 0 ? (
                        <p className="text-xs text-hpl-text-muted italic text-center py-4">
                          No players bought yet.
                        </p>
                      ) : (
                        team.roster.map((item, rIdx) => {
                          const p = item.player || {};
                          return (
                            <div
                              key={rIdx}
                              className="flex items-center justify-between p-2 rounded-xl bg-hpl-surface border border-hpl-border text-xs"
                            >
                              <div className="flex items-center space-x-2.5">
                                <img
                                  src={
                                    p.photo ||
                                    'https://api.dicebear.com/7.x/identicon/svg?seed=' + p.name
                                  }
                                  alt={p.name}
                                  className="w-7 h-7 rounded-full object-cover border border-white/10"
                                />
                                <div>
                                  <span className="font-heading font-bold text-white block">
                                    {p.name || 'Player'}
                                  </span>
                                  <span className="text-[10px] text-hpl-text-muted">
                                    {p.role} • {p.year} Year
                                  </span>
                                </div>
                              </div>
                              <span className="font-heading font-bold text-hpl-gold text-sm">
                                {item.price} pt
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          )}
        </div>
      )}

      {/* VIEW 3: PLAYER REGISTRY & RANKINGS */}
      {publicTab === 'players' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="bg-hpl-card border border-hpl-border rounded-2xl p-4 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 text-hpl-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search player name..."
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-hpl-surface border border-hpl-border rounded-xl text-xs text-white focus:outline-none focus:border-hpl-cyan"
              />
            </div>

            <select
              value={playerRoleFilter}
              onChange={(e) => setPlayerRoleFilter(e.target.value)}
              className="bg-hpl-surface border border-hpl-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-hpl-cyan"
            >
              <option value="ALL">All Roles</option>
              <option value="Batter">Batter</option>
              <option value="Bowler">Bowler</option>
              <option value="All-rounder">All-rounder</option>
              <option value="Wicket-keeper">Wicket-keeper</option>
            </select>

            <select
              value={playerStatusFilter}
              onChange={(e) => setPlayerStatusFilter(e.target.value)}
              className="bg-hpl-surface border border-hpl-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-hpl-cyan"
            >
              <option value="ALL">All Statuses</option>
              <option value="sold">Sold</option>
              <option value="unsold">Unsold</option>
              <option value="pending">Pending</option>
            </select>

            <span className="text-xs text-hpl-text-muted ml-auto font-mono">
              {filteredPlayers.length} players found
            </span>
          </div>

          {/* Player Directory Grid */}
          {filteredPlayers.length === 0 ? (
            <div className="bg-hpl-card border border-hpl-border rounded-3xl p-12 text-center text-hpl-text-muted">
              <Users className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
              <h3 className="font-heading text-xl font-bold text-white mb-1">
                Player Directory Standby
              </h3>
              <p className="text-xs text-hpl-text-secondary max-w-sm mx-auto">
                Players will appear here once tournament player lists are uploaded by officials.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredPlayers.map((player) => {
              const pStats = player.stats || {};
              const isSold = player.status === 'sold';
              const soldTeam = player.soldTo;

              return (
                <div
                  key={player._id}
                  className="bg-hpl-card border border-hpl-border hover:border-hpl-borderHighlight rounded-2xl p-4 transition-all shadow-sm flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Photo & Badges */}
                    <div className="flex items-start space-x-3 mb-3">
                      <img
                        src={
                          player.photo ||
                          'https://api.dicebear.com/7.x/identicon/svg?seed=' + player.name
                        }
                        alt={player.name}
                        className="w-12 h-12 rounded-xl object-cover border border-white/10"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-heading font-bold text-base text-white truncate">
                          {player.name}
                        </h4>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${
                              roleColors[player.role] || roleColors['All-rounder']
                            }`}
                          >
                            {player.role}
                          </span>
                          <span className="text-[10px] text-hpl-text-muted">
                            {player.year} Year
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Compact Stats */}
                    <div className="grid grid-cols-4 gap-1 text-center py-2 bg-hpl-surface rounded-xl border border-hpl-border/50 text-[11px] mb-3">
                      <div>
                        <span className="text-[9px] text-hpl-text-muted block">RUNS</span>
                        <span className="font-heading font-bold text-amber-400">
                          {pStats.runs || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-hpl-text-muted block">WKTS</span>
                        <span className="font-heading font-bold text-emerald-400">
                          {pStats.wickets || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-hpl-text-muted block">S/R</span>
                        <span className="font-heading font-bold text-cyan-300">
                          {pStats.strikeRate || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-hpl-text-muted block">ECON</span>
                        <span className="font-heading font-bold text-purple-300">
                          {pStats.economy || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Price Footer */}
                  <div className="pt-2 border-t border-hpl-border flex items-center justify-between text-xs">
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                        statusColors[player.status] || statusColors.pending
                      }`}
                    >
                      {player.status}
                    </span>

                    {isSold ? (
                      <div className="text-right">
                        <span className="font-heading font-extrabold text-sm text-hpl-gold block">
                          {player.soldPrice} pt
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {soldTeam?.shortCode || soldTeam?.name || 'Sold'}
                        </span>
                      </div>
                    ) : (
                      <span className="font-mono text-hpl-text-muted font-bold text-xs">
                        Base: {player.basePrice} pt
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      )}
    </div>
  );
}
