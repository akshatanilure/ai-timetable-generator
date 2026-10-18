const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://localhost:27017/ai-timetable-generator');
  const subjects = await mongoose.connection.collection('subjects').find({
    $or: [{ subjectName: /seminar/i }, { subjectName: /project/i }]
  }).toArray();

  console.log('Project / Seminar subjects found:');
  subjects.forEach(s => {
    console.log(`[${s.program || 'UG'}] Sem ${s.semester} | ${s.subjectCode} - ${s.subjectName} | Type: ${s.subjectType} | Cr: ${s.credits} | L-T-P: ${s.lectureHours}-${s.tutorialHours}-${s.practicalHours}`);
  });

  const pgSem2 = await mongoose.connection.collection('subjects').find({ program: 'PG', semester: 2 }).toArray();
  console.log('\nCurrent PG Sem 2 subjects:');
  pgSem2.forEach(s => {
    console.log(`  - ${s.subjectCode} - ${s.subjectName} | Type: ${s.subjectType} | Cr: ${s.credits}`);
  });

  process.exit(0);
}

run().catch(console.error);
