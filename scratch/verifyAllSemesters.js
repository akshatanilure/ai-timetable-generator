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

async function testSemester(sem) {
  console.log(`\n==================================================`);
  console.log(`VERIFYING SEMESTER ${sem}`);
  console.log(`==================================================`);

  const subjects = await Subject.find({ semester: sem, branch: 'CSE' });
  const teachers = await Teacher.find();
  const rooms = await Room.find();
  const adminUser = await User.findOne({ role: 'admin' }) || await User.findOne();

  if (!subjects.length) {
    console.error(`No subjects found for Semester ${sem}!`);
    return;
  }

  const payload = {
    subjects: subjects.map(s => s.toObject()),
    teachers: teachers.map(t => t.toObject()),
    rooms: rooms.map(r => r.toObject()),
    constraints: {},
    facultyMapping: {},
    divisions: [{ name: 'DIV-A', strength: 60 }],
    facultyMaxWorkloads: {},
    fixedTimings: {},
    labsConfig: [{ id: 1, name: 'CS Lab 1', capacity: 30 }, { id: 2, name: 'CS Lab 2', capacity: 30 }, { id: 3, name: 'CS Lab 3', capacity: 30 }],
    semester: sem,
    branch: 'CSE'
  };

  const response = await fetch('http://127.0.0.1:8000/api/ml/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    console.error(`Python engine error for Sem ${sem}:`, await response.text());
    return;
  }

  const result = await response.json();
  console.log(`Sem ${sem} Generation Status: ${result.status} | Conflicts: ${result.message}`);

  const rawSchedule = result.rawSchedules['DIV-A'] || [];
  const labEntries = rawSchedule.filter(e => e.batch && e.batch.batchName);
  console.log(`Total Lab Entries: ${labEntries.length}`);

  let badTimings = 0;
  let batchMap = {};

  labEntries.forEach(entry => {
    const start = entry.startTime;
    const end = entry.endTime;
    const subCode = entry.subject?.subjectCode || entry.subject?.subjectName;
    const bName = entry.batch.batchName;

    const validStarts = (sem === 1 || sem === 2 || sem === 5) ? ['08:00', '10:30', '14:30'] : ['10:30', '14:30'];
    if (!validStarts.includes(start)) {
      badTimings++;
      console.error(`  ❌ Invalid Lab Start Time in Sem ${sem}: ${subCode} (${bName}) on ${entry.day} at ${start}-${end}`);
    }

    if (!batchMap[subCode]) batchMap[subCode] = new Set();
    batchMap[subCode].add(bName);
  });

  console.log(`Invalid Lab Timing Count: ${badTimings} ${badTimings === 0 ? '✔ PASS' : '❌ FAIL'}`);
  console.log(`Batch Distribution Per Lab Subject:`);
  for (const [subCode, batches] of Object.entries(batchMap)) {
    console.log(`  - ${subCode}: [${Array.from(batches).join(', ')}]`);
  }

  // Save to MongoDB
  const req = {
    user: { id: adminUser._id },
    body: {
      semester: sem,
      branch: 'CSE',
      rawSchedules: result.rawSchedules
    }
  };

  const res = {
    status(code) { this.statusCode = code; return this; },
    json(data) { this.jsonData = data; return this; }
  };

  await timetableController.saveTimetableML(req, res);
  if (res.jsonData && res.jsonData.success) {
    console.log(`✔ Successfully saved Sem ${sem} timetable to MongoDB! Saved ID: ${res.jsonData.data[0]._id}`);
  } else {
    console.error(`❌ Failed to save Sem ${sem} to MongoDB:`, res.jsonData);
  }
}

async function run() {
  await connectDB();
  for (let sem of [1, 2, 3, 4, 5, 6, 7]) {
    await testSemester(sem);
  }
  mongoose.disconnect();
}

run().catch(console.error);
