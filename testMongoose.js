const mongoose = require('mongoose');
const Timetable = require('./src/models/Timetable');
const User = require('./src/models/User');

mongoose.connect('mongodb://localhost:27017/ai-timetable-generator').then(async () => {
  try {
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) throw new Error("Admin user not found");

    const dummySchedule = [
      {
        day: 'Monday',
        startTime: '08:00',
        endTime: '09:00',
        subject: new mongoose.Types.ObjectId(),
        faculty: [new mongoose.Types.ObjectId()],
        room: undefined
      }
    ];

    const timetable = await Timetable.create({
      semester: 1,
      division: new mongoose.Types.ObjectId(),
      generatedSchedule: dummySchedule,
      createdBy: adminUser._id
    });
    console.log("Success:", timetable._id);
  } catch (err) {
    console.error("Mongoose Error:", err.message);
  } finally {
    process.exit(0);
  }
}).catch(console.error);
