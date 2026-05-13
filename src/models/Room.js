const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: [true, 'Please add a room number'],
      unique: true,
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Room', roomSchema);
