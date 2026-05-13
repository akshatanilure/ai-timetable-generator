const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    subjectCode: {
      type: String,
      required: [true, 'Please add a subject code'],
      unique: true,
      trim: true,
    },
    subjectName: {
      type: String,
      required: [true, 'Please add a subject name'],
      trim: true,
    },
    semester: {
      type: Number,
      required: [true, 'Please add a semester'],
    },
    department: {
      type: String,
      required: [true, 'Please add a department'],
    },
    lectureHours: {
      type: Number,
      default: 0,
    },
    tutorialHours: {
      type: Number,
      default: 0,
    },
    practicalHours: {
      type: Number,
      default: 0,
    },
    credits: {
      type: Number,
      required: [true, 'Please add credits'],
    },
    subjectType: {
      type: String,
      enum: ['theory', 'lab', 'project', 'elective'],
      required: [true, 'Please specify subject type'],
    },
    priority: {
      type: Number,
      default: 1,
    },
    elective: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Subject', subjectSchema);
