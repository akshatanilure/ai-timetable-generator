const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../src/config/db');
const Subject = require('../src/models/Subject');
const Teacher = require('../src/models/Teacher');
const Room = require('../src/models/Room');
const Timetable = require('../src/models/Timetable');
const User = require('../src/models/User');
const timetableController = require('../src/controllers/timetableController');

dotenv.config();

async function testSaveDirect() {
  await connectDB();
  const adminUser = await User.findOne({ role: 'admin' }) || await User.findOne();
  if (!adminUser) {
    console.error("No user found in DB");
    return;
  }

  const subjects = await Subject.find({ semester: 1, branch: 'CSE' });
  const teachers = await Teacher.find();
  const rooms = await Room.find();

  const payload = {
    subjects: subjects.map(s => s.toObject()),
    teachers: teachers.map(t => t.toObject()),
    rooms: rooms.map(r => r.toObject()),
    constraints: {},
    facultyMapping: {},
    divisions: [{ name: 'DIV-A', strength: 60 }],
    facultyMaxWorkloads: {},
    fixedTimings: {},
    labsConfig: [{ id: 1, name: 'CS Lab 1' }, { id: 2, name: 'CS Lab 2' }],
    semester: 1,
    branch: 'CSE'
  };

  const response = await fetch('http://127.0.0.1:8000/api/ml/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const mlData = await response.json();

  const req = {
    user: { id: adminUser._id },
    body: {
      semester: 1,
      branch: 'CSE',
      rawSchedules: mlData.rawSchedules
    }
  };

  const res = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    }
  };

  await timetableController.saveTimetableML(req, res);

  console.log(`Save Controller Status Code: ${res.statusCode}`);
  if (res.jsonData && res.jsonData.success) {
    const savedTimetableId = res.jsonData.data[0]._id;
    const tt = await Timetable.findById(savedTimetableId).populate('generatedSchedule.subject').populate('generatedSchedule.faculty');
    console.log(`Saved Timetable ID: ${tt._id}`);
    console.log(`Total Schedule Entries: ${tt.generatedSchedule.length}`);
    const labEntries = tt.generatedSchedule.filter(e => e.batch);
    console.log(`Lab Entries Count in DB: ${labEntries.length}`);
    labEntries.forEach(e => {
      console.log(`  - Day: ${e.day}, Slot: ${e.startTime}-${e.endTime}, Subject: ${e.subject?.subjectCode}, Faculty count: ${e.faculty.length}`);
    });
  } else {
    console.error("Save Error:", res.jsonData);
  }

  mongoose.disconnect();
}

testSaveDirect().catch(console.error);
