const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');

// Load Models
const User = require('./src/models/User');
const Teacher = require('./src/models/Teacher');
const Subject = require('./src/models/Subject');
const Room = require('./src/models/Room');
const Lab = require('./src/models/Lab');
const Division = require('./src/models/Division');
const Batch = require('./src/models/Batch');
const Constraint = require('./src/models/Constraint');
const Timetable = require('./src/models/Timetable');

dotenv.config();
connectDB();

const seedData = async () => {
  try {
    // 1. Clear existing data
    await Promise.all([
      User.deleteMany(),
      Teacher.deleteMany(),
      Subject.deleteMany(),
      Room.deleteMany(),
      Lab.deleteMany(),
      Division.deleteMany(),
      Batch.deleteMany(),
      Constraint.deleteMany(),
      Timetable.deleteMany(),
    ]);

    console.log('Database Cleared...');

    // 2. Create Users
    const users = await User.insertMany([
      { name: 'Admin', email: 'admin@college.edu', password: 'password123', role: 'admin' },
      { name: 'Dr. Sharma', email: 'sharma@college.edu', password: 'password123', role: 'teacher' },
      { name: 'Prof. Patil', email: 'patil@college.edu', password: 'password123', role: 'teacher' },
    ]);
    const adminId = users[0]._id;

    // 3. Create Teachers
    const teachers = await Teacher.insertMany([
      {
        name: 'Dr. Sharma',
        email: 'sharma@college.edu',
        department: 'Maths',
        subjectsHandled: ['Mathematics-I', 'Mathematics-II'],
        availability: [{ day: 'Monday', slots: [{ startTime: '09:00', endTime: '13:00' }] }],
        user: users[1]._id
      },
      {
        name: 'Prof. Patil',
        email: 'patil@college.edu',
        department: 'Computer Science',
        subjectsHandled: ['Programming in C', 'Artificial Intelligence'],
        user: users[2]._id
      },
      { name: 'Prof. Verma', email: 'verma@college.edu', department: 'Physics', subjectsHandled: ['Engineering Physics'] },
      { name: 'Dr. Iyer', email: 'iyer@college.edu', department: 'Chemistry', subjectsHandled: ['Engineering Chemistry'] },
      { name: 'Prof. Das', email: 'das@college.edu', department: 'Mechanical', subjectsHandled: ['Engineering Drawing'] },
      { name: 'Dr. Khan', email: 'khan@college.edu', department: 'Electrical', subjectsHandled: ['Basic Electrical Engineering'] },
    ]);

    // 4. Create Subjects
    const subjects = await Subject.insertMany([
      // Sem 1
      { subjectCode: 'MA101', subjectName: 'Mathematics-I', semester: 1, department: 'Computer Science', lectureHours: 4, credits: 4, subjectType: 'theory' },
      { subjectCode: 'PH101', subjectName: 'Engineering Physics', semester: 1, department: 'Computer Science', lectureHours: 3, credits: 4, subjectType: 'theory' },
      { subjectCode: 'CS101', subjectName: 'Programming in C', semester: 1, department: 'Computer Science', lectureHours: 3, credits: 4, subjectType: 'lab' },
      { subjectCode: 'ME101', subjectName: 'Engineering Drawing', semester: 1, department: 'Computer Science', lectureHours: 2, credits: 3, subjectType: 'theory' },
      
      // Sem 2
      { subjectCode: 'MA102', subjectName: 'Mathematics-II', semester: 2, department: 'Computer Science', lectureHours: 4, credits: 4, subjectType: 'theory' },
      { subjectCode: 'CH101', subjectName: 'Engineering Chemistry', semester: 2, department: 'Computer Science', lectureHours: 3, credits: 4, subjectType: 'theory' },
      { subjectCode: 'EE101', subjectName: 'Basic Electrical Engineering', semester: 2, department: 'Computer Science', lectureHours: 3, credits: 4, subjectType: 'theory' },
      { subjectCode: 'CS601', subjectName: 'Artificial Intelligence', semester: 6, department: 'Computer Science', lectureHours: 3, credits: 4, subjectType: 'theory' },
    ]);

    // 5. Create Rooms
    await Room.insertMany([
      { roomNumber: 'R101', capacity: 60, roomType: 'lecture' },
      { roomNumber: 'R102', capacity: 60, roomType: 'lecture' },
      { roomNumber: 'R201', capacity: 60, roomType: 'lecture' },
      { roomNumber: 'D1', capacity: 40, roomType: 'lecture' }, // Drawing hall mock
    ]);

    // 6. Create Labs
    await Lab.insertMany([
      { labName: 'CS Lab 1', labType: 'computer', capacity: 30, supportedSubjects: [subjects[2]._id], equipment: ['PCs', 'Server'] },
      { labName: 'Physics Lab', labType: 'physics', capacity: 30, supportedSubjects: [subjects[1]._id], equipment: ['Laser', 'Oscilloscope'] },
      { labName: 'Chemistry Lab', labType: 'chemistry', capacity: 30, supportedSubjects: [subjects[5]._id], equipment: ['Reagents', 'Titration Kits'] },
    ]);

    // 7. Create Divisions & Batches
    const div1 = await Division.create({ semester: 1, divisionName: 'A', department: 'Computer Science', strength: 60 });
    const div2 = await Division.create({ semester: 2, divisionName: 'B', department: 'Computer Science', strength: 60 });

    await Batch.insertMany([
      { batchName: 'A1', division: div1._id, studentCount: 30 },
      { batchName: 'A2', division: div1._id, studentCount: 30 },
      { batchName: 'B1', division: div2._id, studentCount: 30 },
      { batchName: 'B2', division: div2._id, studentCount: 30 },
    ]);

    // 8. Create Constraints
    await Constraint.insertMany([
      {
        semester: 1,
        department: 'Computer Science',
        hardConstraints: { noFacultyOverlap: true, noRoomOverlap: true, continuousLabs: true },
        createdBy: adminId
      },
      {
        semester: 2,
        department: 'Computer Science',
        hardConstraints: { noFacultyOverlap: true, noRoomOverlap: true, continuousLabs: true },
        createdBy: adminId
      }
    ]);

    console.log('Seed Data Inserted Successfully!');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedData();
