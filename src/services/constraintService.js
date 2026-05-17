const Constraint = require('../models/Constraint');

/**
 * Constraint Processing Service
 * Handles loading and validation of academic scheduling constraints
 */
class ConstraintService {
  /**
   * Loads all constraints for a specific semester and department
   */
  async getProcessedConstraints(semester, department) {
    const constraints = await Constraint.findOne({ semester, department });
    
    // Default structure if none found in DB
    const defaultConstraints = {
      hardConstraints: {
        noFacultyOverlap: true,
        noRoomOverlap: true,
        continuousLabs: true,
        lunchBreak: { enabled: true, startTime: '13:00', endTime: '14:00' },
        fixedWorkingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      },
      softConstraints: {
        avoidLastHourHeavySubject: { enabled: true, weight: 5 },
        facultyPreferences: { enabled: true, weight: 10 },
        minimizeGaps: { enabled: true, weight: 3 },
        spreadSubjects: { enabled: true, weight: 4 }
      }
    };

    return constraints || defaultConstraints;
  }

  /**
   * Validates if the faculty is available for the given day and slots
   */
  validateFacultyAvailability(faculty, day, slots) {
    if (!faculty || !faculty.availability || faculty.availability.length === 0) {
      return true; // Assume available if no constraints specified
    }

    const dayAvail = faculty.availability.find(a => a.day === day);
    if (!dayAvail) return false;

    // Check if every slot requested is within the faculty's available time ranges
    return slots.every(slot => 
      dayAvail.slots.some(range => {
        return slot >= range.startTime && slot < range.endTime;
      })
    );
  }

  /**
   * Validates room availability and capacity
   */
  validateRoomAvailability(room, division, type) {
    if (!room) return false;
    
    // Check capacity for theory classes
    if (type === 'theory' && room.capacity < division.strength) {
      return false;
    }

    return true;
  }

  /**
   * Validates if lab sessions are continuous (2+ hours)
   */
  validateLabContinuity(variable, slots) {
    if (variable.type !== 'lab') return true;
    
    // Labs should be at least 2 hours (2 slots)
    return slots.length >= 2;
  }

  /**
   * Validates that subject weekly hours are not exceeded
   * This ensures we don't over-schedule a subject beyond its defined capacity
   */
  validateSubjectWeeklyHours(subject, timetable) {
    if (!subject || !timetable) return true;

    const assignedHours = timetable.reduce((total, entry) => {
      if (entry.subject._id.toString() === subject._id.toString()) {
        // Entry might be 1 hour or 2 hours (labs)
        const duration = entry.type === 'lab' ? 2 : 1;
        return total + duration;
      }
      return total;
    }, 0);

    // Max hours is theory + tutorial + lab
    const maxHours = (subject.lectureHours || 0) + (subject.tutorialHours || 0) + (subject.practicalHours || 0);
    return assignedHours < maxHours;
  }

  /**
   * Returns a structured object of all validation results
   * This provides a clear report on why a slot might be invalid
   */
  getValidationReport(variable, assignment, timetable) {
    const { faculty, room, day, slots } = assignment;
    const { division, subject } = variable;

    const results = {
      facultyAvailable: faculty.every(f => this.validateFacultyAvailability(f, day, slots)),
      roomSuitable: this.validateRoomAvailability(room, division, variable.type),
      labContinuous: this.validateLabContinuity(variable, slots),
      hoursRespected: this.validateSubjectWeeklyHours(subject, timetable)
    };

    return {
      isValid: Object.values(results).every(v => v === true),
      results
    };
  }
}

module.exports = new ConstraintService();
