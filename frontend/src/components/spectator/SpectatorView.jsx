import React from 'react';
import { useAuctionStore } from '../../store/useAuctionStore';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Award, MapPin, Sparkles, Activity, Shield } from 'lucide-react';

export default function SpectatorView() {
  const { auctionState, teams, lastSoldEvent } = useAuctionStore();

  const player = auctionState?.currentPlayer;
  const currentBid = auctionState?.currentBid || 0;
  const leadingTeam = auctionState?.leadingTeam;
  const stats = player?.stats || {};

  return (
    <div className="min-h-screen bg-[#060912] bg-hud-grid text-white flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Stadium Header */}
      <header className="flex items-center justify-between pb-6 border-b border-hpl-border/60">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-heading font-extrabold text-2xl text-black shadow-hud">
            H
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-widest leading-none">
              HOSTEL PREMIER LEAGUE
            </h1>
            <p className="text-xs text-hpl-cyan font-bold tracking-[0.2em] uppercase mt-0.5">
              Official Live Auction Stream
            </p>
          </div>
        </div>

        {/* Live Set Pill */}
        <div className="flex items-center space-x-3 bg-hpl-card/80 border border-hpl-border px-4 py-2 rounded-full backdrop-blur-md">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-hpl-cyan opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-hpl-cyan"></span>
          </span>
          <span className="font-heading font-bold text-sm sm:text-base tracking-wider uppercase text-slate-200">
            {auctionState?.activeSet?.name || 'Live Auction Active'}
          </span>
        </div>
      </header>

      {/* Center Stage: Split between Player and Giant Bidding Ticker */}
      <main className="my-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-7xl mx-auto w-full">
        {/* Left: Huge Player Card (5 of 12 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-hpl-card/90 border border-hpl-border/80 rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl shadow-2xl">
            {/* 4:5 Portrait */}
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border-2 border-hpl-border/80 mb-5 bg-hpl-surface">
              <img
                src={player?.photo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + (player?.name || 'HPL')}
                alt={player?.name || 'Player'}
                className="w-full h-full object-cover object-top"
              />
              {player && (
                <>
                  <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded-lg border border-cyan-500/30">
                    <span className="text-xs font-bold text-hpl-cyan font-heading uppercase tracking-wider">
                      {player.year} Year
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded-lg border border-amber-500/30">
                    <span className="text-xs font-bold text-hpl-gold font-heading uppercase tracking-wider">
                      Base: {player.basePrice} pts
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Player Details */}
            {player ? (
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                    {player.role}
                  </span>
                  {stats.hostel && (
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-hpl-surface border border-hpl-border text-slate-300 flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-rose-400" />
                      <span>{stats.hostel}</span>
                    </span>
                  )}
                </div>
                <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-white uppercase tracking-wide truncate">
                  {player.name}
                </h2>
                {stats.specialSkill && (
                  <p className="text-xs text-cyan-300 italic mt-1">{stats.specialSkill}</p>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-hpl-text-muted text-sm italic">
                Awaiting Next Player on Auction Block...
              </div>
            )}
          </div>
        </div>

        {/* Right: Giant Price & Leader Board (7 of 12 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Giant Ticker Card */}
          <div className="bg-gradient-to-br from-hpl-card via-hpl-surface to-hpl-card border border-amber-500/30 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden text-center">
            <div className="flex items-center justify-center space-x-2 text-sm font-bold text-hpl-gold uppercase tracking-widest mb-2">
              <TrendingUp className="w-5 h-5 text-hpl-gold" />
              <span>Current High Bid</span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentBid}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                className="font-heading text-7xl sm:text-9xl font-extrabold text-hpl-gold text-gold-glow tracking-tight leading-none my-2"
              >
                {currentBid || 0}
              </motion.div>
            </AnimatePresence>

            <span className="font-heading font-bold text-2xl sm:text-3xl text-amber-200/60 uppercase tracking-widest block">
              POINTS
            </span>

            {/* Leading Team Spotlight */}
            <div className="mt-8 pt-6 border-t border-hpl-border/80 flex flex-col sm:flex-row items-center justify-center gap-4">
              <span className="text-xs font-bold text-hpl-text-muted uppercase tracking-wider">
                Holding Bid:
              </span>
              {leadingTeam ? (
                <div className="flex items-center space-x-3 bg-hpl-surface border border-hpl-cyan shadow-hud rounded-2xl px-5 py-3">
                  <img
                    src={leadingTeam.logo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + leadingTeam.name}
                    alt={leadingTeam.name}
                    className="w-12 h-12 rounded-xl object-contain bg-black/40 p-1 border border-white/10"
                  />
                  <div className="text-left">
                    <h3 className="font-heading font-bold text-2xl text-white leading-tight">
                      {leadingTeam.name}
                    </h3>
                    <span className="text-xs text-hpl-text-muted font-mono">
                      Franchise Budget: {leadingTeam.remainingPurse} pts left
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-sm text-hpl-text-muted italic bg-hpl-surface/60 px-4 py-2 rounded-xl border border-hpl-border">
                  No bids yet — Base price active
                </span>
              )}
            </div>
          </div>

          {/* Quick Player Stats Grid */}
          {player && (
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-hpl-card/80 border border-hpl-border rounded-2xl p-4 text-center">
                <span className="text-xs text-hpl-text-muted uppercase block">Runs</span>
                <span className="font-heading text-2xl font-bold text-amber-400">
                  {stats.runs || 0}
                </span>
              </div>
              <div className="bg-hpl-card/80 border border-hpl-border rounded-2xl p-4 text-center">
                <span className="text-xs text-hpl-text-muted uppercase block">Wickets</span>
                <span className="font-heading text-2xl font-bold text-emerald-400">
                  {stats.wickets || 0}
                </span>
              </div>
              <div className="bg-hpl-card/80 border border-hpl-border rounded-2xl p-4 text-center">
                <span className="text-xs text-hpl-text-muted uppercase block">Strike Rate</span>
                <span className="font-heading text-2xl font-bold text-cyan-300">
                  {stats.strikeRate || 0}
                </span>
              </div>
              <div className="bg-hpl-card/80 border border-hpl-border rounded-2xl p-4 text-center">
                <span className="text-xs text-hpl-text-muted uppercase block">Economy</span>
                <span className="font-heading text-2xl font-bold text-purple-300">
                  {stats.economy || 0}
                </span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Franchise Purse Leaderboard */}
      <footer className="pt-4 border-t border-hpl-border/60">
        <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-none">
          {teams.map((t) => {
            const isLeading = String(t._id) === String(leadingTeam?._id);
            return (
              <div
                key={t._id}
                className={`shrink-0 flex items-center space-x-3 px-4 py-2.5 rounded-2xl border transition-all ${
                  isLeading
                    ? 'bg-cyan-950/40 border-hpl-cyan shadow-hud ring-1 ring-cyan-400'
                    : 'bg-hpl-card/80 border-hpl-border'
                }`}
              >
                <img
                  src={t.logo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + t.name}
                  alt={t.name}
                  className="w-8 h-8 rounded-lg object-contain bg-black/40 p-1"
                />
                <div>
                  <p className="font-heading font-bold text-sm text-white">{t.shortCode}</p>
                  <span className="font-heading font-extrabold text-sm text-hpl-gold">
                    {t.remainingPurse} pt
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </footer>
    </div>
  );
}
