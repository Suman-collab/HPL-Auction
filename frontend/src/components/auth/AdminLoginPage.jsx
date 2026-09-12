import React, { useState } from 'react';
import { useAuctionStore } from '../../store/useAuctionStore';
import { Zap, Lock, User, ShieldAlert, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function AdminLoginPage() {
  const { loginAdmin, setCurrentRole, error, clearError } = useAuctionStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setLoading(true);
    try {
      await loginAdmin(username, password);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gradient-to-br from-hpl-card via-hpl-surface to-hpl-card border border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        {/* Glow ambient accent */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-lg text-white">
            <Zap className="w-7 h-7" />
          </div>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-white tracking-wide">
            Admin Authentication
          </h2>
          <p className="text-xs text-hpl-text-muted mt-1">
            Super-Admin credentials required for live auction controls.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-hpl-text-muted uppercase block mb-1">
              Admin Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-hpl-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username..."
                className="w-full pl-9 pr-3 py-2.5 bg-hpl-surface border border-hpl-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 font-medium transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-hpl-text-muted uppercase block mb-1">
              Password / Passkey
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-hpl-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full pl-9 pr-3 py-2.5 bg-hpl-surface border border-hpl-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 font-medium transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !username.trim() || !password.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-heading font-bold text-base shadow-lg transition-transform active:scale-95 disabled:opacity-50 mt-2"
          >
            {loading ? 'Authenticating...' : 'Unlock Admin Command Center'}
          </button>
        </form>

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
