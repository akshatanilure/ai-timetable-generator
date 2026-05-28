const mongoose = require('mongoose');
const Timetable = require('./src/models/Timetable');
const Division = require('./src/models/Division');
const Subject = require('./src/models/Subject');
const Teacher = require('./src/models/Teacher');
const Room = require('./src/models/Room');

mongoose.connect('mongodb://localhost:27017/ai-timetable-generator').then(async () => {
  try {
    const subjects = await Subject.find({ semester: 1, branch: 'CSE' });
    const teachers = await Teacher.find();
    const rooms = await Room.find();

    const payload = {
      subjects, teachers, rooms,
      constraints: {}, facultyMapping: {}, divisions: [{name: 'DIV-A', strength: 60}], facultyMaxWorkloads: {}, fixedTimings: {}
    };

    const pythonRes = await fetch('http://127.0.0.1:8000/api/ml/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const mlData = await pythonRes.json();
    const rawSchedules = mlData.rawSchedules;

    let div = await Division.findOne({ divisionName: 'DIV-A' });
    if (!div) div = await Division.create({ divisionName: 'DIV-A', semester: 1, department: 'CSE', totalStudents: 60 });

    for (const [divName, schedule] of Object.entries(rawSchedules)) {
      const formattedSchedule = schedule.map(entry => ({
        day: entry.day,
        startTime: entry.startTime,
        endTime: entry.endTime,
        subject: entry.subject._id,
        faculty: entry.faculty.map(f => f._id),
        room: entry.room && entry.room._id ? entry.room._id : undefined
      }));

      const timetable = new Timetable({
        semester: 1,
        division: div._id,
        generatedSchedule: formattedSchedule,
        createdBy: div._id // dummy
      });
      await timetable.validate();
      console.log("Validation Successful!");
    }
  } catch (err) {
    console.error("Mongoose Error:", err.message);
    if (err.errors) {
      Object.keys(err.errors).forEach(key => console.error(key, err.errors[key].message));
    }
  } finally {
    process.exit(0);
  }
});
