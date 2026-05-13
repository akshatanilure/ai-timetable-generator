const mongoose = require('mongoose');

const labSchema = new mongoose.Schema(
  {
    labName: {
      type: String,
      required: [true, 'Please add a lab name'],
      unique: true,
      trim: true,
    },
    labType: {
      type: String,
      required: [true, 'Please specify lab type'],
    },
    capacity: {
      type: Number,
      required: [true, 'Please add capacity'],
    },
    supportedSubjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
      },
    ],
    equipment: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Lab', labSchema);
