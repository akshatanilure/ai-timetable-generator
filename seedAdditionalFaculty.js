const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const Teacher = require('./src/models/Teacher');

dotenv.config();

const FACULTY_LIST = [
  // CSE Department (23)
  { name: 'Dr. U. P. Kulkarni', department: 'CSE', designation: 'Professor', extraRoles: 'HOD', concessionHours: 2, maxWorkloadPerWeek: 12 },
  { name: 'Dr. Shrihari M. Joshi', department: 'CSE', designation: 'Professor', extraRoles: 'NAAC Coordinator', concessionHours: 1, maxWorkloadPerWeek: 13 },
  { name: 'Prof. Jayateerth V. Vadavi', department: 'CSE', designation: 'Associate Professor', extraRoles: 'Dean SW', concessionHours: 2, maxWorkloadPerWeek: 12 },
  { name: 'Dr. Raghavendra G. S.', department: 'CSE', designation: 'Associate Professor', extraRoles: 'MIS Officer', concessionHours: 2, maxWorkloadPerWeek: 12 },
  { name: 'Dr. S. B. Kulkarni', department: 'CSE', designation: 'Associate Professor', extraRoles: 'Dean IPD', concessionHours: 2, maxWorkloadPerWeek: 12 },
  { name: 'Dr. Nita G. Kulkarni', department: 'CSE', designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, maxWorkloadPerWeek: 16 },
  { name: 'Dr. Vidyagouri Kulkarni', department: 'CSE', designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, maxWorkloadPerWeek: 16 },
  { name: 'Dr. Ranganath G. Yadawad', department: 'CSE', designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, maxWorkloadPerWeek: 16 },
  { name: 'Dr. Anand Vaidya', department: 'CSE', designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, maxWorkloadPerWeek: 16 },
  { name: 'Dr. Shreedhar G. Yadawad', department: 'CSE', designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, maxWorkloadPerWeek: 16 },
  { name: 'Prof. Indira Umarji', department: 'CSE', designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, maxWorkloadPerWeek: 16 },
  { name: 'Prof. Govind Negalur', department: 'CSE', designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, maxWorkloadPerWeek: 16 },
  { name: 'Dr. Smitesh Patravali', department: 'CSE', designation: 'Assistant Professor', extraRoles: 'Coordinator CCF', concessionHours: 2, maxWorkloadPerWeek: 14 },
  { name: 'Dr. Sandhya S. V.', department: 'CSE', designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, maxWorkloadPerWeek: 16 },
  { name: 'Prof. Prathap Kumar M. K.', department: 'CSE', designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, maxWorkloadPerWeek: 16 },
  { name: 'Prof. Basavaraj Vaddatti', department: 'CSE', designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, maxWorkloadPerWeek: 16 },
  { name: 'Dr. Rani Shetty', department: 'CSE', designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, maxWorkloadPerWeek: 16 },
  { name: 'Prof. Rashmi Patil', department: 'CSE', designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, maxWorkloadPerWeek: 16 },
  { name: 'Prof. Yashodha Sambrani', department: 'CSE', designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, maxWorkloadPerWeek: 16 },
  { name: 'Prof. Anand S. Pashupatimath', department: 'CSE', designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, maxWorkloadPerWeek: 16 },
  { name: 'Dr. Sharada H. N.', department: 'CSE', designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, maxWorkloadPerWeek: 16 },
  { name: 'Prof. Chaitali Arun Chate (Dixit)', department: 'CSE', designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, maxWorkloadPerWeek: 16 },
  { name: 'Prof. Radhika Amashi', department: 'CSE', designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, maxWorkloadPerWeek: 16 },

  // Chemistry Department (3)
  { name: 'Prof. Priyanka', department: 'Chemistry', designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, maxWorkloadPerWeek: 16 },
  { name: 'Dr. Asma', department: 'Chemistry', designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, maxWorkloadPerWeek: 16 },
  { name: 'Dr. Sahana', department: 'Chemistry', designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, maxWorkloadPerWeek: 16 },

  // Electrical / EEE Department (3)
  { name: 'Prof. Sumangala Bhavikatti', department: 'Electrical / EEE', designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, maxWorkloadPerWeek: 16 },
  { name: 'Prof. Nandakumar C', department: 'Electrical / EEE', designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, maxWorkloadPerWeek: 16 },
  { name: 'Prof. Sanjeeth', department: 'Electrical / EEE', designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, maxWorkloadPerWeek: 16 },

  // Mathematics Department (7)
  { name: 'Dr. D. P. Basti', department: 'Mathematics', designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, maxWorkloadPerWeek: 16 },
  { name: 'Dr. Varsha Joshi', department: 'Mathematics', designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, maxWorkloadPerWeek: 16 },
  { name: 'Dr. Shailaja Shivalli', department: 'Mathematics', designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, maxWorkloadPerWeek: 16 },
  { name: 'Dr. Basavaraj H', department: 'Mathematics', designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, maxWorkloadPerWeek: 16 },
  { name: 'Dr. Preti B J', department: 'Mathematics', designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, maxWorkloadPerWeek: 16 },
  { name: 'Dr. Jennifer Kernel', department: 'Mathematics', designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, maxWorkloadPerWeek: 16 },
  { name: 'Dr. Prakash Badiger', department: 'Mathematics', designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, maxWorkloadPerWeek: 16 },

  // Physics Department (3)
  { name: 'Dr. Bahubali K M', department: 'Physics', designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, maxWorkloadPerWeek: 16 },
  { name: 'Dr. Kumar Madani', department: 'Physics', designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, maxWorkloadPerWeek: 16 },
  { name: 'Dr. Malathi', department: 'Physics', designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, maxWorkloadPerWeek: 16 },

  // Others Department (4)
  { name: 'Dr. Shashikant Kurodi', department: 'Others', designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, maxWorkloadPerWeek: 16 },
  { name: 'Prof. M. P. Vastrad', department: 'Others', designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, maxWorkloadPerWeek: 16 },
  { name: 'Prof. Tanveer Ahmed', department: 'Others', designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, maxWorkloadPerWeek: 16 },
  { name: 'Dr. Manjunath', department: 'Others', designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, maxWorkloadPerWeek: 16 }
];

const run = async () => {
  try {
    await connectDB();
    console.log('Synchronizing faculty members with the official list...\n');

    // Remove old teachers not in this list, or match them and update them
    // First, let's normalize helper
    const normalize = (s) => (s || '').toLowerCase().replace(/^(dr|prof|mr|mrs|ms|asst)\s+/g, '').replace(/[^a-z0-9]/g, '');

    const handledIds = new Set();

    for (const fac of FACULTY_LIST) {
      const normTarget = normalize(fac.name);

      // Find an existing teacher that closely matches
      const allExisting = await Teacher.find({});
      let matched = null;

      for (const t of allExisting) {
        if (handledIds.has(t._id.toString())) continue;
        const normExist = normalize(t.name);

        if (normExist === normTarget) {
          matched = t;
          break;
        }

        // Substring / alias checks
        if (normTarget.includes('upkulkarni') && normExist.includes('upkulkarni')) { matched = t; break; }
        if (normTarget.includes('sbkulkarni') && (normExist.includes('shrinivas') || normExist.includes('sbkulkarni'))) { matched = t; break; }
        if (normTarget.includes('jayateerth') && (normExist.includes('jayateerth') || normExist.includes('jvv'))) { matched = t; break; }
        if (normTarget.includes('shrihari') && normExist.includes('shrihari')) { matched = t; break; }
        if (normTarget.includes('raghavendra') && normExist.includes('raghavendra')) { matched = t; break; }
        if (normTarget.includes('smitesh') && (normExist.includes('smitesh') || normExist.includes('smilesh'))) { matched = t; break; }
        if (normTarget.includes('chaitali') && normExist.includes('chaitali')) { matched = t; break; }
        if (normTarget.includes('vastrad') && (normExist.includes('vastrad') || normExist.includes('vastarad'))) { matched = t; break; }
        if (normTarget.includes('pashupatimath') && normExist.includes('pashupatimath')) { matched = t; break; }
        if (normTarget.includes('sumangala') && (normExist.includes('sumangala') || normExist.includes('bavikatti'))) { matched = t; break; }
        if (normTarget.includes('nandakumar') && (normExist.includes('nandakumar') || normExist.includes('nankumar'))) { matched = t; break; }
        if (normTarget.includes('anandvaidya') && (normExist.includes('anandvaidya') || normExist.includes('ananddvaidya'))) { matched = t; break; }
        if (normTarget.includes('prathap') && (normExist.includes('prathap') || normExist.includes('pratap'))) { matched = t; break; }
        if (normTarget.includes('vaddatti') && (normExist.includes('vaddatti') || normExist.includes('vadadatti'))) { matched = t; break; }
      }

      if (matched) {
        handledIds.add(matched._id.toString());
        matched.name = fac.name;
        matched.department = fac.department;
        matched.designation = fac.designation;
        matched.extraRoles = fac.extraRoles;
        matched.concessionHours = fac.concessionHours;
        matched.maxWorkloadPerWeek = fac.maxWorkloadPerWeek;
        await matched.save();
        console.log(`[UPDATED] ${fac.name} -> ${fac.department}`);
      } else {
        const cleanName = fac.name.replace(/[^a-zA-Z]/g, '').toLowerCase();
        const email = `${cleanName}_${Date.now().toString().slice(-4)}@college.edu`;
        const newTeacher = await Teacher.create({
          name: fac.name,
          email,
          department: fac.department,
          designation: fac.designation,
          extraRoles: fac.extraRoles,
          concessionHours: fac.concessionHours,
          maxWorkloadPerWeek: fac.maxWorkloadPerWeek,
          subjectsHandled: []
        });
        handledIds.add(newTeacher._id.toString());
        console.log(`[CREATED] ${fac.name} -> ${fac.department}`);
      }
    }

    // Now remove any remaining teachers not in the official list
    const remainingTeachers = await Teacher.find({});
    let deletedCount = 0;
    for (const t of remainingTeachers) {
      if (!handledIds.has(t._id.toString())) {
        await Teacher.deleteOne({ _id: t._id });
        console.log(`[DELETED UNLISTED] ${t.name} (${t.department})`);
        deletedCount++;
      }
    }

    console.log(`\nSynchronization finished.`);
    console.log(`Total active teachers: ${handledIds.size}`);
    console.log(`Deleted obsolete/duplicate teachers: ${deletedCount}`);

    process.exit(0);
  } catch (err) {
    console.error('Error during faculty sync:', err);
    process.exit(1);
  }
};

run();
