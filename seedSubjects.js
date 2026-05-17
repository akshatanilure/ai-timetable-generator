const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const Subject = require('./src/models/Subject');

dotenv.config();

const subjectsData = [
  // SEM 1
  { subjectCode: '101', subjectName: 'Mathematics I', semester: 1, branch: 'CSE', department: 'Computer Science', credits: 4, lectureHours: 3, tutorialHours: 1, practicalHours: 0, subjectType: 'theory' },
  { subjectCode: '102', subjectName: 'Chemistry for CSE', semester: 1, branch: 'CSE', department: 'Computer Science', credits: 4, lectureHours: 3, tutorialHours: 0, practicalHours: 2, subjectType: 'theory' },
  { subjectCode: '103', subjectName: 'Programming using C', semester: 1, branch: 'CSE', department: 'Computer Science', credits: 4, lectureHours: 2, tutorialHours: 0, practicalHours: 4, subjectType: 'lab' },
  { subjectCode: '104', subjectName: 'Electrical Engineering', semester: 1, branch: 'CSE', department: 'Computer Science', credits: 3, lectureHours: 3, tutorialHours: 0, practicalHours: 0, subjectType: 'theory' },
  { subjectCode: '105', subjectName: 'AI & Applications', semester: 1, branch: 'CSE', department: 'Computer Science', credits: 3, lectureHours: 3, tutorialHours: 0, practicalHours: 0, subjectType: 'theory' },
  { subjectCode: '106', subjectName: 'Professional Writing Skills', semester: 1, branch: 'CSE', department: 'Computer Science', credits: 1, lectureHours: 0, tutorialHours: 1, practicalHours: 0, subjectType: 'theory' },
  { subjectCode: '107', subjectName: 'Indian Constitution', semester: 1, branch: 'CSE', department: 'Computer Science', credits: 1, lectureHours: 1, tutorialHours: 0, practicalHours: 0, subjectType: 'theory' },
  { subjectCode: '108', subjectName: 'Scientific Foundations of Health', semester: 1, branch: 'CSE', department: 'Computer Science', credits: 1, lectureHours: 1, tutorialHours: 0, practicalHours: 0, subjectType: 'theory' },

  // SEM 2
  { subjectCode: '201', subjectName: 'Mathematics II', semester: 2, branch: 'CSE', department: 'Computer Science', credits: 4, lectureHours: 3, tutorialHours: 1, practicalHours: 0, subjectType: 'theory' },
  { subjectCode: '202', subjectName: 'Physics for CSE', semester: 2, branch: 'CSE', department: 'Computer Science', credits: 4, lectureHours: 3, tutorialHours: 0, practicalHours: 2, subjectType: 'theory' },
  { subjectCode: '203', subjectName: 'Engineering Drawing', semester: 2, branch: 'CSE', department: 'Computer Science', credits: 3, lectureHours: 1, tutorialHours: 0, practicalHours: 4, subjectType: 'lab' },
  { subjectCode: '204', subjectName: 'Electronics Engineering', semester: 2, branch: 'CSE', department: 'Computer Science', credits: 3, lectureHours: 3, tutorialHours: 0, practicalHours: 0, subjectType: 'theory' },
  { subjectCode: '205', subjectName: 'Advanced C Programming', semester: 2, branch: 'CSE', department: 'Computer Science', credits: 3, lectureHours: 2, tutorialHours: 0, practicalHours: 2, subjectType: 'lab' },
  { subjectCode: '206', subjectName: 'Communicative English', semester: 2, branch: 'CSE', department: 'Computer Science', credits: 1, lectureHours: 0, tutorialHours: 1, practicalHours: 0, subjectType: 'theory' },
  { subjectCode: '207', subjectName: 'Innovation and Design Thinking', semester: 2, branch: 'CSE', department: 'Computer Science', credits: 1, lectureHours: 1, tutorialHours: 0, practicalHours: 0, subjectType: 'theory' },
  { subjectCode: '208', subjectName: 'Kannada', semester: 2, branch: 'CSE', department: 'Computer Science', credits: 1, lectureHours: 1, tutorialHours: 0, practicalHours: 0, subjectType: 'theory' },

  // SEM 3
  { subjectCode: '301', subjectName: 'Data Structures', semester: 3, branch: 'CSE', department: 'Computer Science', credits: 3, lectureHours: 3, tutorialHours: 0, practicalHours: 0, subjectType: 'theory' },
  { subjectCode: '302', subjectName: 'DS Lab', semester: 3, branch: 'CSE', department: 'Computer Science', credits: 1, lectureHours: 0, tutorialHours: 0, practicalHours: 2, subjectType: 'lab' },
  { subjectCode: '303', subjectName: 'Digital Systems', semester: 3, branch: 'CSE', department: 'Computer Science', credits: 3, lectureHours: 3, tutorialHours: 0, practicalHours: 0, subjectType: 'theory' },
  { subjectCode: '304', subjectName: 'Digital Systems Lab', semester: 3, branch: 'CSE', department: 'Computer Science', credits: 1, lectureHours: 0, tutorialHours: 0, practicalHours: 2, subjectType: 'lab' },
  { subjectCode: '305', subjectName: 'Operating Systems', semester: 3, branch: 'CSE', department: 'Computer Science', credits: 3, lectureHours: 3, tutorialHours: 0, practicalHours: 0, subjectType: 'theory' },
  { subjectCode: '306', subjectName: 'Discrete Structures', semester: 3, branch: 'CSE', department: 'Computer Science', credits: 3, lectureHours: 3, tutorialHours: 0, practicalHours: 0, subjectType: 'theory' },
  { subjectCode: '307', subjectName: 'Unix Shell Programming', semester: 3, branch: 'CSE', department: 'Computer Science', credits: 2, lectureHours: 1, tutorialHours: 0, practicalHours: 2, subjectType: 'lab' },
  { subjectCode: '308', subjectName: 'UHV', semester: 3, branch: 'CSE', department: 'Computer Science', credits: 1, lectureHours: 1, tutorialHours: 0, practicalHours: 0, subjectType: 'theory' },

  // SEM 4
  { subjectCode: '401', subjectName: 'ADA', semester: 4, branch: 'CSE', department: 'Computer Science', credits: 4, lectureHours: 3, tutorialHours: 0, practicalHours: 2, subjectType: 'theory' },
  { subjectCode: '402', subjectName: 'OOP', semester: 4, branch: 'CSE', department: 'Computer Science', credits: 3, lectureHours: 3, tutorialHours: 0, practicalHours: 0, subjectType: 'theory' },
  { subjectCode: '403', subjectName: 'OOP Lab', semester: 4, branch: 'CSE', department: 'Computer Science', credits: 1, lectureHours: 0, tutorialHours: 0, practicalHours: 2, subjectType: 'lab' },
  { subjectCode: '404', subjectName: 'Web Technology', semester: 4, branch: 'CSE', department: 'Computer Science', credits: 3, lectureHours: 2, tutorialHours: 0, practicalHours: 2, subjectType: 'lab' },
  { subjectCode: '405', subjectName: 'PCPI', semester: 4, branch: 'CSE', department: 'Computer Science', credits: 3, lectureHours: 3, tutorialHours: 0, practicalHours: 0, subjectType: 'theory' },
  { subjectCode: '406', subjectName: 'PCPI Lab', semester: 4, branch: 'CSE', department: 'Computer Science', credits: 1, lectureHours: 0, tutorialHours: 0, practicalHours: 2, subjectType: 'lab' },
  { subjectCode: '407', subjectName: 'Biology for Engineers', semester: 4, branch: 'CSE', department: 'Computer Science', credits: 2, lectureHours: 2, tutorialHours: 0, practicalHours: 0, subjectType: 'theory' },
  { subjectCode: '408', subjectName: 'Project Management Tools', semester: 4, branch: 'CSE', department: 'Computer Science', credits: 1, lectureHours: 0, tutorialHours: 0, practicalHours: 2, subjectType: 'lab' },

  // SEM 5
  { subjectCode: '501', subjectName: 'Software Engineering', semester: 5, branch: 'CSE', department: 'Computer Science', credits: 3, lectureHours: 3, tutorialHours: 0, practicalHours: 0, subjectType: 'theory' },
  { subjectCode: '502', subjectName: 'DBMS', semester: 5, branch: 'CSE', department: 'Computer Science', credits: 3, lectureHours: 3, tutorialHours: 0, practicalHours: 0, subjectType: 'theory' },
  { subjectCode: '503', subjectName: 'Computer Networks', semester: 5, branch: 'CSE', department: 'Computer Science', credits: 3, lectureHours: 3, tutorialHours: 0, practicalHours: 0, subjectType: 'theory' },
  { subjectCode: '504', subjectName: 'IoT', semester: 5, branch: 'CSE', department: 'Computer Science', credits: 3, lectureHours: 3, tutorialHours: 0, practicalHours: 0, subjectType: 'theory' },
  { subjectCode: '505', subjectName: 'Digital Image Processing', semester: 5, branch: 'CSE', department: 'Computer Science', credits: 3, lectureHours: 3, tutorialHours: 0, practicalHours: 0, subjectType: 'theory' },
  { subjectCode: '506', subjectName: 'Python Lab', semester: 5, branch: 'CSE', department: 'Computer Science', credits: 1, lectureHours: 0, tutorialHours: 0, practicalHours: 2, subjectType: 'lab' },
  { subjectCode: '507', subjectName: 'DBMS Lab', semester: 5, branch: 'CSE', department: 'Computer Science', credits: 1, lectureHours: 0, tutorialHours: 0, practicalHours: 2, subjectType: 'lab' },
  { subjectCode: '508', subjectName: 'Minor Project I', semester: 5, branch: 'CSE', department: 'Computer Science', credits: 2, lectureHours: 0, tutorialHours: 0, practicalHours: 4, subjectType: 'project' },
  { subjectCode: '509', subjectName: 'Research Methodology', semester: 5, branch: 'CSE', department: 'Computer Science', credits: 2, lectureHours: 2, tutorialHours: 0, practicalHours: 0, subjectType: 'theory' },
  { subjectCode: '510', subjectName: 'Environmental Studies', semester: 5, branch: 'CSE', department: 'Computer Science', credits: 1, lectureHours: 1, tutorialHours: 0, practicalHours: 0, subjectType: 'theory' },

  // SEM 6
  { subjectCode: '601', subjectName: 'OOSD', semester: 6, branch: 'CSE', department: 'Computer Science', credits: 3, lectureHours: 3, tutorialHours: 0, practicalHours: 0, subjectType: 'theory' },
  { subjectCode: '602', subjectName: 'ATCD', semester: 6, branch: 'CSE', department: 'Computer Science', credits: 3, lectureHours: 3, tutorialHours: 0, practicalHours: 0, subjectType: 'theory' },
  { subjectCode: '603', subjectName: 'AI & ML', semester: 6, branch: 'CSE', department: 'Computer Science', credits: 3, lectureHours: 3, tutorialHours: 0, practicalHours: 0, subjectType: 'theory' },
  { subjectCode: '604', subjectName: 'ADSA', semester: 6, branch: 'CSE', department: 'Computer Science', credits: 3, lectureHours: 3, tutorialHours: 0, practicalHours: 0, subjectType: 'theory' },
  { subjectCode: '605', subjectName: 'Data Science', semester: 6, branch: 'CSE', department: 'Computer Science', credits: 3, lectureHours: 3, tutorialHours: 0, practicalHours: 0, subjectType: 'theory' },
  { subjectCode: '606', subjectName: 'Cloud Computing', semester: 6, branch: 'CSE', department: 'Computer Science', credits: 3, lectureHours: 3, tutorialHours: 0, practicalHours: 0, subjectType: 'theory' },
  { subjectCode: '607', subjectName: 'Network Management', semester: 6, branch: 'CSE', department: 'Computer Science', credits: 3, lectureHours: 3, tutorialHours: 0, practicalHours: 0, subjectType: 'theory' },
  { subjectCode: '608', subjectName: 'CN Lab', semester: 6, branch: 'CSE', department: 'Computer Science', credits: 1, lectureHours: 0, tutorialHours: 0, practicalHours: 2, subjectType: 'lab' },
  { subjectCode: '609', subjectName: 'AI ML Lab', semester: 6, branch: 'CSE', department: 'Computer Science', credits: 1, lectureHours: 0, tutorialHours: 0, practicalHours: 2, subjectType: 'lab' },
  { subjectCode: '610', subjectName: 'Minor Project II', semester: 6, branch: 'CSE', department: 'Computer Science', credits: 2, lectureHours: 0, tutorialHours: 0, practicalHours: 4, subjectType: 'project' },

  // SEM 7
  { subjectCode: '701', subjectName: 'Cryptography', semester: 7, branch: 'CSE', department: 'Computer Science', credits: 3, lectureHours: 3, tutorialHours: 0, practicalHours: 0, subjectType: 'theory' },
  { subjectCode: '702', subjectName: 'Distributed Systems', semester: 7, branch: 'CSE', department: 'Computer Science', credits: 3, lectureHours: 3, tutorialHours: 0, practicalHours: 0, subjectType: 'theory' },
  { subjectCode: '703', subjectName: 'NLP', semester: 7, branch: 'CSE', department: 'Computer Science', credits: 3, lectureHours: 3, tutorialHours: 0, practicalHours: 0, subjectType: 'theory' },
  { subjectCode: '704', subjectName: 'Software Testing', semester: 7, branch: 'CSE', department: 'Computer Science', credits: 3, lectureHours: 3, tutorialHours: 0, practicalHours: 0, subjectType: 'theory' },
  { subjectCode: '705', subjectName: 'Blockchain', semester: 7, branch: 'CSE', department: 'Computer Science', credits: 3, lectureHours: 3, tutorialHours: 0, practicalHours: 0, subjectType: 'theory' },
  { subjectCode: '706', subjectName: 'CNS Lab', semester: 7, branch: 'CSE', department: 'Computer Science', credits: 1, lectureHours: 0, tutorialHours: 0, practicalHours: 2, subjectType: 'lab' },
  { subjectCode: '707', subjectName: 'Major Project I', semester: 7, branch: 'CSE', department: 'Computer Science', credits: 3, lectureHours: 0, tutorialHours: 0, practicalHours: 6, subjectType: 'project' },
];

const seedSubjects = async () => {
  try {
    await connectDB();
    await Subject.deleteMany({ branch: 'CSE' });
    
    await Subject.insertMany(subjectsData);
    console.log('Subjects successfully inserted!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedSubjects();
