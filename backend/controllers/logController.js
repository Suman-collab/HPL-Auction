const AuctionLog = require('../models/AuctionLog');

// Get all audit logs with filters
exports.getAuditLogs = async (req, res) => {
  try {
    const { actionType, player, team, limit = 100 } = req.query;
    const query = {};

    if (actionType) query.actionType = actionType;
    if (player) query.player = player;
    if (team) query.team = team;

    const logs = await AuctionLog.find(query)
      .populate('player', 'name role year photo basePrice')
      .populate('team', 'name shortCode primaryColor')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
