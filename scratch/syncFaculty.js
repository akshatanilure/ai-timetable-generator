const mongoose = require('mongoose');
require('dotenv').config();
const Teacher = require('../src/models/Teacher');

const cseFaculty = [
  'Dr. Umakant P Kulkarni',
  'Dr. Shrihari M Joshi',
  'Prof. Jayateerth V Vadavi',
  'Dr. Raghavendra G. S.',
  'Dr. Shrinivas B. Kulkarni',
  'Prof. Nita G. Kulkarni',
  'Dr. Vidyagouri Kulkarni',
  'Dr. Ranganath G. Yadawad',
  'Prof. Anand Vaidya',
  'Prof. Anand Pashupatimath',
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

const mathsFaculty = [
  'Dr. Basavaraj H',
  'Dr. D. P. Basti',
  'Dr. Jennifer Kernel',
  'Dr. Prakash Badiger',
  'Dr. Preti B J',
  'Dr. Shailaja Shivalli',
  'Dr. Varsha Joshi'
];

const physicsFaculty = [
  'Dr. Bahubali K M',
  'Dr. Kumar Madani',
  'Dr. Malathi'
];

const chemistryFaculty = [
  'Dr. Asma',
  'Dr. Sahana',
  'Prof. Priyanka'
];

const electricalFaculty = [
  'Prof. Sumangala Bhavikatti',
  'Prof. Nandakumar C',
  'Prof. Sanjeeth',
  'Prof. Kavya K'
];

const allTargetFaculty = [
  ...cseFaculty.map(name => ({ name, dept: 'CSE' })),
  ...mathsFaculty.map(name => ({ name, dept: 'Maths' })),
  ...physicsFaculty.map(name => ({ name, dept: 'Physics' })),
  ...chemistryFaculty.map(name => ({ name, dept: 'Chemistry' })),
  ...electricalFaculty.map(name => ({ name, dept: 'Electrical' }))
];

const cleanNameTokens = (name) => {
  return name
    .toLowerCase()
    .replace(/^(dr|prof|mr|mrs|ms|asst)\s+/g, '')
    .replace(/[\.\,\-\_]/g, ' ')
    .split(/\s+/)
    .filter(tok => tok.length >= 2);
};

const normalizeNameString = (name) => {
  return name
    .toLowerCase()
    .replace(/^(dr|prof|mr|mrs|ms|asst)\s+/g, '')
    .replace(/[\s\.\,\-\_]/g, '');
};

// Custom matching overrides
const isMatch = (targetName, dbName) => {
  const targetNorm = normalizeNameString(targetName);
  const dbNorm = normalizeNameString(dbName);
  
  if (targetNorm === dbNorm) return true;

  // Manual mappings
  const overrides = [
    { target: 'umakantpkulkarni', db: 'upkulkarni' },
    { target: 'jayateerthvvadavi', db: 'jvvadavi' },
    { target: 'sumangalabhavikatti', db: 'sumangalabavikatti' },
    { target: 'nandakumarc', db: 'nankumar' },
    { target: 'shreedhargyadawad', db: 'sgyadawad' },
    { target: 'ranganathgyadawad', db: 'rgyadawad' },
    { target: 'prathapkumarmk', db: 'pratapkumarmk' },
    { target: 'basavarajvaddatti', db: 'basavarajbvadadatti' },
    { target: 'sharadahn', db: 'sharadahn' }
  ];

  for (const pair of overrides) {
    if ((targetNorm.includes(pair.target) && dbNorm.includes(pair.db)) || 
        (targetNorm.includes(pair.db) && dbNorm.includes(pair.target))) {
      return true;
    }
  }

  // Token subsets
  const targetTokens = cleanNameTokens(targetName);
  const dbTokens = cleanNameTokens(dbName);

  if (targetTokens.length > 0 && dbTokens.length > 0) {
    // Check if targetTokens is subset of dbTokens or vice versa
    const isSubset1 = targetTokens.every(tok => dbTokens.some(dbTok => dbTok.includes(tok) || tok.includes(dbTok)));
    const isSubset2 = dbTokens.every(tok => targetTokens.some(targetTok => targetTok.includes(tok) || tok.includes(targetTok)));
    if (isSubset1 || isSubset2) {
      return true;
    }
  }

  return false;
};

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-timetable-generator')
  .then(async () => {
    try {
      console.log('Fetching all teachers from database...');
      const dbTeachers = await Teacher.find({});
      console.log(`Found ${dbTeachers.length} teachers in database.`);

      const matchedDbIds = new Set();
      const updatedOrCreated = [];

      for (const target of allTargetFaculty) {
        // Find if this target exists in the database
        let matchedTeacher = null;
        for (const t of dbTeachers) {
          if (!matchedDbIds.has(t._id.toString()) && isMatch(target.name, t.name)) {
            matchedTeacher = t;
            break;
          }
        }

        if (matchedTeacher) {
          matchedDbIds.add(matchedTeacher._id.toString());
          // Update details
          const oldName = matchedTeacher.name;
          const oldDept = matchedTeacher.department;
          matchedTeacher.name = target.name;
          matchedTeacher.department = target.dept;
          await matchedTeacher.save();
          console.log(`[UPDATED] "${oldName}" (${oldDept}) -> "${target.name}" (${target.dept})`);
          updatedOrCreated.push(matchedTeacher._id.toString());
        } else {
          // Create new teacher
          const tokens = cleanNameTokens(target.name);
          const email = `${tokens.join('')}_${Date.now().toString().slice(-4)}@college.edu`;
          const newTeacher = await Teacher.create({
            name: target.name,
            email,
            department: target.dept,
            subjectsHandled: [],
            maxWorkloadPerWeek: 30
          });
          console.log(`[CREATED] "${target.name}" (${target.dept})`);
          updatedOrCreated.push(newTeacher._id.toString());
        }
      }

      // Delete all teachers not matched or updated/created
      const finalTeachers = await Teacher.find({});
      let deleteCount = 0;
      for (const t of finalTeachers) {
        if (!updatedOrCreated.includes(t._id.toString())) {
          await Teacher.deleteOne({ _id: t._id });
          console.log(`[DELETED] "${t.name}" (${t.department})`);
          deleteCount++;
        }
      }

      console.log('\n--- SUMMARY ---');
      console.log(`Total target canonical faculty: ${allTargetFaculty.length}`);
      console.log(`Updated or created in DB: ${updatedOrCreated.length}`);
      console.log(`Deleted from DB: ${deleteCount}`);
      
      const count = await Teacher.countDocuments({});
      console.log(`Total active teachers in DB now: ${count}`);

      if (count === allTargetFaculty.length) {
        console.log('SUCCESS: Database is perfectly synchronized with the canonical faculty list.');
      } else {
        console.warn('WARNING: Total count mismatch. Double check the results.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      process.exit(0);
    }
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
