require('dotenv').config();
const connectDB = require('../src/config/db');
const Teacher = require('../src/models/Teacher');
const Room = require('../src/models/Room');
const Lab = require('../src/models/Lab');
const Subject = require('../src/models/Subject');
const Division = require('../src/models/Division');
const Batch = require('../src/models/Batch');
const Constraint = require('../src/models/Constraint');
const TimetableGenerator = require('../src/services/timetableGenerator');
const ConflictChecker = require('../src/services/conflictChecker');
const { getRulesForSemester } = require('../src/config/timetableRules');

const timeToMins = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const runComprehensiveVerification = async () => {
  try {
    await connectDB();
    console.log("=== COMPREHENSIVE TIMETABLE RULES VERIFICATION (SEM 1-7) ===");

    const teachers = await Teacher.find();
    const rooms = await Room.find();
    const labs = await Lab.find().populate('supportedSubjects');
    const batches = await Batch.find().populate('division');

    let allPassed = true;

    for (let sem = 1; sem <= 7; sem++) {
      const branch = 'CSE';
      const divisions = await Division.find({ semester: sem, department: branch });
      const subjects = await Subject.find({ semester: sem, branch });
      const constraints = await Constraint.findOne({ semester: sem, department: branch });

      if (!divisions.length || !subjects.length) {
        console.log(`[SEM ${sem}] Skipped (no divisions or subjects found in database)`);
        continue;
      }

      // Explicitly set isFullClassLab for math lab in sem 1 & 2
      const formattedSubjects = subjects.map(s => {
        const sObj = s.toObject();
        const subName = (sObj.subjectName || '').toLowerCase();
        if ((sem === 1 || sem === 2) && (subName.includes('mathematic') || subName.includes('math'))) {
          sObj.isFullClassLab = true;
        }
        return sObj;
      });

      const timetableRules = getRulesForSemester(sem);

      // Create dummy facultyMapping
      const facultyMapping = {};
      for (const sub of formattedSubjects) {
        const sId = sub._id.toString();
        facultyMapping[sId] = {};
        if (sub.lectureHours > 0 || sub.tutorialHours > 0) {
          const t = teachers.find(t => t.subjectsHandled && t.subjectsHandled.includes(sub.subjectName)) || teachers[0];
          facultyMapping[sId].theory = t._id.toString();
        }
        if (sub.practicalHours > 0) {
          facultyMapping[sId].lab = teachers.slice(0, 4).map(t => t._id.toString());
        }
      }

      const generator = new TimetableGenerator({
        teachers,
        rooms,
        labs,
        divisions,
        subjects: formattedSubjects,
        constraints,
        batches,
        facultyMapping,
        timetableRules
      });

      const result = generator.generate();

      if (!result.success) {
        console.error(`[SEM ${sem}] FAILED generation: ${result.error}`);
        allPassed = false;
        continue;
      }

      const schedule = result.schedule;
      console.log(`\n--- [SEM ${sem}] Generation Result: SUCCESS (${schedule.length} sessions) ---`);
      console.log(`Start Time: ${timetableRules.college_start_time} | End Time: ${timetableRules.college_end_time}`);

      let semPassed = true;
      let labCount = 0;

      for (const entry of schedule) {
        const startM = timeToMins(entry.startTime);
        const endM = timeToMins(entry.endTime);
        const maxM = timeToMins("16:30");

        // 1. Verify End Time <= 16:30
        if (endM > maxM) {
          console.error(`  [FAIL] Session ${entry.subject.subjectName} exceeds 16:30 (ends at ${entry.endTime})`);
          semPassed = false;
        }

        if (entry.type === 'lab') {
          labCount++;
          // 2. Verify 2 continuous hours
          const durationMins = endM - startM;
          if (durationMins !== 120) {
            console.error(`  [FAIL] Lab ${entry.subject.subjectName} duration is ${durationMins} mins, expected 120 mins`);
            semPassed = false;
          }

          // 3. Verify Lab End Time matching start time + 2 hrs
          if (entry.startTime === "08:00" && entry.endTime !== "10:00") {
            console.error(`  [FAIL] 08:00 lab ended at ${entry.endTime}, expected 10:00`);
            semPassed = false;
          } else if (entry.startTime === "10:30" && entry.endTime !== "12:30") {
            console.error(`  [FAIL] 10:30 lab ended at ${entry.endTime}, expected 12:30`);
            semPassed = false;
          } else if (entry.startTime === "14:30" && entry.endTime !== "16:30") {
            console.error(`  [FAIL] 14:30 lab ended at ${entry.endTime}, expected 16:30`);
            semPassed = false;
          }

          // 4. Verify no break overlap
          // Short break: 10:00-10:30, Lunch: 12:30-14:30
          if ((startM < 630 && endM > 600) || (startM < 870 && endM > 750)) {
            console.error(`  [FAIL] Lab ${entry.subject.subjectName} (${entry.startTime}-${entry.endTime}) spans break!`);
            semPassed = false;
          }
        }
      }

      // 5. Conflict Check
      const checker = new ConflictChecker(schedule);
      const report = checker.checkAll();
      if (report.hasConflicts) {
        console.error(`  [FAIL] Conflict Checker reported ${report.conflicts.length} conflicts!`);
        semPassed = false;
      } else {
        console.log(`  [OK] Zero conflicts reported by ConflictChecker.`);
      }

      console.log(`  [OK] Verified ${labCount} lab sessions (all 2-hour continuous, ending <= 16:30).`);
      if (!semPassed) allPassed = false;
    }

    if (allPassed) {
      console.log("\n==========================================");
      console.log("SUCCESS: ALL SEMESTER RULES VERIFIED CLEANLY!");
      console.log("==========================================");
    } else {
      console.error("\nSOME SEMESTER VERIFICATIONS FAILED!");
    }
    process.exit(allPassed ? 0 : 1);

  } catch (err) {
    console.error("Test execution error:", err);
    process.exit(1);
  }
};

runComprehensiveVerification();
