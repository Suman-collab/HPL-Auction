import React, { useState } from 'react';
import { useAuctionStore } from '../../store/useAuctionStore';
import { api } from '../../services/api';
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  Users,
  User,
  Coins,
  Upload,
  X,
  AlertCircle,
  Check,
} from 'lucide-react';

export default function TeamManagement() {
  const { teams, fetchTeams } = useAuctionStore();
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [rosterViewTeam, setRosterViewTeam] = useState(null);
  const [deleteConfirmTeam, setDeleteConfirmTeam] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#06B6D4');
  const [secondaryColor, setSecondaryColor] = useState('#083344');
  const [totalPurse, setTotalPurse] = useState(100);
  const [remainingPurse, setRemainingPurse] = useState(100);
  const [owner, setOwner] = useState('');
  const [captain, setCaptain] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const openCreateModal = () => {
    setEditingTeam(null);
    setName('');
    setShortCode('');
    setPrimaryColor('#06B6D4');
    setSecondaryColor('#083344');
    setTotalPurse(100);
    setRemainingPurse(100);
    setOwner('');
    setCaptain('');
    setLogoFile(null);
    setLogoPreview('');
    setError(null);
    setIsCreateOpen(true);
  };

  const openEditModal = (team) => {
    setEditingTeam(team);
    setName(team.name);
    setShortCode(team.shortCode);
    setPrimaryColor(team.primaryColor || '#06B6D4');
    setSecondaryColor(team.secondaryColor || '#083344');
    setTotalPurse(team.totalPurse);
    setRemainingPurse(team.remainingPurse);
    setOwner(team.owner || '');
    setCaptain(team.captain || '');
    setLogoFile(null);
    setLogoPreview(team.logo || '');
    setError(null);
    setIsCreateOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a team name');
      return;
    }
    setSaving(true);
    setError(null);

    const cleanName = name.trim();
    const cleanOwner = owner.trim();
    const derivedCode =
      shortCode ||
      (cleanName.split(/\s+/).length >= 2
        ? cleanName.split(/\s+/).map((w) => w[0]).join('').substring(0, 4).toUpperCase()
        : cleanName.substring(0, 3).toUpperCase());

    const formData = new FormData();
    formData.append('name', cleanName);
    formData.append('owner', cleanOwner);
    formData.append('shortCode', derivedCode);
    formData.append('totalPurse', totalPurse || 100);
    formData.append('remainingPurse', editingTeam ? editingTeam.remainingPurse : (totalPurse || 100));
    formData.append('primaryColor', primaryColor || '#06B6D4');
    formData.append('secondaryColor', secondaryColor || '#083344');
    formData.append('captain', captain || '');
    if (logoFile) {
      formData.append('logo', logoFile);
    } else if (logoPreview && !logoPreview.startsWith('blob:')) {
      formData.append('logo', logoPreview);
    }

    try {
      if (editingTeam) {
        await api.updateTeam(editingTeam._id, formData);
      } else {
        await api.createTeam(formData);
      }
      setIsCreateOpen(false);
      fetchTeams();
    } catch (err) {
      setError(err.message || 'Failed to save team');
    } finally {
      setSaving(false);
    }
  };

  const executeDelete = async () => {
    if (!deleteConfirmTeam) return;
    setDeleting(true);
    try {
      await api.deleteTeam(deleteConfirmTeam._id);
      await fetchTeams();
      setDeleteConfirmTeam(null);
    } catch (err) {
      alert(err.message || 'Failed to delete team');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-hpl-card border border-hpl-border rounded-2xl p-5">
        <div>
          <h2 className="font-heading text-2xl font-bold text-white flex items-center space-x-2">
            <Shield className="w-6 h-6 text-amber-400" />
            <span>Franchise Management</span>
          </h2>
          <p className="text-sm text-hpl-text-secondary">
            Configure team budgets, colors, owners, and view squads.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-hpl-cyan hover:bg-cyan-300 text-black font-heading font-bold text-sm flex items-center justify-center space-x-2 shadow-hud transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Franchise</span>
        </button>
      </div>

      {/* Teams Grid / Cards */}
      {teams.length === 0 ? (
        <div className="bg-hpl-card border border-hpl-border rounded-3xl p-12 text-center text-hpl-text-muted">
          <Shield className="w-12 h-12 text-cyan-400 mx-auto mb-3 opacity-50" />
          <h3 className="font-heading text-xl font-bold text-white mb-1">
            No Teams Registered Yet
          </h3>
          <p className="text-xs text-hpl-text-secondary max-w-sm mx-auto mb-4">
            Click "+ Add New Franchise" above to register your first team with its team name and owner.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-hpl-cyan hover:bg-cyan-300 text-black font-heading font-bold text-xs shadow-hud inline-flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Team Now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {teams.map((team) => (
          <div
            key={team._id}
            className="bg-hpl-card border border-hpl-border hover:border-hpl-borderHighlight rounded-2xl p-5 relative overflow-hidden transition-all shadow-md group"
          >
            {/* Top Color Accent */}
            <div
              className="absolute top-0 left-0 right-0 h-1.5"
              style={{ backgroundColor: team.primaryColor || '#06B6D4' }}
            />

            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <img
                  src={team.logo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + team.name}
                  alt={team.name}
                  className="w-12 h-12 rounded-xl object-contain bg-black/40 p-1 border border-white/10"
                />
                <div>
                  <h3 className="font-heading font-bold text-lg text-white leading-tight">
                    {team.name}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-xs text-cyan-300 font-semibold">
                      <User className="w-3 h-3 text-hpl-gold shrink-0" />
                      <span className="truncate max-w-[150px]">Owner: {team.owner || 'Franchise Owner'}</span>
                    </div>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono"
                      style={{
                        backgroundColor: `${team.primaryColor || '#06B6D4'}20`,
                        color: team.primaryColor || '#06B6D4',
                      }}
                    >
                      {team.shortCode}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => openEditModal(team)}
                  className="p-1.5 rounded-lg bg-hpl-surface hover:bg-slate-700 text-hpl-text-secondary hover:text-white transition-colors"
                  title="Edit Team"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteConfirmTeam(team)}
                  className="p-1.5 rounded-lg bg-hpl-surface hover:bg-red-900/40 text-hpl-text-secondary hover:text-red-400 transition-colors"
                  title="Delete Team"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Purse Statistics */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-hpl-surface/80 rounded-xl border border-hpl-border/50 mb-4">
              <div>
                <span className="text-[11px] text-hpl-text-muted block">Remaining Purse</span>
                <span className="font-heading font-extrabold text-2xl text-hpl-gold">
                  {team.remainingPurse}
                  <span className="text-xs font-normal text-amber-300/60 ml-1">pts</span>
                </span>
              </div>
              <div>
                <span className="text-[11px] text-hpl-text-muted block">Total Purse</span>
                <span className="font-heading font-bold text-xl text-white">
                  {team.totalPurse}
                  <span className="text-xs font-normal text-slate-400 ml-1">pts</span>
                </span>
              </div>
            </div>

            {/* Squad view button */}
            <div className="flex items-center justify-between pt-2 border-t border-hpl-border">
              <span className="text-xs text-hpl-text-muted flex items-center space-x-1">
                <Users className="w-3.5 h-3.5" />
                <span>Roster ({team.roster?.length || 0} players)</span>
              </span>
              <button
                onClick={() => setRosterViewTeam(team)}
                className="text-xs font-bold text-hpl-cyan hover:underline"
              >
                View Squad &rarr;
              </button>
            </div>
          </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-hpl-surface border border-hpl-border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-hpl-border flex items-center justify-between">
              <h3 className="font-heading font-bold text-xl text-white">
                {editingTeam ? 'Edit Franchise' : 'Create New Franchise'}
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-hpl-text-muted hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {error && (
                <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Only Team Name and Team Owner Name */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-hpl-text-muted uppercase block mb-1.5 flex items-center justify-between">
                    <span>Team Name *</span>
                    {name && (
                      <span className="text-[10px] text-cyan-400 font-mono font-normal">
                        Initials:{' '}
                        {name.trim().split(/\s+/).length >= 2
                          ? name.trim().split(/\s+/).map((w) => w[0]).join('').substring(0, 4).toUpperCase()
                          : name.trim().substring(0, 3).toUpperCase()}
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aryabhatta Titans, Royal Challengers..."
                    className="w-full bg-hpl-card border border-hpl-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-hpl-cyan transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-hpl-text-muted uppercase block mb-1.5">
                    Team Owner Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    placeholder="e.g. Aniket Verma, Hostel 4 Council..."
                    className="w-full bg-hpl-card border border-hpl-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-hpl-cyan transition-colors"
                  />
                </div>
              </div>

              {/* Live Preview Card */}
              {name.trim() && (
                <div className="bg-hpl-card/60 border border-hpl-border/80 rounded-xl p-3.5 space-y-2 mt-2">
                  <span className="text-[10px] font-bold text-hpl-text-muted uppercase tracking-wider block">
                    Franchise Card Preview
                  </span>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center font-heading font-extrabold text-sm text-cyan-300">
                      {name.trim().split(/\s+/).length >= 2
                        ? name.trim().split(/\s+/).map((w) => w[0]).join('').substring(0, 3).toUpperCase()
                        : name.trim().substring(0, 3).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-bold text-sm text-white truncate">
                        {name}
                      </p>
                      <p className="text-xs text-hpl-cyan flex items-center space-x-1 truncate">
                        <User className="w-3 h-3 text-hpl-gold inline shrink-0" />
                        <span className="truncate">Owner: {owner || '(Enter owner name)'}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-hpl-text-muted block">Purse</span>
                      <span className="font-mono font-bold text-xs text-hpl-gold">100 pts</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Collapsible Advanced Options (Optional) */}
              <details className="text-xs text-hpl-text-muted pt-1 group">
                <summary className="cursor-pointer hover:text-white transition-colors py-1 flex items-center space-x-1 font-semibold">
                  <span>Advanced Settings (Custom Colors, Logo, Purse)</span>
                </summary>
                <div className="space-y-3 pt-3 mt-2 border-t border-hpl-border/50">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-hpl-text-muted uppercase block mb-1">
                        Short Code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={shortCode}
                        onChange={(e) => setShortCode(e.target.value.toUpperCase())}
                        placeholder="Auto from name"
                        className="w-full bg-hpl-card border border-hpl-border rounded-xl px-3 py-1.5 text-xs text-white font-mono uppercase focus:outline-none focus:border-hpl-cyan"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-hpl-text-muted uppercase block mb-1">
                        Total Purse (pts)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={totalPurse}
                        onChange={(e) => setTotalPurse(e.target.value)}
                        className="w-full bg-hpl-card border border-hpl-border rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-hpl-cyan"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-hpl-text-muted uppercase block mb-1">
                      Accent Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="flex-1 bg-hpl-card border border-hpl-border rounded-xl px-2.5 py-1 text-xs text-white font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>
              </details>

              <div className="pt-4 border-t border-hpl-border flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl bg-hpl-card hover:bg-slate-700 text-sm font-semibold text-hpl-text-secondary hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-hpl-cyan hover:bg-cyan-300 text-black font-heading font-bold text-sm shadow-hud disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingTeam ? 'Update Team' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Roster Viewer Modal */}
      {rosterViewTeam && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-hpl-surface border border-hpl-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-hpl-border flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={rosterViewTeam.logo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + rosterViewTeam.name}
                  alt={rosterViewTeam.name}
                  className="w-10 h-10 rounded-lg object-contain bg-black/40 p-1"
                />
                <div>
                  <h3 className="font-heading font-bold text-xl text-white">
                    {rosterViewTeam.name} Roster
                  </h3>
                  <p className="text-xs text-hpl-text-muted">
                    {rosterViewTeam.roster?.length || 0} players bought • Remaining Purse: {rosterViewTeam.remainingPurse} pts
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRosterViewTeam(null)}
                className="text-hpl-text-muted hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {!rosterViewTeam.roster || rosterViewTeam.roster.length === 0 ? (
                <div className="text-center py-10 text-hpl-text-muted text-sm italic">
                  No players purchased yet in this auction.
                </div>
              ) : (
                <div className="space-y-2">
                  {rosterViewTeam.roster.map((item, idx) => {
                    const p = item.player || {};
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-hpl-card border border-hpl-border rounded-xl"
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={p.photo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + p.name}
                            alt={p.name}
                            className="w-9 h-9 rounded-full object-cover border border-white/10"
                          />
                          <div>
                            <p className="font-heading font-bold text-base text-white">
                              {p.name || 'Unknown Player'}
                            </p>
                            <span className="text-xs text-hpl-text-muted">
                              {p.role} • {p.year} Year
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-heading font-bold text-lg text-hpl-gold">
                            {item.price} PTS
                          </span>
                          <span className="text-[10px] text-hpl-text-muted block">
                            {item.boughtAt ? new Date(item.boughtAt).toLocaleTimeString() : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmTeam && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-hpl-surface border border-red-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-white">Delete Franchise</h3>
                <p className="text-xs text-hpl-text-muted">Permanent action</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-white font-semibold">"{deleteConfirmTeam.name}"</strong>? Any assigned squad players will be released back to the unassigned pool.
            </p>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmTeam(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-hpl-card hover:bg-slate-700 text-sm font-semibold text-hpl-text-secondary hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDelete}
                disabled={deleting}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-heading font-bold text-sm shadow-lg disabled:opacity-50 flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deleting ? 'Deleting...' : 'Delete Franchise'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
