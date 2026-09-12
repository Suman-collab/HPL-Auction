import React, { useState } from 'react';
import { useAuctionStore } from '../../store/useAuctionStore';
import { Shield, Lock, Mail, ArrowLeft, ShieldAlert } from 'lucide-react';

export default function TeamLoginPage() {
  const { teams, loginTeam, setCurrentRole, error, clearError } = useAuctionStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    if (!identifier.trim() || !password.trim()) return;

    setLoading(true);
    try {
      await loginTeam(identifier.trim(), password.trim());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gradient-to-br from-hpl-card via-hpl-surface to-hpl-card border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        {/* Ambient accent */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-3 shadow-lg text-black">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-white tracking-wide">
            Franchise Portal Login
          </h2>
          <p className="text-xs text-hpl-text-muted mt-1">
            Access your team command hub, track remaining purse & squad allocations.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {teams.length === 0 ? (
          <div className="text-center py-6 text-hpl-text-muted text-sm space-y-3">
            <p>No franchises have been registered in the tournament yet.</p>
            <p className="text-xs text-slate-400">
              Please log in as <strong className="text-purple-300">Admin</strong> first to create franchises and sets.
            </p>
            <button
              onClick={() => setCurrentRole('admin')}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
            >
              Go to Admin Login &rarr;
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username / Email */}
            <div>
              <label className="text-xs font-bold text-hpl-text-muted uppercase block mb-1">
                Franchise Email / Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-hpl-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. teamname@gmail.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-hpl-surface border border-hpl-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-medium transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-bold text-hpl-text-muted uppercase block mb-1">
                Franchise Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-hpl-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="e.g. teamname"
                  className="w-full pl-9 pr-3 py-2.5 bg-hpl-surface border border-hpl-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-medium transition-colors"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !identifier.trim() || !password.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-heading font-bold text-base shadow-goldGlow transition-transform active:scale-95 disabled:opacity-50 mt-2"
            >
              {loading ? 'Authenticating...' : 'Enter Franchise Portal'}
            </button>

          </form>
        )}

        {/* Info Note */}
        <div className="mt-5 p-3 rounded-xl bg-black/40 border border-white/5 text-[11px] text-hpl-text-muted text-center">
          Franchise credentials are provided by the Auction Administrator.
        </div>

        {/* Back to Viewer */}
        <button
          onClick={() => {
            clearError();
            setCurrentRole('user');
          }}
          className="mt-4 w-full flex items-center justify-center space-x-1.5 text-xs text-hpl-text-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Public Viewer</span>
        </button>
      </div>
    </div>
  );
}
