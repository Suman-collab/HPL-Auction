import { create } from 'zustand';
import { api } from '../services/api';
import { socket } from '../services/socket';
import confetti from 'canvas-confetti';

// Initialize role from URL query if present (?role=user / ?role=team / ?role=admin)
const urlParams = new URLSearchParams(window.location.search);
const initialRole = urlParams.get('role') || 'admin';

let storedAdmin = null;
try {
  storedAdmin = JSON.parse(localStorage.getItem('hpl_admin_user'));
} catch (e) {}

let storedTeam = null;
try {
  storedTeam = JSON.parse(localStorage.getItem('hpl_team_user'));
} catch (e) {}

export const useAuctionStore = create((set, get) => ({
  // Authentication State
  adminUser: storedAdmin,
  teamUser: storedTeam,

  // State
  currentRole: initialRole, // 'admin' | 'team' | 'user'
  selectedTeamViewId: storedTeam?._id || null,
  auctionState: null,
  teams: [],
  sets: [],
  players: [],
  logs: [],
  activeTab: 'live',
  isLoading: false,
  error: null,
  socketConnected: false,
  lastSoldEvent: null,

  // Authentication Actions
  loginAdmin: async (username, password) => {
    try {
      const res = await api.adminLogin(username, password);
      if (res.success) {
        localStorage.setItem('hpl_admin_user', JSON.stringify(res.user));
        set({ adminUser: res.user, error: null });
        return res;
      }
      throw new Error(res.error || 'Invalid credentials');
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  logoutAdmin: () => {
    localStorage.removeItem('hpl_admin_user');
    set({ adminUser: null });
  },

  loginTeam: async (teamId, passkey) => {
    try {
      const res = await api.teamLogin(teamId, passkey);
      if (res.success) {
        localStorage.setItem('hpl_team_user', JSON.stringify(res.team));
        set({
          teamUser: res.team,
          selectedTeamViewId: res.team._id,
          error: null,
        });
        return res;
      }
      throw new Error(res.error || 'Invalid team passkey');
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  logoutTeam: () => {
    localStorage.removeItem('hpl_team_user');
    set({ teamUser: null });
  },

  // Setters
  setCurrentRole: (role) => {
    const url = new URL(window.location.href);
    url.searchParams.set('role', role);
    window.history.replaceState({}, '', url.toString());
    set({ currentRole: role });
  },
  setSelectedTeamViewId: (id) => set({ selectedTeamViewId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setError: (err) => set({ error: err }),
  clearError: () => set({ error: null }),

  // Fetch all initial data
  fetchAllData: async () => {
    set({ isLoading: true });
    try {
      const [stateRes, teamsRes, setsRes, playersRes, logsRes] = await Promise.all([
        api.getAuctionState(),
        api.getTeams(),
        api.getSets(),
        api.getPlayers(),
        api.getAuditLogs({ limit: 50 }),
      ]);

      set({
        auctionState: stateRes.data || null,
        teams: teamsRes.data || [],
        sets: setsRes.data || [],
        players: playersRes.data || [],
        logs: logsRes.data || [],
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to load auction data:', err);
      set({ error: err.message, isLoading: false });
    }
  },

  // Setup Real-time Socket listeners
  initSocketListeners: () => {
    socket.on('connect', () => {
      set({ socketConnected: true });
    });

    socket.on('disconnect', () => {
      set({ socketConnected: false });
    });

    socket.on('auction:state', (newState) => {
      set({ auctionState: newState });
    });

    socket.on('auction:bid', ({ player, team, amount, bidHistory }) => {
      set((state) => ({
        auctionState: state.auctionState
          ? {
              ...state.auctionState,
              currentBid: amount,
              leadingTeam: team,
              bidHistory: bidHistory || state.auctionState.bidHistory,
            }
          : null,
      }));
    });

    socket.on('auction:sold', ({ player, team, price, log }) => {
      // Trigger confetti celebration!
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F5B942', '#22D3EE', '#FDE047', '#FFFFFF'],
        });
      } catch (e) {}

      set((state) => ({
        lastSoldEvent: { player, team, price, timestamp: Date.now() },
        logs: log ? [log, ...state.logs] : state.logs,
      }));

      // Refresh team and player list
      get().fetchTeams();
      get().fetchPlayers();
    });

    socket.on('auction:unsold', ({ player, log }) => {
      set((state) => ({
        logs: log ? [log, ...state.logs] : state.logs,
      }));
      get().fetchPlayers();
    });

    socket.on('auction:override', ({ player, log }) => {
      set((state) => ({
        logs: log ? [log, ...state.logs] : state.logs,
      }));
      get().fetchTeams();
      get().fetchPlayers();
    });

    socket.on('auction:undo', ({ undoneLog, undoLog }) => {
      set((state) => ({
        logs: undoLog ? [undoLog, ...state.logs] : state.logs,
      }));
      get().fetchTeams();
      get().fetchPlayers();
      get().fetchAuctionState();
    });

    socket.on('teams:update', () => {
      get().fetchTeams();
    });

    socket.on('players:update', () => {
      get().fetchPlayers();
    });

    socket.on('sets:update', () => {
      get().fetchSets();
    });

    socket.on('log:new', (log) => {
      set((state) => ({ logs: [log, ...state.logs] }));
    });
  },

  // Individual fetchers for refresh
  fetchAuctionState: async () => {
    try {
      const res = await api.getAuctionState();
      if (res.success) set({ auctionState: res.data });
    } catch (e) {
      console.error(e);
    }
  },

  fetchTeams: async () => {
    try {
      const res = await api.getTeams();
      if (res.success) set({ teams: res.data });
    } catch (e) {
      console.error(e);
    }
  },

  fetchSets: async () => {
    try {
      const res = await api.getSets();
      if (res.success) set({ sets: res.data });
    } catch (e) {
      console.error(e);
    }
  },

  fetchPlayers: async (params) => {
    try {
      const res = await api.getPlayers(params);
      if (res.success) set({ players: res.data });
    } catch (e) {
      console.error(e);
    }
  },

  fetchLogs: async (params) => {
    try {
      const res = await api.getAuditLogs(params);
      if (res.success) set({ logs: res.data });
    } catch (e) {
      console.error(e);
    }
  },

  // Action methods
  placeBid: async (teamId, amount, forceOverride = false) => {
    try {
      const res = await api.placeBid(teamId, amount, forceOverride);
      if (!res.success) {
        throw new Error(res.error || 'Failed to place bid');
      }
      return res;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  markSold: async (teamId, price) => {
    try {
      const res = await api.markSold(teamId, price);
      if (!res.success) {
        throw new Error(res.error || 'Failed to mark sold');
      }
      return res;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  markUnsold: async () => {
    try {
      const res = await api.markUnsold();
      if (!res.success) {
        throw new Error(res.error || 'Failed to mark unsold');
      }
      return res;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  nextPlayer: async () => {
    try {
      const res = await api.nextPlayer();
      if (!res.success) {
        throw new Error(res.error || 'Failed to move to next player');
      }
      return res;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  previousPlayer: async () => {
    try {
      const res = await api.previousPlayer();
      if (!res.success) {
        throw new Error(res.error || 'Failed to move to previous player');
      }
      return res;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  skipPlayer: async () => {
    try {
      const res = await api.skipPlayer();
      if (!res.success) {
        throw new Error(res.error || 'Failed to skip player');
      }
      return res;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  undoLastAction: async () => {
    try {
      const res = await api.undoLastAction();
      if (!res.success) {
        throw new Error(res.error || 'Failed to undo');
      }
      return res;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },
}));
