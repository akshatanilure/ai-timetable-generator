const mongoose = require('mongoose');

const labSchema = new mongoose.Schema(
  {
    labName: {
      type: String,
      required: [true, 'Please add a lab name'],
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

labSchema.index({ labName: 1, program: 1 }, { unique: true });

module.exports = mongoose.model('Lab', labSchema);
