const mongoose = require('mongoose');
const Teacher = require('../src/models/Teacher');

mongoose.connect('mongodb://localhost:27017/ai-timetable-generator')
  .then(async () => {
    try {
      const teachers = await Teacher.find({}, 'name department');
      console.log('--- START TEACHER LIST ---');
      console.log(`TOTAL_COUNT:${teachers.length}`);
      teachers.forEach((t, i) => {
        console.log(`${i + 1}. Name: ${t.name} | Dept: ${t.department}`);
      });
      console.log('--- END TEACHER LIST ---');
    } catch (err) {
      console.error(err);
    } finally {
      process.exit(0);
    }
  })
  .catch(console.error);
