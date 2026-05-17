const mongoose = require('mongoose');

const facultyPreferenceSchema = new mongoose.Schema(
  {
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
    },
    preferredSubjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
      },
    ],
    preferredDays: [
      {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      },
    ],
    avoidDays: [
      {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      },
    ],
    maxContinuousHours: {
      type: Number,
      default: 2,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('FacultyPreference', facultyPreferenceSchema);
