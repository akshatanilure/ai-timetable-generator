const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/ai-timetable-generator').then(async () => {
  await mongoose.connection.db.collection('timetables').deleteMany({});
  await mongoose.connection.db.collection('teachers').updateMany({}, { $set: { currentWorkload: 0 } });
  console.log('Successfully cleared all timetables and reset teacher workloads!');
  process.exit(0);
}).catch(console.error);
