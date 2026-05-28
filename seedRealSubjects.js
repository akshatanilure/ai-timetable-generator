const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const Subject = require('./src/models/Subject');
const Teacher = require('./src/models/Teacher');
const User = require('./src/models/User');

dotenv.config();

const parseLTP = (ltp) => {
  if (ltp === 'Audit') return { l: 0, t: 0, p: 0 };
  const parts = ltp.split('-');
  return {
    l: parseInt(parts[0]) || 0,
    t: parseInt(parts[1]) || 0,
    p: parseInt(parts[2]) || 0,
  };
};

const subjectsRaw = [
  // SEM 1
  { code: '22MATS11', title: 'Mathematics – I for CSE Stream', credits: 4, ltp: '2-2-2', inst: 'Dr. D. P. Basti', sem: 1 },
  { code: '22CHES12', title: 'Chemistry for CSE Stream', credits: 4, ltp: '2-2-2', inst: 'Prof. Priyanka', sem: 1 },
  { code: '22POP13', title: 'Principles of Programming using C', credits: 3, ltp: '2-0-2', inst: 'Dr. Rani Shetty', sem: 1 },
  { code: '22ESC142', title: 'Introduction to Electrical Engineering', credits: 3, ltp: '3-0-0', inst: 'Prof. Kavya K', sem: 1 },
  { code: '22ETC100', title: 'Introduction to AI & its Applications', credits: 3, ltp: '3-0-0', inst: 'Dr. Raghavendra G. S', sem: 1 },
  { code: '22PWS16', title: 'Professional Writing Skills in English', credits: 1, ltp: '1-0-0', inst: 'Dr. Shashikant Kurodi', sem: 1 },
  { code: '22ICO17', title: 'Indian Constitution', credits: 1, ltp: '1-0-0', inst: 'Prof. M. P. Vastarad', sem: 1 },
  { code: '22SFH18', title: 'Scientific Foundations of Health', credits: 1, ltp: '1-0-0', inst: 'Prof. Chaitali Chate', sem: 1 },
  // SEM 2
  { code: '22MATS21', title: 'Mathematics – II for CSE Stream', credits: 4, ltp: '2-2-2', inst: 'Dr. Varsha Joshi', sem: 2 },
  { code: '22PHYS22', title: 'Physics for CSE Stream', credits: 4, ltp: '2-2-2', inst: 'Dr. Bahubali K. M', sem: 2 },
  { code: '22CED23', title: 'Computer Aided Engineering Drawing', credits: 3, ltp: '2-0-2', inst: 'Dr. Anilkumar H. C', sem: 2 },
  { code: '22ESC243', title: 'Introduction to Electronics Engineering', credits: 3, ltp: '3-0-0', inst: 'Prof. Sumangala Bavikatti', sem: 2 },
  { code: '22PLC25E', title: 'Advanced C Programming', credits: 3, ltp: '2-0-2', inst: 'Dr. Rani Shetty', sem: 2 },
  { code: '22ENG26', title: 'Communicative English', credits: 1, ltp: '1-0-0', inst: 'Dr. Shashikant Kurodi', sem: 2 },
  { code: '22SK27', title: 'Samskrutika Kannada / Balake Kannada', credits: 1, ltp: '1-0-0', inst: 'Dr. Maruti Kadam', sem: 2 },
  { code: '22IDT28', title: 'Innovation and Design Thinking', credits: 1, ltp: '1-0-1', inst: 'Prof. J. V. Vadavi', sem: 2 },
  // SEM 3
  { code: '22UMAC300', title: 'Engineering Mathematics – III', credits: 3, ltp: '2-2-0', inst: 'Dr. Shailaja Shivalli', sem: 3 },
  { code: '22UCSC300', title: 'Data Structures and Applications', credits: 4, ltp: '4-0-0', inst: 'Dr. Anand Vaidya', sem: 3 },
  { code: '22UCSC301', title: 'Digital Systems and Computer Architecture', credits: 3, ltp: '3-0-0', inst: 'Prof. J. V. Vadavi', sem: 3 },
  { code: '22UCSC302', title: 'Operating Systems', credits: 3, ltp: '3-0-0', inst: 'Dr. Nita G. Kulkarni', sem: 3 },
  { code: '22UCSL303', title: 'Data Structures and Applications Laboratory', credits: 1, ltp: '0-0-2', inst: 'Dr. Anand Vaidya', sem: 3 },
  { code: '22UCSL304', title: 'Digital Systems Laboratory', credits: 1, ltp: '0-0-2', inst: 'Prof. J. V. Vadavi', sem: 3 },
  { code: '22UCSC305', title: 'Discrete Structures for Computer Science', credits: 3, ltp: '3-0-0', inst: 'Prof. Pratapkumar M. K', sem: 3 },
  { code: '22UHVK306', title: 'Universal Human Values – II', credits: 1, ltp: '1-0-0', inst: 'Dr. Shashikant Kurodi', sem: 3 },
  { code: '22UCSE321', title: 'Unix Shell Programming', credits: 1, ltp: '0-0-2', inst: 'Prof. Govind Negalur', sem: 3 },
  // SEM 4
  { code: '22UMAC400', title: 'Engineering Mathematics – IV', credits: 3, ltp: '2-2-0', inst: 'Dr. Basavaraj H', sem: 4 },
  { code: '22UCSC400', title: 'Analysis and Design of Algorithms', credits: 3, ltp: '3-0-0', inst: 'Prof. Anand D. Vaidya', sem: 4 },
  { code: '22UCSC401', title: 'Object Oriented Programming', credits: 3, ltp: '3-0-0', inst: 'Prof. Chaitali Chate', sem: 4 },
  { code: '22UCSC402', title: 'Programming Computer Peripherals and Interfacing', credits: 3, ltp: '3-0-0', inst: 'Prof. Basavaraj B. Vadadatti', sem: 4 },
  { code: '22UCSL403', title: 'Object Oriented Programming Laboratory', credits: 1, ltp: '0-0-2', inst: 'Prof. Chaitali Chate', sem: 4 },
  { code: '22UCSL404', title: 'Programming Computer Peripherals and Interfacing Laboratory', credits: 1, ltp: '0-0-2', inst: 'Prof. Basavaraj B. Vadadatti', sem: 4 },
  { code: '22UPCSC405', title: 'Web Technology', credits: 3, ltp: '3-0-0', inst: 'Prof. Pratap Kumar M. K', sem: 4 },
  { code: '22UHVK406', title: 'Universal Human Values – III', credits: 1, ltp: '1-0-0', inst: 'Dr. Anand D. Vaidya', sem: 4 },
  { code: '22UCSE421', title: 'Project Management Tools', credits: 1, ltp: '0-0-2', inst: 'Dr. Shrinivasa B. Kulkarni', sem: 4 },
  { code: '22UBEK407', title: 'Biology for Engineers', credits: 1, ltp: '1-0-0', inst: 'Prof. Tanveer Ahmed', sem: 4 },
  // SEM 5
  { code: '22UCSC500', title: 'Software Engineering and Project Management', credits: 3, ltp: '3-0-0', inst: 'Dr. Smilesh D Patrawal', sem: 5 },
  { code: '22UCSC501', title: 'Database Management Systems', credits: 4, ltp: '4-0-0', inst: 'Dr. R. G. Yadawad', sem: 5 },
  { code: '22UCSC502', title: 'Computer Networks', credits: 4, ltp: '4-0-0', inst: 'Prof. Chaitali Chate', sem: 5 },
  { code: '22UCSE521', title: 'Internet of Things', credits: 4, ltp: '3-0-2', inst: 'Dr. Nita G Kulkarni', sem: 5 },
  { code: '22UCSC523', title: 'Digital Image Processing', credits: 4, ltp: '4-0-0', inst: 'Dr. Sharada H N', sem: 5 },
  { code: '22UCSL503', title: 'Python Programming Laboratory', credits: 1, ltp: '0-0-2', inst: 'Dr. Vidyagouri Kulkarni', sem: 5 },
  { code: '22UCSL504', title: 'Database Management Systems Laboratory', credits: 1, ltp: '0-0-2', inst: 'Dr. R. G. Yadawad', sem: 5 },
  { code: '22UCSL505', title: 'Minor Project – I', credits: 2, ltp: '0-0-4', inst: 'Dr. R. G. Yadawad', sem: 5 },
  { code: '22URMK506', title: 'Research Methodology and IPR', credits: 2, ltp: '2-0-0', inst: 'Dr. Smilesh D Patrawal', sem: 5 },
  { code: '22UESK507', title: 'Environmental Studies', credits: 1, ltp: '1-0-0', inst: 'Dr. Sharada H N', sem: 5 },
  // SEM 6
  { code: '22UCSC600', title: 'Object Oriented Systems Modeling and Design Patterns', credits: 4, ltp: '4-0-0', inst: 'Dr. U. P. Kulkarni', sem: 6 },
  { code: '22UCSC601', title: 'Automata Theory and Compiler Design', credits: 4, ltp: '4-0-0', inst: 'Dr. Vidyagouri Kulkarni', sem: 6 },
  { code: '22UCSC602', title: 'Artificial Intelligence and Machine Learning', credits: 3, ltp: '3-0-0', inst: 'Prof. Govind G Negalur', sem: 6 },
  { code: '22UCSE620', title: 'Advanced Data Structures and Algorithms', credits: 3, ltp: '3-0-0', inst: 'Dr. Sandhya S V', sem: 6 },
  { code: '22UCSE630', title: 'Data Science and Applications', credits: 3, ltp: '3-0-0', inst: 'Dr. Raghavendra G S', sem: 6 },
  { code: '22UCSO640', title: 'Cloud Computing', credits: 3, ltp: '3-0-0', inst: 'Dr. Shrinivasrao B Kulkarni', sem: 6 },
  { code: '22UCSO641', title: 'Network Management', credits: 3, ltp: '3-0-0', inst: 'Dr. Smilesh D Patrawal', sem: 6 },
  { code: '22UCSL603', title: 'Computer Networks Laboratory', credits: 1, ltp: '0-0-2', inst: 'Prof. Anand S P', sem: 6 },
  { code: '22UCSL604', title: 'AI and ML Laboratory', credits: 1, ltp: '0-0-2', inst: 'Prof. Govind G Negalur', sem: 6 },
  { code: '22UCSL605', title: 'Minor Project – II', credits: 2, ltp: '0-0-4', inst: 'Dr. Anand D Vaidya', sem: 6 },
  // SEM 7
  { code: '22UCSC700', title: 'Cryptography and Network Security', credits: 4, ltp: '4-0-0', inst: 'Dr. Sandhya S V', sem: 7 },
  { code: '22UCSE720', title: 'Distributed Systems and Applications', credits: 3, ltp: '3-0-0', inst: 'Dr. S. G. Yadawad', sem: 7 },
  { code: '22UCSE721', title: 'Natural Language Processing', credits: 3, ltp: '3-0-0', inst: 'Dr. Vidyagouri Kulkarni', sem: 7 },
  { code: '22UCSE731', title: 'Software Testing', credits: 3, ltp: '3-0-0', inst: 'Dr. Smilesh D Patrawal', sem: 7 },
  { code: '22UCSO740', title: 'Blockchain Technology', credits: 3, ltp: '3-0-0', inst: 'Prof. Anand S P', sem: 7 },
  { code: '22UCSL701', title: 'Cryptography and Network Security Laboratory', credits: 1, ltp: '0-0-2', inst: 'Dr. Sandhya S V', sem: 7 },
  { code: '22UCSL702', title: 'Major Project – I', credits: 6, ltp: '0-0-12', inst: 'Dr. Rani Shetty', sem: 7 },
];

const run = async () => {
  try {
    await connectDB();
    await Subject.deleteMany({ branch: 'CSE' });
    
    // Insert Teachers if not exist
    const teacherNames = [...new Set(subjectsRaw.map(s => s.inst).filter(Boolean))];
    let idx = 0;
    for (let name of teacherNames) {
      if (name === '—') continue;
      const t = await Teacher.findOne({ name });
      
      let dept = 'CSE';
      const nameLower = name.toLowerCase();
      if (nameLower.includes('basti') || nameLower.includes('varsha') || nameLower.includes('shivalli') || nameLower.includes('basavaraj h') || nameLower.includes('preti') || nameLower.includes('jennifer') || nameLower.includes('prakash')) {
        dept = 'Maths';
      } else if (nameLower.includes('bahubali') || nameLower.includes('madani') || nameLower.includes('malathi')) {
        dept = 'Physics';
      } else if (nameLower.includes('priyanka') || nameLower.includes('asma') || nameLower.includes('sahana')) {
        dept = 'Chemistry';
      }

      if (!t) {
        idx++;
        await Teacher.create({
          name,
          email: `teacher${idx}_${Date.now()}@college.edu`,
          department: dept,
          subjectsHandled: subjectsRaw.filter(s => s.inst === name).map(s => s.title),
          maxWorkloadPerWeek: 30
        });
      } else {
        await Teacher.findByIdAndUpdate(t._id, {
          department: dept,
          $addToSet: { subjectsHandled: { $each: subjectsRaw.filter(s => s.inst === name).map(s => s.title) } }
        });
      }
    }

    const newSubjects = subjectsRaw.map(s => {
      const ltp = parseLTP(s.ltp);
      let type = 'theory';
      if (ltp.p > 0 && ltp.l === 0) type = 'lab';
      if (s.title.includes('Project')) type = 'project';

      return {
        subjectCode: s.code,
        subjectName: s.title,
        semester: s.sem,
        branch: 'CSE',
        department: 'CSE',
        credits: s.credits === 'Audit' ? 0 : s.credits,
        lectureHours: ltp.l,
        tutorialHours: ltp.t,
        practicalHours: ltp.p,
        subjectType: type
      };
    });

    await Subject.insertMany(newSubjects);
    console.log('Real Subjects and Teachers seeded.');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};
run();
