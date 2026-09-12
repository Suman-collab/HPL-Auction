import React, { useState, useMemo } from 'react';
import { useAuctionStore } from '../../store/useAuctionStore';
import { api } from '../../services/api';
import { getBasePriceForYear } from '../../utils/economy';
import Papa from 'papaparse';
import {
  Users,
  Search,
  Plus,
  Upload,
  FileSpreadsheet,
  Edit2,
  Trash2,
  Filter,
  X,
  Check,
  Award,
  AlertCircle,
  Download,
} from 'lucide-react';

export default function PlayerManagement() {
  const { players, sets, teams, fetchPlayers } = useAuctionStore();

  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterYear, setFilterYear] = useState('ALL');
  const [filterSet, setFilterSet] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Sheet State (Side sheet on desktop, bottom sheet on mobile)
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  // Player Form Fields
  const [name, setName] = useState('');
  const [role, setRole] = useState('All-rounder');
  const [year, setYear] = useState('1st');
  const [basePrice, setBasePrice] = useState(1);
  const [setId, setSetId] = useState('');
  const [hostel, setHostel] = useState('');
  const [block, setBlock] = useState('');
  const [room, setRoom] = useState('');
  const [battingStyle, setBattingStyle] = useState('Right Hand Bat');
  const [bowlingStyle, setBowlingStyle] = useState('Right Arm Medium');
  const [matches, setMatches] = useState(0);
  const [runs, setRuns] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [strikeRate, setStrikeRate] = useState(0);
  const [economy, setEconomy] = useState(0);
  const [specialSkill, setSpecialSkill] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvTargetSetId, setCsvTargetSetId] = useState('');
  const [parsedPreview, setParsedPreview] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [importMode, setImportMode] = useState('file'); // 'file' | 'paste'
  const [csvRawText, setCsvRawText] = useState('');

  // Auto derive base price on year change if not manually edited
  const handleYearChange = (newYear) => {
    setYear(newYear);
    setBasePrice(getBasePriceForYear(newYear));
  };

  const openCreateSheet = () => {
    setEditingPlayer(null);
    setName('');
    setRole('All-rounder');
    setYear('1st');
    setBasePrice(1);
    setSetId(sets[0]?._id || '');
    setHostel('');
    setBlock('');
    setRoom('');
    setBattingStyle('Right Hand Bat');
    setBowlingStyle('Right Arm Medium');
    setMatches(0);
    setRuns(0);
    setWickets(0);
    setStrikeRate(0);
    setEconomy(0);
    setSpecialSkill('');
    setPhotoFile(null);
    setPhotoPreview('');
    setIsSheetOpen(true);
  };

  const openEditSheet = (player) => {
    setEditingPlayer(player);
    setName(player.name);
    setRole(player.role);
    setYear(player.year);
    setBasePrice(player.basePrice);
    setSetId(player.set?._id || player.set || '');
    const s = player.stats || {};
    setHostel(s.hostel || '');
    setBlock(s.block || '');
    setRoom(s.room || '');
    setBattingStyle(s.battingStyle || 'Right Hand Bat');
    setBowlingStyle(s.bowlingStyle || 'Right Arm Medium');
    setMatches(s.matches || 0);
    setRuns(s.runs || 0);
    setWickets(s.wickets || 0);
    setStrikeRate(s.strikeRate || 0);
    setEconomy(s.economy || 0);
    setSpecialSkill(s.specialSkill || '');
    setPhotoFile(null);
    setPhotoPreview(player.photo || '');
    setIsSheetOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('role', role);
    formData.append('year', year);
    formData.append('basePrice', basePrice);
    if (setId) formData.append('set', setId);
    formData.append(
      'stats',
      JSON.stringify({
        hostel,
        block,
        room,
        battingStyle,
        bowlingStyle,
        matches: Number(matches),
        runs: Number(runs),
        wickets: Number(wickets),
        strikeRate: Number(strikeRate),
        economy: Number(economy),
        specialSkill,
      })
    );

    if (photoFile) {
      formData.append('photo', photoFile);
    } else if (photoPreview && !photoPreview.startsWith('blob:')) {
      formData.append('photo', photoPreview);
    }

    try {
      if (editingPlayer) {
        await api.updatePlayer(editingPlayer._id, formData);
      } else {
        await api.createPlayer(formData);
      }
      setIsSheetOpen(false);
      fetchPlayers();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete player "${name}"?`)) return;
    try {
      await api.deletePlayer(id);
      fetchPlayers();
    } catch (err) {
      alert(err.message);
    }
  };

  const parseCsvContent = (input) => {
    Papa.parse(input, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.replace(/^\uFEFF/, '').trim().toLowerCase(),
      complete: (results) => {
        const rows = results.data || [];
        const normalized = rows
          .map((row) => {
            // Check normalized lowercase keys
            const name =
              row.name ||
              row.playername ||
              row.player_name ||
              row['player name'] ||
              Object.values(row)[0] ||
              '';
            const rawYear =
              row.year ||
              row.collegeyear ||
              row.college_year ||
              row['college year'] ||
              Object.values(row)[1] ||
              '1st';

            const str = String(rawYear).toLowerCase().trim();
            let year = '1st';
            if (str.includes('4') || str.includes('fourth')) year = '4th';
            else if (str.includes('3') || str.includes('third')) year = '3rd';
            else if (str.includes('2') || str.includes('second')) year = '2nd';

            const basePrice = getBasePriceForYear(year);
            return {
              name: String(name).trim().replace(/^["']|["']$/g, ''),
              year,
              basePrice,
              role: row.role || 'All-rounder',
            };
          })
          .filter((p) => p.name && p.name.length > 0);

        setParsedPreview(normalized);
      },
      error: (err) => {
        alert('Could not parse CSV: ' + err.message);
      },
    });
  };

  const handleFilePick = (file) => {
    if (!file) return;
    setCsvFile(file);
    parseCsvContent(file);
  };

  const handlePasteChange = (text) => {
    setCsvRawText(text);
    if (!text.trim()) {
      setParsedPreview([]);
      setCsvFile(null);
      return;
    }
    // Create a virtual file from the pasted string
    const blob = new Blob([text], { type: 'text/csv' });
    const virtualFile = new File([blob], 'pasted_players.csv', { type: 'text/csv' });
    setCsvFile(virtualFile);
    parseCsvContent(text);
  };

  const loadSamplePlayers = () => {
    const sampleCsv = `name,year
Aarav Sharma,1st
Ishaan Patel,2nd
Rohan Gupta,3rd
Vikramaditya Verma,4th
Dhruv Kapoor,1st
Ayush Rawat,2nd
Karthik Iyer,3rd
Hardik Oberoi,4th`;
    handlePasteChange(sampleCsv);
    setImportMode('file');
  };

  const downloadTemplate = () => {
    const csvContent = 'name,year\nAarav Sharma,1st\nIshaan Patel,2nd\nRohan Gupta,3rd\nVikramaditya Verma,4th';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'hpl_players_name_year_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCsvImport = async (e) => {
    e.preventDefault();
    if (!csvFile && parsedPreview.length === 0) {
      alert('Please choose or paste a CSV with name and year columns.');
      return;
    }
    setCsvUploading(true);
    try {
      let count = 0;
      let usedServerMultipart = false;

      // 1. Try backend multipart endpoint first if a file is present
      if (csvFile) {
        try {
          const res = await api.bulkImportCSV(csvFile, csvTargetSetId || null);
          if (res && res.success) {
            usedServerMultipart = true;
            count = res.count || parsedPreview.length;
          }
        } catch (serverErr) {
          console.warn('[CSV Import] Multipart endpoint failed, switching to client creation fallback:', serverErr);
        }
      }

      // 2. Client fallback: if server multipart didn't succeed, create individual player records
      if (!usedServerMultipart && parsedPreview.length > 0) {
        for (const p of parsedPreview) {
          const fd = new FormData();
          fd.append('name', p.name);
          fd.append('year', p.year);
          fd.append('role', p.role || 'All-rounder');
          fd.append('basePrice', p.basePrice);
          if (csvTargetSetId) fd.append('set', csvTargetSetId);
          await api.createPlayer(fd);
          count++;
        }
      }

      setIsCsvModalOpen(false);
      setCsvFile(null);
      setParsedPreview([]);
      setCsvRawText('');
      await fetchPlayers();
      alert(`Bulk CSV import completed successfully! ${count} players imported with base prices calculated from college years.`);
    } catch (err) {
      console.error('[CSV Import Error]', err);
      alert('Import failed: ' + (err.message || 'Unknown network error'));
    } finally {
      setCsvUploading(false);
    }
  };

  // Filtered Players
  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      const matchSearch =
        !search || p.name.toLowerCase().includes(search.toLowerCase());
      const matchRole = filterRole === 'ALL' || p.role === filterRole;
      const matchYear = filterYear === 'ALL' || p.year === filterYear;
      const matchSet =
        filterSet === 'ALL' ||
        String(p.set?._id || p.set) === String(filterSet);
      const matchStatus = filterStatus === 'ALL' || p.status === filterStatus;
      return matchSearch && matchRole && matchYear && matchSet && matchStatus;
    });
  }, [players, search, filterRole, filterYear, filterSet, filterStatus]);

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
    <div className="space-y-5 pb-20 md:pb-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-hpl-card border border-hpl-border rounded-2xl p-5">
        <div>
          <h2 className="font-heading text-2xl font-bold text-white flex items-center space-x-2">
            <Users className="w-6 h-6 text-emerald-400" />
            <span>Player Registry</span>
          </h2>
          <p className="text-sm text-hpl-text-secondary">
            Manage player rosters, year tiers, base prices, and bulk CSV uploads.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-hpl-surface hover:bg-slate-700 border border-hpl-border text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Bulk CSV Import</span>
          </button>

          <button
            onClick={openCreateSheet}
            className="px-4 py-2.5 rounded-xl bg-hpl-cyan hover:bg-cyan-300 text-black font-heading font-bold text-sm flex items-center space-x-2 shadow-hud transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Player</span>
          </button>
        </div>
      </div>

      {/* Filters Strip */}
      <div className="bg-hpl-card/80 border border-hpl-border rounded-2xl p-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-hpl-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by player name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-hpl-surface border border-hpl-border rounded-xl text-xs text-white focus:outline-none focus:border-hpl-cyan"
          />
        </div>

        {/* Role Filter */}
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="bg-hpl-surface border border-hpl-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-hpl-cyan"
        >
          <option value="ALL">All Roles</option>
          <option value="Batter">Batter</option>
          <option value="Bowler">Bowler</option>
          <option value="All-rounder">All-rounder</option>
          <option value="Wicket-keeper">Wicket-keeper</option>
        </select>

        {/* Year Filter */}
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          className="bg-hpl-surface border border-hpl-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-hpl-cyan"
        >
          <option value="ALL">All College Years</option>
          <option value="1st">1st Year (1 pt)</option>
          <option value="2nd">2nd Year (1 pt)</option>
          <option value="3rd">3rd Year (2 pts)</option>
          <option value="4th">4th Year (2 pts)</option>
        </select>

        {/* Set Filter */}
        <select
          value={filterSet}
          onChange={(e) => setFilterSet(e.target.value)}
          className="bg-hpl-surface border border-hpl-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-hpl-cyan"
        >
          <option value="ALL">All Sets</option>
          {sets.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-hpl-surface border border-hpl-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-hpl-cyan"
        >
          <option value="ALL">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress (Live)</option>
          <option value="sold">Sold</option>
          <option value="unsold">Unsold</option>
        </select>

        <span className="text-xs text-hpl-text-muted ml-auto">
          {filteredPlayers.length} of {players.length} players
        </span>
      </div>

      {/* Players Table (Desktop) & Cards (Mobile) */}
      <div className="bg-hpl-card border border-hpl-border rounded-2xl overflow-hidden shadow-md">
        {/* Desktop View Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-hpl-surface/80 border-b border-hpl-border text-hpl-text-muted font-heading uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Photo</th>
                <th className="py-3 px-4">Player Name</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">College Year</th>
                <th className="py-3 px-4">Base Price</th>
                <th className="py-3 px-4">Auction Set</th>
                <th className="py-3 px-4">Status / Sold To</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hpl-border/50 font-manrope">
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-hpl-text-muted">
                    <Users className="w-10 h-10 text-cyan-400 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-semibold text-white">No players in registry yet</p>
                    <p className="text-xs text-hpl-text-muted mt-0.5">Click "+ Add Player" or "Bulk CSV Import" to register players.</p>
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((player) => {
                  const setName = player.set?.name || 'Unassigned';
                  const isSold = player.status === 'sold';
                  const soldTeamName = player.soldTo?.name || 'Team';

                  return (
                    <tr
                    key={player._id}
                    onClick={() => openEditSheet(player)}
                    className="hover:bg-hpl-surface/50 cursor-pointer transition-colors group"
                  >
                    {/* Photo */}
                    <td className="py-2.5 px-4">
                      <img
                        src={player.photo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + player.name}
                        alt={player.name}
                        className="w-10 h-10 rounded-full object-cover border border-white/10"
                      />
                    </td>

                    {/* Name & Hostel */}
                    <td className="py-2.5 px-4 font-semibold text-white">
                      <span className="text-sm font-heading font-bold block group-hover:text-hpl-cyan transition-colors">
                        {player.name}
                      </span>
                      <span className="text-[10px] text-hpl-text-muted">
                        {player.stats?.hostel || 'Hostel N/A'}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          roleColors[player.role] || roleColors['All-rounder']
                        }`}
                      >
                        {player.role}
                      </span>
                    </td>

                    {/* Year */}
                    <td className="py-2.5 px-4">
                      <span className="font-heading font-bold text-xs text-white">
                        {player.year} Year
                      </span>
                    </td>

                    {/* Base Price */}
                    <td className="py-2.5 px-4 font-mono font-bold text-hpl-gold text-sm">
                      {player.basePrice} pt
                    </td>

                    {/* Set */}
                    <td className="py-2.5 px-4 text-hpl-text-secondary truncate max-w-[140px]">
                      {setName}
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-4">
                      <div className="flex flex-col items-start gap-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                            statusColors[player.status] || statusColors.pending
                          }`}
                        >
                          {player.status}
                        </span>
                        {isSold && (
                          <span className="text-[10px] text-amber-300 font-medium">
                            {soldTeamName} ({player.soldPrice} pt)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => openEditSheet(player)}
                          className="p-1.5 rounded-lg hover:bg-slate-700 text-hpl-text-muted hover:text-white"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(player._id, player.name)}
                          className="p-1.5 rounded-lg hover:bg-red-950/50 text-hpl-text-muted hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Stacked Card Pattern */}
        <div className="md:hidden divide-y divide-hpl-border">
          {filteredPlayers.length === 0 ? (
            <div className="p-8 text-center text-hpl-text-muted">
              <Users className="w-8 h-8 text-cyan-400 mx-auto mb-2 opacity-40" />
              <p className="text-xs font-semibold text-white">No players registered yet</p>
              <p className="text-[11px] text-hpl-text-muted mt-0.5">Use Bulk CSV Import or Add Player.</p>
            </div>
          ) : (
            filteredPlayers.map((player) => (
            <div
              key={player._id}
              onClick={() => openEditSheet(player)}
              className="p-3.5 flex items-center space-x-3 active:bg-hpl-surface transition-colors"
            >
              <img
                src={player.photo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + player.name}
                alt={player.name}
                className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/10"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading font-bold text-sm text-white truncate">
                    {player.name}
                  </h4>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold border ${
                      statusColors[player.status] || statusColors.pending
                    }`}
                  >
                    {player.status}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-hpl-text-muted mt-0.5">
                  <span className="text-hpl-cyan font-semibold">{player.role}</span>
                  <span>•</span>
                  <span>{player.year} Year</span>
                  <span>•</span>
                  <span className="text-hpl-gold font-bold font-mono">
                    {player.basePrice} pt
                  </span>
                </div>
              </div>
            </div>
          ))
          )}
        </div>
      </div>

      {/* Slide-out Edit Sheet (Desktop Right Side / Mobile Bottom Sheet) */}
      {isSheetOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end">
          <div className="bg-hpl-surface border-l border-hpl-border w-full sm:w-[480px] lg:w-[540px] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Sheet Header */}
            <div className="px-6 py-4 border-b border-hpl-border flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-xl text-white">
                  {editingPlayer ? 'Edit Player' : 'Register New Player'}
                </h3>
                <p className="text-xs text-hpl-text-muted">
                  Year tier automatically sets starting base price.
                </p>
              </div>
              <button
                onClick={() => setIsSheetOpen(false)}
                className="text-hpl-text-muted hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Photo preview and upload */}
              <div className="flex items-center space-x-4 pb-2">
                <div className="relative aspect-[4/5] w-20 rounded-xl overflow-hidden border border-hpl-border bg-hpl-card shrink-0">
                  <img
                    src={photoPreview || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + (name || 'New')}
                    alt="Player preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <label className="flex-1 cursor-pointer flex flex-col items-center justify-center p-3 bg-hpl-card hover:bg-slate-800 border border-dashed border-hpl-border rounded-xl text-xs text-hpl-text-secondary transition-colors">
                  <Upload className="w-4 h-4 text-hpl-cyan mb-1" />
                  <span>Upload Player Photo (4:5 Portrait)</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setPhotoFile(file);
                        setPhotoPreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </label>
              </div>

              {/* Name */}
              <div>
                <label className="text-xs font-bold text-hpl-text-muted uppercase block mb-1">
                  Player Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Vikramaditya Chawla"
                  className="w-full bg-hpl-card border border-hpl-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-hpl-cyan"
                />
              </div>

              {/* Role & Year Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-hpl-text-muted uppercase block mb-1">
                    Role *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-hpl-card border border-hpl-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-hpl-cyan"
                  >
                    <option value="Batter">Batter</option>
                    <option value="Bowler">Bowler</option>
                    <option value="All-rounder">All-rounder</option>
                    <option value="Wicket-keeper">Wicket-keeper</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-hpl-text-muted uppercase block mb-1">
                    College Year *
                  </label>
                  <select
                    value={year}
                    onChange={(e) => handleYearChange(e.target.value)}
                    className="w-full bg-hpl-card border border-hpl-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-hpl-cyan"
                  >
                    <option value="1st">1st Year (Default 1 pt)</option>
                    <option value="2nd">2nd Year (Default 1 pt)</option>
                    <option value="3rd">3rd Year (Default 2 pts)</option>
                    <option value="4th">4th Year (Default 2 pts)</option>
                  </select>
                </div>
              </div>

              {/* Base Price & Set Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-hpl-gold uppercase block mb-1">
                    Base Price (Editable Override)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="w-full bg-hpl-card border border-amber-500/40 rounded-xl px-3 py-2 text-sm text-hpl-gold font-mono font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-hpl-text-muted uppercase block mb-1">
                    Auction Set
                  </label>
                  <select
                    value={setId}
                    onChange={(e) => setSetId(e.target.value)}
                    className="w-full bg-hpl-card border border-hpl-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-hpl-cyan"
                  >
                    <option value="">Unassigned Pool</option>
                    {sets.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Hostel / Block / Room */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] text-hpl-text-muted uppercase block mb-1">Hostel</label>
                  <input
                    type="text"
                    value={hostel}
                    onChange={(e) => setHostel(e.target.value)}
                    placeholder="e.g. Aryabhatta"
                    className="w-full bg-hpl-card border border-hpl-border rounded-xl px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-hpl-text-muted uppercase block mb-1">Block</label>
                  <input
                    type="text"
                    value={block}
                    onChange={(e) => setBlock(e.target.value)}
                    placeholder="e.g. B"
                    className="w-full bg-hpl-card border border-hpl-border rounded-xl px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-hpl-text-muted uppercase block mb-1">Room</label>
                  <input
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="e.g. 302"
                    className="w-full bg-hpl-card border border-hpl-border rounded-xl px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              {/* Batting and Bowling Styles */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-hpl-text-muted uppercase block mb-1">Batting Style</label>
                  <input
                    type="text"
                    value={battingStyle}
                    onChange={(e) => setBattingStyle(e.target.value)}
                    placeholder="Right Hand Bat"
                    className="w-full bg-hpl-card border border-hpl-border rounded-xl px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-hpl-text-muted uppercase block mb-1">Bowling Style</label>
                  <input
                    type="text"
                    value={bowlingStyle}
                    onChange={(e) => setBowlingStyle(e.target.value)}
                    placeholder="Right Arm Fast"
                    className="w-full bg-hpl-card border border-hpl-border rounded-xl px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              {/* Special Skill Callout */}
              <div>
                <label className="text-[11px] text-hpl-text-muted uppercase block mb-1">
                  Special Skill / Signature Shot
                </label>
                <input
                  type="text"
                  value={specialSkill}
                  onChange={(e) => setSpecialSkill(e.target.value)}
                  placeholder="e.g. Death-over yorker specialist"
                  className="w-full bg-hpl-card border border-hpl-border rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              {/* Numeric Stats */}
              <div className="grid grid-cols-5 gap-2 pt-2 border-t border-hpl-border">
                <div>
                  <label className="text-[10px] text-hpl-text-muted block text-center">Matches</label>
                  <input
                    type="number"
                    value={matches}
                    onChange={(e) => setMatches(e.target.value)}
                    className="w-full bg-hpl-card border border-hpl-border rounded-lg p-1 text-center text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-hpl-text-muted block text-center">Runs</label>
                  <input
                    type="number"
                    value={runs}
                    onChange={(e) => setRuns(e.target.value)}
                    className="w-full bg-hpl-card border border-hpl-border rounded-lg p-1 text-center text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-hpl-text-muted block text-center">Wickets</label>
                  <input
                    type="number"
                    value={wickets}
                    onChange={(e) => setWickets(e.target.value)}
                    className="w-full bg-hpl-card border border-hpl-border rounded-lg p-1 text-center text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-hpl-text-muted block text-center">S/R</label>
                  <input
                    type="number"
                    step="0.1"
                    value={strikeRate}
                    onChange={(e) => setStrikeRate(e.target.value)}
                    className="w-full bg-hpl-card border border-hpl-border rounded-lg p-1 text-center text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-hpl-text-muted block text-center">Econ</label>
                  <input
                    type="number"
                    step="0.1"
                    value={economy}
                    onChange={(e) => setEconomy(e.target.value)}
                    className="w-full bg-hpl-card border border-hpl-border rounded-lg p-1 text-center text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-hpl-border flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsSheetOpen(false)}
                  className="px-4 py-2 rounded-xl bg-hpl-card hover:bg-slate-700 text-sm font-semibold text-hpl-text-secondary hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-hpl-cyan hover:bg-cyan-300 text-black font-heading font-bold text-sm shadow-hud disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingPlayer ? 'Update Player' : 'Register Player'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Bulk Import Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-hpl-surface border border-hpl-border rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-hpl-border mb-4">
              <h3 className="font-heading font-bold text-xl text-white flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <span>Bulk Import Players (CSV)</span>
              </h3>
              <button
                onClick={() => setIsCsvModalOpen(false)}
                className="text-hpl-text-muted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCsvImport} className="space-y-4">
              {/* Header explanation */}
              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-200 flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-white mb-0.5">Minimal CSV Supported</p>
                  <p className="text-[11px] text-emerald-300/80 leading-relaxed">
                    Only <code className="bg-black/40 px-1 py-0.5 rounded text-cyan-300 font-mono">name</code> and <code className="bg-black/40 px-1 py-0.5 rounded text-cyan-300 font-mono">year</code> headers are required! Base prices are automatically calculated (1st/2nd $\rightarrow$ 1 pt, 3rd/4th $\rightarrow$ 2 pts).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="shrink-0 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-[11px] text-emerald-300 font-bold flex items-center space-x-1 transition-colors"
                  title="Download sample CSV template with name and year columns"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Template</span>
                </button>
              </div>

              {/* Target Set Selector */}
              <div>
                <label className="text-xs font-bold text-hpl-text-muted uppercase block mb-1">
                  Assign Imported Players To Auction Set (Optional)
                </label>
                <select
                  value={csvTargetSetId}
                  onChange={(e) => setCsvTargetSetId(e.target.value)}
                  className="w-full bg-hpl-card border border-hpl-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-hpl-cyan"
                >
                  <option value="">-- Unassigned Pool (Assign Later) --</option>
                  {sets.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Import Mode Tabs */}
              <div className="flex items-center space-x-2 border-b border-hpl-border/60 pb-2">
                <button
                  type="button"
                  onClick={() => setImportMode('file')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    importMode === 'file'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-hpl-text-muted hover:text-white'
                  }`}
                >
                  Upload / Drag File
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('paste')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    importMode === 'paste'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-hpl-text-muted hover:text-white'
                  }`}
                >
                  Paste CSV Text
                </button>
                <div className="flex-1 text-right">
                  <button
                    type="button"
                    onClick={loadSamplePlayers}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2"
                    title="Load 8 sample players with 1st, 2nd, 3rd, and 4th years"
                  >
                    + Load 8 Sample Players
                  </button>
                </div>
              </div>

              {/* Drag and Drop Box or Paste Box */}
              {importMode === 'file' ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFilePick(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-colors bg-hpl-card/50 ${
                    isDragging
                      ? 'border-emerald-400 bg-emerald-950/20'
                      : 'border-hpl-border hover:border-hpl-cyan'
                  }`}
                >
                  <input
                    type="file"
                    accept=".csv,text/csv,text/plain"
                    id="csvFileInput"
                    className="hidden"
                    onClick={(e) => {
                      e.target.value = null;
                    }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFilePick(e.target.files[0]);
                      }
                    }}
                  />
                  <label htmlFor="csvFileInput" className="cursor-pointer block">
                    <FileSpreadsheet className="w-9 h-9 text-emerald-400 mx-auto mb-1.5" />
                    <span className="text-sm font-semibold text-white block">
                      {csvFile ? csvFile.name : 'Click to choose file or drag & drop here'}
                    </span>
                    <span className="text-[11px] text-hpl-text-muted mt-0.5 block">
                      Supported: .csv with <strong className="text-slate-300">name,year</strong> columns
                    </span>
                  </label>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <textarea
                    rows={4}
                    value={csvRawText}
                    onChange={(e) => handlePasteChange(e.target.value)}
                    placeholder="name,year&#10;Aarav Sharma,1st&#10;Ishaan Patel,2nd&#10;Rohan Gupta,3rd&#10;Vikramaditya Verma,4th"
                    className="w-full bg-hpl-card border border-hpl-border rounded-xl p-3 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-hpl-cyan"
                  />
                  <div className="flex items-center justify-between text-[11px] text-hpl-text-muted">
                    <span>Paste raw comma-separated lines above</span>
                    <button
                      type="button"
                      onClick={loadSamplePlayers}
                      className="text-cyan-400 hover:underline"
                    >
                      Fill sample
                    </button>
                  </div>
                </div>
              )}

              {/* Parsed Preview Table if file loaded */}
              {parsedPreview.length > 0 && (
                <div className="bg-hpl-card border border-hpl-border rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">
                      Detected {parsedPreview.length} Players in CSV:
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">
                      ✓ Valid Format
                    </span>
                  </div>

                  <div className="max-h-36 overflow-y-auto divide-y divide-hpl-border/50 text-xs">
                    {parsedPreview.slice(0, 5).map((row, idx) => (
                      <div key={idx} className="py-1.5 flex items-center justify-between">
                        <span className="font-semibold text-white truncate max-w-[180px]">
                          {row.name}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] text-hpl-text-muted">
                            {row.year} Year
                          </span>
                          <span className="font-mono font-bold text-hpl-gold text-xs">
                            {row.basePrice} pt
                          </span>
                        </div>
                      </div>
                    ))}
                    {parsedPreview.length > 5 && (
                      <div className="pt-1.5 text-center text-[10px] text-hpl-text-muted italic">
                        + {parsedPreview.length - 5} more players ready to import
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCsvModalOpen(false);
                    setCsvFile(null);
                    setParsedPreview([]);
                  }}
                  className="px-4 py-2 rounded-xl bg-hpl-card text-xs font-semibold text-hpl-text-secondary hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={(!csvFile && parsedPreview.length === 0) || csvUploading}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-heading font-bold text-sm shadow-md disabled:opacity-50"
                >
                  {csvUploading
                    ? 'Importing...'
                    : parsedPreview.length > 0
                    ? `Import ${parsedPreview.length} Players`
                    : 'Import Players'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
