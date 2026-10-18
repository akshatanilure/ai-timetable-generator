const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    subjectCode: {
      type: String,
      required: [true, 'Please add a subject code'],
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
    branch: {
      type: String,
      default: 'CSE',
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
    subjectCategory: {
      type: String,
      default: 'Compulsory Subject',
      trim: true,
    },
    isFullClassLab: {
      type: Boolean,
      default: false,
    },
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

subjectSchema.pre('save', function (next) {
  if (this.subjectCategory && this.subjectCategory !== 'Compulsory Subject') {
    this.elective = true;
  } else if (this.subjectCategory === 'Compulsory Subject') {
    this.elective = false;
  } else if (this.elective) {
    this.subjectCategory = 'Elective 1';
  } else {
    this.subjectCategory = 'Compulsory Subject';
  }
  next();
});

subjectSchema.index({ subjectCode: 1, program: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);
