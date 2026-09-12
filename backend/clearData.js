require('dotenv').config();
const mongoose = require('mongoose');
const Team = require('./models/Team');
const Player = require('./models/Player');
const AuctionSet = require('./models/AuctionSet');
const AuctionLog = require('./models/AuctionLog');
const AuctionState = require('./models/AuctionState');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  throw new Error('MONGO_URI is required. Set it in backend/.env before running the clean script.');
}

async function clearData() {
  try {
    console.log('Connecting to MongoDB at:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('Connected! Purging all sample data...');

    await Promise.all([
      Team.deleteMany({}),
      Player.deleteMany({}),
      AuctionSet.deleteMany({}),
      AuctionLog.deleteMany({}),
      AuctionState.deleteMany({}),
    ]);

    // Create fresh clean AuctionState singleton
    await AuctionState.create({
      activeSet: null,
      currentPlayer: null,
      currentBid: 0,
      leadingTeam: null,
      bidHistory: [],
      status: 'idle',
      isShuffled: false,
    });

    console.log('All sample data successfully removed from database!');
    console.log('Auction state reset to clean idle state.');
    process.exit(0);
  } catch (err) {
    console.error('Error clearing data:', err);
    process.exit(1);
  }
}

clearData();
