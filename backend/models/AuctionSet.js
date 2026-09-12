const mongoose = require('mongoose');

const AuctionSetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      default: 1,
    },
    description: {
      type: String,
      default: '',
    },
    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player',
      },
    ],
    status: {
      type: String,
      enum: ['upcoming', 'active', 'completed'],
      default: 'upcoming',
    },
    // Keeps the holding set for players marked unsold distinct from normal rounds.
    isUnsoldSet: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AuctionSet', AuctionSetSchema);
