const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const Teacher = require('./src/models/Teacher');

dotenv.config();

const mathsFaculty = [
  'Dr. Basavaraj H',
  'Dr. Varsha Joshi',
  'Dr. Preti B J',
  'Dr. Jennifer Kernel',
  'Dr. Prakash Badiger'
];

const physicsFaculty = [
  'Dr. Bahubali K M',
  'Dr. Kumar Madani',
  'Dr. Malathi'
];

const chemistryFaculty = [
  'Dr. Asma',
  'Dr. Sahana'
];

const cseFaculty = [
  'Dr. Umakant P Kulkarni',
  'Dr. Shrihari M Joshi',
  'Prof. Jayateerth V Vadavi',
  'Dr. Raghavendra G.S.',
  'Dr. Shrinivas B. Kulkarni',
  'Prof. Nita G. Kulkarni',
  'Dr. Vidyagouri Kulkarni',
  'Dr. Ranganath G. Yadawad',
  'Prof. Anand Vaidya',
  'Prof. Anand Pashupatimath',
  'Dr. Archana Nandibewoor',
  'Prof. Shreedhar G. Yadawad',
  'Prof. Sandhya S. V.',
  'Prof. Prathap Kumar M.K.',
  'Prof. Basavaraj Vaddatti',
  'Prof. Govind G Negalur',
  'Dr. Smitesh D. Patravali',
  'Prof. Sharada H.N.',
  'Prof. Indira Umarji',
  'Prof. Rani R. Shetty',
  'Prof. Rashmi Patil',
  'Prof. Yashodha A Sambrani'
];

const run = async () => {
  try {
    await connectDB();

    console.log('Seeding and aligning faculty members...');

    const processFaculty = async (names, department) => {
      for (const name of names) {
        // Clean prefixes and punctuation
        const cleanName = name.replace(/\./g, '').trim();
        const searchName = cleanName.toLowerCase().replace(/^(dr|prof|mr|mrs|ms)\s+/g, '');
        const tokens = searchName.split(/\s+/).filter(tok => tok.length >= 2);
        
        let t = null;
        if (tokens.length >= 2) {
          // Token matching: find a teacher whose name contains all key tokens
          const queries = tokens.map(tok => ({ name: new RegExp(tok, 'i') }));
          t = await Teacher.findOne({ $and: queries });
        } else if (tokens.length === 1) {
          t = await Teacher.findOne({ name: new RegExp(tokens[0], 'i') });
        }

        if (!t) {
          // Try standard regex search
          const regex = new RegExp(`^${cleanName.split(/\s+/).join('\\s*\\.?\\s*')}$`, 'i');
          t = await Teacher.findOne({ name: regex });
        }

        const email = `${tokens.join('')}_${Date.now().toString().slice(-4)}@college.edu`;

        if (!t) {
          t = await Teacher.create({
            name,
            email,
            department,
            subjectsHandled: [],
            maxWorkloadPerWeek: 30
          });
          console.log(`[CREATED] ${name} -> ${department}`);
        } else {
          // Update name to correct/formal name, department to correct department
          const oldName = t.name;
          const oldDept = t.department;
          t.name = name; // set to formal name
          t.department = department;
          await t.save();
          console.log(`[UPDATED] "${oldName}" (${oldDept}) -> "${name}" (${department})`);
        }
      }
    };

    console.log('\n--- Maths Faculty ---');
    await processFaculty(mathsFaculty, 'Maths');

    console.log('\n--- Physics Faculty ---');
    await processFaculty(physicsFaculty, 'Physics');

    console.log('\n--- Chemistry Faculty ---');
    await processFaculty(chemistryFaculty, 'Chemistry');

    console.log('\n--- Computer Science Faculty ---');
    await processFaculty(cseFaculty, 'CSE');

    // Clean up any remaining teachers that are not in these lists and move them to CSE or keep them?
    // The user states "except maths chemistry and physics, for other subjects only these faculty list should appear".
    // Let's print out all teachers currently in database to check.
    const allTeachers = await Teacher.find({});
    console.log(`\nTotal teachers in database: ${allTeachers.length}`);
    
    console.log('\nFaculty alignment complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding faculty:', error);
    process.exit(1);
  }
};

run();
