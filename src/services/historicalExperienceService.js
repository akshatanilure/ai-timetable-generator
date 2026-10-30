const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');
const HistoricalExperience = require('../models/HistoricalExperience');

// Normalize teacher name: strip titles, remove punctuation, trim
function normalizeTeacherName(name) {
  return (name || '')
    .toLowerCase()
    .replace(/\b(dr|prof|mr|mrs|ms)\b\.?/gi, '')
    .replace(/[^a-z]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Clean and standardize name tokens with phonetic synonyms
function getTeacherTokens(normName) {
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

// Match raw teacher string from Excel against database Teacher collection
function matchTeacher(rawName, dbTeachers) {
  if (!rawName) return null;
  // Handle compound entries like Prof. A / Prof. B or Prof. A & Prof. B
  const firstNameOnly = rawName.split(/[\/&]/)[0].trim();
  const normRaw = normalizeTeacherName(firstNameOnly);
  if (!normRaw) return null;

  // 1. Direct exact string match
  let match = dbTeachers.find(t => normalizeTeacherName(t.name) === normRaw);
  if (match) return match;

  const rawToks = getTeacherTokens(normRaw);
  const rawInitials = rawToks.filter(t => t.length === 1);
  const rawWords = rawToks.filter(t => t.length > 1);

  if (rawWords.length === 0) return null;

  let bestCandidate = null;
  let bestScore = 0;

  for (const t of dbTeachers) {
    const normDb = normalizeTeacherName(t.name);
    const dbToks = getTeacherTokens(normDb);
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

// Normalize subject title for robust fuzzy matching
function normalizeSubjectTitle(name) {
  return (name || '')
    .toLowerCase()
    .replace(/\b(ai\s*(&|and)\s*ml|aiml)\b/gi, 'artificial intelligence and machine learning')
    .replace(/\b(laboratory|labs|lab)\b/gi, '')
    .replace(/[–—-]/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Match Excel subject string & course code against database Subject collection
function matchSubject(rawSubject, rawCode, dbSubjects) {
  // 1. Match by course code
  if (rawCode) {
    const cleanCodes = rawCode.split(/[\/,]/).map(c => c.trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase());
    const matchByCode = dbSubjects.find(s => {
      const subCodeClean = (s.subjectCode || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      return cleanCodes.some(c => c && (c === subCodeClean || subCodeClean.includes(c) || c.includes(subCodeClean)));
    });
    if (matchByCode) return matchByCode;
  }

  // 2. Match by normalized subject name
  const normRaw = normalizeSubjectTitle(rawSubject);
  if (!normRaw) return null;

  let matchByName = dbSubjects.find(s => normalizeSubjectTitle(s.subjectName) === normRaw);
  if (matchByName) return matchByName;

  // Substring match
  matchByName = dbSubjects.find(s => {
    const normDb = normalizeSubjectTitle(s.subjectName);
    return normRaw.length > 5 && normDb.length > 5 && (normRaw.includes(normDb) || normDb.includes(normRaw));
  });

  return matchByName || null;
}

/**
 * Import historical records from Excel file buffer or path
 * Safely upserts records to avoid duplicates.
 */
async function importHistoricalExcel(filePathOrBuffer = null) {
  let workbook = null;

  if (Buffer.isBuffer(filePathOrBuffer)) {
    workbook = XLSX.read(filePathOrBuffer, { type: 'buffer' });
  } else {
    let targetPath = filePathOrBuffer;
    if (!targetPath) {
      const candidatePaths = [
        path.join(__dirname, '../../data/Teacher_Subject_Experience_Ranking.xlsx'),
        'C:\\Users\\aksha\\Downloads\\Teacher_Subject_Experience_Ranking.xlsx',
        path.join(__dirname, '../../data/3_Original_Allotment_Records.csv'),
        'C:\\Users\\aksha\\Downloads\\3_Original_Allotment_Records.csv'
      ];
      for (const p of candidatePaths) {
        if (fs.existsSync(p)) {
          targetPath = p;
          break;
        }
      }
    }

    if (!targetPath || !fs.existsSync(targetPath)) {
      throw new Error('Historical data file not found. Please provide or upload Teacher_Subject_Experience_Ranking.xlsx');
    }

    workbook = XLSX.readFile(targetPath);
  }

  const dbTeachers = await Teacher.find({}).lean();
  const dbSubjects = await Subject.find({}).lean();

  // Read Top Teacher per Subject sheet
  const topTeachersMap = new Map(); // key: subjectNorm + '_' + teacherNorm -> maxCount
  const topSheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('top teacher'));
  if (topSheetName) {
    const topRows = XLSX.utils.sheet_to_json(workbook.Sheets[topSheetName]);
    topRows.forEach(r => {
      const sub = r['Subject'] || '';
      const teacher = r['Most Experienced Teacher (by allotment count)'] || r['Teacher Name'] || '';
      const maxCount = parseInt(r['Maximum Allotment Count'] || r['Allotment Count']) || 1;
      const key = `${normalizeSubjectTitle(sub)}_${normalizeTeacherName(teacher)}`;
      topTeachersMap.set(key, maxCount);
    });
  }

  // Read All Teacher Counts sheet (or fallback to first available sheet)
  const countsSheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('all teacher')) || workbook.SheetNames[0];
  const allRows = XLSX.utils.sheet_to_json(workbook.Sheets[countsSheetName]);

  const operations = [];
  let matchedTeachersCount = 0;
  let matchedSubjectsCount = 0;

  for (const row of allRows) {
    const subjectName = (row['Subject'] || '').toString().trim();
    const teacherName = (row['Teacher Name'] || row['Most Experienced Teacher (by allotment count)'] || '').toString().trim();
    if (!subjectName || !teacherName) continue;

    // Filter out obvious placeholder rows
    if (teacherName.toLowerCase().includes('all faculty') || teacherName === '"Prof') continue;

    const allotmentCount = parseInt(row['Allotment Count'] || row['Maximum Allotment Count']) || 1;
    const rawCodes = (row['Course Codes'] || row['Course Code'] || '').toString();
    const courseCodes = rawCodes.split(/[\/,]/).map(c => c.trim()).filter(Boolean);
    const academicYears = (row['Academic Years'] || row['Academic Year'] || '').toString().split(/[\/,]/).map(y => y.trim()).filter(Boolean);
    const semesters = (row['Semesters'] || row['Semester'] || '').toString().split(/[\/,]/).map(s => s.trim()).filter(Boolean);
    const divisions = (row['Divisions'] || row['Division'] || '').toString().split(/[\/,]/).map(d => d.trim()).filter(Boolean);

    const subjectNormalized = normalizeSubjectTitle(subjectName);
    const teacherNormalized = normalizeTeacherName(teacherName);

    const matchedT = matchTeacher(teacherName, dbTeachers);
    const matchedS = matchSubject(subjectName, rawCodes, dbSubjects);

    if (matchedT) matchedTeachersCount++;
    if (matchedS) matchedSubjectsCount++;

    const isTopTeacher = topTeachersMap.has(`${subjectNormalized}_${teacherNormalized}`);

    operations.push({
      updateOne: {
        filter: {
          subjectNormalized,
          teacherNormalized,
          sourceSheet: 'All Teacher Counts'
        },
        update: {
          $set: {
            subjectName,
            subjectNormalized,
            teacherName,
            teacherNormalized,
            allotmentCount,
            courseCodes,
            academicYears,
            semesters,
            divisions,
            isTopTeacher,
            matchedTeacher: matchedT ? matchedT._id : null,
            matchedSubject: matchedS ? matchedS._id : null,
            sourceSheet: 'All Teacher Counts'
          }
        },
        upsert: true
      }
    });
  }

  if (operations.length > 0) {
    await HistoricalExperience.bulkWrite(operations);
  }

  return {
    success: true,
    totalRecordsProcessed: operations.length,
    matchedTeachersCount,
    matchedSubjectsCount
  };
}

/**
 * Get experience rankings for a specific subject
 * Returns teachers ordered descending by allotment count.
 * Includes equal counts.
 * Returns fallback faculty if no records exist.
 */
async function getSubjectExperienceRanking(subjectId) {
  const subject = await Subject.findById(subjectId).lean();
  if (!subject) {
    throw new Error('Subject not found');
  }

  const allTeachers = await Teacher.find({}).lean();
  const subCodeClean = (subject.subjectCode || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const subNorm = normalizeSubjectTitle(subject.subjectName);

  // Find historical records matching subject
  const records = await HistoricalExperience.find({
    $or: [
      { matchedSubject: subject._id },
      { courseCodes: { $regex: new RegExp(subCodeClean, 'i') } },
      { subjectNormalized: subNorm }
    ]
  }).lean();

  // If lab subject, also search for lab variations (e.g. without 'laboratory' or with 'lab')
  let additionalRecords = [];
  if (subject.practicalHours > 0 || subject.subjectType === 'lab') {
    const rawLabRegex = new RegExp(subNorm.replace(/lab/g, '').trim(), 'i');
    additionalRecords = await HistoricalExperience.find({
      $and: [
        { subjectNormalized: { $regex: rawLabRegex } },
        {
          $or: [
            { subjectName: { $regex: /lab|laboratory/i } },
            { courseCodes: { $regex: new RegExp(subCodeClean, 'i') } }
          ]
        }
      ]
    }).lean();
  }

  const combinedRecords = [...records];
  const seenIds = new Set(records.map(r => r._id.toString()));
  for (const ar of additionalRecords) {
    if (!seenIds.has(ar._id.toString())) {
      combinedRecords.push(ar);
      seenIds.add(ar._id.toString());
    }
  }

  // Aggregate by matched teacher ID
  const teacherStats = new Map(); // teacherId -> { count, isTop, years, rawNames }

  for (const rec of combinedRecords) {
    let tId = rec.matchedTeacher ? rec.matchedTeacher.toString() : null;
    if (!tId) {
      // Try late-match
      const matchedT = matchTeacher(rec.teacherName, allTeachers);
      if (matchedT) tId = matchedT._id.toString();
    }
    if (!tId) continue;

    const current = teacherStats.get(tId) || {
      count: 0,
      isTop: false,
      academicYears: new Set(),
      rawNames: new Set()
    };

    current.count += (rec.allotmentCount || 1);
    if (rec.isTopTeacher) current.isTop = true;
    (rec.academicYears || []).forEach(y => current.academicYears.add(y));
    current.rawNames.add(rec.teacherName);

    teacherStats.set(tId, current);
  }

  const hasHistoricalRecords = teacherStats.size > 0;

  let rankedTeachers = [];

  if (hasHistoricalRecords) {
    rankedTeachers = Array.from(teacherStats.entries()).map(([teacherId, stats]) => {
      const teacherObj = allTeachers.find(t => t._id.toString() === teacherId);
      return {
        teacherId,
        teacherName: teacherObj ? teacherObj.name : Array.from(stats.rawNames)[0],
        department: teacherObj ? teacherObj.department : '',
        allotmentCount: stats.count,
        isTopTeacher: stats.isTop,
        academicYears: Array.from(stats.academicYears),
        hasHistoricalRecord: true
      };
    });

    // Sort descending by allotment count (include equal counts)
    rankedTeachers.sort((a, b) => b.allotmentCount - a.allotmentCount);
  } else {
    // Fallback: all eligible faculty for this subject's department
    const subDeptLower = (subject.department || '').toLowerCase();
    const subNameLower = (subject.subjectName || '').toLowerCase();

    let eligible = allTeachers;
    if (subNameLower.includes('math') || subDeptLower.includes('math')) {
      eligible = allTeachers.filter(t => (t.department || '').toLowerCase().includes('math'));
    } else if (subNameLower.includes('phys') || subDeptLower.includes('phys')) {
      eligible = allTeachers.filter(t => (t.department || '').toLowerCase().includes('phys'));
    } else if (subNameLower.includes('chem') || subDeptLower.includes('chem')) {
      eligible = allTeachers.filter(t => (t.department || '').toLowerCase().includes('chem'));
    } else if (subNameLower.includes('elect') || subDeptLower.includes('elect')) {
      eligible = allTeachers.filter(t => (t.department || '').toLowerCase().includes('elect'));
    } else {
      eligible = allTeachers.filter(t => (t.department || '').toLowerCase().includes('cse') || (t.department || '').toLowerCase().includes('computer'));
    }

    if (eligible.length === 0) eligible = allTeachers;

    rankedTeachers = eligible.map(t => ({
      teacherId: t._id.toString(),
      teacherName: t.name,
      department: t.department,
      allotmentCount: 0,
      isTopTeacher: false,
      academicYears: [],
      hasHistoricalRecord: false
    }));
  }

  return {
    subjectId: subject._id,
    subjectCode: subject.subjectCode,
    subjectName: subject.subjectName,
    hasHistoricalRecords,
    rankings: rankedTeachers
  };
}

/**
 * Get rankings for all subjects (optionally filtered by semester and program)
 */
async function getAllSubjectsRankings(semester = null, program = null) {
  const filter = {};
  if (semester) filter.semester = parseInt(semester, 10);
  if (program) filter.program = program;

  const subjects = await Subject.find(filter).lean();
  const allTeachers = await Teacher.find({}).lean();
  const allHistorical = await HistoricalExperience.find({}).lean();

  const results = {};

  for (const sub of subjects) {
    const subCodeClean = (sub.subjectCode || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const subNorm = normalizeSubjectTitle(sub.subjectName);

    const matching = allHistorical.filter(h => {
      if (h.matchedSubject && h.matchedSubject.toString() === sub._id.toString()) return true;
      if (h.courseCodes && h.courseCodes.some(c => c && c.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().includes(subCodeClean))) return true;
      if (h.subjectNormalized === subNorm) return true;
      if (sub.practicalHours > 0 || sub.subjectType === 'lab') {
        const rawLabRegex = subNorm.replace(/lab/g, '').trim();
        if (rawLabRegex.length > 5 && h.subjectNormalized.includes(rawLabRegex)) return true;
      }
      return false;
    });

    const teacherStats = new Map();
    for (const rec of matching) {
      let tId = rec.matchedTeacher ? rec.matchedTeacher.toString() : null;
      if (!tId) {
        const matchedT = matchTeacher(rec.teacherName, allTeachers);
        if (matchedT) tId = matchedT._id.toString();
      }
      if (!tId) continue;

      const current = teacherStats.get(tId) || { count: 0, isTop: false, academicYears: new Set() };
      current.count += (rec.allotmentCount || 1);
      if (rec.isTopTeacher) current.isTop = true;
      (rec.academicYears || []).forEach(y => current.academicYears.add(y));
      teacherStats.set(tId, current);
    }

    const hasHistoricalRecords = teacherStats.size > 0;
    let rankings = [];

    if (hasHistoricalRecords) {
      rankings = Array.from(teacherStats.entries()).map(([teacherId, stats]) => {
        const t = allTeachers.find(teach => teach._id.toString() === teacherId);
        return {
          teacherId,
          teacherName: t ? t.name : 'Unknown',
          department: t ? t.department : '',
          allotmentCount: stats.count,
          isTopTeacher: stats.isTop,
          academicYears: Array.from(stats.academicYears),
          hasHistoricalRecord: true
        };
      });
      rankings.sort((a, b) => b.allotmentCount - a.allotmentCount);
    } else {
      // Fallback
      const subDeptLower = (sub.department || '').toLowerCase();
      const subNameLower = (sub.subjectName || '').toLowerCase();

      let eligible = allTeachers;
      if (subNameLower.includes('math') || subDeptLower.includes('math')) {
        eligible = allTeachers.filter(t => (t.department || '').toLowerCase().includes('math'));
      } else if (subNameLower.includes('phys') || subDeptLower.includes('phys')) {
        eligible = allTeachers.filter(t => (t.department || '').toLowerCase().includes('phys'));
      } else if (subNameLower.includes('chem') || subDeptLower.includes('chem')) {
        eligible = allTeachers.filter(t => (t.department || '').toLowerCase().includes('chem'));
      } else if (subNameLower.includes('elect') || subDeptLower.includes('elect')) {
        eligible = allTeachers.filter(t => (t.department || '').toLowerCase().includes('elect'));
      } else {
        eligible = allTeachers.filter(t => (t.department || '').toLowerCase().includes('cse') || (t.department || '').toLowerCase().includes('computer'));
      }
      if (eligible.length === 0) eligible = allTeachers;

      rankings = eligible.map(t => ({
        teacherId: t._id.toString(),
        teacherName: t.name,
        department: t.department,
        allotmentCount: 0,
        isTopTeacher: false,
        academicYears: [],
        hasHistoricalRecord: false
      }));
    }

    results[sub._id.toString()] = {
      subjectId: sub._id,
      subjectCode: sub.subjectCode,
      subjectName: sub.subjectName,
      hasHistoricalRecords,
      rankings
    };
  }

  return results;
}

module.exports = {
  importHistoricalExcel,
  getSubjectExperienceRanking,
  getAllSubjectsRankings,
  matchTeacher,
  matchSubject,
  normalizeSubjectTitle,
  normalizeTeacherName
};
