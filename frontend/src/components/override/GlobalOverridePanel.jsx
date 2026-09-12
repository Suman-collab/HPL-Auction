import React, { useState } from 'react';
import { useAuctionStore } from '../../store/useAuctionStore';
import { api } from '../../services/api';
import {
  SlidersHorizontal,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  X,
  Search,
  ArrowRight,
  Shield,
  Coins,
} from 'lucide-react';

export default function GlobalOverridePanel() {
  const { players, teams, sets, fetchPlayers, fetchTeams, fetchAuctionState } = useAuctionStore();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Preview confirmation modal state
  const [previewData, setPreviewData] = useState(null);
  const [pendingOverride, setPendingOverride] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [applying, setApplying] = useState(false);

  // Reopen Modal state
  const [reopenPlayerObj, setReopenPlayerObj] = useState(null);
  const [reopenTargetSet, setReopenTargetSet] = useState('');

  // Handle opening preview for inline edit
  const initiateOverride = async (player, newTeamId, newPrice, newStatus) => {
    setLoadingPreview(true);
    try {
      const res = await api.previewOverride(
        player._id,
        newTeamId,
        newPrice,
        newStatus
      );

      if (res.success) {
        setPreviewData(res.data);
        setPendingOverride({
          playerId: player._id,
          playerName: player.name,
          newTeamId,
          newPrice,
          newStatus,
        });
      }
    } catch (err) {
      alert('Error calculating override diff: ' + err.message);
    } finally {
      setLoadingPreview(false);
    }
  };

  const confirmAndApplyOverride = async () => {
    if (!pendingOverride) return;
    setApplying(true);
    try {
      await api.overridePlayer(
        pendingOverride.playerId,
        pendingOverride.newTeamId,
        pendingOverride.newPrice,
        pendingOverride.newStatus
      );

      setPreviewData(null);
      setPendingOverride(null);
      fetchPlayers();
      fetchTeams();
      fetchAuctionState();
      alert('Override successfully applied to database and team budgets!');
    } catch (err) {
      alert('Failed to apply override: ' + err.message);
    } finally {
      setApplying(false);
    }
  };

  const handleReopenSubmit = async () => {
    if (!reopenPlayerObj) return;
    try {
      await api.reopenPlayer(reopenPlayerObj._id, reopenTargetSet || null);
      setReopenPlayerObj(null);
      fetchPlayers();
      fetchTeams();
      fetchAuctionState();
      alert(`${reopenPlayerObj.name} reopened for auction as PENDING!`);
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = players.filter((p) => {
    const matchSearch =
      !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-red-950/40 via-hpl-card to-hpl-card border border-rose-500/40 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-bold text-white flex items-center space-x-2">
              <SlidersHorizontal className="w-6 h-6 text-rose-400" />
              <span>Global Auction Override Panel</span>
            </h2>
            <p className="text-xs text-rose-200/70 mt-1 max-w-2xl">
              Super-Admin master controls: reassign sold players, edit final hammer prices, restore
              refunded purses atomically, or send completed players back to pending.
            </p>
          </div>
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-bold shrink-0">
            <AlertTriangle className="w-4 h-4" />
            <span>Purse Safe-Check Active</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-hpl-card border border-hpl-border rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 text-hpl-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search players to override..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-hpl-surface border border-hpl-border rounded-xl text-xs text-white focus:outline-none focus:border-rose-400"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-hpl-surface border border-hpl-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-400"
        >
          <option value="ALL">All Statuses</option>
          <option value="sold">Sold Players Only</option>
          <option value="unsold">Unsold Players</option>
          <option value="pending">Pending Players</option>
        </select>

        <span className="text-xs text-hpl-text-muted ml-auto font-mono">
          {filtered.length} players listed
        </span>
      </div>

      {/* Overrides Table */}
      <div className="bg-hpl-card border border-hpl-border rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-hpl-surface/80 border-b border-hpl-border text-hpl-text-muted font-heading uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Player</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4">Assign Franchise</th>
                <th className="py-3 px-4">Sold Price (pts)</th>
                <th className="py-3 px-4 text-right">Quick Reopen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hpl-border/50">
              {filtered.map((player) => {
                const isSold = player.status === 'sold';
                const currentTeamId = player.soldTo?._id || player.soldTo || '';

                return (
                  <tr key={player._id} className="hover:bg-hpl-surface/50 transition-colors">
                    {/* Player */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={player.photo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + player.name}
                          alt={player.name}
                          className="w-9 h-9 rounded-full object-cover border border-white/10"
                        />
                        <div>
                          <p className="font-heading font-bold text-sm text-white">
                            {player.name}
                          </p>
                          <span className="text-[10px] text-hpl-text-muted">
                            {player.role} • {player.year} Year (Base: {player.basePrice} pt)
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3 px-4">
                      <select
                        value={player.status}
                        onChange={(e) => {
                          const newStat = e.target.value;
                          initiateOverride(
                            player,
                            newStat === 'sold' ? currentTeamId || teams[0]?._id : null,
                            player.soldPrice || player.basePrice,
                            newStat
                          );
                        }}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold uppercase border bg-hpl-surface focus:outline-none ${
                          player.status === 'sold'
                            ? 'text-amber-400 border-amber-500/40'
                            : player.status === 'unsold'
                            ? 'text-rose-400 border-rose-500/40'
                            : 'text-slate-300 border-slate-700'
                        }`}
                      >
                        <option value="sold">Sold</option>
                        <option value="unsold">Unsold</option>
                        <option value="pending">Pending</option>
                      </select>
                    </td>

                    {/* Assign Franchise Dropdown */}
                    <td className="py-3 px-4">
                      <select
                        disabled={player.status !== 'sold'}
                        value={currentTeamId}
                        onChange={(e) => {
                          initiateOverride(
                            player,
                            e.target.value,
                            player.soldPrice || player.basePrice,
                            'sold'
                          );
                        }}
                        className="w-48 bg-hpl-surface border border-hpl-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-400 disabled:opacity-30"
                      >
                        <option value="">-- No Franchise --</option>
                        {teams.map((t) => (
                          <option key={t._id} value={t._id}>
                            {t.name} ({t.remainingPurse} pt)
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Sold Price Inline Edit */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5">
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          disabled={player.status !== 'sold'}
                          defaultValue={player.soldPrice || player.basePrice}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              initiateOverride(
                                player,
                                currentTeamId,
                                Number(e.target.value),
                                'sold'
                              );
                            }
                          }}
                          onBlur={(e) => {
                            if (
                              Number(e.target.value) !==
                              Number(player.soldPrice || player.basePrice)
                            ) {
                              initiateOverride(
                                player,
                                currentTeamId,
                                Number(e.target.value),
                                'sold'
                              );
                            }
                          }}
                          className="w-20 bg-hpl-surface border border-hpl-border rounded-lg px-2 py-1 text-xs text-hpl-gold font-mono font-bold focus:outline-none focus:border-rose-400 disabled:opacity-30"
                        />
                        <span className="text-[10px] text-hpl-text-muted">pts</span>
                      </div>
                    </td>

                    {/* Reopen Button */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setReopenPlayerObj(player);
                          setReopenTargetSet(player.set?._id || sets[0]?._id || '');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-hpl-surface hover:bg-slate-700 border border-hpl-border text-[11px] font-semibold text-cyan-300 hover:text-white flex items-center space-x-1 ml-auto"
                        title="Reopen for re-auction in a set"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reopen</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal Showing Purse Impact Before Commit */}
      {previewData && pendingOverride && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-hpl-surface border border-rose-500/60 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-hpl-border mb-4">
              <h3 className="font-heading font-bold text-xl text-white flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <span>Confirm Purse & Roster Override</span>
              </h3>
              <button
                onClick={() => {
                  setPreviewData(null);
                  setPendingOverride(null);
                }}
                className="text-hpl-text-muted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-hpl-text-secondary">
                You are overriding auction results for{' '}
                <strong className="text-white">{pendingOverride.playerName}</strong>.
                The following atomic adjustments will be applied to franchise budgets:
              </p>

              {/* Purse Diff Cards */}
              <div className="space-y-2">
                {previewData.teamPurseDiffs?.length === 0 ? (
                  <div className="p-3 bg-hpl-card border border-hpl-border rounded-xl text-xs text-hpl-text-muted">
                    No franchise budget changes detected.
                  </div>
                ) : (
                  previewData.teamPurseDiffs?.map((diff, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-hpl-card border border-hpl-border rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-hpl-cyan" />
                        <span className="font-heading font-bold text-sm text-white">
                          {diff.teamName}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 font-mono text-xs">
                        <span className="text-slate-400">{diff.oldPurse} pt</span>
                        <ArrowRight className="w-3.5 h-3.5 text-hpl-text-muted" />
                        <span className="font-bold text-hpl-gold">{diff.newPurse} pt</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                            diff.diff.startsWith('+')
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          ({diff.diff} pt)
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                ⚠️ This action will immediately synchronize across all live client screens without a
                page reload.
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewData(null);
                    setPendingOverride(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-hpl-card text-xs font-semibold text-hpl-text-secondary hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={applying}
                  onClick={confirmAndApplyOverride}
                  className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-heading font-bold text-sm shadow-md disabled:opacity-50"
                >
                  {applying ? 'Committing...' : 'Confirm & Commit Override'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reopen Player Modal */}
      {reopenPlayerObj && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-hpl-surface border border-hpl-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-hpl-border mb-4">
              <h3 className="font-heading font-bold text-xl text-white flex items-center space-x-2">
                <RotateCcw className="w-5 h-5 text-cyan-300" />
                <span>Reopen for Re-auction</span>
              </h3>
              <button
                onClick={() => setReopenPlayerObj(null)}
                className="text-hpl-text-muted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-hpl-text-secondary">
                Send <strong className="text-white">{reopenPlayerObj.name}</strong> back to{' '}
                <span className="text-cyan-300 font-bold uppercase">PENDING</span> status. If they
                were previously bought by a team, their purchase price will be automatically refunded
                to the team's purse.
              </p>

              <div>
                <label className="text-xs font-bold text-hpl-text-muted uppercase block mb-1">
                  Target Auction Set for Re-auction
                </label>
                <select
                  value={reopenTargetSet}
                  onChange={(e) => setReopenTargetSet(e.target.value)}
                  className="w-full bg-hpl-card border border-hpl-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-hpl-cyan"
                >
                  {sets.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReopenPlayerObj(null)}
                  className="px-4 py-2 rounded-xl bg-hpl-card text-xs font-semibold text-hpl-text-secondary hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReopenSubmit}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-heading font-bold text-sm shadow-hud"
                >
                  Reopen Player
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
