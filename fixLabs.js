const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const Subject = require('./src/models/Subject');
const Lab = require('./src/models/Lab');

dotenv.config();

const fixLabs = async () => {
  try {
    await connectDB();
    const allLabSubjects = await Subject.find({ subjectType: 'lab' });
    const allLabIds = allLabSubjects.map(s => s._id);

    // Let's just make 'CS Lab 1' support ALL lab subjects for now so generator works
    await Lab.findOneAndUpdate(
      { labName: 'CS Lab 1' },
      { supportedSubjects: allLabIds }
    );

    console.log('Labs updated to support all new lab subjects.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

fixLabs();
