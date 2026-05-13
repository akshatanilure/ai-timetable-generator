/**
 * Timetable Conflict Detection Service
 * Analyzes a schedule and identifies overlaps and constraint violations.
 */

class ConflictChecker {
  constructor(schedule) {
    this.schedule = schedule; // Array of session objects
    this.conflicts = [];
  }

  checkAll() {
    this.conflicts = [];
    this.checkFacultyOverlap();
    this.checkRoomOverlap();
    this.checkBatchOverlap();
    this.checkDivisionOverlap();
    this.checkLabContinuity();
    
    return {
      hasConflicts: this.conflicts.length > 0,
      conflicts: this.conflicts,
      summary: {
        totalConflicts: this.conflicts.length,
        types: this.summarizeTypes()
      }
    };
  }

  checkFacultyOverlap() {
    const facultyMap = {}; // { facultyId: { day: { slot: [sessions] } } }

    this.schedule.forEach((session, index) => {
      const facId = session.faculty?.toString();
      const { day, startTime } = session;

      if (!facultyMap[facId]) facultyMap[facId] = {};
      if (!facultyMap[facId][day]) facultyMap[facId][day] = {};
      if (!facultyMap[facId][day][startTime]) facultyMap[facId][day][startTime] = [];

      facultyMap[facId][day][startTime].push({ ...session, index });
    });

    for (const facId in facultyMap) {
      for (const day in facultyMap[facId]) {
        for (const slot in facultyMap[facId][day]) {
          const sessions = facultyMap[facId][day][slot];
          if (sessions.length > 1) {
            this.conflicts.push({
              type: 'FACULTY_OVERLAP',
              message: `Faculty member is assigned to ${sessions.length} sessions simultaneously on ${day} at ${slot}`,
              details: { facultyId: facId, day, slot, sessionIndices: sessions.map(s => s.index) }
            });
          }
        }
      }
    }
  }

  checkRoomOverlap() {
    const roomMap = {}; // { roomId: { day: { slot: [sessions] } } }

    this.schedule.forEach((session, index) => {
      const roomId = session.room?.toString();
      const { day, startTime } = session;

      if (!roomId) return;
      if (!roomMap[roomId]) roomMap[roomId] = {};
      if (!roomMap[roomId][day]) roomMap[roomId][day] = {};
      if (!roomMap[roomId][day][startTime]) roomMap[roomId][day][startTime] = [];

      roomMap[roomId][day][startTime].push({ ...session, index });
    });

    for (const roomId in roomMap) {
      for (const day in roomMap[roomId]) {
        for (const slot in roomMap[roomId][day]) {
          const sessions = roomMap[roomId][day][slot];
          if (sessions.length > 1) {
            this.conflicts.push({
              type: 'ROOM_OVERLAP',
              message: `Room/Lab is assigned to ${sessions.length} sessions simultaneously on ${day} at ${slot}`,
              details: { roomId, day, slot, sessionIndices: sessions.map(s => s.index) }
            });
          }
        }
      }
    }
  }

  checkBatchOverlap() {
    const batchMap = {}; // { batchId: { day: { slot: [sessions] } } }

    this.schedule.forEach((session, index) => {
      const batchId = session.batch?.toString();
      const { day, startTime } = session;

      if (!batchId) return;
      if (!batchMap[batchId]) batchMap[batchId] = {};
      if (!batchMap[batchId][day]) batchMap[batchId][day] = {};
      if (!batchMap[batchId][day][startTime]) batchMap[batchId][day][startTime] = [];

      batchMap[batchId][day][startTime].push({ ...session, index });
    });

    for (const batchId in batchMap) {
      for (const day in batchMap[batchId]) {
        for (const slot in batchMap[batchId][day]) {
          const sessions = batchMap[batchId][day][slot];
          if (sessions.length > 1) {
            this.conflicts.push({
              type: 'BATCH_OVERLAP',
              message: `Batch is assigned to ${sessions.length} sessions simultaneously on ${day} at ${slot}`,
              details: { batchId, day, slot, sessionIndices: sessions.map(s => s.index) }
            });
          }
        }
      }
    }
  }

  checkDivisionOverlap() {
    const divMap = {}; // { divId: { day: { slot: [sessions] } } }

    this.schedule.forEach((session, index) => {
      const divId = session.division?.toString();
      const { day, startTime, batch } = session;

      if (!divId) return;
      if (!divMap[divId]) divMap[divId] = {};
      if (!divMap[divId][day]) divMap[divId][day] = {};
      if (!divMap[divId][day][startTime]) divMap[divId][day][startTime] = [];

      divMap[divId][day][startTime].push({ ...session, index });
    });

    for (const divId in divMap) {
      for (const day in divMap[divId]) {
        for (const slot in divMap[divId][day]) {
          const sessions = divMap[divId][day][slot];
          
          // Filter out valid overlapping sessions (e.g. parallel batch labs in same division)
          const distinctSessions = this.filterParallelLabs(sessions);

          if (distinctSessions.length > 1) {
            this.conflicts.push({
              type: 'DIVISION_OVERLAP',
              message: `Division has ${distinctSessions.length} conflicting sessions on ${day} at ${slot}`,
              details: { divisionId: divId, day, slot, sessionIndices: distinctSessions.map(s => s.index) }
            });
          }
        }
      }
    }
  }

  filterParallelLabs(sessions) {
    // If sessions have different batches, they might be parallel labs
    // In a true conflict, the same batch or the entire division (lecture) is doubled
    const batchesSeen = new Set();
    const result = [];

    sessions.forEach(s => {
      if (!s.batch) {
        // This is a whole-division session (lecture)
        result.push(s);
      } else {
        if (!batchesSeen.has(s.batch.toString())) {
          batchesSeen.add(s.batch.toString());
          // We count parallel labs for different batches as 1 "division unit" of time
          // unless there are multiple sessions for the SAME batch
        }
      }
    });

    // If we have parallel labs and a lecture at the same time, that's a conflict
    // But if we only have parallel labs for different batches, that's OK.
    if (batchesSeen.size > 0) {
      // Add one representative for the batches
      result.push({ type: 'batch_group' });
    }

    return result;
  }

  checkLabContinuity() {
    // Check if lab sessions of the same subject/batch are continuous
    // Implementation depends on how slots are represented.
    // For now, we'll flag if a lab session exists without a preceding or succeeding session
    // of the same type if it's supposed to be multiple hours.
  }

  summarizeTypes() {
    const summary = {};
    this.conflicts.forEach(c => {
      summary[c.type] = (summary[c.type] || 0) + 1;
    });
    return summary;
  }
}

module.exports = ConflictChecker;
