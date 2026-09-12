const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    shortCode: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 6,
      default: function () {
        if (!this.name) return 'HPL';
        const words = this.name.trim().split(/\s+/);
        if (words.length >= 2) {
          return words.map((w) => w[0]).join('').substring(0, 4).toUpperCase();
        }
        return this.name.substring(0, 3).toUpperCase();
      },
    },
    logo: {
      type: String,
      default: '',
    },
    primaryColor: {
      type: String,
      default: '#22D3EE', // Default cyan
    },
    secondaryColor: {
      type: String,
      default: '#0F172A',
    },
    totalPurse: {
      type: Number,
      default: 100,
      min: 0,
    },
    remainingPurse: {
      type: Number,
      default: 100,
      min: 0,
    },
    owner: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: function () {
        if (!this.name) return '';
        const slug = this.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return `${slug}@gmail.com`;
      },
    },
    password: {
      type: String,
      trim: true,
      default: '',
    },
    captain: {
      type: String,
      trim: true,
      default: '',
    },
    roster: [
      {
        player: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Player',
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        boughtAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Team', TeamSchema);
