const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const Subject = require('./src/models/Subject');
const Lab = require('./src/models/Lab');

dotenv.config();

const fixLabsAgain = async () => {
  try {
    await connectDB();
    const allLabSubjects = await Subject.find({ practicalHours: { $gt: 0 } });
    const allLabIds = allLabSubjects.map(s => s._id);

    await Lab.findOneAndUpdate(
      { labName: 'CS Lab 1' },
      { supportedSubjects: allLabIds }
    );

    console.log('Labs updated to support ALL subjects with practical hours.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

fixLabsAgain();
