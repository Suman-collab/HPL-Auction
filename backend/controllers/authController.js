const Team = require('../models/Team');

// Admin Login
exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const expectedUser = process.env.ADMIN_USERNAME;
    const expectedPass = process.env.ADMIN_PASSWORD;

    if (username === expectedUser && password === expectedPass) {
      return res.json({
        success: true,
        message: 'Admin authenticated successfully',
        role: 'admin',
        token: 'admin-session-' + Date.now(),
        user: {
          name: 'Super Admin',
          username: expectedUser,
          role: 'admin',
        },
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid admin credentials. Please check your username and password.',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Team Login
exports.teamLogin = async (req, res) => {
  try {
    const { email, username, password, teamId, passkey } = req.body;

    const identifier = (email || username || '').trim().toLowerCase();
    const providedPass = (password || passkey || '').trim();

    let team;

    if (teamId) {
      team = await Team.findById(teamId);
    } else if (identifier) {
      const cleanSlug = identifier.replace(/@gmail\.com$/, '').replace(/[^a-z0-9]/g, '');
      const fullEmail = `${cleanSlug}@gmail.com`;

      team = await Team.findOne({
        $or: [
          { email: fullEmail },
          { email: identifier },
          { shortCode: identifier.toUpperCase() },
          { name: { $regex: new RegExp(`^${identifier.replace(/[^a-z0-9\s]/gi, '')}$`, 'i') } },
        ],
      });

      if (!team) {
        const allTeams = await Team.find();
        team = allTeams.find((t) => {
          const tSlug = t.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          return tSlug === cleanSlug || t.email?.toLowerCase() === identifier || t.shortCode.toLowerCase() === identifier;
        });
      }
    }

    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Franchise not found. Please check your username / email (e.g. teamname@gmail.com).',
      });
    }

    const validPasswords = [
      team.password,
      process.env.TEAM_PASSKEY,
    ].filter(Boolean);

    if (!providedPass || !validPasswords.includes(providedPass)) {
      return res.status(401).json({
        success: false,
        error: 'Incorrect franchise credentials.',
      });
    }

    return res.json({
      success: true,
      message: `Welcome ${team.name}`,
      role: 'team',
      token: `team-session-${team._id}-${Date.now()}`,
      team: {
        _id: team._id,
        name: team.name,
        shortCode: team.shortCode,
        email: team.email || `${teamSlug}@gmail.com`,
        owner: team.owner,
        logo: team.logo,
        primaryColor: team.primaryColor,
        remainingPurse: team.remainingPurse,
        totalPurse: team.totalPurse,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
