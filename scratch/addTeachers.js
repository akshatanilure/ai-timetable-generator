const mongoose = require('mongoose');
const Teacher = require('../src/models/Teacher');

mongoose.connect('mongodb://localhost:27017/ai-timetable-generator')
  .then(async () => {
    try {
      const teachersToAdd = [
        {
          name: 'Dr. U P Kulkarni',
          email: 'upkulkarni@college.edu',
          department: 'CSE',
          subjectsHandled: [],
          maxWorkloadPerWeek: 30
        },
        {
          name: 'Dr. Anand Vaidya',
          email: 'anandvaidya@college.edu',
          department: 'CSE',
          subjectsHandled: [],
          maxWorkloadPerWeek: 30
        }
      ];

      for (const tData of teachersToAdd) {
        const existing = await Teacher.findOne({ name: tData.name });
        if (existing) {
          console.log(`Teacher already exists: "${tData.name}"`);
        } else {
          const newTeacher = await Teacher.create(tData);
          console.log(`Successfully created teacher: "${newTeacher.name}" with ID: ${newTeacher._id}`);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      process.exit(0);
    }
  })
  .catch(console.error);
