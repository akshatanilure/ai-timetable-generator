require('dotenv').config();
const connectDB = require('./src/config/db');
const Teacher = require('./src/models/Teacher');
const Room = require('./src/models/Room');
const Lab = require('./src/models/Lab');
const Subject = require('./src/models/Subject');
const Division = require('./src/models/Division');
const Batch = require('./src/models/Batch');
const Constraint = require('./src/models/Constraint');
const TimetableSetting = require('./src/models/TimetableSetting');
const TimetableGenerator = require('./src/services/timetableGenerator');

const run = async () => {
  await connectDB();
  const semester = 5;
  const branch = 'CSE';
  
  const teachers = await Teacher.find();
  const rooms = await Room.find();
  const labs = await Lab.find().populate('supportedSubjects');
  const divisions = await Division.find({ semester, department: branch });
  const subjects = await Subject.find({ semester, branch });
  const batches = await Batch.find().populate('division');
  const constraints = await Constraint.findOne({ semester, department: branch });
  let settings = await TimetableSetting.findOne();
  if (!settings) {
    settings = {
      college_start_time: "09:00",
      college_end_time: "16:30",
      period_duration: 60,
      short_break_start: "11:00",
      short_break_end: "11:30",
      lunch_break_start: "13:30",
      lunch_break_end: "14:30"
    };
  }

  const generator = new TimetableGenerator({
    teachers,
    rooms,
    labs,
    divisions,
    subjects,
    constraints,
    batches,
    facultyMapping: {},
    settings,
  });

  const res = generator.generate();
  console.log("Success:", res.success);
  if (!res.success) {
    console.log("Error:", res.error);
  }
  process.exit();
};

run();
