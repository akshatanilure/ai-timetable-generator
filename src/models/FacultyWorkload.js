const mongoose = require('mongoose');

const facultyWorkloadSchema = new mongoose.Schema(
  {
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
    },
    semester: {
      type: Number,
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    assignedHours: {
      type: Number,
      required: true,
    },
    role: {
      type: String,
      enum: ['main', 'assistant'],
      default: 'main',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('FacultyWorkload', facultyWorkloadSchema);
