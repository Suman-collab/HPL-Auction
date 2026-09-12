const Player = require('../models/Player');
const AuctionSet = require('../models/AuctionSet');
const Team = require('../models/Team');
const { getBasePriceForYear } = require('../utils/economy');
const { emitEvent } = require('../socket');
const fs = require('fs');
const csv = require('csv-parser');

// Get all players with filtering
exports.getPlayers = async (req, res) => {
  try {
    const { search, role, year, status, set, team } = req.query;
    const query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (role) {
      query.role = role;
    }
    if (year) {
      query.year = year;
    }
    if (status) {
      query.status = status;
    }
    if (set) {
      query.set = set;
    }
    if (team) {
      query.soldTo = team;
    }

    const players = await Player.find(query)
      .populate('set', 'name order status')
      .populate('soldTo', 'name shortCode primaryColor logo')
      .sort({ auctionOrder: 1, createdAt: 1 });

    res.json({ success: true, count: players.length, data: players });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get single player
exports.getPlayerById = async (req, res) => {
  try {
    const player = await Player.findById(req.params.id)
      .populate('set')
      .populate('soldTo');
    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }
    res.json({ success: true, data: player });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create player
exports.createPlayer = async (req, res) => {
  try {
    const {
      name,
      role,
      year,
      basePrice,
      set,
      stats,
      status = 'pending',
    } = req.body;

    const computedBasePrice =
      basePrice !== undefined && basePrice !== ''
        ? Number(basePrice)
        : getBasePriceForYear(year);

    let parsedStats = {};
    if (typeof stats === 'string') {
      try {
        parsedStats = JSON.parse(stats);
      } catch (e) {
        parsedStats = {};
      }
    } else if (stats && typeof stats === 'object') {
      parsedStats = stats;
    }

    const photo = req.file ? `/uploads/${req.file.filename}` : req.body.photo || '';

    const player = await Player.create({
      name,
      photo,
      role: role || 'All-rounder',
      year: year || '1st',
      basePrice: computedBasePrice,
      set: set || null,
      stats: parsedStats,
      status,
    });

    if (set) {
      await AuctionSet.findByIdAndUpdate(set, {
        $addToSet: { players: player._id },
      });
    }

    const populated = await Player.findById(player._id).populate('set');
    emitEvent('players:update', { action: 'create', player: populated });
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Update player
exports.updatePlayer = async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }

    const {
      name,
      role,
      year,
      basePrice,
      set,
      stats,
      status,
      soldPrice,
      soldTo,
      auctionOrder,
    } = req.body;

    if (name) player.name = name;
    if (role) player.role = role;
    if (year) {
      player.year = year;
      // If base price was not explicitly edited in this request, update default
      if (basePrice === undefined) {
        player.basePrice = getBasePriceForYear(year);
      }
    }
    if (basePrice !== undefined) {
      player.basePrice = Number(basePrice);
    }
    if (auctionOrder !== undefined) {
      player.auctionOrder = Number(auctionOrder);
    }

    // Set change
    if (set !== undefined && String(player.set) !== String(set)) {
      if (player.set) {
        await AuctionSet.findByIdAndUpdate(player.set, {
          $pull: { players: player._id },
        });
      }
      if (set) {
        await AuctionSet.findByIdAndUpdate(set, {
          $addToSet: { players: player._id },
        });
        player.set = set;
      } else {
        player.set = null;
      }
    }

    if (stats) {
      let parsedStats = stats;
      if (typeof stats === 'string') {
        try {
          parsedStats = JSON.parse(stats);
        } catch (e) {}
      }
      player.stats = { ...player.stats.toObject(), ...parsedStats };
    }

    if (status) player.status = status;
    if (soldPrice !== undefined) player.soldPrice = soldPrice;
    if (soldTo !== undefined) player.soldTo = soldTo;

    if (req.file) {
      player.photo = `/uploads/${req.file.filename}`;
    } else if (req.body.photo !== undefined) {
      player.photo = req.body.photo;
    }

    await player.save();
    const populated = await Player.findById(player._id).populate('set').populate('soldTo');
    emitEvent('players:update', { action: 'update', player: populated });
    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Delete player
exports.deletePlayer = async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }

    if (player.set) {
      await AuctionSet.findByIdAndUpdate(player.set, {
        $pull: { players: player._id },
      });
    }

    if (player.soldTo) {
      await Team.findByIdAndUpdate(player.soldTo, {
        $pull: { roster: { player: player._id } },
        $inc: { remainingPurse: player.soldPrice || 0 },
      });
    }

    await Player.findByIdAndDelete(req.params.id);
    emitEvent('players:update', { action: 'delete', playerId: req.params.id });
    res.json({ success: true, message: 'Player removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Bulk Import CSV
exports.bulkImportCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a CSV file' });
    }

    const results = [];
    const filePath = req.file.path;

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          function normalizeYear(rawYear) {
            const str = String(rawYear || '').toLowerCase().trim();
            if (str.includes('4') || str.includes('fourth')) return '4th';
            if (str.includes('3') || str.includes('third')) return '3rd';
            if (str.includes('2') || str.includes('second')) return '2nd';
            return '1st';
          }

          const imported = [];
          const targetSetId = req.body.setId || null;

          for (const row of results) {
            // Support Name, name, PlayerName, player_name, etc.
            const name = row.name || row.Name || row.PlayerName || row.player_name || Object.values(row)[0];
            if (!name || typeof name !== 'string' || !name.trim()) continue;

            // Support Year, year, CollegeYear, etc.
            const rawYear = row.year || row.Year || row.college_year || row.CollegeYear || Object.values(row)[1] || '1st';
            const year = normalizeYear(rawYear);

            const role = row.role || row.Role || 'All-rounder';
            const basePrice = row.basePrice || row.BasePrice
              ? Number(row.basePrice || row.BasePrice)
              : getBasePriceForYear(year);

            let setId = targetSetId;
            const setName = row.set || row.Set || row.auctionSet;
            if (setName && !targetSetId) {
              let auctionSet = await AuctionSet.findOne({
                name: { $regex: new RegExp(`^${setName.trim()}$`, 'i') },
              });
              if (!auctionSet) {
                const count = await AuctionSet.countDocuments();
                auctionSet = await AuctionSet.create({
                  name: setName.trim(),
                  order: count + 1,
                });
              }
              setId = auctionSet._id;
            }

            const stats = {
              hostel: row.hostel || row.Hostel || '',
              block: row.block || row.Block || '',
              room: row.room || row.Room || '',
              battingStyle: row.battingStyle || row.BattingStyle || 'Right Hand Bat',
              bowlingStyle: row.bowlingStyle || row.BowlingStyle || 'Right Arm Medium',
              matches: Number(row.matches || row.Matches || 0),
              runs: Number(row.runs || row.Runs || 0),
              wickets: Number(row.wickets || row.Wickets || 0),
              strikeRate: Number(row.strikeRate || row.StrikeRate || 0),
              economy: Number(row.economy || row.Economy || 0),
              specialSkill: row.specialSkill || row.SpecialSkill || '',
            };

            const photo =
              row.photo ||
              row.Photo ||
              row.photoUrl ||
              `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name.trim())}`;

            const player = await Player.create({
              name: name.trim(),
              photo,
              role,
              year,
              basePrice,
              set: setId,
              stats,
              status: 'pending',
            });

            if (setId) {
              await AuctionSet.findByIdAndUpdate(setId, {
                $addToSet: { players: player._id },
              });
            }

            imported.push(player);
          }

          // Clean up temp file
          try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          } catch (e) {}

          emitEvent('players:update', { action: 'bulk_import', count: imported.length });
          res.json({
            success: true,
            message: `Successfully imported ${imported.length} players with base prices auto-computed by year!`,
            count: imported.length,
          });
        } catch (innerErr) {
          res.status(500).json({ success: false, error: innerErr.message });
        }
      });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
