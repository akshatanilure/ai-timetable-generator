const mongoose = require('mongoose');

const TimetableSettingSchema = new mongoose.Schema({
  college_start_time: {
    type: String,
    required: true,
    default: "09:00"
  },
  college_end_time: {
    type: String,
    required: true,
    default: "16:30"
  },
  period_duration: {
    type: Number,
    required: true,
    default: 60 // in minutes
  },
  short_break_start: {
    type: String,
    required: true,
    default: "11:00"
  },
  short_break_end: {
    type: String,
    required: true,
    default: "11:30"
  },
  lunch_break_start: {
    type: String,
    required: true,
    default: "13:30"
  },
  lunch_break_end: {
    type: String,
    required: true,
    default: "14:30"
  }
}, { timestamps: true });

module.exports = mongoose.model('TimetableSetting', TimetableSettingSchema);
