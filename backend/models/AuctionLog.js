const mongoose = require('mongoose');

const AuctionLogSchema = new mongoose.Schema(
  {
    actionType: {
      type: String,
      required: true,
      enum: [
        'bid_placed',
        'player_sold',
        'player_unsold',
        'override_reassign',
        'override_price_change',
        'player_reopened',
        'set_started',
        'set_completed',
        'purse_adjusted',
        'undo',
      ],
    },
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      default: null,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    actor: {
      type: String,
      default: 'Admin',
    },
    details: {
      type: String,
      default: '',
    },
    isUndone: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AuctionLog', AuctionLogSchema);
