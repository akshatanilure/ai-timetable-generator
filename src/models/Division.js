const mongoose = require('mongoose');

const divisionSchema = new mongoose.Schema(
  {
    semester: {
      type: Number,
      required: [true, 'Please add a semester'],
    },
    divisionName: {
      type: String,
      required: [true, 'Please add a division name'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Please add a department'],
    },
    strength: {
      type: Number,
      required: [true, 'Please add division strength'],
    },
    program: {
      type: String,
      enum: ['UG', 'PG'],
      default: 'UG',
      index: true,
    },
    assignedRoom: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Division', divisionSchema);
