const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Room = require('../src/models/Room');
const Lab = require('../src/models/Lab');
const Subject = require('../src/models/Subject');

async function migrate() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-timetable-generator';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB:', mongoUri);

  // 1. Drop old single-field unique indexes
  try {
    await mongoose.connection.collection('rooms').dropIndex('roomNumber_1');
    console.log('Dropped old index: roomNumber_1');
  } catch (err) {
    console.log('roomNumber_1 index:', err.message);
  }

  try {
    await mongoose.connection.collection('labs').dropIndex('labName_1');
    console.log('Dropped old index: labName_1');
  } catch (err) {
    console.log('labName_1 index:', err.message);
  }

  // 2. Set program: 'UG' on all legacy rooms and labs without program
  const roomUGUpdate = await mongoose.connection.collection('rooms').updateMany(
    { $or: [{ program: { $exists: false } }, { program: null }] },
    { $set: { program: 'UG' } }
  );
  console.log(`Updated legacy rooms to program='UG':`, roomUGUpdate.modifiedCount);

  const labUGUpdate = await mongoose.connection.collection('labs').updateMany(
    { $or: [{ program: { $exists: false } }, { program: null }] },
    { $set: { program: 'UG' } }
  );
  console.log(`Updated legacy labs to program='UG':`, labUGUpdate.modifiedCount);

  // 3. Create compound indexes
  await mongoose.connection.collection('rooms').createIndex({ roomNumber: 1, program: 1 }, { unique: true });
  console.log('Created compound index on rooms: { roomNumber: 1, program: 1 }');

  await mongoose.connection.collection('labs').createIndex({ labName: 1, program: 1 }, { unique: true });
  console.log('Created compound index on labs: { labName: 1, program: 1 }');

  // 4. Find PG lab subjects to support
  const pgLabSubjects = await Subject.find({ program: 'PG', subjectType: 'lab' });
  const pgSupportedIds = pgLabSubjects.map(s => s._id);

  // 5. Seed default PG Classroom (1 PG classroom)
  const defaultPGRoom = {
    roomNumber: 'PG-101',
    capacity: 30,
    roomType: 'lecture',
    program: 'PG'
  };

  await Room.findOneAndUpdate(
    { roomNumber: defaultPGRoom.roomNumber, program: 'PG' },
    { $set: defaultPGRoom },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log('Upserted default PG Classroom: PG-101');

  // 6. Seed default PG Laboratory (1 PG lab)
  const defaultPGLab = {
    labName: 'PG Computing Lab',
    labType: 'computer',
    capacity: 30,
    program: 'PG',
    supportedSubjects: pgSupportedIds,
    equipment: ['High-Performance Workstations', 'GPU Server', 'High-Speed LAN Switch']
  };

  await Lab.findOneAndUpdate(
    { labName: defaultPGLab.labName, program: 'PG' },
    { $set: defaultPGLab },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log('Upserted default PG Lab: PG Computing Lab');

  // 7. Verify Counts
  const ugRooms = await Room.countDocuments({ $or: [{ program: 'UG' }, { program: { $exists: false } }, { program: null }] });
  const pgRooms = await Room.countDocuments({ program: 'PG' });
  const ugLabs = await Lab.countDocuments({ $or: [{ program: 'UG' }, { program: { $exists: false } }, { program: null }] });
  const pgLabs = await Lab.countDocuments({ program: 'PG' });

  console.log('\n--- INFRASTRUCTURE COUNTS ---');
  console.log(`UG Classrooms: ${ugRooms} (Expected: 7)`);
  console.log(`UG Laboratories: ${ugLabs} (Expected: 8)`);
  console.log(`PG Classrooms: ${pgRooms} (Expected: 1)`);
  console.log(`PG Laboratories: ${pgLabs} (Expected: 1)`);

  const pgRoomList = await Room.find({ program: 'PG' }).lean();
  console.log('PG Rooms:', pgRoomList.map(r => `${r.roomNumber} (Cap: ${r.capacity}, Type: ${r.roomType})`));

  const pgLabList = await Lab.find({ program: 'PG' }).lean();
  console.log('PG Labs:', pgLabList.map(l => `${l.labName} (Cap: ${l.capacity}, Type: ${l.labType})`));

  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
