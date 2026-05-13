const mongoose = require('mongoose');

const constraintSchema = new mongoose.Schema(
  {
    semester: {
      type: Number,
      required: [true, 'Please add a semester'],
    },
    department: {
      type: String,
      required: [true, 'Please add a department'],
    },
    hardConstraints: {
      noFacultyOverlap: { type: Boolean, default: true },
      noRoomOverlap: { type: Boolean, default: true },
      continuousLabs: { type: Boolean, default: true },
      lunchBreak: {
        enabled: { type: Boolean, default: true },
        startTime: { type: String, default: '13:00' },
        endTime: { type: String, default: '14:00' },
      },
      fixedWorkingDays: {
        type: [String],
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      },
    },
    softConstraints: {
      avoidLastHourHeavySubject: {
        enabled: { type: Boolean, default: true },
        weight: { type: Number, default: 5 },
      },
      facultyPreferences: {
        enabled: { type: Boolean, default: true },
        weight: { type: Number, default: 10 },
      },
      minimizeGaps: {
        enabled: { type: Boolean, default: true },
        weight: { type: Number, default: 3 },
      },
      spreadSubjects: {
        enabled: { type: Boolean, default: true },
        weight: { type: Number, default: 4 },
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one constraint set exists per semester and department
constraintSchema.index({ semester: 1, department: 1 }, { unique: true });

module.exports = mongoose.model('Constraint', constraintSchema);
