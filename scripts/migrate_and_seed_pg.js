const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Subject = require('../src/models/Subject');

const pgSubjects = [
  // Semester 1 (M.Tech CSE Curriculum)
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

  // Semester 2 (M.Tech CSE Curriculum)
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

  // Semester 3 (M.Tech CSE Curriculum)
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

  // Semester 4 (Internship / Project Only)
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

async function run() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-timetable-generator';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  // 1. Drop old single-field unique index if it exists
  try {
    await mongoose.connection.collection('subjects').dropIndex('subjectCode_1');
    console.log('Successfully dropped old single-field index: subjectCode_1');
  } catch (err) {
    console.log('subjectCode_1 index info:', err.message);
  }

  // 2. Ensure all existing subjects without program are set to 'UG'
  const ugUpdateResult = await mongoose.connection.collection('subjects').updateMany(
    { program: { $exists: false } },
    { $set: { program: 'UG' } }
  );
  console.log(`Updated existing subjects with program='UG':`, ugUpdateResult.modifiedCount);

  // 3. Upsert PG subjects
  let inserted = 0;
  let updated = 0;
  for (const s of pgSubjects) {
    const res = await Subject.findOneAndUpdate(
      { subjectCode: s.subjectCode, program: 'PG' },
      { $set: s },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    if (res) inserted++;
  }
  console.log(`Successfully seeded/updated ${inserted} PG subjects across Sem 1, 2, 3, 4!`);

  const countUG = await Subject.countDocuments({ program: 'UG' });
  const countPG = await Subject.countDocuments({ program: 'PG' });
  console.log(`Current DB State: UG Subjects = ${countUG}, PG Subjects = ${countPG}`);

  process.exit(0);
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
