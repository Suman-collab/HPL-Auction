const API_BASE = import.meta.env.DEV ? '/api' : 'https://hpl-auction.onrender.com/api';

async function smartFetch(urlOrPath, options = {}) {
  const url = urlOrPath.startsWith('http')
    ? urlOrPath
    : `${API_BASE}${urlOrPath.startsWith('/') ? '' : '/'}${urlOrPath}`;
  return fetch(url, options);
}

export const api = {
  // Authentication
  adminLogin: async (username, password) => {
    const res = await smartFetch('/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return res.json();
  },

  teamLogin: async (loginIdentifier, password) => {
    const payload =
      typeof loginIdentifier === 'object'
        ? loginIdentifier
        : String(loginIdentifier).includes('@') || !String(loginIdentifier).match(/^[0-9a-fA-F]{24}$/)
        ? { email: loginIdentifier, username: loginIdentifier, password }
        : { teamId: loginIdentifier, passkey: password, password };

    const res = await smartFetch('/auth/team-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Auction Live Control
  getAuctionState: async () => {
    const res = await smartFetch('/auction/state');
    return res.json();
  },
  startSet: async (setId, shuffle = false) => {
    const res = await smartFetch('/auction/start-set', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setId, shuffle }),
    });
    return res.json();
  },
  setCurrentPlayer: async (playerId) => {
    const res = await smartFetch('/auction/set-current-player', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId }),
    });
    return res.json();
  },
  placeBid: async (teamId, amount, forceOverride = false) => {
    const res = await smartFetch('/auction/bid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId, amount, forceOverride }),
    });
    return res.json();
  },
  markSold: async (teamId, price) => {
    const res = await smartFetch('/auction/sold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId, price }),
    });
    return res.json();
  },
  markUnsold: async () => {
    const res = await smartFetch('/auction/unsold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  },
  nextPlayer: async () => {
    const res = await smartFetch('/auction/next', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  },
  previousPlayer: async () => {
    const res = await smartFetch('/auction/previous', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  },
  skipPlayer: async () => {
    const res = await smartFetch('/auction/skip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  },
  previewOverride: async (playerId, newTeamId, newPrice, newStatus) => {
    const res = await smartFetch('/auction/preview-override', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, newTeamId, newPrice, newStatus }),
    });
    return res.json();
  },
  overridePlayer: async (playerId, newTeamId, newPrice, newStatus) => {
    const res = await smartFetch('/auction/override', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, newTeamId, newPrice, newStatus }),
    });
    return res.json();
  },
  reopenPlayer: async (playerId, targetSetId) => {
    const res = await smartFetch('/auction/reopen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, targetSetId }),
    });
    return res.json();
  },
  undoLastAction: async () => {
    const res = await smartFetch('/auction/undo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  },

  // Teams
  getTeams: async () => {
    const res = await smartFetch('/teams');
    return res.json();
  },
  createTeam: async (formData) => {
    const res = await smartFetch('/teams', {
      method: 'POST',
      body: formData,
    });
    return res.json();
  },
  updateTeam: async (id, formData) => {
    const res = await smartFetch(`/teams/${id}`, {
      method: 'PUT',
      body: formData,
    });
    return res.json();
  },
  deleteTeam: async (id) => {
    const res = await smartFetch(`/teams/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data.error || 'Failed to delete team');
    }
    return data;
  },

  // Players
  getPlayers: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await smartFetch(`/players?${query}`);
    return res.json();
  },
  createPlayer: async (formData) => {
    const res = await smartFetch('/players', {
      method: 'POST',
      body: formData,
    });
    return res.json();
  },
  updatePlayer: async (id, formData) => {
    const res = await smartFetch(`/players/${id}`, {
      method: 'PUT',
      body: formData,
    });
    return res.json();
  },
  deletePlayer: async (id) => {
    const res = await smartFetch(`/players/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },
  bulkImportCSV: async (file, setId = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (setId) formData.append('setId', setId);
    const res = await smartFetch('/players/import-csv', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Server rejected CSV import');
    }
    return data;
  },

  // Sets
  getSets: async () => {
    const res = await smartFetch('/sets');
    return res.json();
  },
  createSet: async (setData) => {
    const res = await smartFetch('/sets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(setData),
    });
    return res.json();
  },
  updateSet: async (id, setData) => {
    const res = await smartFetch(`/sets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(setData),
    });
    return res.json();
  },
  deleteSet: async (id) => {
    const res = await smartFetch(`/sets/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data.error || 'Failed to delete set');
    }
    return data;
  },
  addPlayersToSet: async (id, playerIds) => {
    const res = await smartFetch(`/sets/${id}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerIds }),
    });
    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data.error || 'Failed to add players to set');
    }
    return data;
  },
  removePlayerFromSet: async (id, playerId) => {
    const res = await smartFetch(`/sets/${id}/players/${playerId}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data.error || 'Failed to remove player from set');
    }
    return data;
  },
  createUnsoldSet: async (sourceSetId = null, customName = null) => {
    const res = await smartFetch('/sets/create-unsold-set', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceSetId, customName }),
    });
    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data.error || 'Failed to create unsold set');
    }
    return data;
  },

  // Logs
  getAuditLogs: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await smartFetch(`/logs?${query}`);
    return res.json();
  },
};
