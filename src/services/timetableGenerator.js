const ConstraintHandler = require('./constraintHandler');
const LabAllocator = require('./labAllocator');

class TimetableGenerator {
  constructor(data) {
    this.teachers = data.teachers;
    this.rooms = data.rooms;
    this.labs = data.labs;
    this.divisions = data.divisions;
    this.subjects = data.subjects;
    this.batches = data.batches || [];
    this.constraints = data.constraints;

    // specialized engines
    this.handler = new ConstraintHandler(data.divisions[0]?.semester, data.divisions[0]?.department);
    this.labEngine = new LabAllocator(this);

    // Configuration
    this.days = this.constraints?.hardConstraints?.fixedWorkingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    this.timeSlots = this.generateTimeSlots('09:00', '17:00');
    this.lunchBreak = this.constraints?.hardConstraints?.lunchBreak || { startTime: '13:00', endTime: '14:00' };

    // State
    this.timetable = [];
    this.facultyAssignments = new Map(); // Map<facultyId, Set<day-slot>>
    this.roomAssignments = new Map();    // Map<roomId, Set<day-slot>>
    this.divisionAssignments = new Map(); // Map<divId, Set<day-slot>>
  }

  generateTimeSlots(start, end) {
    const slots = [];
    let current = parseInt(start.split(':')[0]);
    const finish = parseInt(end.split(':')[0]);
    while (current < finish) {
      slots.push(`${current.toString().padStart(2, '0')}:00`);
      current++;
    }
    return slots;
  }

  generate() {
    const variables = this.prepareVariables();
    // Heuristic: Sort by difficulty (Labs first, then subjects with high priority)
    variables.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'lab' ? -1 : 1;
      return b.subject.priority - a.subject.priority;
    });

    if (this.backtrack(variables, 0)) {
      return { success: true, schedule: this.timetable };
    }
    return { success: false, error: 'Infeasible constraints: No valid schedule found' };
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
        // Labs
        if (sub.subjectType === 'lab') {
          const divBatches = this.batches.filter(b => b.division.toString() === div._id.toString());
          divBatches.forEach(batch => {
            // Labs are usually 2 hours continuous
            vars.push({ division: div, subject: sub, type: 'lab', batch, duration: 2 });
          });
        }
      });
    });
    return vars;
  }

  backtrack(variables, index) {
    if (index === variables.length) return true;

    const variable = variables[index];
    const domains = this.getOrderedDomains(variable);

    for (const assignment of domains) {
      if (this.isValid(variable, assignment)) {
        this.applyAssignment(variable, assignment);
        if (this.backtrack(variables, index + 1)) return true;
        this.removeAssignment(variable, assignment);
      }
    }
    return false;
  }

  getOrderedDomains(variable) {
    const domains = [];
    const suitableFaculty = this.teachers.filter(t => t.subjectsHandled.includes(variable.subject.subjectName));
    const suitableRooms = variable.type === 'lab'
      ? this.labs.filter(l => l.supportedSubjects.some(s => s._id.toString() === variable.subject._id.toString()))
      : this.rooms.filter(r => r.roomType === 'lecture' && r.capacity >= variable.division.strength);

    for (const day of this.days) {
      for (let i = 0; i <= this.timeSlots.length - variable.duration; i++) {
        const slots = this.timeSlots.slice(i, i + variable.duration);
        if (slots.some(s => s === this.lunchBreak.startTime)) continue;

        if (variable.type === 'lab') {
          // Use LabAllocator engine
          const allocation = this.labEngine.allocate(variable, day, slots);
          if (allocation) {
            domains.push({
              day,
              slots,
              faculty: allocation.faculty, // Array of 2
              room: allocation.lab
            });
          }
        } else {
          // Regular Theory logic
          for (const faculty of suitableFaculty) {
            for (const room of suitableRooms) {
              domains.push({ day, slots, faculty: [faculty], room }); // Wrap in array for consistency
            }
          }
        }
      }
    }
    
    // Refine domain based on semester logic
    const refined = this.handler.refineDomain(variable, domains);

    // Simple LCV Heuristic: Shuffle to spread out
    return refined.sort(() => Math.random() - 0.5);
  }

  isValid(variable, assignment) {
    const { day, slots, faculty, room } = assignment;

    // Semester specific validation
    const handlerCheck = this.handler.validateSlot(variable, assignment);
    if (!handlerCheck.valid) return false;

    // Check overlaps for each slot in the duration
    for (const slot of slots) {
      const key = `${day}-${slot}`;

      for (const f of faculty) {
        if (this.facultyAssignments.get(f._id.toString())?.has(key)) return false;
      }
      
      if (this.roomAssignments.get(room._id.toString())?.has(key)) return false;
      
      // Division overlap check
      if (variable.type === 'theory') {
        if (this.divisionAssignments.get(variable.division._id.toString())?.has(key)) return false;
      } else {
        // Lab: Check if the specific BATCH is busy, or if a lecture is happening for the whole division
        // To keep it simple, we check if the division is busy at all for now
        if (this.divisionAssignments.get(variable.division._id.toString())?.has(key)) return false;
      }

      // Faculty Availability
      if (faculty.availability?.length > 0) {
        const dayAvail = faculty.availability.find(a => a.day === day);
        if (!dayAvail || !dayAvail.slots.some(s => s.startTime <= slot && s.endTime > slot)) return false;
      }
    }

    return true;
  }

  applyAssignment(variable, assignment) {
    const { day, slots, faculty, room } = assignment;
    
    slots.forEach(slot => {
      const key = `${day}-${slot}`;
      faculty.forEach(f => this.addToMap(this.facultyAssignments, f._id.toString(), key));
      this.addToMap(this.roomAssignments, room._id.toString(), key);
      this.addToMap(this.divisionAssignments, variable.division._id.toString(), key);
    });

    this.timetable.push({
      day,
      startTime: slots[0],
      endTime: this.calculateEndTime(slots[slots.length - 1]),
      subject: variable.subject,
      faculty: faculty.length > 1 ? faculty : faculty[0], // Store array for labs, single for theory
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
      this.divisionAssignments.get(variable.division._id.toString()).delete(key);
    });

    this.timetable.pop();
  }

  addToMap(map, id, key) {
    if (!map.has(id)) map.set(id, new Set());
    map.get(id).add(key);
  }

  calculateEndTime(startTime) {
    const hour = parseInt(startTime.split(':')[0]);
    return `${(hour + 1).toString().padStart(2, '0')}:00`;
  }
}

module.exports = TimetableGenerator;
