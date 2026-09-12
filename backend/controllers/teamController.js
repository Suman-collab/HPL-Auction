const Team = require('../models/Team');
const Player = require('../models/Player');
const AuctionState = require('../models/AuctionState');
const AuctionLog = require('../models/AuctionLog');
const { emitEvent } = require('../socket');

// Get all teams
exports.getTeams = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate('roster.player')
      .sort({ remainingPurse: -1, name: 1 });
    res.json({ success: true, count: teams.length, data: teams });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get single team
exports.getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate('roster.player');
    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }
    res.json({ success: true, data: team });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create new team
exports.createTeam = async (req, res) => {
  try {
    const {
      name,
      shortCode,
      primaryColor,
      secondaryColor,
      totalPurse = 100,
      owner = '',
      captain = '',
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Team name is required' });
    }

    const cleanName = name.trim();
    const cleanOwner = (owner || '').trim();

    // Auto-derive shortCode from name if not provided
    let derivedShortCode = (shortCode || '').trim();
    if (!derivedShortCode) {
      const words = cleanName.split(/\s+/);
      if (words.length >= 2) {
        derivedShortCode = words.map((w) => w[0]).join('').substring(0, 4).toUpperCase();
      } else {
        derivedShortCode = cleanName.substring(0, 3).toUpperCase();
      }
    }

    // Dynamic stadium HUD color palette assignment
    const count = await Team.countDocuments();
    const PALETTE = [
      { primary: '#06B6D4', secondary: '#083344' }, // Cyan
      { primary: '#F59E0B', secondary: '#451A03' }, // Amber / Gold
      { primary: '#10B981', secondary: '#064E3B' }, // Emerald
      { primary: '#8B5CF6', secondary: '#2E1065' }, // Purple
      { primary: '#EC4899', secondary: '#500724' }, // Rose / Pink
      { primary: '#3B82F6', secondary: '#172554' }, // Royal Blue
      { primary: '#EF4444', secondary: '#450A0A' }, // Crimson Red
      { primary: '#14B8A6', secondary: '#042F2E' }, // Teal
    ];
    const theme = PALETTE[count % PALETTE.length];

    const defaultLogo = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(cleanName)}`;
    const logo = req.file ? `/uploads/${req.file.filename}` : req.body.logo || defaultLogo;

    // Team-specific passwords are optional; teams can use the configured
    // TEAM_PASSKEY when a separate password is not supplied.
    const slug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const autoEmail = req.body.email || `${slug}@gmail.com`;
    const teamPassword = req.body.password || '';

    const team = await Team.create({
      name: cleanName,
      shortCode: derivedShortCode,
      email: autoEmail,
      password: teamPassword,
      primaryColor: primaryColor || theme.primary,
      secondaryColor: secondaryColor || theme.secondary,
      totalPurse: Number(totalPurse) || 100,
      remainingPurse: Number(totalPurse) || 100,
      owner: cleanOwner,
      captain: (captain || '').trim(),
      logo,
      roster: [],
    });

    emitEvent('teams:update', { action: 'create', team });
    res.status(201).json({ success: true, data: team });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Update team
exports.updateTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }

    const {
      name,
      shortCode,
      primaryColor,
      secondaryColor,
      totalPurse,
      remainingPurse,
      owner,
      captain,
    } = req.body;

    if (name) team.name = name;
    if (shortCode) team.shortCode = shortCode.toUpperCase();
    if (primaryColor) team.primaryColor = primaryColor;
    if (secondaryColor) team.secondaryColor = secondaryColor;
    if (owner !== undefined) team.owner = owner;
    if (captain !== undefined) team.captain = captain;

    if (req.file) {
      team.logo = `/uploads/${req.file.filename}`;
    } else if (req.body.logo !== undefined) {
      team.logo = req.body.logo;
    }

    // Check if purse is adjusted manually
    if (totalPurse !== undefined && Number(totalPurse) !== team.totalPurse) {
      const oldTotal = team.totalPurse;
      const diff = Number(totalPurse) - oldTotal;
      team.totalPurse = Number(totalPurse);
      team.remainingPurse = Math.max(0, team.remainingPurse + diff);

      await AuctionLog.create({
        actionType: 'purse_adjusted',
        team: team._id,
        oldValue: { totalPurse: oldTotal },
        newValue: { totalPurse: team.totalPurse, remainingPurse: team.remainingPurse },
        details: `Purse adjusted for ${team.name} from ${oldTotal} to ${team.totalPurse}`,
      });
    }

    if (remainingPurse !== undefined) {
      team.remainingPurse = Number(remainingPurse);
    }

    await team.save();
    emitEvent('teams:update', { action: 'update', team });
    res.json({ success: true, data: team });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Delete team
exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }

    // Release any players previously sold to or rostered under this team
    await Player.updateMany(
      { soldTo: team._id },
      { $set: { soldTo: null, status: 'pending', soldPrice: 0 } }
    );

    // If auction state currently has this team leading, reset it
    await AuctionState.updateMany(
      { leadingTeam: team._id },
      { $set: { leadingTeam: null, currentBid: 0 } }
    );

    await Team.findByIdAndDelete(req.params.id);

    emitEvent('teams:update', { action: 'delete', teamId: req.params.id });
    emitEvent('players:update', { action: 'release' });
    const freshState = await AuctionState.findOne();
    if (freshState) emitEvent('auction:state', freshState);

    res.json({ success: true, message: `Team ${team.name} deleted successfully` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
