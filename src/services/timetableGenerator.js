const ConstraintHandler = require('./constraintHandler');
const LabAllocator = require('./labAllocator');
const constraintService = require('./constraintService');

class TimetableGenerator {
  constructor(data) {
    this.teachers = data.teachers;
    this.rooms = data.rooms;
    this.labs = data.labs;
    this.divisions = data.divisions;
    this.subjects = data.subjects;
    this.batches = data.batches || [];
    this.constraints = data.constraints;
    this.facultyMapping = data.facultyMapping || {};

    // specialized engines
    this.handler = new ConstraintHandler(data.divisions[0]?.semester, data.divisions[0]?.department);
    this.labEngine = new LabAllocator(this);

    // Configuration
    this.settings = data.settings || {
      college_start_time: "09:00",
      college_end_time: "16:30",
      period_duration: 60,
      short_break_start: "11:00",
      short_break_end: "11:30",
      lunch_break_start: "13:30",
      lunch_break_end: "14:30"
    };

    const hard = this.constraints?.hardConstraints;
    this.periodDuration = this.settings.period_duration || 60; // mostly 60 mins

    const isEvenSem = data.divisions[0]?.semester % 2 === 0;
    this.isEvenSem = isEvenSem;

    // Define slots per day based on settings
    this.timeSlots = {};
    const daysArr = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    this.days = daysArr;

    const generateSlots = () => {
      const slots = [];
      let currentMins = this.timeToMinutes(this.settings.college_start_time);
      const endMins = this.timeToMinutes(this.settings.college_end_time);
      const sbStart = this.timeToMinutes(this.settings.short_break_start);
      const sbEnd = this.timeToMinutes(this.settings.short_break_end);
      const lbStart = this.timeToMinutes(this.settings.lunch_break_start);
      const lbEnd = this.timeToMinutes(this.settings.lunch_break_end);

      while (currentMins + this.periodDuration <= endMins) {
        // Skip over short break
        if (currentMins >= sbStart && currentMins < sbEnd) {
          currentMins = sbEnd;
          continue;
        }
        // Skip over lunch break
        if (currentMins >= lbStart && currentMins < lbEnd) {
          currentMins = lbEnd;
          continue;
        }

        // Ensure a full period can fit before the next break
        if (currentMins < sbStart && currentMins + this.periodDuration > sbStart) {
          currentMins = sbEnd;
          continue;
        }
        if (currentMins < lbStart && currentMins + this.periodDuration > lbStart) {
          currentMins = lbEnd;
          continue;
        }

        slots.push(this.minutesToTime(currentMins));
        currentMins += this.periodDuration;
      }
      return slots;
    };

    const dailySlots = generateSlots();

    daysArr.forEach(day => {
      this.timeSlots[day] = dailySlots;
    });

    // Helper to get ALL unique slots for matrix rendering
    this.allUniqueSlots = Array.from(new Set(Object.values(this.timeSlots).flat())).sort();

    // State
    this.timetable = [];
    this.facultyAssignments = new Map(); // Map<facultyId, Set<day-slot>>
    this.roomAssignments = new Map();    // Map<roomId, Set<day-slot>>
    this.divisionAssignments = new Map(); // Map<divId, Set<day-slot>>
  }

  // calculateEndTime explicitly handles the 60 min duration.
  // Breaks are explicitly skipped because the next slot in the array handles the start time!

  timeToMinutes(time) {
    const [hrs, mins] = time.split(':').map(Number);
    return hrs * 60 + mins;
  }

  minutesToTime(mins) {
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    return `${hrs.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  generate() {
    const variables = this.prepareVariables();
    // Heuristic: Sort by difficulty (Labs first, then subjects with high priority)
    variables.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'lab' ? -1 : 1;
      return b.subject.priority - a.subject.priority;
    });

    this.variables = variables;

    if (this.backtrack(0)) {
      return {
        success: true,
        schedule: this.timetable,
        matrix: this.getStructuredMatrix(),
        slots: this.allUniqueSlots
      };
    }
    return { success: false, error: 'Infeasible constraints: No valid schedule found' };
  }

  /**
   * Transforms the flat timetable into a structured matrix grouped by division
   */
  getStructuredMatrix() {
    const matrix = {};

    this.divisions.forEach(div => {
      matrix[div._id] = {
        divisionName: div.divisionName,
        semester: div.semester,
        days: {}
      };

      this.days.forEach(day => {
        matrix[div._id].days[day] = {};
        this.timeSlots[day].forEach(slot => {
          matrix[div._id].days[day][slot] = null;
        });
      });
    });

    this.timetable.forEach(entry => {
      const divId = entry.division._id;
      if (matrix[divId]) {
        // For labs, we might have multiple slots
        const startTime = entry.startTime;
        matrix[divId].days[entry.day][startTime] = entry;

        // Mark subsequent slots as busy if it's a multi-period session
        if (entry.type === 'lab') {
          const durationPeriods = entry.duration || 1;
          const daySlots = this.timeSlots[entry.day];
          const startIndex = daySlots.indexOf(startTime);
          for (let i = 1; i < durationPeriods; i++) {
            const nextSlot = daySlots[startIndex + i];
            if (nextSlot) {
              matrix[divId].days[entry.day][nextSlot] = { type: 'busy', parent: startTime };
            }
          }
        }
      }
    });

    return matrix;
  }

  prepareVariables() {
    const vars = [];
    this.divisions.forEach(div => {
      const divSubjects = this.subjects.filter(s => s.semester === div.semester && s.department === div.department);
      divSubjects.forEach(sub => {
        // Apply semester priority
        sub.priority = this.handler.getSubjectPriority(sub);

        // Check for specific session counts (e.g. Sem 8 projects)
        let lectures = this.handler.getRequiredSessions(sub) ?? sub.lectureHours;

        // Lectures
        for (let i = 0; i < lectures; i++) {
          vars.push({ division: div, subject: sub, type: 'theory', duration: 1 });
        }

        let tutorials = sub.tutorialHours || 0;
        for (let i = 0; i < tutorials; i++) {
          vars.push({ division: div, subject: sub, type: 'theory', duration: 1 }); // treat tutorial as theory session
        }

        // Labs
        if (sub.practicalHours > 0) {
          const sessionDuration = sub.practicalHours >= 2 ? 2 : sub.practicalHours;
          const numSessions = Math.ceil(sub.practicalHours / sessionDuration);

          for (let i = 0; i < numSessions; i++) {
            const divBatches = this.batches.filter(b => {
              const bDivId = b.division._id ? b.division._id.toString() : b.division.toString();
              return bDivId === div._id.toString();
            });
            if (divBatches.length > 0) {
              divBatches.forEach(batch => {
                vars.push({ division: div, subject: sub, type: 'lab', batch, duration: sessionDuration });
              });
            } else {
              vars.push({ division: div, subject: sub, type: 'lab', duration: sessionDuration });
            }
          }
        }
      });
    });
    return vars;
  }

  backtrack(index) {
    if (index === this.variables.length) {
      return true; // All assigned successfully
    }

    const variable = this.variables[index];
    const orderedDomains = this.getOrderedDomains(variable);

    if (orderedDomains.length === 0) {
      console.log(`[BACKTRACK FAILURE] No valid domains for: ${variable.subject.subjectName} (${variable.type}) - Batch: ${variable.batch ? variable.batch.batchName : 'None'}`);
      return false;
    }

    for (const domain of orderedDomains) {
      const assignment = {
        day: domain.day,
        slots: domain.slots,
        faculty: domain.faculty,
        room: domain.room,
        duration: variable.duration,
        type: variable.type,
      };

      if (this.isValid(variable, assignment)) {
        this.applyAssignment(variable, assignment);

        if (this.backtrack(index + 1)) {
          return true;
        }

        this.removeAssignment(variable, assignment);
      } else {
        // Validation failed, let's trace why sometimes.
      }
    }

    // console.log(`[BACKTRACK FAILURE] Exhausted all domains for: ${variable.subject.subjectName} (${variable.type}) - initial domains: ${orderedDomains.length}`);
    return false;
  }

  getOrderedDomains(variable) {
    const domains = [];

    // Use faculty mapping if provided, otherwise fallback to finding suitable ones
    let suitableFaculty = [];
    const mappedFacs = this.facultyMapping[variable.subject._id.toString()];
    if (mappedFacs) {
      if (variable.type === 'theory' && mappedFacs.theory) {
        suitableFaculty = this.teachers.filter(t => t._id.toString() === mappedFacs.theory);
      } else if (variable.type === 'lab' && mappedFacs.lab) {
        suitableFaculty = this.teachers.filter(t => mappedFacs.lab.includes(t._id.toString()));
      } else if (Array.isArray(mappedFacs)) { // Backwards compatibility
        suitableFaculty = this.teachers.filter(t => mappedFacs.includes(t._id.toString()));
      } else if (typeof mappedFacs === 'string') {
        suitableFaculty = this.teachers.filter(t => t._id.toString() === mappedFacs);
      }
    } else {
      suitableFaculty = this.teachers.filter(t => t.subjectsHandled.includes(variable.subject.subjectName));
    }
    const suitableRooms = variable.type === 'lab'
      ? this.labs.filter(l => l.supportedSubjects.some(s => s._id.toString() === variable.subject._id.toString()))
      : this.rooms.filter(r => r.roomType === 'lecture' && r.capacity >= variable.division.strength);

    for (const day of this.days) {
      const daySlots = this.timeSlots[day];
      for (let i = 0; i <= daySlots.length - variable.duration; i++) {
        const slots = daySlots.slice(i, i + variable.duration);

        // Ensure slots don't span across breaks (short break or lunch)
        if (variable.duration > 1) {
          let spansBreak = false;
          for (let s = 0; s < slots.length - 1; s++) {
            const gap = this.timeToMinutes(slots[s + 1]) - this.timeToMinutes(slots[s]);
            if (gap > this.periodDuration) {
              spansBreak = true;
            }
          }
          if (spansBreak) continue;
        }

        // Relaxed CONSTRAINT: 4+ credits courses can be scheduled in the afternoon if necessary.
        // It was causing massive backtrack failures because labs take up morning slots.

        if (variable.type === 'lab') {
          // Use LabAllocator engine
          const allocation = this.labEngine.allocate(variable, day, slots);
          if (allocation) {
            domains.push({
              day,
              slots,
              faculty: allocation.faculty,
              room: allocation.lab
            });
          }
        } else {
          // Regular Theory logic
          for (const faculty of suitableFaculty) {
            for (const room of suitableRooms) {
              domains.push({ day, slots, faculty: [faculty], room });
            }
          }
        }
      }
    }

    // Refine domain based on semester logic
    const refined = this.handler.refineDomain(variable, domains);

    // Simple LCV Heuristic: Shuffle to spread out
    refined.sort(() => Math.random() - 0.5);

    // Lab Scheduling Preferences: Avoid last hour, prefer morning/mid-session
    if (variable.type === 'lab') {
      const lunchMins = this.timeToMinutes(this.settings.lunch_break_start);
      const dayEndMins = this.timeToMinutes(this.settings.college_end_time);

      refined.sort((a, b) => {
        const startMinsA = this.timeToMinutes(a.slots[0]);
        const endMinsA = this.timeToMinutes(a.slots[a.slots.length - 1]) + this.periodDuration;
        const startMinsB = this.timeToMinutes(b.slots[0]);
        const endMinsB = this.timeToMinutes(b.slots[b.slots.length - 1]) + this.periodDuration;

        let scoreA = 0;
        let scoreB = 0;

        // Prefer morning/mid
        if (startMinsA < lunchMins) scoreA += 10;
        if (startMinsB < lunchMins) scoreB += 10;

        // Avoid last hour
        if (endMinsA >= dayEndMins) scoreA -= 20;
        if (endMinsB >= dayEndMins) scoreB -= 20;

        return scoreB - scoreA;
      });
    }

    return refined;
  }

  isValid(variable, assignment) {
    const { day, slots, faculty, room } = assignment;

    // 1. Basic Overlap Checks (Hard Constraints)
    for (const slot of slots) {
      const key = `${day}-${slot}`;

      // Faculty Overlap
      for (const f of faculty) {
        if (this.facultyAssignments.get(f._id.toString())?.has(key)) return false;
      }

      // Room Overlap
      if (this.roomAssignments.get(room._id.toString())?.has(key)) return false;

      // Division/Batch Overlap
      const divAssigns = this.divisionAssignments.get(variable.division._id.toString());
      if (divAssigns?.has(key)) {
        const existing = divAssigns.get(key);
        // If existing is 'theory', whole division is locked.
        if (existing.type === 'theory') return false;

        // If current is 'theory', it cannot overlap with any existing lab.
        if (variable.type === 'theory') return false;

        // If both are labs, they must be for DIFFERENT batches
        if (variable.type === 'lab' && existing.type === 'lab') {
          if (existing.batches.has(variable.batch?._id.toString())) {
            return false; // This batch is already busy
          }
        }
      }
    }

    // 2. Service-based Validations
    const isFacultyAvailable = faculty.every(f =>
      constraintService.validateFacultyAvailability(f, day, slots)
    );
    if (!isFacultyAvailable) {
      // console.log("Faculty not available:", faculty.map(f=>f.name));
      return false;
    }

    if (!constraintService.validateRoomAvailability(room, variable.division, variable.type)) {
      // console.log("Room not available:", room.roomNumber);
      return false;
    }

    if (!constraintService.validateLabContinuity(variable, slots)) {
      // console.log("Lab continuity failed");
      return false;
    }

    // 3. Semester-specific validation
    const handlerCheck = this.handler.validateSlot(variable, assignment);
    if (!handlerCheck.valid) {
      // console.log("Handler check failed:", handlerCheck.reason);
      return false;
    }

    return true;
  }

  applyAssignment(variable, assignment) {
    const { day, slots, faculty, room } = assignment;

    slots.forEach(slot => {
      const key = `${day}-${slot}`;
      faculty.forEach(f => this.addToMap(this.facultyAssignments, f._id.toString(), key));
      this.addToMap(this.roomAssignments, room._id.toString(), key);
      let divAssigns = this.divisionAssignments.get(variable.division._id.toString());
      if (!divAssigns) {
        divAssigns = new Map();
        this.divisionAssignments.set(variable.division._id.toString(), divAssigns);
      }

      if (!divAssigns.has(key)) {
        divAssigns.set(key, { type: variable.type, batches: new Set() });
      }

      if (variable.type === 'lab' && variable.batch) {
        divAssigns.get(key).batches.add(variable.batch._id.toString());
      } else if (variable.type === 'theory') {
        divAssigns.set(key, { type: 'theory', batches: new Set() });
      }
    });

    this.timetable.push({
      day,
      startTime: slots[0],
      endTime: this.calculateEndTime(slots[slots.length - 1]),
      subject: variable.subject,
      faculty: faculty.length > 1 ? faculty : faculty[0],
      room,
      division: variable.division,
      batch: variable.batch,
      type: variable.type
    });
  }

  removeAssignment(variable, assignment) {
    const { day, slots, faculty, room } = assignment;

    slots.forEach(slot => {
      const key = `${day}-${slot}`;
      faculty.forEach(f => this.facultyAssignments.get(f._id.toString()).delete(key));
      this.roomAssignments.get(room._id.toString()).delete(key);

      const divAssigns = this.divisionAssignments.get(variable.division._id.toString());
      if (divAssigns && divAssigns.has(key)) {
        if (variable.type === 'theory') {
          divAssigns.delete(key);
        } else if (variable.type === 'lab' && variable.batch) {
          const entry = divAssigns.get(key);
          entry.batches.delete(variable.batch._id.toString());
          if (entry.batches.size === 0) {
            divAssigns.delete(key);
          }
        }
      }
    });

    this.timetable.pop();
  }

  addToMap(map, id, key) {
    if (!map.has(id)) map.set(id, new Set());
    map.get(id).add(key);
  }

  calculateEndTime(startTime) {
    const startMins = this.timeToMinutes(startTime);
    return this.minutesToTime(startMins + this.periodDuration);
  }
}

module.exports = TimetableGenerator;
