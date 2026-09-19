const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../src/config/db');
const Subject = require('../src/models/Subject');
const Teacher = require('../src/models/Teacher');
const Room = require('../src/models/Room');
const ConflictChecker = require('../src/services/conflictChecker');

dotenv.config();

async function testSemesterRotation(sem) {
  console.log(`\n==================================================`);
  console.log(`TESTING LAB ALLOCATION FOR SEMESTER ${sem}`);
  console.log(`==================================================`);

  const subjects = await Subject.find({ semester: sem, branch: 'CSE' });
  const teachers = await Teacher.find();
  const rooms = await Room.find();

  if (!subjects.length) {
    console.error(`No subjects found for Semester ${sem}!`);
    return false;
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
    labsConfig: [
      { id: 1, name: 'CS Lab 1', capacity: 30 },
      { id: 2, name: 'CS Lab 2', capacity: 30 },
      { id: 3, name: 'CS Lab 3', capacity: 30 }
    ],
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
    return false;
  }

  const result = await response.json();
  console.log(`Sem ${sem} Generation Status: ${result.status} | Conflicts: ${result.message}`);

  const rawSchedule = result.rawSchedules['DIV-A'] || [];
  
  // 1. Group sessions by slot (day + startTime)
  const slotGroups = {};
  rawSchedule.forEach(s => {
    const key = `${s.day}_${s.startTime}`;
    if (!slotGroups[key]) slotGroups[key] = [];
    slotGroups[key].push(s);
  });

  console.log(`\n--- Parallel Lab Slots Analysis ---`);
  let labSlotsFound = 0;
  for (const [key, sessions] of Object.entries(slotGroups)) {
    const labSessions = sessions.filter(s => s.batch && s.batch.batchName);
    if (labSessions.length > 0) {
      labSlotsFound++;
      const [day, startTime] = key.split('_');
      console.log(`Slot on ${day} at ${startTime}-${labSessions[0].endTime}:`);
      labSessions.forEach(s => {
        const subCode = s.subject.subjectCode || s.subject.subjectName;
        const bName = s.batch.batchName;
        const room = s.room?.roomNumber || 'Room TBD';
        const facs = (s.faculty || []).map(f => f.name).join(', ');
        console.log(`   Batch ${bName} -> ${subCode} (Room: ${room}, Faculty: ${facs})`);
      });

      // Verify no duplicate lab subjects in this slot
      const codesInSlot = labSessions.map(s => s.subject.subjectCode || s.subject.subjectName);
      const uniqueCodes = new Set(codesInSlot);
      if (uniqueCodes.size !== codesInSlot.length) {
        console.error(`   ❌ FAIL: Duplicate lab subject in the same slot! (${codesInSlot.join(', ')})`);
      } else {
        console.log(`   ✔ All ${labSessions.length} parallel batches have DIFFERENT lab subjects!`);
      }
    }
  }

  // 2. Sem 7 Major Project check
  if (sem === 7) {
    const projSessions = rawSchedule.filter(s => {
      const code = s.subject.subjectCode || '';
      const name = (s.subject.subjectName || '').toLowerCase();
      return code.includes('22UCSL702') || name.includes('major project');
    });
    console.log(`\nSem 7 Major Project Sessions: ${projSessions.length}`);
    projSessions.forEach(ps => {
      console.log(`   Major Project on ${ps.day} at ${ps.startTime}-${ps.endTime}, Batch: ${ps.batch ? ps.batch.batchName : 'None (Whole Division)'}`);
      if (ps.batch && ps.batch.batchName) {
        console.error(`   ❌ FAIL: Major Project should NOT have a batch!`);
      } else {
        console.log(`   ✔ PASS: Major Project assigned to whole division at once!`);
      }
    });
  }

  // 3. Run ConflictChecker
  console.log(`\n--- ConflictChecker Validation ---`);
  // Attach semester info to sessions if missing for ConflictChecker
  rawSchedule.forEach(s => { s.semester = sem; });
  const checker = new ConflictChecker(rawSchedule);
  const checkResult = checker.checkAll();
  console.log(`Conflict count: ${checkResult.conflicts.length}`);
  if (checkResult.conflicts.length > 0) {
    console.error(`❌ Conflicts detected:`, JSON.stringify(checkResult.conflicts, null, 2));
    return false;
  } else {
    console.log(`✔ 0 conflicts detected by ConflictChecker!`);
    return true;
  }
}

async function run() {
  await connectDB();
  let allPass = true;
  for (const sem of [1, 2, 3, 4, 5, 7]) {
    const passed = await testSemesterRotation(sem);
    if (!passed) allPass = false;
  }
  console.log(`\n==================================================`);
  console.log(`FINAL RESULT: ${allPass ? 'ALL TESTS PASSED ✔' : 'SOME TESTS FAILED ❌'}`);
  console.log(`==================================================`);
  mongoose.disconnect();
}

run().catch(console.error);
