const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const Division = require('./src/models/Division');
const Batch = require('./src/models/Batch');

dotenv.config();

const fixDivisions = async () => {
  try {
    await connectDB();
    
    // Create divisions for Semester 1 to 8 for CSE
    for (let i = 1; i <= 8; i++) {
      let div = await Division.findOne({ semester: i, department: 'CSE' });
      if (!div) {
        div = await Division.create({
          semester: i,
          divisionName: 'A',
          department: 'CSE',
          strength: 60
        });
        
        // Create Batches for Labs
        await Batch.insertMany([
          { batchName: `S${i}-B1`, division: div._id, studentCount: 30 },
          { batchName: `S${i}-B2`, division: div._id, studentCount: 30 },
        ]);
        console.log(`Created Division and Batches for Sem ${i} CSE`);
      }
    }

    console.log('Divisions and Batches fixed.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

fixDivisions();
