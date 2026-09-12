const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    photo: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      required: true,
      enum: ['Batter', 'Bowler', 'All-rounder', 'Wicket-keeper'],
      default: 'All-rounder',
    },
    year: {
      type: String,
      required: true,
      enum: ['1st', '2nd', '3rd', '4th'],
      default: '1st',
    },
    set: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuctionSet',
      default: null,
    },
    basePrice: {
      type: Number,
      required: true,
      default: 1,
      min: 0.5,
    },
    stats: {
      hostel: { type: String, default: '' },
      block: { type: String, default: '' },
      room: { type: String, default: '' },
      battingStyle: { type: String, default: 'Right Hand Bat' },
      bowlingStyle: { type: String, default: 'Right Arm Medium' },
      matches: { type: Number, default: 0 },
      runs: { type: Number, default: 0 },
      wickets: { type: Number, default: 0 },
      strikeRate: { type: Number, default: 0 },
      economy: { type: Number, default: 0 },
      specialSkill: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'sold', 'unsold'],
      default: 'pending',
    },
    soldTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    soldPrice: {
      type: Number,
      default: null,
      min: 0,
    },
    auctionOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Player', PlayerSchema);
