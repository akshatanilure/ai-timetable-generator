const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../src/config/db');
const Subject = require('../src/models/Subject');
const Teacher = require('../src/models/Teacher');
const Room = require('../src/models/Room');
const Division = require('../src/models/Division');

dotenv.config();

async function testGeneration(sem, labsConfig) {
  console.log(`\n========================================`);
  console.log(`Testing Sem ${sem} CSE with ${labsConfig.length} labs`);
  console.log(`========================================`);

  await connectDB();
  const subjects = await Subject.find({ semester: sem, branch: 'CSE' });
  const teachers = await Teacher.find();
  const rooms = await Room.find();

  console.log(`Found ${subjects.length} subjects, ${teachers.length} teachers, ${rooms.length} rooms`);

  const payload = {
    subjects: subjects.map(s => s.toObject()),
    teachers: teachers.map(t => t.toObject()),
    rooms: rooms.map(r => r.toObject()),
    constraints: {},
    facultyMapping: {},
    divisions: [{ name: `DIV-A`, strength: 60 }],
    facultyMaxWorkloads: {},
    fixedTimings: {},
    labsConfig,
    semester: sem,
    branch: 'CSE'
  };

  const response = await fetch('http://127.0.0.1:8000/api/ml/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Python engine error: ${response.status} ${await response.text()}`);
  }

  const result = await response.json();
  console.log(`ML Engine Status: ${result.status}, Message: ${result.message}`);

  const rawSchedule = result.rawSchedules['DIV-A'] || [];
  console.log(`Total Schedule Entries: ${rawSchedule.length}`);

  let after430Count = 0;
  let batchFacultyCounts = [];
  let mathLabFullClassFound = false;

  for (const entry of rawSchedule) {
    if (entry.endTime > '16:30') {
      after430Count++;
      console.error(`FAILURE: Entry scheduled after 4:30 PM: ${entry.subject.subjectCode} ${entry.day} ${entry.startTime}-${entry.endTime}`);
    }

    if (entry.batch && entry.batch.batchName) {
      if (entry.batch.batchName === 'Full Class') {
        if (entry.subject.subjectName.toLowerCase().includes('math') || entry.subject.subjectName.toLowerCase().includes('mathematic')) {
          mathLabFullClassFound = true;
          console.log(`✔ Math Lab Full Class found: ${entry.subject.subjectName} on ${entry.day} ${entry.startTime}-${entry.endTime} in room ${entry.room?.roomNumber}`);
        }
      } else {
        batchFacultyCounts.push({
          batch: entry.batch.batchName,
          subject: entry.subject.subjectCode,
          facCount: entry.faculty ? entry.faculty.length : 0
        });
      }
    }
  }

  console.log(`Entries after 4:30 PM: ${after430Count}`);
  if (labsConfig.length === 2) {
    const expectedFacCount = 3;
    const allMatch = batchFacultyCounts.every(b => b.facCount === expectedFacCount);
    console.log(`Batch Faculty Counts (Expected 3 per batch for 2 labs): ${allMatch ? 'PASS (all 3)' : 'CHECK details'}`);
    batchFacultyCounts.slice(0, 4).forEach(b => console.log(`  - ${b.batch} (${b.subject}): ${b.facCount} faculty`));
  } else if (labsConfig.length === 3) {
    const expectedFacCount = 2;
    const allMatch = batchFacultyCounts.every(b => b.facCount === expectedFacCount);
    console.log(`Batch Faculty Counts (Expected 2 per batch for 3 labs): ${allMatch ? 'PASS (all 2)' : 'CHECK details'}`);
    batchFacultyCounts.slice(0, 4).forEach(b => console.log(`  - ${b.batch} (${b.subject}): ${b.facCount} faculty`));
  }

  console.log(`Math Lab Full Class Enforced: ${mathLabFullClassFound ? 'PASS' : 'FAIL/N/A'}`);
  mongoose.disconnect();
}

async function run() {
  const labs2 = [{ id: 1, name: 'CS Lab 1', capacity: 30 }, { id: 2, name: 'CS Lab 2', capacity: 30 }];
  const labs3 = [{ id: 1, name: 'CS Lab 1', capacity: 30 }, { id: 2, name: 'CS Lab 2', capacity: 30 }, { id: 3, name: 'CS Lab 3', capacity: 30 }];

  await testGeneration(1, labs2);
  await testGeneration(1, labs3);
  await testGeneration(2, labs2);
}

run().catch(console.error);
