const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const connectDB = require('../src/config/db');
const Subject = require('../src/models/Subject');

async function main() {
  await connectDB();
  const subs = await Subject.find({ semester: { $gte: 5 } });
  console.log("Sem 5, 6, 7 Subjects:");
  subs.forEach(s => {
    console.log(`Sem ${s.semester} | Code: ${s.subjectCode} | Name: ${s.subjectName} | Type: ${s.subjectType} | L:${s.lectureHours} T:${s.tutorialHours} P:${s.practicalHours}`);
  });
  mongoose.disconnect();
}

main();
