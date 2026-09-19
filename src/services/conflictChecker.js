/**
 * Timetable Conflict Detection Service
 *
 * Handles:
 *  - Faculty overlaps
 *  - Room/Lab overlaps
 *  - Batch overlaps
 *  - Division overlaps
 *  - Exact 2-hour lab duration
 *  - Short-break/lunch overlap
 *  - Sem 3/4/5/6 A1/A2/A3 lab-pair distribution
 */

class ConflictChecker {
  constructor(schedule, options = {}) {
    this.schedule = Array.isArray(schedule) ? schedule : [];
    this.conflicts = [];

    /*
     * Change these here if your college break timings change.
     *
     * Short break:
     * 10:00 AM - 10:30 AM
     *
     * Lunch:
     * 1:30 PM - 2:30 PM
     */
    this.breaks =
      options.breaks ||
      [
        {
          name: 'SHORT_BREAK',
          startTime: '10:00 AM',
          endTime: '10:30 AM',
        },
        {
          name: 'LUNCH_BREAK',
          startTime: '1:30 PM',
          endTime: '2:30 PM',
        },
      ];

    this.LAB_DURATION_MINUTES = 120;
  }

  checkAll() {
    this.conflicts = [];

    this.checkFacultyOverlap();
    this.checkRoomOverlap();
    this.checkBatchOverlap();
    this.checkDivisionOverlap();

    this.checkLabContinuity();
    this.checkLabBatchDistribution();

    return {
      hasConflicts: this.conflicts.length > 0,

      conflicts: this.conflicts,

      summary: {
        totalConflicts: this.conflicts.length,
        types: this.summarizeTypes(),
      },
    };
  }

  // =====================================================
  // TIME HELPERS
  // =====================================================

  timeToMinutes(time) {
    if (!time) return null;

    if (typeof time === 'number') {
      return time;
    }

    let value = time.toString().trim();

    const amPmMatch = value.match(
      /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
    );

    if (amPmMatch) {
      let hour = Number(amPmMatch[1]);
      const minute = Number(amPmMatch[2]);
      const period = amPmMatch[3].toUpperCase();

      if (period === 'AM' && hour === 12) {
        hour = 0;
      }

      if (period === 'PM' && hour !== 12) {
        hour += 12;
      }

      return hour * 60 + minute;
    }

    const twentyFourHourMatch = value.match(
      /^(\d{1,2}):(\d{2})$/
    );

    if (twentyFourHourMatch) {
      const hour = Number(twentyFourHourMatch[1]);
      const minute = Number(twentyFourHourMatch[2]);

      return hour * 60 + minute;
    }

    return null;
  }

  getSessionStart(session) {
    return this.timeToMinutes(session.startTime);
  }

  getSessionEnd(session) {
    /*
     * Preferred:
     * startTime + endTime
     *
     * Example:
     * startTime: "10:30 AM"
     * endTime:   "12:30 PM"
     */

    if (session.endTime) {
      return this.timeToMinutes(session.endTime);
    }

    const start = this.getSessionStart(session);

    if (start === null) {
      return null;
    }

    /*
     * Support durationMinutes
     */
    if (
      session.durationMinutes !== undefined &&
      session.durationMinutes !== null
    ) {
      return start + Number(session.durationMinutes);
    }

    /*
     * Support duration if stored as minutes.
     */
    if (
      session.duration !== undefined &&
      session.duration !== null
    ) {
      const duration = Number(session.duration);

      if (!Number.isNaN(duration)) {
        return start + duration;
      }
    }

    /*
     * IMPORTANT:
     * Do not automatically assume every lab is 2 hours here.
     *
     * If endTime/duration is missing,
     * checkLabContinuity() will report it.
     */
    return null;
  }

  intervalsOverlap(start1, end1, start2, end2) {
    if (
      start1 === null ||
      end1 === null ||
      start2 === null ||
      end2 === null
    ) {
      return false;
    }

    return start1 < end2 && start2 < end1;
  }

  sessionsOverlap(session1, session2) {
    if (session1.day !== session2.day) {
      return false;
    }

    const start1 = this.getSessionStart(session1);
    const end1 = this.getSessionEnd(session1);

    const start2 = this.getSessionStart(session2);
    const end2 = this.getSessionEnd(session2);

    return this.intervalsOverlap(
      start1,
      end1,
      start2,
      end2
    );
  }

  // =====================================================
  // FIELD HELPERS
  // =====================================================

  isLab(session) {
    if (session.isLab === true) {
      return true;
    }

    const values = [
      session.type,
      session.sessionType,
      session.subjectType,
      session.subject?.type,
      session.subject?.subjectType,
    ];

    return values.some(
      (value) =>
        value &&
        value.toString().toLowerCase().includes('lab')
    );
  }

  getSemester(session) {
    const possibleSemester =
      session.semester ??
      session.semesterNumber ??
      session.division?.semester ??
      session.division?.semesterNumber;

    if (possibleSemester === undefined || possibleSemester === null) {
      return null;
    }

    /*
     * Supports:
     * 3
     * "3"
     * "Sem 3"
     * "Semester 3"
     */
    const match = possibleSemester
      .toString()
      .match(/\d+/);

    return match ? Number(match[0]) : null;
  }

  getBatchName(session) {
    let batch =
      session.batchName ||
      session.batch?.batchName ||
      session.batch?.name;

    if (!batch) {
      return null;
    }

    batch = batch
      .toString()
      .trim()
      .replace(/^batch\s*/i, '')
      .toUpperCase();

    return batch;
  }

  getBatchId(session) {
    if (!session.batch) {
      return null;
    }

    if (typeof session.batch === 'object') {
      return (
        session.batch._id?.toString() ||
        session.batch.id?.toString() ||
        this.getBatchName(session)
      );
    }

    return session.batch.toString();
  }

  getDivisionId(session) {
    if (!session.division) {
      return null;
    }

    if (typeof session.division === 'object') {
      return (
        session.division._id?.toString() ||
        session.division.id?.toString()
      );
    }

    return session.division.toString();
  }

  getRoomId(session) {
    if (!session.room) {
      return null;
    }

    if (typeof session.room === 'object') {
      return (
        session.room._id?.toString() ||
        session.room.id?.toString() ||
        session.room.name
      );
    }

    return session.room.toString();
  }

  getFacultyIds(session) {
    /*
     * Supports:
     *
     * faculty: ObjectId
     *
     * OR
     *
     * faculty: [ObjectId, ObjectId]
     *
     * OR
     *
     * faculties: [...]
     */

    let faculty =
      session.faculties ||
      session.faculty ||
      [];

    if (!Array.isArray(faculty)) {
      faculty = [faculty];
    }

    return faculty
      .filter(Boolean)
      .map((fac) => {
        if (typeof fac === 'object') {
          return (
            fac._id?.toString() ||
            fac.id?.toString()
          );
        }

        return fac.toString();
      })
      .filter(Boolean);
  }

  getSubjectCode(session) {
    const subject =
      session.subjectCode ||
      session.subject?.code ||
      session.subject?.subjectCode ||
      session.subject?.name ||
      session.subjectName;

    return subject
      ? subject.toString().trim().toUpperCase()
      : null;
  }

  // =====================================================
  // FACULTY CONFLICT
  // =====================================================

  checkFacultyOverlap() {
    for (let i = 0; i < this.schedule.length; i++) {
      const session1 = this.schedule[i];

      const faculty1 = this.getFacultyIds(session1);

      if (!faculty1.length) continue;

      for (
        let j = i + 1;
        j < this.schedule.length;
        j++
      ) {
        const session2 = this.schedule[j];

        if (session1.day !== session2.day) {
          continue;
        }

        const faculty2 =
          this.getFacultyIds(session2);

        if (!faculty2.length) continue;

        const commonFaculty =
          faculty1.filter((id) =>
            faculty2.includes(id)
          );

        if (!commonFaculty.length) {
          continue;
        }

        if (
          this.sessionsOverlap(
            session1,
            session2
          )
        ) {
          this.conflicts.push({
            type: 'FACULTY_OVERLAP',

            message:
              `Faculty is assigned to overlapping sessions ` +
              `on ${session1.day}`,

            details: {
              facultyIds: commonFaculty,
              sessionIndices: [i, j],

              firstSession: {
                startTime:
                  session1.startTime,
                endTime:
                  session1.endTime,
              },

              secondSession: {
                startTime:
                  session2.startTime,
                endTime:
                  session2.endTime,
              },
            },
          });
        }
      }
    }
  }

  // =====================================================
  // ROOM CONFLICT
  // =====================================================

  checkRoomOverlap() {
    for (let i = 0; i < this.schedule.length; i++) {
      const session1 = this.schedule[i];

      const room1 = this.getRoomId(session1);

      if (!room1) continue;

      for (
        let j = i + 1;
        j < this.schedule.length;
        j++
      ) {
        const session2 = this.schedule[j];

        if (session1.day !== session2.day) {
          continue;
        }

        const room2 = this.getRoomId(session2);

        if (!room2) continue;

        if (room1 !== room2) {
          continue;
        }

        if (
          this.sessionsOverlap(
            session1,
            session2
          )
        ) {
          this.conflicts.push({
            type: 'ROOM_OVERLAP',

            message:
              `Room/Lab is double-booked on ${session1.day}`,

            details: {
              roomId: room1,
              sessionIndices: [i, j],
            },
          });
        }
      }
    }
  }

  // =====================================================
  // BATCH CONFLICT
  // =====================================================

  checkBatchOverlap() {
    for (let i = 0; i < this.schedule.length; i++) {
      const session1 = this.schedule[i];

      const batch1 = this.getBatchId(session1);

      if (!batch1) continue;

      for (
        let j = i + 1;
        j < this.schedule.length;
        j++
      ) {
        const session2 = this.schedule[j];

        if (session1.day !== session2.day) {
          continue;
        }

        const batch2 = this.getBatchId(session2);

        if (!batch2) continue;

        if (batch1 !== batch2) {
          continue;
        }

        /*
         * Real overlap check:
         *
         * 10:30 - 12:30
         * 11:30 - 12:30
         *
         * is now correctly detected.
         */
        if (
          this.sessionsOverlap(
            session1,
            session2
          )
        ) {
          this.conflicts.push({
            type: 'BATCH_OVERLAP',

            message:
              `Batch ${this.getBatchName(session1) || batch1} ` +
              `has overlapping sessions on ${session1.day}`,

            details: {
              batchId: batch1,
              day: session1.day,
              sessionIndices: [i, j],
            },
          });
        }
      }
    }
  }

  // =====================================================
  // DIVISION CONFLICT
  // =====================================================

  checkDivisionOverlap() {
    for (let i = 0; i < this.schedule.length; i++) {
      const session1 = this.schedule[i];

      const division1 =
        this.getDivisionId(session1);

      if (!division1) continue;

      for (
        let j = i + 1;
        j < this.schedule.length;
        j++
      ) {
        const session2 = this.schedule[j];

        if (session1.day !== session2.day) {
          continue;
        }

        const division2 =
          this.getDivisionId(session2);

        if (
          !division2 ||
          division1 !== division2
        ) {
          continue;
        }

        if (
          !this.sessionsOverlap(
            session1,
            session2
          )
        ) {
          continue;
        }

        const lab1 = this.isLab(session1);
        const lab2 = this.isLab(session2);

        const batch1 =
          this.getBatchId(session1);

        const batch2 =
          this.getBatchId(session2);

        /*
         * Valid:
         *
         * Same division
         * Same time
         * Both are labs
         * Different batches
         *
         * Example:
         *
         * A1 -> DBMS Lab
         * A2 -> CN Lab
         *
         * running in parallel.
         */
        const validParallelBatchLabs =
          lab1 &&
          lab2 &&
          batch1 &&
          batch2 &&
          batch1 !== batch2;

        if (validParallelBatchLabs) {
          continue;
        }

        this.conflicts.push({
          type: 'DIVISION_OVERLAP',

          message:
            `Division has overlapping sessions on ${session1.day}`,

          details: {
            divisionId: division1,
            sessionIndices: [i, j],
          },
        });
      }
    }
  }

  // =====================================================
  // LAB DURATION + BREAK VALIDATION
  // =====================================================

  checkLabContinuity() {
    this.schedule.forEach(
      (session, index) => {
        if (!this.isLab(session)) {
          return;
        }

        const start =
          this.getSessionStart(session);

        const end =
          this.getSessionEnd(session);

        if (start === null) {
          this.conflicts.push({
            type: 'INVALID_LAB_TIME',

            message:
              'Lab has an invalid start time',

            details: {
              sessionIndex: index,
              startTime:
                session.startTime,
            },
          });

          return;
        }

        if (end === null) {
          this.conflicts.push({
            type: 'MISSING_LAB_END_TIME',

            message:
              `Lab must contain endTime or durationMinutes so ` +
              `its 2-hour duration can be validated`,

            details: {
              sessionIndex: index,
              startTime:
                session.startTime,
            },
          });

          return;
        }

        const duration = end - start;

        /*
         * EXACTLY 2 HOURS
         */
        if (
          duration !==
          this.LAB_DURATION_MINUTES
        ) {
          this.conflicts.push({
            type: 'INVALID_LAB_DURATION',

            message:
              `Lab must be exactly 2 continuous hours. ` +
              `Current duration is ${duration} minutes.`,

            details: {
              sessionIndex: index,
              startTime:
                session.startTime,
              endTime:
                session.endTime,
              durationMinutes:
                duration,
            },
          });
        }

        /*
         * SHORT BREAK / LUNCH CHECK
         */
        this.breaks.forEach(
          (breakPeriod) => {
            const breakStart =
              this.timeToMinutes(
                breakPeriod.startTime
              );

            const breakEnd =
              this.timeToMinutes(
                breakPeriod.endTime
              );

            if (
              this.intervalsOverlap(
                start,
                end,
                breakStart,
                breakEnd
              )
            ) {
              this.conflicts.push({
                type: 'LAB_BREAK_OVERLAP',

                message:
                  `Lab overlaps ${breakPeriod.name}: ` +
                  `${breakPeriod.startTime} - ${breakPeriod.endTime}`,

                details: {
                  sessionIndex: index,
                  break:
                    breakPeriod.name,
                  labStart:
                    session.startTime,
                  labEnd:
                    session.endTime,
                },
              });
            }
          }
        );
      }
    );
  }

  // =====================================================
  // SEM 3 / 4 / 5 / 6 BATCH ROTATION & BREAK VALIDATION
  // =====================================================

  checkLabBatchDistribution() {
    // 1. Never assign the same lab subject to multiple batches in the same slot
    for (let i = 0; i < this.schedule.length; i++) {
      const s1 = this.schedule[i];
      if (!this.isLab(s1)) continue;

      const sub1 = this.getSubjectCode(s1);
      const div1 = this.getDivisionId(s1);
      const batch1 = this.getBatchName(s1);

      for (let j = i + 1; j < this.schedule.length; j++) {
        const s2 = this.schedule[j];
        if (!this.isLab(s2)) continue;

        if (s1.day !== s2.day) continue;

        const sub2 = this.getSubjectCode(s2);
        const div2 = this.getDivisionId(s2);
        const batch2 = this.getBatchName(s2);

        if (div1 && div2 && div1 === div2 && sub1 && sub2 && sub1 === sub2) {
          // If different batches are assigned the same lab subject at overlapping times
          if (batch1 && batch2 && batch1 !== batch2 && this.sessionsOverlap(s1, s2)) {
            this.conflicts.push({
              type: 'SAME_LAB_MULTIPLE_BATCHES',
              message: `Lab subject ${sub1} is assigned to multiple batches (${batch1}, ${batch2}) simultaneously on ${s1.day} at ${s1.startTime}`,
              details: {
                subject: sub1,
                day: s1.day,
                startTime: s1.startTime,
                batches: [batch1, batch2],
                sessionIndices: [i, j]
              }
            });
          }
        }
      }
    }

    // 2. Sem 7 Major Project-I (22UCSL702): assign entire class, NOT separately by A1/A2/A3
    this.schedule.forEach((session, index) => {
      const semester = this.getSemester(session);
      const subCode = this.getSubjectCode(session) || '';
      const subName = (session.subject?.subjectName || session.subjectName || '').toLowerCase();

      const isMajorProject =
        semester === 7 &&
        (subCode.includes('22UCSL702') || subName.includes('major project'));

      if (isMajorProject) {
        const batch = this.getBatchName(session);
        if (batch && batch !== 'FULL CLASS') {
          this.conflicts.push({
            type: 'INVALID_MAJOR_PROJECT_BATCH',
            message: `Major Project-I (22UCSL702) is a whole-division subject and must not be assigned separately by batch ${batch}`,
            details: {
              sessionIndex: index,
              semester,
              subject: subCode,
              batch
            }
          });
        }
      }
    });

    // 3. Sem 3, 4, 5, 6: 3-lab rotational parallel allocation validation
    // Find lab subjects per (semester, division)
    const semDivLabs = {}; // key: `${semester}_${division}` -> { labSubjects: Set, batchLabs: { A1: Set, A2: Set, A3: Set } }

    this.schedule.forEach((session) => {
      if (!this.isLab(session)) return;

      const semester = this.getSemester(session);
      // Sem 1 & 2: keep existing logic unchanged
      if (![3, 4, 5, 6].includes(semester)) return;

      const subCode = this.getSubjectCode(session);
      const subName = (session.subject?.subjectName || session.subjectName || '').toLowerCase();
      // Skip minor projects from regular 3-lab rotation
      if (subName.includes('minor project')) return;

      const division = this.getDivisionId(session);
      const batch = this.getBatchName(session);

      if (!division || !subCode || !batch) return;

      const key = `${semester}_${division}`;
      if (!semDivLabs[key]) {
        semDivLabs[key] = {
          semester,
          division,
          labSubjects: new Set(),
          batchLabs: { A1: new Set(), A2: new Set(), A3: new Set() }
        };
      }

      semDivLabs[key].labSubjects.add(subCode);
      if (semDivLabs[key].batchLabs[batch]) {
        semDivLabs[key].batchLabs[batch].add(subCode);
      }
    });

    Object.values(semDivLabs).forEach((entry) => {
      const distinctLabs = Array.from(entry.labSubjects);
      // Only enforce 3-lab rotation when exactly 3 lab subjects exist
      if (distinctLabs.length === 3) {
        ['A1', 'A2', 'A3'].forEach((batchName) => {
          const completedLabs = Array.from(entry.batchLabs[batchName] || []);
          const missing = distinctLabs.filter((l) => !completedLabs.includes(l));

          if (missing.length > 0) {
            this.conflicts.push({
              type: 'INVALID_LAB_BATCH_ROTATION',
              message: `Batch ${batchName} in Semester ${entry.semester} is missing rotation for lab(s): ${missing.join(', ')}`,
              details: {
                semester: entry.semester,
                division: entry.division,
                batch: batchName,
                missingLabs: missing,
                assignedLabs: completedLabs,
                allLabs: distinctLabs
              }
            });
          }
        });
      }
    });
  }

  // =====================================================
  // SUMMARY
  // =====================================================

  summarizeTypes() {
    const summary = {};

    this.conflicts.forEach(
      (conflict) => {
        summary[conflict.type] =
          (summary[
            conflict.type
          ] || 0) + 1;
      }
    );

    return summary;
  }
}

module.exports = ConflictChecker;