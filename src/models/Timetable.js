const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema(
  {
    semester: {
      type: Number,
      required: [true, 'Please add a semester'],
    },
    division: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Division',
      required: [true, 'Please add a division'],
    },
    generatedSchedule: [
      {
        day: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          required: true,
        },
        startTime: {
          type: String,
          required: true,
        },
        endTime: {
          type: String,
          required: true,
        },
        subject: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Subject',
          required: true,
        },
        faculty: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Teacher',
          required: true,
        }],
        room: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Room',
        },
        batch: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Batch',
        },
      },
    ],
    roomAllocations: {
      type: mongoose.Schema.Types.Mixed,
    },
    facultyAllocations: {
      type: mongoose.Schema.Types.Mixed,
    },
    labAllocations: {
      type: mongoose.Schema.Types.Mixed,
    },
    conflicts: [
      {
        type: String,
      },
    ],
    settings: {
      college_start_time: String,
      college_end_time: String,
      period_duration: Number,
      short_break_start: String,
      short_break_end: String,
      lunch_break_start: String,
      lunch_break_end: String
    },
    generatedAt: {
      type: Date,
      default: Date.now,
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

module.exports = mongoose.model('Timetable', timetableSchema);
