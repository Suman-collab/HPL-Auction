const AuctionState = require('../models/AuctionState');
const AuctionSet = require('../models/AuctionSet');
const Player = require('../models/Player');
const Team = require('../models/Team');
const AuctionLog = require('../models/AuctionLog');
const { getNextIncrement, getNextBidAmount } = require('../utils/economy');
const { emitEvent } = require('../socket');

// Helper to get or create singleton AuctionState
async function getOrCreateState() {
  let state = await AuctionState.findOne()
    .populate('activeSet')
    .populate({
      path: 'currentPlayer',
      populate: { path: 'set' },
    })
    .populate('leadingTeam')
    .populate('bidHistory.team');

  if (!state) {
    state = await AuctionState.create({
      status: 'idle',
      currentBid: 0,
      bidHistory: [],
    });
  }
  return state;
}

// Unsold players stay in one dedicated holding set until an admin reopens them
// for a re-auction round.
async function getOrCreateUnsoldPlayersSet() {
  let unsoldSet = await AuctionSet.findOne({ isUnsoldSet: true });
  if (unsoldSet) return unsoldSet;

  const maxOrder = await AuctionSet.findOne().sort({ order: -1 });
  unsoldSet = await AuctionSet.create({
    name: 'Unsold Players',
    order: maxOrder ? maxOrder.order + 1 : 1,
    description: 'Players marked unsold during the auction.',
    players: [],
    status: 'upcoming',
    isUnsoldSet: true,
  });

  return unsoldSet;
}

// Get current live auction state
exports.getState = async (req, res) => {
  try {
    const state = await getOrCreateState();
    res.json({ success: true, data: state });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Start or activate an auction set
exports.startSet = async (req, res) => {
  try {
    const { setId, shuffle = false } = req.body;
    const set = await AuctionSet.findById(setId).populate('players');
    if (!set) {
      return res.status(404).json({ success: false, error: 'Set not found' });
    }

    set.status = 'active';
    await set.save();

    let playerList = [...set.players];
    if (shuffle) {
      playerList.sort(() => Math.random() - 0.5);
    }

    // Find first pending player
    const pendingPlayer =
      playerList.find((p) => p.status === 'pending') || playerList[0];

    let state = await AuctionState.findOne();
    if (!state) state = new AuctionState();

    state.activeSet = set._id;
    state.isShuffled = !!shuffle;

    if (pendingPlayer) {
      state.currentPlayer = pendingPlayer._id;
      state.currentBid = pendingPlayer.basePrice;
      state.leadingTeam = null;
      state.bidHistory = [];
      state.status = 'bidding';

      await Player.findByIdAndUpdate(pendingPlayer._id, { status: 'in_progress' });
    } else {
      state.currentPlayer = null;
      state.currentBid = 0;
      state.leadingTeam = null;
      state.bidHistory = [];
      state.status = 'idle';
    }

    await state.save();

    await AuctionLog.create({
      actionType: 'set_started',
      oldValue: null,
      newValue: { setId: set._id, setName: set.name },
      details: `Admin started auction set "${set.name}" (${playerList.length} players)`,
    });

    const populatedState = await getOrCreateState();
    emitEvent('auction:state', populatedState);
    emitEvent('sets:update', { action: 'start', set });
    res.json({ success: true, data: populatedState });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Set a specific player as the current player on block
exports.setCurrentPlayer = async (req, res) => {
  try {
    const { playerId } = req.body;
    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }

    let state = await AuctionState.findOne();
    if (!state) state = new AuctionState();

    // If there was a player in progress, set them back to pending
    if (state.currentPlayer && String(state.currentPlayer) !== String(player._id)) {
      const prevPlayer = await Player.findById(state.currentPlayer);
      if (prevPlayer && prevPlayer.status === 'in_progress') {
        prevPlayer.status = 'pending';
        await prevPlayer.save();
      }
    }

    player.status = 'in_progress';
    await player.save();

    state.currentPlayer = player._id;
    state.currentBid = player.basePrice;
    state.leadingTeam = null;
    state.bidHistory = [];
    state.status = 'bidding';
    if (player.set) {
      state.activeSet = player.set;
    }

    await state.save();

    const populatedState = await getOrCreateState();
    emitEvent('auction:state', populatedState);
    emitEvent('players:update', { action: 'in_progress', player });
    res.json({ success: true, data: populatedState });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Place bid
exports.placeBid = async (req, res) => {
  try {
    const { teamId, amount, forceOverride = false } = req.body;

    const state = await AuctionState.findOne();
    if (!state || !state.currentPlayer) {
      return res.status(400).json({ success: false, error: 'No active player on auction block' });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }

    const player = await Player.findById(state.currentPlayer);

    // Calculate bid amount
    let bidAmount;
    if (amount !== undefined && amount !== null && amount !== '') {
      bidAmount = Number(amount);
    } else {
      // Auto increment based on current price
      if (state.bidHistory.length === 0) {
        // First bid starts at base price
        bidAmount = state.currentBid || player.basePrice;
      } else {
        bidAmount = getNextBidAmount(state.currentBid);
      }
    }

    // Validate budget unless forceOverride is true
    if (!forceOverride && team.remainingPurse < bidAmount) {
      return res.status(400).json({
        success: false,
        error: `Insufficient purse! ${team.name} has ${team.remainingPurse} pts left, bid requires ${bidAmount} pts.`,
      });
    }

    const oldPrice = state.currentBid;
    const oldTeam = state.leadingTeam;

    state.currentBid = bidAmount;
    state.leadingTeam = team._id;
    state.bidHistory.push({
      team: team._id,
      amount: bidAmount,
      timestamp: new Date(),
    });
    state.status = 'bidding';
    await state.save();

    await AuctionLog.create({
      actionType: 'bid_placed',
      player: player._id,
      team: team._id,
      oldValue: { price: oldPrice, team: oldTeam },
      newValue: { price: bidAmount, team: team._id },
      details: `${team.name} placed bid of ${bidAmount} pts for ${player.name}`,
    });

    const populatedState = await getOrCreateState();
    emitEvent('auction:bid', {
      player,
      team,
      amount: bidAmount,
      bidHistory: populatedState.bidHistory,
    });
    emitEvent('auction:state', populatedState);

    res.json({ success: true, data: populatedState });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Mark Sold
exports.markSold = async (req, res) => {
  try {
    const { teamId, price } = req.body;
    const state = await AuctionState.findOne();
    if (!state || !state.currentPlayer) {
      return res.status(400).json({ success: false, error: 'No active player on auction block' });
    }

    const finalTeamId = teamId || state.leadingTeam;
    const finalPrice = price !== undefined ? Number(price) : state.currentBid;

    if (!finalTeamId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot mark sold without a winning team selected or leading bid',
      });
    }

    const team = await Team.findById(finalTeamId);
    if (!team) {
      return res.status(404).json({ success: false, error: 'Winning team not found' });
    }

    const player = await Player.findById(state.currentPlayer);
    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }

    // Atomic update team purse & roster
    team.remainingPurse = Math.max(0, Math.round((team.remainingPurse - finalPrice) * 10) / 10);
    team.roster.push({
      player: player._id,
      price: finalPrice,
      boughtAt: new Date(),
    });
    await team.save();

    // Update player
    player.status = 'sold';
    player.soldTo = team._id;
    player.soldPrice = finalPrice;
    await player.save();

    // Update auction state
    state.status = 'sold';
    await state.save();

    // Log action
    const log = await AuctionLog.create({
      actionType: 'player_sold',
      player: player._id,
      team: team._id,
      oldValue: null,
      newValue: { soldTo: team._id, soldPrice: finalPrice, teamPurse: team.remainingPurse },
      details: `${player.name} SOLD to ${team.name} for ${finalPrice} pts!`,
    });

    const populatedPlayer = await Player.findById(player._id).populate('soldTo').populate('set');
    const populatedTeam = await Team.findById(team._id).populate('roster.player');
    const populatedState = await getOrCreateState();

    emitEvent('auction:sold', {
      player: populatedPlayer,
      team: populatedTeam,
      price: finalPrice,
      log,
    });
    emitEvent('auction:state', populatedState);
    emitEvent('teams:update', { action: 'update', team: populatedTeam });
    emitEvent('players:update', { action: 'sold', player: populatedPlayer });
    emitEvent('log:new', log);

    res.json({
      success: true,
      message: `${player.name} sold to ${team.name} for ${finalPrice} pts`,
      player: populatedPlayer,
      team: populatedTeam,
      state: populatedState,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Mark Unsold
exports.markUnsold = async (req, res) => {
  try {
    const state = await AuctionState.findOne();
    if (!state || !state.currentPlayer) {
      return res.status(400).json({ success: false, error: 'No active player on auction block' });
    }

    const player = await Player.findById(state.currentPlayer);
    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }

    const previousSetId = player.set;
    const unsoldSet = await getOrCreateUnsoldPlayersSet();

    // A player belongs to one set at a time. Remove them from their auction
    // round before adding them to the dedicated unsold set.
    if (previousSetId && String(previousSetId) !== String(unsoldSet._id)) {
      await AuctionSet.findByIdAndUpdate(previousSetId, {
        $pull: { players: player._id },
      });
    }
    await AuctionSet.findByIdAndUpdate(unsoldSet._id, {
      $addToSet: { players: player._id },
    });

    player.status = 'unsold';
    player.soldTo = null;
    player.soldPrice = null;
    player.set = unsoldSet._id;
    await player.save();

    state.status = 'unsold';
    await state.save();

    const log = await AuctionLog.create({
      actionType: 'player_unsold',
      player: player._id,
      oldValue: { status: 'in_progress', set: previousSetId },
      newValue: { status: 'unsold', set: unsoldSet._id },
      details: `${player.name} marked UNSOLD and moved to Unsold Players`,
    });

    const populatedPlayer = await Player.findById(player._id).populate('set');
    const populatedState = await getOrCreateState();

    emitEvent('auction:unsold', { player: populatedPlayer, log });
    emitEvent('auction:state', populatedState);
    emitEvent('sets:update', { action: 'player_moved_to_unsold', set: unsoldSet });
    emitEvent('players:update', { action: 'unsold', player: populatedPlayer });
    emitEvent('log:new', log);

    res.json({
      success: true,
      message: `${player.name} marked unsold and added to Unsold Players`,
      player: populatedPlayer,
      state: populatedState,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Next Player in Set
exports.nextPlayer = async (req, res) => {
  try {
    const state = await AuctionState.findOne();
    if (!state || !state.activeSet) {
      return res.status(400).json({ success: false, error: 'No active auction set' });
    }

    const set = await AuctionSet.findById(state.activeSet).populate('players');
    if (!set || !set.players || set.players.length === 0) {
      return res.status(400).json({ success: false, error: 'No players in active set' });
    }

    // Find next pending player
    let currentIndex = -1;
    if (state.currentPlayer) {
      currentIndex = set.players.findIndex(
        (p) => String(p._id) === String(state.currentPlayer)
      );
    }

    let nextPlayer = null;
    // Look forward from currentIndex + 1
    for (let i = currentIndex + 1; i < set.players.length; i++) {
      if (set.players[i].status === 'pending') {
        nextPlayer = set.players[i];
        break;
      }
    }

    // If not found, wrap around to find any pending player
    if (!nextPlayer) {
      for (let i = 0; i <= currentIndex; i++) {
        if (set.players[i].status === 'pending') {
          nextPlayer = set.players[i];
          break;
        }
      }
    }

    if (!nextPlayer) {
      // All players in set completed!
      set.status = 'completed';
      await set.save();

      state.status = 'idle';
      state.currentPlayer = null;
      state.currentBid = 0;
      state.leadingTeam = null;
      state.bidHistory = [];
      await state.save();

      await AuctionLog.create({
        actionType: 'set_completed',
        newValue: { setId: set._id, setName: set.name },
        details: `Auction set "${set.name}" completed!`,
      });

      const populatedState = await getOrCreateState();
      emitEvent('auction:state', populatedState);
      emitEvent('sets:update', { action: 'completed', set });
      return res.json({
        success: true,
        message: 'All players in this set have been auctioned!',
        setCompleted: true,
        data: populatedState,
      });
    }

    nextPlayer.status = 'in_progress';
    await nextPlayer.save();

    state.currentPlayer = nextPlayer._id;
    state.currentBid = nextPlayer.basePrice;
    state.leadingTeam = null;
    state.bidHistory = [];
    state.status = 'bidding';
    await state.save();

    const populatedState = await getOrCreateState();
    emitEvent('auction:state', populatedState);
    emitEvent('players:update', { action: 'in_progress', player: nextPlayer });

    res.json({ success: true, data: populatedState });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Previous Player in Set
exports.previousPlayer = async (req, res) => {
  try {
    const state = await AuctionState.findOne();
    if (!state || !state.activeSet) {
      return res.status(400).json({ success: false, error: 'No active auction set' });
    }

    const set = await AuctionSet.findById(state.activeSet).populate('players');
    if (!set || !set.players.length) {
      return res.status(400).json({ success: false, error: 'No players in active set' });
    }

    let currentIndex = set.players.findIndex(
      (p) => String(p._id) === String(state.currentPlayer)
    );

    let prevIndex = currentIndex > 0 ? currentIndex - 1 : set.players.length - 1;
    const targetPlayer = set.players[prevIndex];

    targetPlayer.status = 'in_progress';
    await targetPlayer.save();

    state.currentPlayer = targetPlayer._id;
    state.currentBid = targetPlayer.basePrice;
    state.leadingTeam = null;
    state.bidHistory = [];
    state.status = 'bidding';
    await state.save();

    const populatedState = await getOrCreateState();
    emitEvent('auction:state', populatedState);
    res.json({ success: true, data: populatedState });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Skip player (keeps player pending, advances to next)
exports.skipPlayer = async (req, res) => {
  try {
    const state = await AuctionState.findOne();
    if (!state || !state.currentPlayer) {
      return res.status(400).json({ success: false, error: 'No current player to skip' });
    }

    const player = await Player.findById(state.currentPlayer);
    if (player && player.status === 'in_progress') {
      player.status = 'pending';
      await player.save();
    }

    return exports.nextPlayer(req, res);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Preview Override (calculates purse impact before commit)
exports.previewOverride = async (req, res) => {
  try {
    const { playerId, newTeamId, newPrice, newStatus } = req.body;
    const player = await Player.findById(playerId).populate('soldTo');
    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }

    const changes = {
      player: {
        id: player._id,
        name: player.name,
        currentStatus: player.status,
        currentPrice: player.soldPrice,
        currentTeam: player.soldTo ? player.soldTo.name : null,
      },
      teamPurseDiffs: [],
    };

    const oldTeamId = player.soldTo ? String(player.soldTo._id) : null;
    const oldPrice = Number(player.soldPrice || 0);
    const targetPrice = Number(newPrice !== undefined ? newPrice : oldPrice);

    // Case 1: Old team refund
    if (oldTeamId && (newStatus === 'unsold' || newStatus === 'pending' || (newTeamId && String(newTeamId) !== oldTeamId))) {
      const oldTeam = await Team.findById(oldTeamId);
      if (oldTeam) {
        changes.teamPurseDiffs.push({
          teamId: oldTeam._id,
          teamName: oldTeam.name,
          oldPurse: oldTeam.remainingPurse,
          newPurse: Math.round((oldTeam.remainingPurse + oldPrice) * 10) / 10,
          diff: `+${oldPrice}`,
        });
      }
    }

    // Case 2: New team deduction
    if (newStatus === 'sold' && newTeamId) {
      if (oldTeamId === String(newTeamId)) {
        // Same team, just price change
        const team = await Team.findById(newTeamId);
        const priceDiff = targetPrice - oldPrice;
        changes.teamPurseDiffs.push({
          teamId: team._id,
          teamName: team.name,
          oldPurse: team.remainingPurse,
          newPurse: Math.round((team.remainingPurse - priceDiff) * 10) / 10,
          diff: priceDiff > 0 ? `-${priceDiff}` : `+${Math.abs(priceDiff)}`,
        });
      } else {
        // Different team
        const newTeam = await Team.findById(newTeamId);
        if (newTeam) {
          changes.teamPurseDiffs.push({
            teamId: newTeam._id,
            teamName: newTeam.name,
            oldPurse: newTeam.remainingPurse,
            newPurse: Math.round((newTeam.remainingPurse - targetPrice) * 10) / 10,
            diff: `-${targetPrice}`,
          });
        }
      }
    }

    res.json({ success: true, data: changes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Manual Override Player (Reassign, Change Price, Reopen)
exports.overridePlayer = async (req, res) => {
  try {
    const { playerId, newTeamId, newPrice, newStatus } = req.body;
    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }

    const oldTeamId = player.soldTo ? String(player.soldTo) : null;
    const oldPrice = Number(player.soldPrice || 0);
    const oldStatus = player.status;

    const targetStatus = newStatus || (newTeamId ? 'sold' : oldStatus);
    const targetPrice = newPrice !== undefined ? Number(newPrice) : oldPrice;

    // Rollback previous team if sold
    if (oldTeamId) {
      await Team.findByIdAndUpdate(oldTeamId, {
        $pull: { roster: { player: player._id } },
        $inc: { remainingPurse: oldPrice },
      });
    }

    // Apply to new team if sold
    if (targetStatus === 'sold' && newTeamId) {
      await Team.findByIdAndUpdate(newTeamId, {
        $push: {
          roster: {
            player: player._id,
            price: targetPrice,
            boughtAt: new Date(),
          },
        },
        $inc: { remainingPurse: -targetPrice },
      });

      player.status = 'sold';
      player.soldTo = newTeamId;
      player.soldPrice = targetPrice;
    } else {
      player.status = targetStatus;
      player.soldTo = null;
      player.soldPrice = null;
    }

    await player.save();

    // Log the override action
    const log = await AuctionLog.create({
      actionType: oldTeamId !== String(newTeamId) ? 'override_reassign' : 'override_price_change',
      player: player._id,
      team: newTeamId || null,
      oldValue: { team: oldTeamId, price: oldPrice, status: oldStatus },
      newValue: { team: newTeamId || null, price: targetPrice, status: targetStatus },
      details: `Admin Override: ${player.name} set to ${targetStatus} (Team: ${newTeamId || 'None'}, Price: ${targetPrice} pts)`,
    });

    const updatedTeams = await Team.find().populate('roster.player');
    const updatedPlayer = await Player.findById(player._id).populate('soldTo').populate('set');
    const state = await getOrCreateState();

    emitEvent('auction:override', { player: updatedPlayer, log });
    emitEvent('auction:state', state);
    emitEvent('teams:update', { action: 'bulk_refresh', teams: updatedTeams });
    emitEvent('players:update', { action: 'update', player: updatedPlayer });
    emitEvent('log:new', log);

    res.json({
      success: true,
      message: 'Player override applied successfully',
      player: updatedPlayer,
      teams: updatedTeams,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Reopen player for re-auction
exports.reopenPlayer = async (req, res) => {
  try {
    const { playerId, targetSetId } = req.body;
    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }

    // If was sold, refund team
    if (player.soldTo) {
      await Team.findByIdAndUpdate(player.soldTo, {
        $pull: { roster: { player: player._id } },
        $inc: { remainingPurse: player.soldPrice || 0 },
      });
    }

    const oldStatus = player.status;
    player.status = 'pending';
    player.soldTo = null;
    player.soldPrice = null;

    if (targetSetId) {
      if (player.set && String(player.set) !== String(targetSetId)) {
        await AuctionSet.findByIdAndUpdate(player.set, {
          $pull: { players: player._id },
        });
      }
      await AuctionSet.findByIdAndUpdate(targetSetId, {
        $addToSet: { players: player._id },
      });
      player.set = targetSetId;
    }

    await player.save();

    const log = await AuctionLog.create({
      actionType: 'player_reopened',
      player: player._id,
      oldValue: { status: oldStatus },
      newValue: { status: 'pending', set: player.set },
      details: `${player.name} reopened for re-auction`,
    });

    const updatedTeams = await Team.find().populate('roster.player');
    const updatedPlayer = await Player.findById(player._id).populate('set');
    const state = await getOrCreateState();

    emitEvent('auction:state', state);
    emitEvent('teams:update', { action: 'bulk_refresh', teams: updatedTeams });
    emitEvent('players:update', { action: 'update', player: updatedPlayer });
    emitEvent('log:new', log);

    res.json({
      success: true,
      message: `${player.name} reopened for auction`,
      player: updatedPlayer,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Single-step Undo Last Action
exports.undoLastAction = async (req, res) => {
  try {
    const lastLog = await AuctionLog.findOne({
      isUndone: false,
      actionType: { $in: ['player_sold', 'player_unsold', 'bid_placed', 'override_reassign', 'override_price_change'] },
    }).sort({ createdAt: -1 });

    if (!lastLog) {
      return res.status(400).json({ success: false, error: 'No undoable action found' });
    }

    const { actionType, player: playerId, team: teamId, oldValue, newValue } = lastLog;

    if (actionType === 'player_sold') {
      // Revert sold: refund team, remove from roster, set player status back to in_progress
      if (teamId) {
        await Team.findByIdAndUpdate(teamId, {
          $pull: { roster: { player: playerId } },
          $inc: { remainingPurse: newValue.soldPrice || 0 },
        });
      }
      const player = await Player.findByIdAndUpdate(
        playerId,
        { status: 'in_progress', soldTo: null, soldPrice: null },
        { new: true }
      );

      const state = await AuctionState.findOne();
      if (state) {
        state.currentPlayer = playerId;
        state.status = 'bidding';
        await state.save();
      }
    } else if (actionType === 'player_unsold') {
      const player = await Player.findById(playerId);
      const originalSetId = oldValue && oldValue.set;
      const unsoldSetId = newValue && newValue.set;

      if (player && originalSetId && String(originalSetId) !== String(unsoldSetId)) {
        if (unsoldSetId) {
          await AuctionSet.findByIdAndUpdate(unsoldSetId, {
            $pull: { players: player._id },
          });
        }
        await AuctionSet.findByIdAndUpdate(originalSetId, {
          $addToSet: { players: player._id },
        });
        player.set = originalSetId;
      }

      if (player) {
        player.status = 'in_progress';
        await player.save();
      }
      const state = await AuctionState.findOne();
      if (state) {
        state.currentPlayer = playerId;
        state.status = 'bidding';
        await state.save();
      }
    } else if (actionType === 'bid_placed') {
      const state = await AuctionState.findOne();
      if (state && state.bidHistory && state.bidHistory.length > 0) {
        state.bidHistory.pop();
        if (state.bidHistory.length > 0) {
          const prevBid = state.bidHistory[state.bidHistory.length - 1];
          state.currentBid = prevBid.amount;
          state.leadingTeam = prevBid.team;
        } else {
          const p = await Player.findById(playerId);
          state.currentBid = p ? p.basePrice : 0;
          state.leadingTeam = null;
        }
        await state.save();
      }
    } else if (actionType.startsWith('override_')) {
      // Revert override to oldValue
      if (oldValue) {
        const player = await Player.findById(playerId);
        // Rollback current state
        if (player && player.soldTo) {
          await Team.findByIdAndUpdate(player.soldTo, {
            $pull: { roster: { player: player._id } },
            $inc: { remainingPurse: player.soldPrice || 0 },
          });
        }
        // Apply oldValue
        if (oldValue.team && oldValue.status === 'sold') {
          await Team.findByIdAndUpdate(oldValue.team, {
            $push: { roster: { player: playerId, price: oldValue.price, boughtAt: new Date() } },
            $inc: { remainingPurse: -oldValue.price },
          });
          await Player.findByIdAndUpdate(playerId, {
            soldTo: oldValue.team,
            soldPrice: oldValue.price,
            status: 'sold',
          });
        } else {
          await Player.findByIdAndUpdate(playerId, {
            soldTo: null,
            soldPrice: null,
            status: oldValue.status || 'pending',
          });
        }
      }
    }

    lastLog.isUndone = true;
    await lastLog.save();

    const undoLog = await AuctionLog.create({
      actionType: 'undo',
      details: `Undid action: ${lastLog.details}`,
      oldValue: { originalLogId: lastLog._id, type: actionType },
    });

    const updatedTeams = await Team.find().populate('roster.player');
    const updatedState = await getOrCreateState();

    emitEvent('auction:undo', { undoneLog: lastLog, undoLog });
    emitEvent('auction:state', updatedState);
    emitEvent('sets:update', { action: 'undo' });
    emitEvent('teams:update', { action: 'bulk_refresh', teams: updatedTeams });
    emitEvent('log:new', undoLog);

    res.json({
      success: true,
      message: `Undid: ${lastLog.details}`,
      undoneLog: lastLog,
      state: updatedState,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
