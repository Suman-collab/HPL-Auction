import React, { useState } from 'react';
import { useAuctionStore } from '../../store/useAuctionStore';
import { api } from '../../services/api';
import {
  Layers,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  Trash2,
  Users,
  X,
  Search,
  Check,
  AlertCircle,
  RotateCcw,
  SlidersHorizontal,
  UserPlus,
  UserMinus,
  Eye,
  Radio,
} from 'lucide-react';

export default function SetManagement() {
  const { sets, players, fetchSets, fetchPlayers, fetchAuctionState, setActiveTab } =
    useAuctionStore();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [order, setOrder] = useState(1);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // Add Players to Set Modal
  const [addModalSet, setAddModalSet] = useState(null);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);
  const [playerSearch, setPlayerSearch] = useState('');
  const [playerRoleFilter, setPlayerRoleFilter] = useState('ALL');
  const [playerYearFilter, setPlayerYearFilter] = useState('ALL');
  const [addingPlayers, setAddingPlayers] = useState(false);

  // Manage Players in Set Modal / Drawer
  const [viewSetRoster, setViewSetRoster] = useState(null);

  // Delete Set Modal
  const [deleteConfirmSet, setDeleteConfirmSet] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Reopen Player feedback
  const [reopeningPlayerId, setReopeningPlayerId] = useState(null);

  // Unsold Set Modal State
  const [unsoldModalSet, setUnsoldModalSet] = useState(null);
  const [unsoldSetName, setUnsoldSetName] = useState('');
  const [creatingUnsoldSet, setCreatingUnsoldSet] = useState(false);

  const openUnsoldSetModal = (sourceSet = null) => {
    setUnsoldModalSet(sourceSet);
    if (sourceSet) {
      setUnsoldSetName(`${sourceSet.name} - Unsold Re-Auction`);
    } else {
      setUnsoldSetName('Accelerated Round: Unsold Players');
    }
  };

  const handleConfirmCreateUnsoldSet = async () => {
    setCreatingUnsoldSet(true);
    try {
      const sourceId = unsoldModalSet ? unsoldModalSet._id : null;
      const res = await api.createUnsoldSet(sourceId, unsoldSetName.trim());
      await fetchSets();
      await fetchPlayers();
      await fetchAuctionState();
      setUnsoldModalSet(null);
      alert(res.message || 'Unsold set created successfully!');
    } catch (err) {
      alert(err.message || 'Failed to create unsold set');
    } finally {
      setCreatingUnsoldSet(false);
    }
  };

  // Create Set Handler
  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createSet({ name, order: Number(order), description });
      setIsCreateOpen(false);
      setName('');
      setDescription('');
      await fetchSets();
    } catch (err) {
      alert(err.message || 'Failed to create set');
    } finally {
      setSaving(false);
    }
  };

  // Start Set & Make Live
  const handleActivateSet = async (setId) => {
    try {
      await api.startSet(setId, false);
      await fetchSets();
      await fetchAuctionState();
      // Transition admin to Live Console
      setActiveTab('live');
    } catch (err) {
      alert(err.message || 'Failed to start set');
    }
  };

  // Delete Set Handler
  const executeDeleteSet = async () => {
    if (!deleteConfirmSet) return;
    setDeleting(true);
    try {
      await api.deleteSet(deleteConfirmSet._id);
      await fetchSets();
      await fetchPlayers();
      setDeleteConfirmSet(null);
    } catch (err) {
      alert(err.message || 'Failed to delete set');
    } finally {
      setDeleting(false);
    }
  };

  // Open Add Players Modal
  const openAddPlayersModal = (set) => {
    setAddModalSet(set);
    setSelectedPlayerIds([]);
    setPlayerSearch('');
    setPlayerRoleFilter('ALL');
    setPlayerYearFilter('ALL');
  };

  // Submit Add Players
  const handleAddPlayersSubmit = async () => {
    if (!addModalSet || selectedPlayerIds.length === 0) return;
    setAddingPlayers(true);
    try {
      await api.addPlayersToSet(addModalSet._id, selectedPlayerIds);
      await fetchSets();
      await fetchPlayers();
      setAddModalSet(null);
      setSelectedPlayerIds([]);
    } catch (err) {
      alert(err.message || 'Failed to add players');
    } finally {
      setAddingPlayers(false);
    }
  };

  // Remove Player from Set
  const handleRemovePlayer = async (setId, playerId) => {
    try {
      await api.removePlayerFromSet(setId, playerId);
      await fetchSets();
      await fetchPlayers();
      if (viewSetRoster && viewSetRoster._id === setId) {
        setViewSetRoster((prev) => ({
          ...prev,
          players: prev.players.filter((p) => p._id !== playerId),
        }));
      }
    } catch (err) {
      alert(err.message || 'Failed to remove player');
    }
  };

  // Revise / Reopen a Player
  const handleReopenPlayer = async (player, targetSetId = null) => {
    setReopeningPlayerId(player._id);
    try {
      await api.reopenPlayer(player._id, targetSetId || player.set?._id || player.set || null);
      await fetchPlayers();
      await fetchSets();
      await fetchAuctionState();
      alert(`Decision revised! "${player.name}" is reopened as PENDING.`);
    } catch (err) {
      alert(err.message || 'Failed to reopen player');
    } finally {
      setReopeningPlayerId(null);
    }
  };

  // Unassigned / Available players for add modal
  const availablePlayers = players.filter((p) => {
    if (!addModalSet) return false;
    const currentSetPlayerIds = (addModalSet.players || []).map((sp) =>
      typeof sp === 'object' ? sp._id : sp
    );
    if (currentSetPlayerIds.includes(p._id)) return false;

    // Filters
    const matchesSearch =
      !playerSearch || p.name.toLowerCase().includes(playerSearch.toLowerCase());
    const matchesRole = playerRoleFilter === 'ALL' || p.role === playerRoleFilter;
    const matchesYear = playerYearFilter === 'ALL' || p.year === playerYearFilter;

    return matchesSearch && matchesRole && matchesYear;
  });

  const toggleSelectPlayer = (id) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllAvailable = () => {
    if (selectedPlayerIds.length === availablePlayers.length) {
      setSelectedPlayerIds([]);
    } else {
      setSelectedPlayerIds(availablePlayers.map((p) => p._id));
    }
  };

  const statusBadges = {
    upcoming: 'bg-slate-800 text-slate-300 border-slate-700',
    active: 'bg-cyan-500/20 text-cyan-300 border-cyan-400 font-bold animate-pulse',
    completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold',
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Top Banner with Quick Actions & Decision Revision Shortcut */}
      <div className="bg-gradient-to-r from-purple-950/40 via-hpl-card to-cyan-950/30 border border-purple-500/30 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-6 h-6 text-purple-400" />
            <h2 className="font-heading text-2xl font-bold text-white">
              Auction Sets & Sequence Manager
            </h2>
          </div>
          <p className="text-xs text-hpl-text-secondary mt-1 max-w-xl">
            Group imported players into sequential auction sets, start rounds live on the auction
            block, and revise any auction decisions on demand.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Create Unsold Round for All Unsold */}
          {players.filter((p) => p.status === 'unsold').length > 0 && (
            <button
              onClick={() => openUnsoldSetModal(null)}
              className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-heading font-bold text-xs flex items-center space-x-1.5 transition-colors"
              title="Create an auction set for all unsold players in tournament"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Unsold Round ({players.filter((p) => p.status === 'unsold').length})</span>
            </button>
          )}

          {/* Decision Revision Quick Button */}
          <button
            onClick={() => setActiveTab('override')}
            className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-heading font-bold text-xs flex items-center space-x-1.5 transition-colors"
            title="Jump to Master Decision Revision & Override Panel"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Decision Revision Center</span>
          </button>

          {/* Create Set */}
          <button
            onClick={() => {
              setOrder(sets.length + 1);
              setIsCreateOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-hpl-cyan hover:bg-cyan-300 text-black font-heading font-bold text-xs flex items-center space-x-1.5 shadow-hud transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Set</span>
          </button>
        </div>
      </div>

      {/* Sets Grid */}
      {sets.length === 0 ? (
        <div className="bg-hpl-card border border-hpl-border rounded-3xl p-12 text-center text-hpl-text-muted">
          <Layers className="w-12 h-12 text-purple-400 mx-auto mb-3 opacity-50" />
          <h3 className="font-heading text-xl font-bold text-white mb-1">
            No Auction Sets Created Yet
          </h3>
          <p className="text-xs text-hpl-text-secondary max-w-sm mx-auto mb-4">
            Create an auction set (e.g. "Set 1: Marquee All-rounders") to group imported players and
            take them live.
          </p>
          <button
            onClick={() => {
              setOrder(1);
              setIsCreateOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-hpl-cyan hover:bg-cyan-300 text-black font-heading font-bold text-xs shadow-hud inline-flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Set</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {sets.map((set) => {
            const setPlayers = set.players || [];
            const soldCount = setPlayers.filter((p) => p.status === 'sold').length;
            const unsoldCount = setPlayers.filter((p) => p.status === 'unsold').length;
            const pendingCount = setPlayers.filter((p) => p.status === 'pending').length;

            return (
              <div
                key={set._id}
                className={`bg-hpl-card border rounded-2xl p-5 relative overflow-hidden transition-all shadow-md ${
                  set.status === 'active'
                    ? 'border-cyan-400 shadow-hud ring-1 ring-cyan-400/50'
                    : 'border-hpl-border hover:border-hpl-borderHighlight'
                }`}
              >
                {/* Active Accent Header */}
                {set.status === 'active' && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-500" />
                )}

                {/* Top Info & Actions */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-950/50 border border-purple-500/40 flex items-center justify-center font-heading font-bold text-lg text-purple-300">
                      #{set.order}
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-lg text-white leading-tight">
                        {set.name}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border inline-block ${
                            statusBadges[set.status] || statusBadges.upcoming
                          }`}
                        >
                          {set.status === 'active' ? 'LIVE NOW' : set.status}
                        </span>
                        <span className="text-[11px] text-hpl-text-muted">
                          {setPlayers.length} players
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center space-x-1.5">
                    {/* Make Live / Start Set */}
                    <button
                      onClick={() => handleActivateSet(set._id)}
                      className={`px-3 py-1.5 rounded-xl font-heading font-bold text-xs flex items-center space-x-1.5 transition-all shadow-sm ${
                        set.status === 'active'
                          ? 'bg-cyan-400 text-black shadow-hud hover:bg-cyan-300'
                          : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black'
                      }`}
                      title={set.status === 'active' ? 'Go to Live Console' : 'Start Set Live'}
                    >
                      {set.status === 'active' ? (
                        <>
                          <Radio className="w-3.5 h-3.5 animate-pulse" />
                          <span>LIVE CONSOLE</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-black" />
                          <span>START SET</span>
                        </>
                      )}
                    </button>

                    {/* Create Unsold Set button if any unsold players in this set */}
                    {unsoldCount > 0 && (
                      <button
                        onClick={() => openUnsoldSetModal(set)}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-heading font-bold text-xs flex items-center space-x-1.5 transition-colors"
                        title={`Create a re-auction set for ${unsoldCount} unsold player(s)`}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Unsold Set ({unsoldCount})</span>
                      </button>
                    )}

                    {/* Add Players to Set */}
                    <button
                      onClick={() => openAddPlayersModal(set)}
                      className="p-2 rounded-xl bg-hpl-surface hover:bg-slate-700 text-cyan-300 border border-white/5 transition-colors"
                      title="Add Imported Players to this Set"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>

                    {/* Manage Players / Roster */}
                    <button
                      onClick={() => setViewSetRoster(set)}
                      className="p-2 rounded-xl bg-hpl-surface hover:bg-slate-700 text-slate-300 border border-white/5 transition-colors"
                      title="View & Manage Set Players"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Delete Set */}
                    <button
                      onClick={() => setDeleteConfirmSet(set)}
                      className="p-2 rounded-xl bg-hpl-surface hover:bg-red-950/40 text-hpl-text-muted hover:text-red-400 border border-white/5 transition-colors"
                      title="Delete Set"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {set.description && (
                  <p className="text-xs text-hpl-text-secondary mb-3 italic">
                    "{set.description}"
                  </p>
                )}

                {/* Status Breakdown Chips */}
                <div className="grid grid-cols-4 gap-2 text-center p-2.5 bg-hpl-surface/80 rounded-xl border border-hpl-border/50 text-xs mb-3">
                  <div>
                    <span className="text-[10px] text-hpl-text-muted block">Total</span>
                    <span className="font-heading font-bold text-sm text-white">
                      {setPlayers.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-400 block">Sold</span>
                    <span className="font-heading font-bold text-sm text-amber-400">
                      {soldCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-400 block">Unsold</span>
                    <span className="font-heading font-bold text-sm text-rose-400">
                      {unsoldCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-cyan-300 block">Pending</span>
                    <span className="font-heading font-bold text-sm text-cyan-300">
                      {pendingCount}
                    </span>
                  </div>
                </div>

                {/* Players Preview Row with Quick Revise/Reopen Badge */}
                {setPlayers.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-hpl-text-muted">
                      <span>Assigned Players</span>
                      <button
                        onClick={() => setViewSetRoster(set)}
                        className="text-cyan-400 hover:underline font-semibold"
                      >
                        Manage All ({setPlayers.length}) &rarr;
                      </button>
                    </div>

                    <div className="flex items-center space-x-1.5 overflow-x-auto py-1 scrollbar-none">
                      {setPlayers.slice(0, 8).map((p) => (
                        <div
                          key={p._id}
                          className="relative group shrink-0"
                          title={`${p.name} (${p.role}) - ${p.status}`}
                        >
                          <img
                            src={p.photo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + p.name}
                            alt={p.name}
                            className={`w-8 h-8 rounded-full object-cover border ${
                              p.status === 'sold'
                                ? 'border-amber-500 ring-1 ring-amber-400/50'
                                : p.status === 'unsold'
                                ? 'border-rose-500 opacity-60'
                                : 'border-white/20'
                            }`}
                          />
                          {/* Revise indicator for sold/unsold */}
                          {(p.status === 'sold' || p.status === 'unsold') && (
                            <button
                              onClick={() => handleReopenPlayer(p, set._id)}
                              disabled={reopeningPlayerId === p._id}
                              title={`Revise decision: Reopen ${p.name} as PENDING`}
                              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow transition-transform group-hover:scale-110"
                            >
                              <RotateCcw className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      {setPlayers.length > 8 && (
                        <span className="text-[10px] text-hpl-text-muted font-bold pl-1 shrink-0">
                          +{setPlayers.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-hpl-surface/40 border border-dashed border-white/10 rounded-xl text-center">
                    <p className="text-xs text-hpl-text-muted mb-2">No players assigned to this set yet.</p>
                    <button
                      onClick={() => openAddPlayersModal(set)}
                      className="px-3 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold inline-flex items-center space-x-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add Players from Registry</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Add Players to Set */}
      {addModalSet && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-hpl-surface border border-hpl-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-hpl-border flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-white">
                    Add Players to "{addModalSet.name}"
                  </h3>
                  <p className="text-xs text-hpl-text-muted">
                    Assign imported or unassigned players into this round.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAddModalSet(null)}
                className="text-hpl-text-muted hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Controls */}
            <div className="p-4 bg-hpl-card/60 border-b border-hpl-border flex flex-wrap items-center gap-2 shrink-0">
              <div className="flex-1 min-w-[180px] relative">
                <Search className="w-3.5 h-3.5 text-hpl-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search players by name..."
                  value={playerSearch}
                  onChange={(e) => setPlayerSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-hpl-surface border border-hpl-border rounded-xl text-xs text-white focus:outline-none focus:border-hpl-cyan"
                />
              </div>

              <select
                value={playerYearFilter}
                onChange={(e) => setPlayerYearFilter(e.target.value)}
                className="bg-hpl-surface border border-hpl-border rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-hpl-cyan"
              >
                <option value="ALL">All Years</option>
                <option value="1st">1st Year</option>
                <option value="2nd">2nd Year</option>
                <option value="3rd">3rd Year</option>
                <option value="4th">4th Year</option>
              </select>

              <select
                value={playerRoleFilter}
                onChange={(e) => setPlayerRoleFilter(e.target.value)}
                className="bg-hpl-surface border border-hpl-border rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-hpl-cyan"
              >
                <option value="ALL">All Roles</option>
                <option value="Batter">Batter</option>
                <option value="Bowler">Bowler</option>
                <option value="All-rounder">All-rounder</option>
                <option value="Wicket-keeper">Wicket-keeper</option>
              </select>

              <button
                type="button"
                onClick={selectAllAvailable}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 font-semibold"
              >
                {selectedPlayerIds.length === availablePlayers.length && availablePlayers.length > 0
                  ? 'Deselect All'
                  : 'Select All Filtered'}
              </button>
            </div>

            {/* Players Selection List */}
            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {availablePlayers.length === 0 ? (
                <div className="text-center py-10 text-hpl-text-muted text-xs">
                  No unassigned or matching players available to add.
                </div>
              ) : (
                availablePlayers.map((player) => {
                  const isChecked = selectedPlayerIds.includes(player._id);
                  return (
                    <div
                      key={player._id}
                      onClick={() => toggleSelectPlayer(player._id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors cursor-pointer select-none ${
                        isChecked
                          ? 'bg-cyan-950/40 border-cyan-500/50'
                          : 'bg-hpl-card border-hpl-border hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded bg-hpl-surface border-hpl-border text-hpl-cyan focus:ring-0"
                        />
                        <img
                          src={player.photo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + player.name}
                          alt={player.name}
                          className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0"
                        />
                        <div className="truncate">
                          <p className="font-heading font-bold text-xs text-white truncate">
                            {player.name}
                          </p>
                          <p className="text-[11px] text-hpl-text-muted">
                            {player.year} Year • {player.role}
                            {player.stats?.specialSkill ? ` • ${player.stats.specialSkill}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-2">
                        <span className="font-mono font-bold text-xs text-hpl-gold block">
                          {player.basePrice} pts
                        </span>
                        <span className="text-[10px] text-slate-400 capitalize">
                          {player.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-hpl-border flex items-center justify-between shrink-0 bg-hpl-card/60">
              <span className="text-xs text-slate-300 font-semibold font-mono">
                {selectedPlayerIds.length} player(s) selected
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setAddModalSet(null)}
                  className="px-4 py-2 rounded-xl bg-hpl-surface hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddPlayersSubmit}
                  disabled={addingPlayers || selectedPlayerIds.length === 0}
                  className="px-5 py-2 rounded-xl bg-hpl-cyan hover:bg-cyan-300 text-black font-heading font-bold text-xs shadow-hud disabled:opacity-40"
                >
                  {addingPlayers ? 'Adding...' : `Add ${selectedPlayerIds.length} Player(s)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: View & Manage Set Players Roster */}
      {viewSetRoster && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-hpl-surface border border-hpl-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-hpl-border flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-heading font-bold text-lg text-white">
                  "{viewSetRoster.name}" Roster
                </h3>
                <p className="text-xs text-hpl-text-muted">
                  {viewSetRoster.players?.length || 0} players enrolled in this round.
                </p>
              </div>
              <button
                onClick={() => setViewSetRoster(null)}
                className="text-hpl-text-muted hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
              {(!viewSetRoster.players || viewSetRoster.players.length === 0) ? (
                <div className="text-center py-10 text-hpl-text-muted text-xs">
                  No players currently assigned to this set.
                </div>
              ) : (
                viewSetRoster.players.map((p) => {
                  const isSold = p.status === 'sold';
                  const isUnsold = p.status === 'unsold';

                  return (
                    <div
                      key={p._id}
                      className="flex items-center justify-between p-3 rounded-xl bg-hpl-card border border-hpl-border"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <img
                          src={p.photo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + p.name}
                          alt={p.name}
                          className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0"
                        />
                        <div className="truncate">
                          <p className="font-heading font-bold text-sm text-white truncate">
                            {p.name}
                          </p>
                          <p className="text-xs text-hpl-text-muted">
                            {p.year} Year • {p.role} • Base {p.basePrice} pts
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded ${
                            isSold
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : isUnsold
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                          }`}
                        >
                          {isSold ? `SOLD ${p.soldPrice || p.basePrice} PTS` : p.status}
                        </span>

                        {/* Revise / Reopen decision button */}
                        {(isSold || isUnsold) && (
                          <button
                            onClick={() => handleReopenPlayer(p, viewSetRoster._id)}
                            disabled={reopeningPlayerId === p._id}
                            className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-[11px] font-bold flex items-center space-x-1"
                            title="Revise Decision: Reopen this player back to pending"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Revise / Reopen</span>
                          </button>
                        )}

                        {/* Remove from set */}
                        <button
                          onClick={() => handleRemovePlayer(viewSetRoster._id, p._id)}
                          className="p-1.5 rounded-lg hover:bg-red-950/40 text-hpl-text-muted hover:text-red-400 transition-colors"
                          title="Remove player from this set (becomes unassigned)"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-6 py-3 border-t border-hpl-border flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setViewSetRoster(null)}
                className="px-4 py-2 rounded-xl bg-hpl-surface hover:bg-slate-700 text-xs font-semibold text-white"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Create Set Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-hpl-surface border border-hpl-border rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-hpl-border mb-4">
              <h3 className="font-heading font-bold text-xl text-white">Create Auction Set</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-hpl-text-muted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-hpl-text-muted uppercase block mb-1">
                  Set Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Set 1: Marquee Power Hitters"
                  className="w-full bg-hpl-card border border-hpl-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-hpl-cyan"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-hpl-text-muted uppercase block mb-1">
                  Sequence Order #
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  className="w-full bg-hpl-card border border-hpl-border rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-hpl-cyan"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-hpl-text-muted uppercase block mb-1">
                  Description / Focus
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Premium hostel players and opening batsmen"
                  rows={3}
                  className="w-full bg-hpl-card border border-hpl-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-hpl-cyan"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl bg-hpl-card text-xs font-semibold text-hpl-text-secondary hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-heading font-bold text-sm shadow-md disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Set'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Delete Set Confirmation Modal */}
      {deleteConfirmSet && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-hpl-surface border border-red-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-white">Delete Auction Set</h3>
                <p className="text-xs text-hpl-text-muted">Permanent set removal</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-white font-semibold">"{deleteConfirmSet.name}"</strong>? Any assigned players will not be deleted; they will simply become unassigned and available for other sets.
            </p>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmSet(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-hpl-card hover:bg-slate-700 text-sm font-semibold text-hpl-text-secondary hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeleteSet}
                disabled={deleting}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-heading font-bold text-sm shadow-lg disabled:opacity-50 flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deleting ? 'Deleting...' : 'Delete Set'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Create Unsold Set Confirmation Modal */}
      {unsoldModalSet !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-hpl-surface border border-amber-500/40 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-amber-400">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-white">
                  Create Unsold Re-Auction Set
                </h3>
                <p className="text-xs text-hpl-text-muted">
                  {unsoldModalSet
                    ? `From "${unsoldModalSet.name}"`
                    : 'All Tournament Unsold Players'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This will automatically collect all unsold players from{' '}
              <strong className="text-amber-300 font-semibold">
                {unsoldModalSet ? unsoldModalSet.name : 'all sets'}
              </strong>
              , reset their status from <span className="text-rose-400 font-bold">UNSOLD</span> to{' '}
              <span className="text-cyan-300 font-bold">PENDING</span>, and place them into a new
              sequential set ready for live re-auction!
            </p>

            <div>
              <label className="text-xs font-bold text-hpl-text-muted uppercase block mb-1">
                New Set Name
              </label>
              <input
                type="text"
                required
                value={unsoldSetName}
                onChange={(e) => setUnsoldSetName(e.target.value)}
                placeholder="e.g. Set 1 - Unsold Re-Auction"
                className="w-full bg-hpl-card border border-hpl-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400 font-medium"
              />
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setUnsoldModalSet(null)}
                disabled={creatingUnsoldSet}
                className="px-4 py-2 rounded-xl bg-hpl-card hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCreateUnsoldSet}
                disabled={creatingUnsoldSet || !unsoldSetName.trim()}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-heading font-bold text-xs shadow-goldGlow disabled:opacity-50 flex items-center space-x-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-black" />
                <span>{creatingUnsoldSet ? 'Creating Set...' : 'Create & Reopen Players'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
