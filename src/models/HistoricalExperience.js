const mongoose = require('mongoose');

const historicalExperienceSchema = new mongoose.Schema(
  {
    subjectName: {
      type: String,
      required: true,
      trim: true,
    },
    subjectNormalized: {
      type: String,
      required: true,
      index: true,
    },
    courseCodes: [{
      type: String,
      trim: true,
    }],
    teacherName: {
      type: String,
      required: true,
      trim: true,
    },
    teacherNormalized: {
      type: String,
      required: true,
      index: true,
    },
    allotmentCount: {
      type: Number,
      required: true,
      default: 1,
    },
    academicYears: [{
      type: String,
      trim: true,
    }],
    semesters: [{
      type: String,
      trim: true,
    }],
    divisions: [{
      type: String,
      trim: true,
    }],
    isTopTeacher: {
      type: Boolean,
      default: false,
    },
    sourceSheet: {
      type: String,
      enum: ['Top Teacher per Subject', 'All Teacher Counts', 'Original Allotment Records', 'Merged'],
      default: 'All Teacher Counts',
    },
    matchedTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
      index: true,
    },
    matchedSubject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness and safe upsert
historicalExperienceSchema.index(
  { subjectNormalized: 1, teacherNormalized: 1, sourceSheet: 1 },
  { unique: true }
);

module.exports = mongoose.model('HistoricalExperience', historicalExperienceSchema);

