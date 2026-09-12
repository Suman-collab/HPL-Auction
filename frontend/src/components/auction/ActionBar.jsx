import React, { useState } from 'react';
import { useAuctionStore } from '../../store/useAuctionStore';
import { getNextBidAmount, getNextIncrement } from '../../utils/economy';
import {
  Gavel,
  CheckCircle,
  XCircle,
  SkipForward,
  SkipBack,
  RotateCcw,
  Sliders,
  AlertTriangle,
} from 'lucide-react';

export default function ActionBar({ player, currentBid, leadingTeam }) {
  const {
    teams,
    placeBid,
    markSold,
    markUnsold,
    nextPlayer,
    previousPlayer,
    skipPlayer,
    undoLastAction,
    error,
    clearError,
  } = useAuctionStore();

  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [forceOverride, setForceOverride] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // If no leading team, pick first team or selected
  const activeBiddingTeamId = selectedTeamId || leadingTeam?._id || (teams[0]?._id ?? '');
  const activeBiddingTeam = teams.find((t) => String(t._id) === String(activeBiddingTeamId));

  const nextAutoBid = player
    ? currentBid > 0 && leadingTeam
      ? getNextBidAmount(currentBid)
      : player.basePrice
    : 0;

  const currentIncrement = getNextIncrement(currentBid);

  const handleQuickBid = async () => {
    if (!activeBiddingTeamId || !player) return;
    setIsProcessing(true);
    clearError();
    try {
      await placeBid(activeBiddingTeamId, nextAutoBid, forceOverride);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCustomBid = async (e) => {
    e.preventDefault();
    if (!activeBiddingTeamId || !customAmount) return;
    setIsProcessing(true);
    clearError();
    try {
      await placeBid(activeBiddingTeamId, Number(customAmount), forceOverride);
      setCustomAmount('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSold = async () => {
    if (!player) return;
    const teamToSell = leadingTeam?._id || selectedTeamId;
    if (!teamToSell) {
      alert('Please select or bid with a team before marking as SOLD!');
      return;
    }
    setIsProcessing(true);
    clearError();
    try {
      await markSold(teamToSell, currentBid);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnsold = async () => {
    if (!player) return;
    setIsProcessing(true);
    clearError();
    try {
      await markUnsold();
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-hpl-surface/95 border-t border-hpl-border p-3 sm:p-4 rounded-2xl shadow-2xl backdrop-blur-xl mt-4">
      {/* Error alert if any */}
      {error && (
        <div className="mb-3 p-2.5 bg-red-950/40 border border-red-500/40 rounded-xl flex items-center justify-between text-xs text-red-300">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={clearError}
            className="text-[10px] text-red-400 hover:text-white uppercase font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Left: Team Selector + Bid Controls */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Team Dropdown */}
          <div className="w-full sm:w-56 shrink-0">
            <label className="text-[10px] text-hpl-text-muted uppercase font-bold block mb-1">
              Select Bidding Franchise
            </label>
            <select
              value={activeBiddingTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="w-full bg-hpl-card border border-hpl-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-hpl-cyan transition-colors"
            >
              {teams.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.remainingPurse} pts left)
                </option>
              ))}
            </select>
          </div>

          {/* Quick Pre-calculated Bid Button */}
          <div className="flex-1 sm:flex-initial">
            <label className="text-[10px] text-hpl-cyan uppercase font-bold block mb-1">
              Next Step (+{currentIncrement} pt)
            </label>
            <button
              onClick={handleQuickBid}
              disabled={isProcessing || !player}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-heading font-bold text-base sm:text-lg flex items-center justify-center space-x-2 shadow-hud transition-transform active:scale-95 disabled:opacity-50"
            >
              <Gavel className="w-4 h-4 text-black" />
              <span>BID {nextAutoBid} PTS</span>
            </button>
          </div>

          {/* Custom Bid Override Input */}
          <form onSubmit={handleCustomBid} className="flex items-center space-x-1.5">
            <div>
              <label className="text-[10px] text-hpl-text-muted uppercase font-bold block mb-1">
                Custom Bid
              </label>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  placeholder="e.g. 15.5"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-24 sm:w-28 bg-hpl-card border border-hpl-border rounded-xl px-2.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-hpl-cyan"
                />
                <button
                  type="submit"
                  disabled={!customAmount || isProcessing}
                  className="px-3 py-2 rounded-xl bg-hpl-card border border-hpl-border hover:border-hpl-cyan text-xs font-bold text-white transition-colors disabled:opacity-40"
                >
                  Raise
                </button>
              </div>
            </div>
          </form>

          {/* Force Override Checkbox */}
          <div className="flex items-center space-x-1.5 pt-4 text-[11px] text-hpl-text-muted select-none">
            <input
              type="checkbox"
              id="forcePurse"
              checked={forceOverride}
              onChange={(e) => setForceOverride(e.target.checked)}
              className="rounded bg-hpl-card border-hpl-border text-hpl-cyan focus:ring-0"
            />
            <label htmlFor="forcePurse" className="cursor-pointer">
              Bypass Budget Check
            </label>
          </div>
        </div>

        {/* Right: Gavel Actions (Sold, Unsold, Navigation, Undo) */}
        <div className="flex items-center justify-end space-x-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-hpl-border/60">
          {/* Sold Button */}
          <button
            onClick={handleSold}
            disabled={isProcessing || !player}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-heading font-bold text-base flex items-center justify-center space-x-1.5 shadow-goldGlow transition-transform active:scale-95 disabled:opacity-40"
            title="Hammer down: Sell player to winning team"
          >
            <CheckCircle className="w-4 h-4 text-black" />
            <span>SOLD</span>
          </button>

          {/* Unsold Button */}
          <button
            onClick={handleUnsold}
            disabled={isProcessing || !player}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 font-heading font-bold text-sm flex items-center justify-center space-x-1 transition-colors disabled:opacity-40"
            title="Mark player unsold"
          >
            <XCircle className="w-4 h-4 text-red-400" />
            <span>UNSOLD</span>
          </button>

          {/* Skip / Next */}
          <button
            onClick={skipPlayer}
            disabled={isProcessing}
            className="p-2.5 rounded-xl bg-hpl-card border border-hpl-border hover:border-hpl-cyan text-hpl-text-secondary hover:text-white transition-colors"
            title="Skip to next player"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Previous */}
          <button
            onClick={previousPlayer}
            disabled={isProcessing}
            className="p-2.5 rounded-xl bg-hpl-card border border-hpl-border hover:border-hpl-cyan text-hpl-text-secondary hover:text-white transition-colors"
            title="Return to previous player"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Undo */}
          <button
            onClick={undoLastAction}
            disabled={isProcessing}
            className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors"
            title="Single-step undo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
