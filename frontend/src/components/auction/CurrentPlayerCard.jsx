import React from 'react';
import { Shield, Sparkles, MapPin, Activity, Award } from 'lucide-react';

export default function CurrentPlayerCard({ player }) {
  if (!player) {
    return (
      <div className="bg-hpl-card border border-hpl-border rounded-2xl p-8 flex flex-col items-center justify-center text-center h-[420px]">
        <div className="w-16 h-16 rounded-full bg-hpl-surface border border-hpl-border flex items-center justify-center text-hpl-cyan mb-4 animate-pulse">
          <Award className="w-8 h-8" />
        </div>
        <h3 className="font-heading text-2xl font-bold text-white mb-1">
          Auction Block is Empty
        </h3>
        <p className="text-sm text-hpl-text-secondary max-w-sm">
          Select an upcoming player from the queue strip or pick an auction set from the control panel to begin bidding.
        </p>
      </div>
    );
  }

  const { stats = {}, role, year, basePrice, name, photo } = player;

  const roleColors = {
    Batter: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    Bowler: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'All-rounder': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'Wicket-keeper': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };

  return (
    <div className="bg-hpl-card border border-hpl-border rounded-2xl p-4 sm:p-6 relative overflow-hidden backdrop-blur-sm shadow-xl">
      {/* Background stadium HUD gradient accent */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row gap-5 lg:gap-6 items-start">
        {/* Player Photo with 4:5 Aspect Ratio */}
        <div className="w-full sm:w-48 md:w-52 lg:w-56 shrink-0">
          <div className="relative aspect-[4/5] rounded-xl overflow-hidden border-2 border-hpl-border shadow-2xl group bg-hpl-surface">
            <img
              src={photo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + name}
              alt={name}
              className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            />
            {/* Year & Role Badge Overlay */}
            <div className="absolute top-2 left-2 flex flex-col gap-1.5">
              <span className="bg-black/70 backdrop-blur-md text-hpl-cyan border border-cyan-500/30 text-xs font-bold px-2 py-0.5 rounded-md font-heading uppercase tracking-wider">
                {year} Year
              </span>
            </div>

            {/* Base Price Chip */}
            <div className="absolute bottom-2 left-2 right-2 bg-gradient-to-r from-black/90 to-black/70 backdrop-blur-md border border-amber-500/30 rounded-lg p-1.5 flex items-center justify-between">
              <span className="text-[10px] text-amber-200/70 font-semibold uppercase">Base Price</span>
              <span className="font-heading font-bold text-base text-hpl-gold">
                {basePrice} PTS
              </span>
            </div>
          </div>
        </div>

        {/* Player Information & Stats Column */}
        <div className="flex-1 w-full min-w-0">
          {/* Header & Badges */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center space-x-2">
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                  roleColors[role] || roleColors['All-rounder']
                }`}
              >
                {role}
              </span>
              {stats.hostel && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-hpl-surface border border-hpl-border text-hpl-text-secondary flex items-center space-x-1">
                  <MapPin className="w-3 h-3 text-rose-400" />
                  <span>
                    {stats.hostel} {stats.block ? `(${stats.block}-${stats.room})` : ''}
                  </span>
                </span>
              )}
            </div>

            <div className="text-xs text-hpl-text-muted">
              Player #{player.auctionOrder || 1}
            </div>
          </div>

          {/* Name in Rajdhani */}
          <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-wide uppercase truncate leading-tight">
            {name}
          </h2>

          {/* Special Skill Callout */}
          {stats.specialSkill && (
            <div className="mt-1 flex items-center space-x-1.5 text-xs text-cyan-300 bg-cyan-950/30 border border-cyan-800/40 rounded-lg px-2.5 py-1.5 w-fit">
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-hpl-cyan" />
              <span className="font-medium italic">{stats.specialSkill}</span>
            </div>
          )}

          {/* Styles grid */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-hpl-border text-xs">
            <div>
              <span className="text-[11px] text-hpl-text-muted block">Batting Style</span>
              <span className="font-semibold text-white truncate block">
                {stats.battingStyle || 'Right Hand Bat'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-hpl-text-muted block">Bowling Style</span>
              <span className="font-semibold text-white truncate block">
                {stats.bowlingStyle || 'Right Arm Medium'}
              </span>
            </div>
          </div>

          {/* Performance Stats HUD Table */}
          <div className="mt-4 bg-hpl-surface/80 border border-hpl-border rounded-xl p-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-hpl-text-muted mb-2 flex items-center space-x-1">
              <Activity className="w-3 h-3 text-hpl-cyan" />
              <span>Tournament Track Record</span>
            </div>
            <div className="grid grid-cols-5 gap-2 text-center">
              <div className="p-1.5 bg-hpl-card rounded-lg border border-hpl-border/50">
                <span className="text-[10px] text-hpl-text-muted block">MAT</span>
                <span className="font-heading text-base font-bold text-white">
                  {stats.matches || 0}
                </span>
              </div>
              <div className="p-1.5 bg-hpl-card rounded-lg border border-hpl-border/50">
                <span className="text-[10px] text-hpl-text-muted block">RUNS</span>
                <span className="font-heading text-base font-bold text-amber-400">
                  {stats.runs || 0}
                </span>
              </div>
              <div className="p-1.5 bg-hpl-card rounded-lg border border-hpl-border/50">
                <span className="text-[10px] text-hpl-text-muted block">WKTS</span>
                <span className="font-heading text-base font-bold text-emerald-400">
                  {stats.wickets || 0}
                </span>
              </div>
              <div className="p-1.5 bg-hpl-card rounded-lg border border-hpl-border/50">
                <span className="text-[10px] text-hpl-text-muted block">S/R</span>
                <span className="font-heading text-base font-bold text-cyan-300">
                  {stats.strikeRate || 0}
                </span>
              </div>
              <div className="p-1.5 bg-hpl-card rounded-lg border border-hpl-border/50">
                <span className="text-[10px] text-hpl-text-muted block">ECON</span>
                <span className="font-heading text-base font-bold text-purple-300">
                  {stats.economy || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
