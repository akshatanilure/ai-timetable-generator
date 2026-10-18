const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Subject = require('../src/models/Subject');

const pgSem4Subjects = [
  {
    subjectCode: '24PCSL401',
    subjectName: 'Project Phase 2',
    department: 'CSE',
    semester: 4,
    subjectType: 'project',
    lectureHours: 0,
    tutorialHours: 0,
    practicalHours: 16,
    credits: 16.0,
    elective: false,
    program: 'PG',
    branch: 'CSE',
  },
  {
    subjectCode: '24PCSL402',
    subjectName: 'Internship in Industry',
    department: 'CSE',
    semester: 4,
    subjectType: 'project',
    lectureHours: 0,
    tutorialHours: 0,
    practicalHours: 6,
    credits: 4.0,
    elective: false,
    program: 'PG',
    branch: 'CSE',
  },
];

async function updateSem4() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-timetable-generator';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  // 1. Remove all non-internship/project or old UG subjects from PG Sem 4
  const sem4ValidCodes = pgSem4Subjects.map(s => s.subjectCode);
  const deleted = await Subject.deleteMany({
    program: 'PG',
    semester: 4,
    subjectCode: { $nin: sem4ValidCodes }
  });
  console.log('Removed obsolete/UG subjects from PG Sem 4:', deleted.deletedCount);

  // 2. Upsert PG Sem 4 Internship/Project subjects
  for (const s of pgSem4Subjects) {
    await Subject.findOneAndUpdate(
      { subjectCode: s.subjectCode, program: 'PG' },
      { $set: s },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  console.log('Upserted Sem 4 Project & Internship subjects');

  // 3. Complete Verification
  const countUG = await Subject.countDocuments({ program: 'UG' });
  console.log('\n--- VERIFICATION OF ALL PROGRAMS & SEMESTERS ---');
  console.log('Total UG Subjects (strictly unchanged):', countUG);

  const pgSems = [1, 2, 3, 4];
  for (const sem of pgSems) {
    const subs = await Subject.find({ program: 'PG', semester: sem }).lean();
    console.log(`\nPG Sem ${sem} (${subs.length} subjects):`);
    subs.forEach(s => {
      console.log(`  [${s.subjectCode}] ${s.subjectName} | Cr: ${s.credits} | L-T-P: ${s.lectureHours}-${s.tutorialHours}-${s.practicalHours} | Type: ${s.subjectType} | Dept: ${s.department}`);
    });
  }

  await mongoose.disconnect();
}

updateSem4().catch(err => {
  console.error(err);
  process.exit(1);
});
