const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const connectDB = require('../src/config/db');
const Subject = require('../src/models/Subject');
const Teacher = require('../src/models/Teacher');
const Room = require('../src/models/Room');

async function testElectiveTiming(sem, peTiming, oeTiming) {
  console.log(`\n========================================`);
  console.log(`Testing Sem ${sem} Elective Timings`);
  console.log(`PE Timing: ${peTiming ? peTiming.day + ' @ ' + peTiming.time : 'None'}`);
  console.log(`OE Timing: ${oeTiming ? oeTiming.day + ' @ ' + oeTiming.time : 'None'}`);
  console.log(`========================================`);

  await connectDB();
  const subjects = await Subject.find({ semester: sem, branch: 'CSE' });
  const teachers = await Teacher.find();
  const rooms = await Room.find();

  const divisions = [{ name: 'DIV-A', strength: 60 }, { name: 'DIV-B', strength: 60 }];
  const fixedTimings = { 'DIV-A': {}, 'DIV-B': {} };

  subjects.forEach(s => {
    const code = (s.subjectCode || '').toUpperCase();
    const name = (s.subjectName || '').toLowerCase();
    const isPE = code.includes('UCSE') || name.includes('program elective') || name.includes('pe') || s.subjectType === 'elective';
    const isOE = code.includes('UCSO') || name.includes('open elective') || name.includes('oe');

    if (isPE && peTiming) {
      divisions.forEach(div => {
        fixedTimings[div.name][s._id] = [{ day: peTiming.day, time: peTiming.time }];
      });
    }

    if (isOE && oeTiming) {
      divisions.forEach(div => {
        fixedTimings[div.name][s._id] = [{ day: oeTiming.day, time: oeTiming.time }];
      });
    }
  });

  const payload = {
    subjects: subjects.map(s => s.toObject()),
    teachers: teachers.map(t => t.toObject()),
    rooms: rooms.map(r => r.toObject()),
    constraints: {},
    facultyMapping: {},
    divisions,
    facultyMaxWorkloads: {},
    fixedTimings,
    labsConfig: [{ id: 1, name: 'Lab 1' }, { id: 2, name: 'Lab 2' }],
    semester: sem,
    branch: 'CSE'
  };

  const response = await fetch('http://127.0.0.1:8000/api/ml/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`ML Engine response error: ${response.status} - ${await response.text()}`);
  }

  const result = await response.json();
  console.log(`ML Engine Status: ${result.status}, Message: ${result.message}`);

  // Assert timing for each division
  divisions.forEach(div => {
    const rawSched = result.rawSchedules[div.name] || [];
    console.log(`Division ${div.name} Schedule Entries: ${rawSched.length}`);

    if (peTiming) {
      const peEntries = rawSched.filter(e => e.subject.subjectCode.includes('UCSE'));
      peEntries.forEach(e => {
        console.log(`  - [PE] ${e.subject.subjectCode} (${e.subject.subjectName}): Day=${e.day}, Start=${e.startTime}`);
      });
    }

    if (oeTiming) {
      const oeEntries = rawSched.filter(e => e.subject.subjectCode.includes('UCSO'));
      oeEntries.forEach(e => {
        console.log(`  - [OE] ${e.subject.subjectCode} (${e.subject.subjectName}): Day=${e.day}, Start=${e.startTime}`);
      });
    }
  });

  mongoose.disconnect();
}

async function run() {
  await testElectiveTiming(5, { day: 'Monday', time: '08:00' }, null);
  await testElectiveTiming(6, { day: 'Wednesday', time: '10:30' }, { day: 'Friday', time: '14:30' });
  await testElectiveTiming(7, { day: 'Tuesday', time: '09:00' }, { day: 'Thursday', time: '11:30' });
}

run().catch(console.error);
