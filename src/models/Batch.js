const mongoose = require('mongoose');

/*
 * Lab batch rules
 *
 * Sem 1 & 2:
 * Keep existing generator logic unchanged.
 *
 * Sem 3, 4, 5, 6:
 * Three batches (A1, A2, A3) rotate through the 3 lab subjects across 3 parallel slots:
 * Slot 1 → A1: Lab1, A2: Lab2, A3: Lab3
 * Slot 2 → A1: Lab2, A2: Lab3, A3: Lab1
 * Slot 3 → A1: Lab3, A2: Lab1, A3: Lab2
 *
 * Sem 7:
 * Major Project-I (22UCSL702) is a whole-division subject like Mathematics:
 * assign the entire class at the same time, NOT separately by A1/A2/A3.
 * Every lab must be exactly 2 continuous hours.
 */

const normalizeBatchName = (value) => {
  if (!value) return value;
  return value
    .toString()
    .trim()
    .replace(/^batch\s*/i, '')
    .toUpperCase();
};

const batchSchema = new mongoose.Schema(
  {
    batchName: {
      type: String,
      required: [true, 'Please add a batch name'],
      trim: true,
      set: normalizeBatchName,
      validate: {
        validator: function (value) {
          return /^A[1-3]$/.test(value);
        },
        message: 'Batch name must be A1, A2 or A3',
      },
    },
    division: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Division',
      required: [true, 'Please associate with a division'],
    },
    studentCount: {
      type: Number,
      required: [true, 'Please add student count for the batch'],
      min: [1, 'Student count must be greater than 0'],
    },
  },
  {
    timestamps: true,
  }
);

batchSchema.index(
  {
    division: 1,
    batchName: 1,
  },
  {
    unique: true,
  }
);

/*
 * 3-Slot Rotational Lab Matrix for 3 batches & 3 labs:
 * Slot 1: A1 -> Lab 0, A2 -> Lab 1, A3 -> Lab 2
 * Slot 2: A1 -> Lab 1, A2 -> Lab 2, A3 -> Lab 0
 * Slot 3: A1 -> Lab 2, A2 -> Lab 0, A3 -> Lab 1
 */
const LAB_ROTATION_SCHEDULE = [
  { A1: 0, A2: 1, A3: 2 },
  { A1: 1, A2: 2, A3: 0 },
  { A1: 2, A2: 0, A3: 1 },
];

batchSchema.statics.getLabRotationSchedule = function (semester) {
  const sem = Number(semester);
  if ([3, 4, 5, 6].includes(sem)) {
    return LAB_ROTATION_SCHEDULE;
  }
  return [];
};

batchSchema.statics.getRequiredBatchNames = function (semester) {
  const sem = Number(semester);
  if ([3, 4, 5, 6, 7].includes(sem)) {
    return ['A1', 'A2', 'A3'];
  }
  return [];
};

module.exports = mongoose.model('Batch', batchSchema);
