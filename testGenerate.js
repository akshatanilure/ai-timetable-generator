const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const Teacher = require('./src/models/Teacher');
const Room = require('./src/models/Room');
const Lab = require('./src/models/Lab');
const Subject = require('./src/models/Subject');
const Division = require('./src/models/Division');
const Batch = require('./src/models/Batch');
const Constraint = require('./src/models/Constraint');
const TimetableGenerator = require('./src/services/timetableGenerator');

dotenv.config();

const testGenerate = async () => {
  try {
    await connectDB();
    
    const semester = 2;
    const branch = 'CSE';
    
    const teachers = await Teacher.find();
    const rooms = await Room.find();
    const labs = await Lab.find().populate('supportedSubjects');
    const divisions = await Division.find({ semester, department: branch });
    const subjects = await Subject.find({ semester, branch });
    const batches = await Batch.find().populate('division');
    const constraints = await Constraint.findOne({ semester, department: branch });

    // Build dummy facultyMapping
    const facultyMapping = {};
    for (const sub of subjects) {
      facultyMapping[sub._id.toString()] = {};
      if (sub.lectureHours > 0 || sub.tutorialHours > 0) {
        // Find a teacher that teaches this
        const t = teachers.find(t => t.subjectsHandled.includes(sub.subjectName));
        if (t) facultyMapping[sub._id.toString()].theory = t._id.toString();
        else facultyMapping[sub._id.toString()].theory = teachers[0]._id.toString();
      }
      if (sub.practicalHours > 0) {
        facultyMapping[sub._id.toString()].lab = [teachers[0]._id.toString(), teachers[1]._id.toString()];
      }
    }

    const generator = new TimetableGenerator({
      teachers,
      rooms,
      labs,
      divisions,
      subjects,
      constraints,
      batches,
      facultyMapping,
    });

    console.log(`Starting generation with ${subjects.length} subjects for Division: ${divisions[0]?.divisionName}`);
    const result = generator.generate();
    console.log('Result:', result.success ? 'SUCCESS' : 'FAILED');
    if (!result.success) console.log(result.error);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

testGenerate();
