const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Subject = require('../src/models/Subject');

const newPgSem2Subjects = [
  {
    subjectCode: '24PCSC201',
    subjectName: 'Cryptography and Network Security (CNS)',
    department: 'CSE',
    semester: 2,
    subjectType: 'theory',
    lectureHours: 4,
    tutorialHours: 0,
    practicalHours: 0,
    credits: 4.0,
    elective: false,
    program: 'PG',
    branch: 'CSE',
  },
  {
    subjectCode: '24PCSC202',
    subjectName: 'Data Science and Engineering',
    department: 'CSE',
    semester: 2,
    subjectType: 'theory',
    lectureHours: 4,
    tutorialHours: 0,
    practicalHours: 0,
    credits: 4.0,
    elective: false,
    program: 'PG',
    branch: 'CSE',
  },
  {
    subjectCode: '24PCSE225',
    subjectName: 'Block Chain Technology',
    department: 'CSE',
    semester: 2,
    subjectType: 'elective',
    lectureHours: 4,
    tutorialHours: 0,
    practicalHours: 0,
    credits: 4.0,
    elective: true,
    program: 'PG',
    branch: 'CSE',
  },
  {
    subjectCode: '24PCSE226',
    subjectName: 'Image and Video Analytics',
    department: 'CSE',
    semester: 2,
    subjectType: 'elective',
    lectureHours: 4,
    tutorialHours: 0,
    practicalHours: 0,
    credits: 4.0,
    elective: true,
    program: 'PG',
    branch: 'CSE',
  },
  {
    subjectCode: '24PCSE229',
    subjectName: 'Agile Technologies',
    department: 'CSE',
    semester: 2,
    subjectType: 'elective',
    lectureHours: 4,
    tutorialHours: 0,
    practicalHours: 0,
    credits: 4.0,
    elective: true,
    program: 'PG',
    branch: 'CSE',
  },
  {
    subjectCode: '24PCSL201',
    subjectName: 'Data Science and Engineering Laboratory',
    department: 'CSE',
    semester: 2,
    subjectType: 'lab',
    lectureHours: 0,
    tutorialHours: 0,
    practicalHours: 2,
    credits: 1.0,
    elective: false,
    program: 'PG',
    branch: 'CSE',
  },
  {
    subjectCode: '24PCSL202',
    subjectName: 'Seminar',
    department: 'CSE',
    semester: 2,
    subjectType: 'project',
    lectureHours: 0,
    tutorialHours: 0,
    practicalHours: 2,
    credits: 1.0,
    elective: false,
    program: 'PG',
    branch: 'CSE',
  },
];

async function updatePG2() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-timetable-generator';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB:', mongoUri);

  // 1. Remove obsolete UG subjects that were mistakenly seeded in PG Sem 2
  const validSem2Codes = newPgSem2Subjects.map(s => s.subjectCode);
  const deletedSem2 = await Subject.deleteMany({
    program: 'PG',
    semester: 2,
    subjectCode: { $nin: validSem2Codes }
  });
  console.log('Removed obsolete PG Sem 2 subjects:', deletedSem2.deletedCount);

  // 2. Upsert each new PG Sem 2 subject
  for (const s of newPgSem2Subjects) {
    await Subject.findOneAndUpdate(
      { subjectCode: s.subjectCode, program: 'PG' },
      { $set: s },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  console.log(`Upserted ${newPgSem2Subjects.length} subjects for PG Sem 2`);

  // 3. Verify Counts
  const countUG = await Subject.countDocuments({
    $or: [{ program: 'UG' }, { program: { $exists: false } }, { program: null }]
  });
  const countPGS1 = await Subject.countDocuments({ program: 'PG', semester: 1 });
  const countPGS2 = await Subject.countDocuments({ program: 'PG', semester: 2 });
  const countPGS3 = await Subject.countDocuments({ program: 'PG', semester: 3 });
  const countPGS4 = await Subject.countDocuments({ program: 'PG', semester: 4 });

  console.log('\n--- VERIFICATION OF SUBJECT COUNTS ---');
  console.log(`UG Subjects count (MUST BE 72): ${countUG}`);
  console.log(`PG Sem 1 Subjects count (MUST BE 7): ${countPGS1}`);
  console.log(`PG Sem 2 Subjects count (MUST BE 7): ${countPGS2}`);
  console.log(`PG Sem 3 Subjects count (MUST BE 6): ${countPGS3}`);
  console.log(`PG Sem 4 Subjects count (MUST BE 2): ${countPGS4}`);

  const s2List = await Subject.find({ program: 'PG', semester: 2 }).lean();
  console.log('\nPG Sem 2 Current List:');
  s2List.forEach(s => {
    console.log(`  - [${s.subjectCode}] ${s.subjectName} | Cr: ${s.credits} | L-T-P: ${s.lectureHours}-${s.tutorialHours}-${s.practicalHours} | Type: ${s.subjectType} | Dept: ${s.department}`);
  });

  await mongoose.disconnect();
}

updatePG2().catch(err => {
  console.error('Error updating PG Sem 2:', err);
  process.exit(1);
});
