const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: [true, 'Please add a room number'],
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Please add capacity'],
    },
    roomType: {
      type: String,
      enum: ['lecture', 'seminar', 'tutorial'],
      default: 'lecture',
    },
    program: {
      type: String,
      enum: ['UG', 'PG'],
      default: 'UG',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

roomSchema.index({ roomNumber: 1, program: 1 }, { unique: true });

module.exports = mongoose.model('Room', roomSchema);
