const mongoose = require('mongoose');

const AuctionStateSchema = new mongoose.Schema(
  {
    activeSet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuctionSet',
      default: null,
    },
    currentPlayer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      default: null,
    },
    currentBid: {
      type: Number,
      default: 0,
    },
    leadingTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    bidHistory: [
      {
        team: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Team',
        },
        amount: {
          type: Number,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ['idle', 'bidding', 'sold', 'unsold', 'paused'],
      default: 'idle',
    },
    isShuffled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AuctionState', AuctionStateSchema);
