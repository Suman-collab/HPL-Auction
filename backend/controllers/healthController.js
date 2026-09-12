const mongoose = require('mongoose');

const connectionStates = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

exports.getHealth = (req, res) => {
  const databaseState = mongoose.connection.readyState;
  const databaseConnected = databaseState === 1;

  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? 'ok' : 'degraded',
    service: 'HPL Auction API',
    database: connectionStates[databaseState] || 'unknown',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
};

// Liveness checks confirm that the API process is running. They intentionally
// stay independent of MongoDB so hosting providers do not restart an otherwise
// healthy process during a temporary database or DNS outage.
exports.getLiveness = (req, res) => {
  res.json({
    status: 'ok',
    service: 'HPL Auction API',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
};
