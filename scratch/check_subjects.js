const mongoose = require('mongoose');
require('dotenv').config();
const Subject = require('../src/models/Subject');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/timetable');
  const ug = await Subject.find({ program: 'UG' });
  const pg = await Subject.find({ program: 'PG' });
  console.log('UG count:', ug.length, 'PG count:', pg.length);
  
  const bySem = {};
  pg.forEach(s => {
    bySem[s.semester] = bySem[s.semester] || [];
    bySem[s.semester].push({
      code: s.subjectCode,
      name: s.subjectName,
      credits: s.credits,
      ltp: `${s.lectureHours}-${s.tutorialHours}-${s.practicalHours}`,
      type: s.subjectType
    });
  });
  console.log('PG subjects by semester:\n', JSON.stringify(bySem, null, 2));
  
  await mongoose.disconnect();
}

check().catch(console.error);
