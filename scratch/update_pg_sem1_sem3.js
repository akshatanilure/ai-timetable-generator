const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Subject = require('../src/models/Subject');

const newPgSem1Subjects = [
  {
    subjectCode: '26PCSC101',
    subjectName: 'Applied Mathematics',
    department: 'Mathematics',
    semester: 1,
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
    subjectCode: '26PCSC102',
    subjectName: 'Advanced AIML',
    department: 'CSE',
    semester: 1,
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
    subjectCode: '26PCSC103',
    subjectName: 'Advanced Computer Networks',
    department: 'CSE',
    semester: 1,
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
    subjectCode: '26PCSC104',
    subjectName: 'Advanced Operating Systems',
    department: 'CSE',
    semester: 1,
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
    subjectCode: '26PCSE1051',
    subjectName: 'Block Chain Technology',
    department: 'CSE',
    semester: 1,
    subjectType: 'elective',
    lectureHours: 3,
    tutorialHours: 0,
    practicalHours: 0,
    credits: 3.0,
    elective: true,
    program: 'PG',
    branch: 'CSE',
  },
  {
    subjectCode: '26PCSL106',
    subjectName: 'Advanced AIML Lab',
    department: 'CSE',
    semester: 1,
    subjectType: 'lab',
    lectureHours: 0,
    tutorialHours: 0,
    practicalHours: 2,
    credits: 2.0,
    elective: false,
    program: 'PG',
    branch: 'CSE',
  },
  {
    subjectCode: '26PCSE107',
    subjectName: 'Research Methodology and IPR',
    department: 'CSE',
    semester: 1,
    subjectType: 'theory',
    lectureHours: 3,
    tutorialHours: 0,
    practicalHours: 0,
    credits: 3.0,
    elective: false,
    program: 'PG',
    branch: 'CSE',
  },
];

const newPgSem3Subjects = [
  {
    subjectCode: '24PCSC301',
    subjectName: 'Cloud Computing Concepts and Applications',
    department: 'CSE',
    semester: 3,
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
    subjectCode: '24PCSE325',
    subjectName: 'Natural Language Processing and Text Mining',
    department: 'CSE',
    semester: 3,
    subjectType: 'elective',
    lectureHours: 3,
    tutorialHours: 0,
    practicalHours: 0,
    credits: 3.0,
    elective: true,
    program: 'PG',
    branch: 'CSE',
  },
  {
    subjectCode: '24PCSE330',
    subjectName: 'Cyber Forensic',
    department: 'CSE',
    semester: 3,
    subjectType: 'elective',
    lectureHours: 3,
    tutorialHours: 0,
    practicalHours: 0,
    credits: 3.0,
    elective: true,
    program: 'PG',
    branch: 'CSE',
  },
  {
    subjectCode: '24PCSL301',
    subjectName: 'Internship in Industry or R&D Organization',
    department: 'CSE',
    semester: 3,
    subjectType: 'project',
    lectureHours: 0,
    tutorialHours: 0,
    practicalHours: 6,
    credits: 3.0,
    elective: false,
    program: 'PG',
    branch: 'CSE',
  },
  {
    subjectCode: '24PCSE331',
    subjectName: 'Data Stream Mining',
    department: 'CSE',
    semester: 3,
    subjectType: 'elective',
    lectureHours: 3,
    tutorialHours: 0,
    practicalHours: 0,
    credits: 3.0,
    elective: true,
    program: 'PG',
    branch: 'CSE',
  },
  {
    subjectCode: '24PCSL302',
    subjectName: 'Project Phase 1',
    department: 'CSE',
    semester: 3,
    subjectType: 'project',
    lectureHours: 0,
    tutorialHours: 0,
    practicalHours: 4,
    credits: 3.0,
    elective: false,
    program: 'PG',
    branch: 'CSE',
  },
];

async function updatePGSubjects() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-timetable-generator';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB:', mongoUri);

  // 1. Remove old erroneous subjects in PG Sem 1 and PG Sem 3
  const validSem1Codes = newPgSem1Subjects.map(s => s.subjectCode);
  const validSem3Codes = newPgSem3Subjects.map(s => s.subjectCode);

  const deletedSem1 = await Subject.deleteMany({
    program: 'PG',
    semester: 1,
    subjectCode: { $nin: validSem1Codes }
  });
  console.log('Removed obsolete PG Sem 1 subjects:', deletedSem1.deletedCount);

  const deletedSem3 = await Subject.deleteMany({
    program: 'PG',
    semester: 3,
    subjectCode: { $nin: validSem3Codes }
  });
  console.log('Removed obsolete PG Sem 3 subjects:', deletedSem3.deletedCount);

  // 2. Upsert PG Sem 1 subjects (avoids duplicates)
  for (const s of newPgSem1Subjects) {
    await Subject.findOneAndUpdate(
      { subjectCode: s.subjectCode, program: 'PG' },
      { $set: s },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  console.log(`Upserted ${newPgSem1Subjects.length} subjects for PG Sem 1`);

  // 3. Upsert PG Sem 3 subjects (avoids duplicates)
  for (const s of newPgSem3Subjects) {
    await Subject.findOneAndUpdate(
      { subjectCode: s.subjectCode, program: 'PG' },
      { $set: s },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  console.log(`Upserted ${newPgSem3Subjects.length} subjects for PG Sem 3`);

  // 4. Verify DB Counts and Integrity
  const countUG = await Subject.countDocuments({ program: 'UG' });
  const countPGS1 = await Subject.countDocuments({ program: 'PG', semester: 1 });
  const countPGS2 = await Subject.countDocuments({ program: 'PG', semester: 2 });
  const countPGS3 = await Subject.countDocuments({ program: 'PG', semester: 3 });
  const countPGS4 = await Subject.countDocuments({ program: 'PG', semester: 4 });

  console.log('\n--- VERIFICATION ---');
  console.log(`UG Subjects count (MUST BE UNCHANGED): ${countUG}`);
  console.log(`PG Sem 1 Subjects count: ${countPGS1}`);
  console.log(`PG Sem 2 Subjects count (UNMODIFIED): ${countPGS2}`);
  console.log(`PG Sem 3 Subjects count: ${countPGS3}`);
  console.log(`PG Sem 4 Subjects count (UNMODIFIED): ${countPGS4}`);

  const s1List = await Subject.find({ program: 'PG', semester: 1 }).lean();
  console.log('\nPG Sem 1 List:');
  s1List.forEach(s => console.log(`  - ${s.subjectCode}: ${s.subjectName} | Cr: ${s.credits} | L-T-P: ${s.lectureHours}-${s.tutorialHours}-${s.practicalHours} | Type: ${s.subjectType} | Dept: ${s.department}`));

  const s3List = await Subject.find({ program: 'PG', semester: 3 }).lean();
  console.log('\nPG Sem 3 List:');
  s3List.forEach(s => console.log(`  - ${s.subjectCode}: ${s.subjectName} | Cr: ${s.credits} | L-T-P: ${s.lectureHours}-${s.tutorialHours}-${s.practicalHours} | Type: ${s.subjectType} | Dept: ${s.department}`));

  await mongoose.disconnect();
}

updatePGSubjects().catch(err => {
  console.error(err);
  process.exit(1);
});
