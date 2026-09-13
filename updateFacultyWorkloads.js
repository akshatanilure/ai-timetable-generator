const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const Teacher = require('./src/models/Teacher');

dotenv.config();

const facultyList = [
  { name: 'Dr. U. P. Kulkarni', tokens: ['kulkarni', 'u'], altTokens: ['kulkarni', 'umakant'], designation: 'Professor & HOD', hours: 12 },
  { name: 'Dr. Shrihari M. Joshi', tokens: ['joshi', 'shrihari'], designation: 'Professor + NAAC Coordinator', hours: 13 },
  { name: 'Prof. Jayateerth V. Vadavi', tokens: ['vadavi', 'jayateerth'], altTokens: ['vadavi', 'j'], designation: 'Associate Professor + Dean SW', hours: 12 },
  { name: 'Dr. Raghavendra G. S.', tokens: ['raghavendra'], designation: 'Associate Professor + MIS Officer', hours: 12 },
  { name: 'Dr. S. B. Kulkarni', tokens: ['kulkarni', 'shrinivas'], altTokens: ['kulkarni', 's'], designation: 'Associate Professor + Dean IPD', hours: 12 },
  { name: 'Dr. Nita G. Kulkarni', tokens: ['kulkarni', 'nita'], designation: 'Assistant Professor', hours: 16 },
  { name: 'Dr. Vidyagouri Kulkarni', tokens: ['kulkarni', 'vidyagouri'], designation: 'Assistant Professor', hours: 16 },
  { name: 'Dr. Ranganath G. Yadawad', tokens: ['yadawad', 'ranganath'], altTokens: ['yadawad', 'r'], designation: 'Assistant Professor', hours: 16 },
  { name: 'Dr. Anand Vaidya', tokens: ['vaidya', 'anand'], designation: 'Assistant Professor', hours: 16 },
  { name: 'Dr. Shreedhar G. Yadawad', tokens: ['yadawad', 'shreedhar'], altTokens: ['yadawad', 's'], designation: 'Assistant Professor', hours: 16 },
  { name: 'Prof. Indira Umarji', tokens: ['umarji', 'indira'], designation: 'Assistant Professor', hours: 16 },
  { name: 'Prof. Govind Negalur', tokens: ['negalur', 'govind'], designation: 'Assistant Professor', hours: 16 },
  { name: 'Dr. Smitesh Patravali', tokens: ['patravali'], altTokens: ['patrawal'], designation: 'Assistant Professor + Coordinator CCF', hours: 14 },
  { name: 'Dr. Sandhya S. V.', tokens: ['sandhya'], designation: 'Assistant Professor', hours: 16 },
  { name: 'Prof. Prathap Kumar M. K.', tokens: ['prathap'], altTokens: ['pratap'], designation: 'Assistant Professor', hours: 16 },
  { name: 'Prof. Basavaraj Vaddatti', tokens: ['vaddatti'], altTokens: ['vadadatti'], designation: 'Assistant Professor', hours: 16 },
  { name: 'Dr. Rani Shetty', tokens: ['shetty', 'rani'], designation: 'Assistant Professor', hours: 16 },
  { name: 'Prof. Rashmi Patil', tokens: ['patil', 'rashmi'], designation: 'Assistant Professor', hours: 16 },
  { name: 'Prof. Yashodha Sambrani', tokens: ['sambrani', 'yashodha'], designation: 'Assistant Professor', hours: 16 },
  { name: 'Prof. Anand S. Pashupatimath', tokens: ['pashupatimath'], designation: 'Assistant Professor', hours: 16 },
  { name: 'Dr. Sharada H. N.', tokens: ['sharada'], designation: 'Assistant Professor', hours: 16 },
  { name: 'Prof. Chaitali Arun Chate (Dixit)', tokens: ['chate'], designation: 'Assistant Professor', hours: 16 },
  { name: 'Prof. Radhika Amashi', tokens: ['amashi'], designation: 'Assistant Professor', hours: 16 }
];

const run = async () => {
  await connectDB();
  console.log('Updating faculty designations and workload limits in DB...\n');

  const teachers = await Teacher.find();
  for (const fac of facultyList) {
    const matches = teachers.filter(t => {
      const dbNorm = t.name.toLowerCase().replace(/[^a-z]/g, '');
      const matchPrimary = fac.tokens.every(tok => dbNorm.includes(tok));
      const matchAlt = fac.altTokens ? fac.altTokens.every(tok => dbNorm.includes(tok)) : false;
      return matchPrimary || matchAlt;
    });

    if (matches.length > 0) {
      for (const m of matches) {
        m.designation = fac.designation;
        m.maxWorkloadPerWeek = fac.hours;
        await m.save();
        console.log(`[UPDATED] ${m.name} -> Designation: "${fac.designation}" | Workload Limit: ${fac.hours} hours`);
      }
    } else {
      const cleanTokens = fac.name.toLowerCase().replace(/[^a-z]/g, '');
      const email = `${cleanTokens}@college.edu`;
      const created = await Teacher.create({
        name: fac.name,
        email,
        department: 'CSE',
        designation: fac.designation,
        maxWorkloadPerWeek: fac.hours
      });
      console.log(`[CREATED] ${fac.name} -> Designation: "${fac.designation}" | Workload Limit: ${fac.hours} hours`);
    }
  }

  const others = await Teacher.find({ maxWorkloadPerWeek: 30 });
  for (const o of others) {
    o.maxWorkloadPerWeek = 16;
    if (!o.designation) o.designation = 'Assistant Professor';
    await o.save();
    console.log(`[UPDATED OTHER] ${o.name} -> Workload Limit: 16 hours`);
  }

  console.log('\nDone updating faculty workloads!');
  mongoose.connection.close();
};

run().catch(console.error);
