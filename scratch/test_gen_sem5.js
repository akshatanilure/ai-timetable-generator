const connectDB = require('../src/config/db');
const Teacher = require('../src/models/Teacher');
const Subject = require('../src/models/Subject');
const Division = require('../src/models/Division');
const Room = require('../src/models/Room');
const Constraint = require('../src/models/Constraint');
const dotenv = require('dotenv');

dotenv.config();

const run = async () => {
  try {
    await connectDB();
    
    const semester = 5;
    const branch = 'CSE';
    
    const teachers = await Teacher.find({});
    const subjects = await Subject.find({ semester, branch });
    const divisions = await Division.find({ semester, department: branch });
    const rooms = await Room.find({});
    
    // Map teachers to subjects cleanly
    const facultyMapping = {};
    for (const sub of subjects) {
      facultyMapping[sub._id.toString()] = {};
      if (sub.lectureHours > 0) {
        // Find a teacher in CSE
        const t = teachers.find(t => t.department === 'CSE');
        if (t) facultyMapping[sub._id.toString()].theory = t._id.toString();
      }
      if (sub.practicalHours > 0) {
        const cseTeachers = teachers.filter(t => t.department === 'CSE');
        facultyMapping[sub._id.toString()].lab = [
          cseTeachers[0]?._id?.toString() || teachers[0]._id.toString(),
          cseTeachers[1]?._id?.toString() || teachers[0]._id.toString()
        ];
      }
    }
    
    const payload = {
      semester,
      branch,
      facultyMapping,
      divisions: divisions.map(d => ({ name: d.divisionName, strength: d.strength })),
      fixedTimings: {},
      facultyMaxWorkloads: {}
    };

    console.log('Logging in to get JWT token...');
    const loginRes = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@college.edu',
        password: 'password123'
      })
    });
    const authData = await loginRes.json();
    const token = authData.token;
    console.log('JWT Token acquired:', token ? 'YES' : 'NO');
    
    console.log('Sending request to generate-ml...');
    const startTime = Date.now();
    const res = await fetch('http://localhost:5001/api/timetables/generate-ml', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    
    const endTime = Date.now();
    console.log(`generate-ml call returned in ${(endTime - startTime)/1000}s`);
    
    const data = await res.json();
    console.log('Response status:', res.status);
    console.log('Response body:', JSON.stringify(data, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

run();
