const mongoose = require('mongoose');
const dotenv = require('dotenv');
const XLSX = require('xlsx');
dotenv.config();

function normalizeTeacherName(name) {
  return (name || '')
    .toLowerCase()
    .replace(/\b(dr|prof|mr|mrs|ms)\b\.?/gi, '')
    .replace(/[^a-z]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getTokens(normName) {
  const synonyms = {
    'maddani': 'madani',
    'jenifer': 'jennifer',
    'karnel': 'kernel',
    'pratap': 'prathap',
    'neglur': 'negalur',
    'yashoda': 'yashodha',
    'bavikatti': 'bhavikatti',
    'sharadha': 'sharada',
    'preeti': 'preti',
    'uamrji': 'umarji',
    'vidyagori': 'vidyagouri',
    'shirkol': 'shivalli',
    'shirakol': 'shivalli'
  };
  return normName.split(' ').filter(Boolean).map(t => synonyms[t] || t);
}

function matchTeacher(rawName, dbTeachers) {
  if (!rawName) return null;
  const firstNameOnly = rawName.split(/[\/&]/)[0].trim();
  const normRaw = normalizeTeacherName(firstNameOnly);
  if (!normRaw) return null;

  // 1. Direct exact string match
  let match = dbTeachers.find(t => normalizeTeacherName(t.name) === normRaw);
  if (match) return match;

  const rawToks = getTokens(normRaw);
  const rawInitials = rawToks.filter(t => t.length === 1);
  const rawWords = rawToks.filter(t => t.length > 1);

  if (rawWords.length === 0) return null;

  let bestCandidate = null;
  let bestScore = 0;

  for (const t of dbTeachers) {
    const normDb = normalizeTeacherName(t.name);
    const dbToks = getTokens(normDb);
    const dbInitials = dbToks.filter(tok => tok.length === 1);
    const dbWords = dbToks.filter(tok => tok.length > 1);

    const matchingWords = rawWords.filter(rw => dbWords.includes(rw));
    const rawSurname = rawWords[rawWords.length - 1];
    const dbSurname = dbWords[dbWords.length - 1];
    const surnameMatches = (rawSurname === dbSurname);

    if (matchingWords.length > 0) {
      let score = matchingWords.length * 10;
      if (surnameMatches) score += 15;
      
      const matchingInitials = rawInitials.filter(ri => dbInitials.includes(ri) || dbWords.some(dw => dw.startsWith(ri)));
      score += matchingInitials.length * 5;

      if (!surnameMatches && rawWords.length > 1 && dbWords.length > 1) {
        score -= 20;
      }

      if (score > bestScore && score >= 20) {
        bestScore = score;
        bestCandidate = t;
      }
    }
  }

  return bestCandidate;
}

function normalizeSubjectTitle(name) {
  return (name || '')
    .toLowerCase()
    .replace(/\b(ai\s*(&|and)\s*ml|aiml)\b/gi, 'artificial intelligence and machine learning')
    .replace(/\b(laboratory|labs|lab)\b/gi, '')
    .replace(/[–—\-]/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchSubject(rawSubject, rawCode, dbSubjects) {
  if (rawCode) {
    const cleanCodes = rawCode.split(/[\/,]/).map(c => c.trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase());
    const matchByCode = dbSubjects.find(s => {
      const subCodeClean = (s.subjectCode || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      return cleanCodes.some(c => c && (c === subCodeClean || subCodeClean.includes(c) || c.includes(subCodeClean)));
    });
    if (matchByCode) return matchByCode;
  }

  const normRaw = normalizeSubjectTitle(rawSubject);
  if (!normRaw) return null;

  let matchByName = dbSubjects.find(s => normalizeSubjectTitle(s.subjectName) === normRaw);
  if (matchByName) return matchByName;

  matchByName = dbSubjects.find(s => {
    const normDb = normalizeSubjectTitle(s.subjectName);
    return normRaw.length > 5 && normDb.length > 5 && (normRaw.includes(normDb) || normDb.includes(normRaw));
  });

  return matchByName || null;
}

async function testLabs() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Subject = require('../src/models/Subject');
  const Teacher = require('../src/models/Teacher');
  const dbSubjects = await Subject.find({}).lean();
  const dbTeachers = await Teacher.find({}).lean();

  const wb = XLSX.readFile('data/Teacher_Subject_Experience_Ranking.xlsx');
  const allRows = XLSX.utils.sheet_to_json(wb.Sheets['All Teacher Counts'] || {});

  const labSubs = dbSubjects.filter(s => s.practicalHours > 0 || s.subjectType === 'lab');
  console.log('--- ACCURATE LAB SUBJECTS RANKINGS ---');
  labSubs.forEach(ls => {
    const matchingRows = allRows.filter(r => {
      const ms = matchSubject(r['Subject'], r['Course Codes'], dbSubjects);
      return ms && ms._id.toString() === ls._id.toString();
    });

    const teacherCounts = {};
    matchingRows.forEach(r => {
      const mt = matchTeacher(r['Teacher Name'], dbTeachers);
      if (mt) {
        const tid = mt._id.toString();
        const cnt = parseInt(r['Allotment Count']) || 1;
        teacherCounts[tid] = (teacherCounts[tid] || 0) + cnt;
      }
    });

    const ranking = Object.entries(teacherCounts)
      .map(([tid, count]) => {
        const t = dbTeachers.find(teach => teach._id.toString() === tid);
        return { name: t.name, count };
      })
      .sort((a,b) => b.count - a.count);

    console.log(`${ls.program} Sem ${ls.semester} | ${ls.subjectCode} ${ls.subjectName}`);
    if (ranking.length > 0) {
      console.log('   -> Ranked Teachers:', ranking.map(r => `${r.name} (${r.count})`).join(', '));
    } else {
      console.log('   -> [No historical records - will use fallback]');
    }
  });

  await mongoose.disconnect();
}
testLabs();
