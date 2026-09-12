const AuctionSet = require('../models/AuctionSet');
const Player = require('../models/Player');
const AuctionState = require('../models/AuctionState');
const { emitEvent } = require('../socket');

// Get all sets
exports.getSets = async (req, res) => {
  try {
    const sets = await AuctionSet.find()
      .populate({
        path: 'players',
        populate: { path: 'soldTo', select: 'name shortCode primaryColor' },
      })
      .sort({ order: 1 });
    res.json({ success: true, count: sets.length, data: sets });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get single set
exports.getSetById = async (req, res) => {
  try {
    const set = await AuctionSet.findById(req.params.id).populate('players');
    if (!set) {
      return res.status(404).json({ success: false, error: 'Auction Set not found' });
    }
    res.json({ success: true, data: set });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create set
exports.createSet = async (req, res) => {
  try {
    const { name, order, description } = req.body;
    const maxOrder = await AuctionSet.findOne().sort({ order: -1 });
    const calculatedOrder = order || (maxOrder ? maxOrder.order + 1 : 1);

    const set = await AuctionSet.create({
      name,
      order: calculatedOrder,
      description: description || '',
      players: [],
    });

    emitEvent('sets:update', { action: 'create', set });
    res.status(201).json({ success: true, data: set });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Update set
exports.updateSet = async (req, res) => {
  try {
    const { name, order, description, status } = req.body;
    const set = await AuctionSet.findById(req.params.id);
    if (!set) {
      return res.status(404).json({ success: false, error: 'Auction Set not found' });
    }

    if (name) set.name = name;
    if (order !== undefined) set.order = order;
    if (description !== undefined) set.description = description;
    if (status) set.status = status;

    await set.save();
    emitEvent('sets:update', { action: 'update', set });
    res.json({ success: true, data: set });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Delete set
exports.deleteSet = async (req, res) => {
  try {
    const set = await AuctionSet.findById(req.params.id);
    if (!set) {
      return res.status(404).json({ success: false, error: 'Auction Set not found' });
    }

    // Unassign all players from this set
    await Player.updateMany({ set: set._id }, { $set: { set: null } });

    // Clear activeSet in AuctionState if this was the active set
    await AuctionState.updateMany({ activeSet: set._id }, { $set: { activeSet: null } });

    await AuctionSet.findByIdAndDelete(req.params.id);

    emitEvent('sets:update', { action: 'delete', setId: req.params.id });
    emitEvent('players:update', { action: 'set_cleared' });
    const freshState = await AuctionState.findOne();
    if (freshState) emitEvent('auction:state', freshState);

    res.json({ success: true, message: 'Set deleted and players unassigned' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add players to a set
exports.addPlayersToSet = async (req, res) => {
  try {
    const { playerIds } = req.body;
    if (!playerIds || !Array.isArray(playerIds) || playerIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Please provide an array of playerIds' });
    }

    const set = await AuctionSet.findById(req.params.id);
    if (!set) {
      return res.status(404).json({ success: false, error: 'Auction Set not found' });
    }

    const currentSetIds = new Set((set.players || []).map((p) => p.toString()));
    for (const pid of playerIds) {
      currentSetIds.add(pid.toString());
    }
    set.players = Array.from(currentSetIds);
    await set.save();

    await Player.updateMany(
      { _id: { $in: playerIds } },
      { $set: { set: set._id } }
    );

    emitEvent('sets:update', { action: 'add_players', setId: set._id });
    emitEvent('players:update', { action: 'set_assigned' });

    const updated = await AuctionSet.findById(set._id).populate('players');
    res.json({ success: true, count: playerIds.length, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Remove a single player from a set
exports.removePlayerFromSet = async (req, res) => {
  try {
    const { id, playerId } = req.params;
    const set = await AuctionSet.findById(id);
    if (!set) {
      return res.status(404).json({ success: false, error: 'Auction Set not found' });
    }

    set.players = (set.players || []).filter((p) => p.toString() !== playerId.toString());
    await set.save();

    await Player.findByIdAndUpdate(playerId, { $set: { set: null } });

    emitEvent('sets:update', { action: 'remove_player', setId: id, playerId });
    emitEvent('players:update', { action: 'set_unassigned', playerId });

    res.json({ success: true, message: 'Player removed from set' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Reorder players in a set
exports.reorderPlayers = async (req, res) => {
  try {
    const { playerIds } = req.body; // Array of player IDs in desired order
    const set = await AuctionSet.findById(req.params.id);
    if (!set) {
      return res.status(404).json({ success: false, error: 'Auction Set not found' });
    }

    set.players = playerIds;
    await set.save();

    // Also update auctionOrder on players
    for (let i = 0; i < playerIds.length; i++) {
      await Player.findByIdAndUpdate(playerIds[i], { auctionOrder: i + 1 });
    }

    emitEvent('sets:update', { action: 'reorder', set });
    res.json({ success: true, data: set });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create a new set for unsold players according to the set name
exports.createUnsoldSet = async (req, res) => {
  try {
    const { sourceSetId, customName } = req.body;
    let unsoldPlayers = [];
    let setName = customName;

    if (sourceSetId) {
      const sourceSet = await AuctionSet.findById(sourceSetId).populate('players');
      if (!sourceSet) {
        return res.status(404).json({ success: false, error: 'Source set not found' });
      }
      unsoldPlayers = (sourceSet.players || []).filter((p) => p.status === 'unsold');
      if (!setName) {
        setName = `${sourceSet.name} - Unsold Re-Auction`;
      }
    } else {
      // Find all unsold players across all sets
      unsoldPlayers = await Player.find({ status: 'unsold' });
      if (!setName) {
        setName = 'Accelerated Round: Unsold Players';
      }
    }

    if (unsoldPlayers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No unsold players found to create an unsold set.',
      });
    }

    const maxOrder = await AuctionSet.findOne().sort({ order: -1 });
    const calculatedOrder = maxOrder ? maxOrder.order + 1 : 1;

    const unsoldPlayerIds = unsoldPlayers.map((p) => p._id);

    const newSet = await AuctionSet.create({
      name: setName,
      order: calculatedOrder,
      description: `Re-auction round for unsold players from ${setName}`,
      players: unsoldPlayerIds,
      status: 'upcoming',
      isUnsoldSet: false,
    });

    // Reset status of these players to pending and assign them to the new set
    await Player.updateMany(
      { _id: { $in: unsoldPlayerIds } },
      { $set: { set: newSet._id, status: 'pending' } }
    );

    // Remove players from every previous set, including the automatic
    // Unsold Players holding set when a tournament-wide re-auction is created.
    await AuctionSet.updateMany(
      { _id: { $ne: newSet._id }, players: { $in: unsoldPlayerIds } },
      { $pull: { players: { $in: unsoldPlayerIds } } }
    );

    emitEvent('sets:update', { action: 'create_unsold_set', set: newSet });
    emitEvent('players:update', { action: 'reopened_unsold' });

    const populatedSet = await AuctionSet.findById(newSet._id).populate('players');
    res.status(201).json({
      success: true,
      message: `Created "${setName}" with ${unsoldPlayers.length} unsold player(s) reopened for bidding!`,
      data: populatedSet,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
