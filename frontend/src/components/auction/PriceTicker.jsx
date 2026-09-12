import React from 'react';
import { getNextIncrement } from '../../utils/economy';
import { TrendingUp, Award, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PriceTicker({ currentBid, leadingTeam, bidHistory = [] }) {
  const increment = getNextIncrement(currentBid);

  return (
    <div className="bg-gradient-to-br from-hpl-card via-hpl-surface to-hpl-card border border-hpl-border rounded-2xl p-5 shadow-2xl relative overflow-hidden">
      {/* Stadium glow light effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-32 bg-amber-500/10 blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Price Ticker display */}
        <div className="text-center sm:text-left w-full sm:w-auto">
          <div className="flex items-center justify-center sm:justify-start space-x-2 text-xs font-bold text-hpl-gold uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4 text-hpl-gold" />
            <span>Current Bid Ticker</span>
            <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full font-mono">
              +{increment} PT STEP
            </span>
          </div>

          <div className="flex items-baseline justify-center sm:justify-start space-x-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentBid}
                initial={{ scale: 0.85, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.1, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="font-heading text-5xl sm:text-6xl font-extrabold text-hpl-gold text-gold-glow tracking-tight"
              >
                {currentBid || 0}
              </motion.div>
            </AnimatePresence>
            <span className="font-heading text-2xl font-bold text-amber-200/60 uppercase">
              POINTS
            </span>
          </div>
        </div>

        {/* Right: Leading Team Display */}
        <div className="w-full sm:w-auto flex flex-col items-center sm:items-end">
          <span className="text-xs font-bold text-hpl-text-muted uppercase tracking-wider mb-1">
            Leading Franchise
          </span>

          {leadingTeam ? (
            <motion.div
              key={leadingTeam._id || leadingTeam.name}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center space-x-3 bg-hpl-surface border border-hpl-cyan/50 shadow-hud rounded-xl px-4 py-2.5"
            >
              <img
                src={leadingTeam.logo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + leadingTeam.name}
                alt={leadingTeam.name}
                className="w-10 h-10 rounded-lg object-contain bg-black/40 p-1 border border-white/10"
              />
              <div className="text-left">
                <p className="font-heading font-bold text-lg text-white leading-tight">
                  {leadingTeam.name}
                </p>
                <div className="flex items-center space-x-2">
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: `${leadingTeam.primaryColor}25`,
                      color: leadingTeam.primaryColor,
                    }}
                  >
                    {leadingTeam.shortCode}
                  </span>
                  <span className="text-xs text-hpl-text-secondary font-mono">
                    Purse: {leadingTeam.remainingPurse} pt
                  </span>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex items-center space-x-2 bg-hpl-surface/50 border border-dashed border-hpl-border rounded-xl px-4 py-3 text-hpl-text-muted text-sm italic">
              <Clock className="w-4 h-4 text-hpl-text-muted" />
              <span>Awaiting Opening Bid</span>
            </div>
          )}
        </div>
      </div>

      {/* Bid History Feed Strip */}
      {bidHistory && bidHistory.length > 0 && (
        <div className="mt-4 pt-3 border-t border-hpl-border/60 flex items-center space-x-2 overflow-x-auto text-xs scrollbar-none">
          <span className="text-[10px] text-hpl-text-muted uppercase font-bold shrink-0">
            Bid Trail:
          </span>
          {bidHistory.slice(-5).map((bh, idx) => (
            <div
              key={idx}
              className="shrink-0 flex items-center space-x-1.5 bg-hpl-surface border border-hpl-border/80 px-2 py-1 rounded-md"
            >
              <span className="w-2 h-2 rounded-full bg-hpl-cyan" />
              <span className="font-semibold text-white">
                {bh.team?.shortCode || bh.team?.name || 'Team'}
              </span>
              <span className="text-hpl-gold font-mono font-bold">{bh.amount} pt</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
