const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const Teacher = require('./src/models/Teacher');

dotenv.config();

const listTeachers = async () => {
  await connectDB();
  const teachers = await Teacher.find().sort({ name: 1 });
  console.log(`Total Teachers in DB: ${teachers.length}\n`);
  teachers.forEach(t => {
    console.log(`ID: ${t._id} | Name: "${t.name}" | Dept: ${t.department} | MaxWorkload: ${t.maxWorkloadPerWeek} | Designation: ${t.designation || 'N/A'}`);
  });
  mongoose.connection.close();
};

listTeachers().catch(console.error);
