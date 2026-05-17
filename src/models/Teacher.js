const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    facultyId: {
      type: String,
      unique: true,
      sparse: true,
    },
    designation: {
      type: String,
    },
    specialization: {
      type: String,
    },
    department: {
      type: String,
      required: [true, 'Please add a department'],
    },
    subjectsHandled: [
      {
        type: String,
      },
    ],
    availability: [
      {
        day: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        },
        slots: [
          {
            startTime: String,
            endTime: String,
          },
        ],
      },
    ],
    preferredSlots: [
      {
        day: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        },
        slots: [
          {
            startTime: String,
            endTime: String,
          },
        ],
      },
    ],
    maxWorkloadPerDay: {
      type: Number,
      default: 6,
    },
    maxWorkloadPerWeek: {
      type: Number,
      default: 30,
    },
    currentWorkload: {
      type: Number,
      default: 0,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Teacher', teacherSchema);
