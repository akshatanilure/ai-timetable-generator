const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema(
  {
    branchName: {
      type: String,
      required: [true, 'Please add a branch name'],
      unique: true,
    },
    branchCode: {
      type: String,
      required: [true, 'Please add a branch code'],
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Branch', branchSchema);
