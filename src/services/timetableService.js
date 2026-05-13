/**
 * Timetable Generation Service
 * Implements CSP logic with Backtracking and Conflict Detection
 */

class TimetableService {
  constructor(data) {
    this.teachers = data.teachers;
    this.rooms = data.rooms;
    this.labs = data.labs;
    this.divisions = data.divisions;
    this.subjects = data.subjects;
    this.constraints = data.constraints;
    this.batches = data.batches || [];

    // Working variables
    this.timetable = [];
    this.facultySchedule = {}; // { facultyId: { day: { slot: true } } }
    this.roomSchedule = {};    // { roomId: { day: { slot: true } } }
    this.divisionSchedule = {}; // { divisionId: { day: { slot: true } } }

    this.days = this.constraints?.hardConstraints?.fixedWorkingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    this.timeSlots = this.generateTimeSlots('09:00', '17:00');
    this.lunchBreak = this.constraints?.hardConstraints?.lunchBreak || { startTime: '13:00', endTime: '14:00' };
  }

  generateTimeSlots(start, end) {
    const slots = [];
    let current = parseInt(start.split(':')[0]);
    const finish = parseInt(end.split(':')[0]);

    while (current < finish) {
      const startTime = `${current.toString().padStart(2, '0')}:00`;
      const endTime = `${(current + 1).toString().padStart(2, '0')}:00`;
      slots.push({ startTime, endTime });
      current++;
    }
    return slots;
  }

  /**
   * Main Generation Function
   */
  generate() {
    // 1. Prepare requirements (all sessions to be scheduled)
    const sessionsToSchedule = this.prepareSessions();

    // 2. Start Backtracking
    if (this.backtrack(sessionsToSchedule, 0)) {
      return {
        success: true,
        schedule: this.timetable,
        conflicts: [],
      };
    } else {
      return {
        success: false,
        error: 'Could not find a conflict-free schedule with current constraints',
        conflicts: ['System-wide resource exhaustion'],
      };
    }
  }

  prepareSessions() {
    const requirements = [];
    this.divisions.forEach((div) => {
      // Find subjects for this semester/department
      const divSubjects = this.subjects.filter(
        (s) => s.semester === div.semester && s.department === div.department
      );

      divSubjects.forEach((sub) => {
        // Add Lectures
        for (let i = 0; i < sub.lectureHours; i++) {
          requirements.push({
            division: div,
            subject: sub,
            type: 'lecture',
            duration: 1,
          });
        }
        // Add Labs (assuming 2h labs for now)
        if (sub.subjectType === 'lab') {
          const divBatches = this.batches.filter(b => b.division.toString() === div._id.toString());
          divBatches.forEach(batch => {
            requirements.push({
              division: div,
              subject: sub,
              type: 'lab',
              batch: batch,
              duration: 2,
            });
          });
        }
      });
    });
    return requirements;
  }

  backtrack(sessions, index) {
    if (index === sessions.length) return true;

    const session = sessions[index];
    const possibleValues = this.getPossibleValues(session);

    for (const val of possibleValues) {
      if (this.isValid(session, val)) {
        this.applyValue(session, val);
        if (this.backtrack(sessions, index + 1)) return true;
        this.removeValue(session, val);
      }
    }

    return false;
  }

  getPossibleValues(session) {
    const values = [];
    const suitableRooms = session.type === 'lab' 
      ? this.labs.filter(l => l.supportedSubjects.some(s => s._id.toString() === session.subject._id.toString()))
      : this.rooms.filter(r => r.roomType === 'lecture' && r.capacity >= session.division.strength);

    const suitableFaculty = this.teachers.filter(t => t.subjectsHandled.includes(session.subject.subjectName));

    for (const day of this.days) {
      for (const slot of this.timeSlots) {
        for (const room of suitableRooms) {
          for (const faculty of suitableFaculty) {
            values.push({ day, startTime: slot.startTime, endTime: slot.endTime, room, faculty });
          }
        }
      }
    }
    // Shuffle values to avoid deterministic patterns
    return values.sort(() => Math.random() - 0.5);
  }

  isValid(session, val) {
    const { day, startTime, faculty, room } = val;
    const divId = session.division._id.toString();
    const facId = faculty._id.toString();
    const roomId = room._id.toString();

    // 1. Check Lunch Break
    if (startTime === this.lunchBreak.startTime) return false;

    // 2. Check Faculty Overlap
    if (this.facultySchedule[facId]?.[day]?.[startTime]) return false;

    // 3. Check Room Overlap
    if (this.roomSchedule[roomId]?.[day]?.[startTime]) return false;

    // 4. Check Division Overlap (unless it's a different batch in the same division - but labs usually need focus)
    if (this.divisionSchedule[divId]?.[day]?.[startTime]) return false;

    // 5. Faculty Availability (Hard constraint from teacher model)
    if (faculty.availability?.length > 0) {
      const dayAvail = faculty.availability.find(a => a.day === day);
      if (dayAvail) {
        const isAvailable = dayAvail.slots.some(s => s.startTime <= startTime && s.endTime >= val.endTime);
        if (!isAvailable) return false;
      }
    }

    return true;
  }

  applyValue(session, val) {
    const { day, startTime, faculty, room } = val;
    const divId = session.division._id.toString();
    const facId = faculty._id.toString();
    const roomId = room._id.toString();

    if (!this.facultySchedule[facId]) this.facultySchedule[facId] = {};
    if (!this.facultySchedule[facId][day]) this.facultySchedule[facId][day] = {};
    this.facultySchedule[facId][day][startTime] = true;

    if (!this.roomSchedule[roomId]) this.roomSchedule[roomId] = {};
    if (!this.roomSchedule[roomId][day]) this.roomSchedule[roomId][day] = {};
    this.roomSchedule[roomId][day][startTime] = true;

    if (!this.divisionSchedule[divId]) this.divisionSchedule[divId] = {};
    if (!this.divisionSchedule[divId][day]) this.divisionSchedule[divId][day] = {};
    this.divisionSchedule[divId][day][startTime] = true;

    this.timetable.push({
      ...val,
      subject: session.subject,
      division: session.division,
      batch: session.batch,
      type: session.type,
    });
  }

  removeValue(session, val) {
    const { day, startTime, faculty, room } = val;
    const divId = session.division._id.toString();
    const facId = faculty._id.toString();
    const roomId = room._id.toString();

    delete this.facultySchedule[facId][day][startTime];
    delete this.roomSchedule[roomId][day][startTime];
    delete this.divisionSchedule[divId][day][startTime];
    this.timetable.pop();
  }
}

module.exports = TimetableService;
