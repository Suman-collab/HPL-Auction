import React, { useState } from 'react';
import { useAuctionStore } from '../../store/useAuctionStore';
import {
  History,
  RotateCcw,
  Search,
  Filter,
  ArrowRight,
  Gavel,
  CheckCircle2,
  XCircle,
  Sliders,
  Layers,
  Calendar,
} from 'lucide-react';

export default function AuditLogView() {
  const { logs, undoLastAction, fetchLogs } = useAuctionStore();

  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  const actionIcons = {
    bid_placed: { icon: Gavel, color: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/40' },
    player_sold: { icon: CheckCircle2, color: 'text-amber-400 bg-amber-950/40 border-amber-500/40' },
    player_unsold: { icon: XCircle, color: 'text-rose-400 bg-rose-950/40 border-rose-500/40' },
    override_reassign: { icon: Sliders, color: 'text-purple-400 bg-purple-950/40 border-purple-500/40' },
    override_price_change: { icon: Sliders, color: 'text-purple-400 bg-purple-950/40 border-purple-500/40' },
    player_reopened: { icon: RotateCcw, color: 'text-sky-400 bg-sky-950/40 border-sky-500/40' },
    set_started: { icon: Layers, color: 'text-indigo-400 bg-indigo-950/40 border-indigo-500/40' },
    set_completed: { icon: Layers, color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/40' },
    undo: { icon: RotateCcw, color: 'text-yellow-400 bg-yellow-950/40 border-yellow-500/40' },
  };

  const filteredLogs = logs.filter((log) => {
    const matchSearch =
      !search ||
      log.details?.toLowerCase().includes(search.toLowerCase()) ||
      log.actor?.toLowerCase().includes(search.toLowerCase());
    const matchAction = filterAction === 'ALL' || log.actionType === filterAction;
    return matchSearch && matchAction;
  });

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-hpl-card border border-hpl-border rounded-2xl p-5">
        <div>
          <h2 className="font-heading text-2xl font-bold text-white flex items-center space-x-2">
            <History className="w-6 h-6 text-sky-400" />
            <span>Auction Audit Trail</span>
          </h2>
          <p className="text-sm text-hpl-text-secondary">
            Immutable log of all bidding actions, hammer falls, overrides, and administrative rollbacks.
          </p>
        </div>

        <button
          onClick={undoLastAction}
          className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-heading font-bold text-sm flex items-center justify-center space-x-2 transition-all active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Undo Last Event</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-hpl-card border border-hpl-border rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 text-hpl-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-hpl-surface border border-hpl-border rounded-xl text-xs text-white focus:outline-none focus:border-sky-400"
          />
        </div>

        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="bg-hpl-surface border border-hpl-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
        >
          <option value="ALL">All Action Types</option>
          <option value="bid_placed">Bid Placed</option>
          <option value="player_sold">Player Sold</option>
          <option value="player_unsold">Player Unsold</option>
          <option value="override_reassign">Override Reassign</option>
          <option value="override_price_change">Override Price Change</option>
          <option value="player_reopened">Player Reopened</option>
          <option value="undo">Undo Operations</option>
        </select>

        <span className="text-xs text-hpl-text-muted ml-auto font-mono">
          {filteredLogs.length} events logged
        </span>
      </div>

      {/* Timeline Stream */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="bg-hpl-card border border-hpl-border rounded-2xl p-10 text-center text-hpl-text-muted text-sm italic">
            No auction activity matching filters.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const config = actionIcons[log.actionType] || {
              icon: History,
              color: 'text-slate-400 bg-slate-800 border-slate-700',
            };
            const Icon = config.icon;

            return (
              <div
                key={log._id}
                className={`bg-hpl-card border rounded-2xl p-4 transition-all hover:border-hpl-borderHighlight flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  log.isUndone ? 'opacity-40 line-through border-dashed border-red-500/40' : 'border-hpl-border'
                }`}
              >
                {/* Left: Icon & Details */}
                <div className="flex items-start space-x-3">
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${config.color}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-white">
                        {log.actionType.replace(/_/g, ' ')}
                      </span>
                      {log.isUndone && (
                        <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.2 rounded font-bold uppercase no-underline">
                          UNDONE
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-200 mt-0.5">
                      {log.details}
                    </p>

                    {/* Diff rendering if available */}
                    {(log.oldValue || log.newValue) && (
                      <div className="flex items-center space-x-2 mt-2 text-[11px] font-mono">
                        {log.oldValue && (
                          <span className="bg-hpl-surface px-2 py-0.5 rounded border border-hpl-border text-slate-400 truncate max-w-[200px]">
                            Before: {JSON.stringify(log.oldValue)}
                          </span>
                        )}
                        {log.oldValue && log.newValue && (
                          <ArrowRight className="w-3 h-3 text-hpl-text-muted shrink-0" />
                        )}
                        {log.newValue && (
                          <span className="bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-500/30 text-cyan-300 font-bold truncate max-w-[200px]">
                            After: {JSON.stringify(log.newValue)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actor & Timestamp */}
                <div className="sm:text-right shrink-0 text-xs text-hpl-text-muted pl-12 sm:pl-0">
                  <span className="font-semibold text-slate-300 block">{log.actor || 'Admin'}</span>
                  <span className="font-mono text-[10px]">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
