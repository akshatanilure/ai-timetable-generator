const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema(
  {
    semesterNumber: {
      type: Number,
      required: [true, 'Please add a semester number'],
      unique: true,
    },
    description: {
      type: String,
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

module.exports = mongoose.model('Semester', semesterSchema);
