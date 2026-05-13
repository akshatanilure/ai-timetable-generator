/**
 * Semester-wise Constraint Handler System
 * Provides specialized logic for different academic semesters
 */

class ConstraintHandler {
  constructor(semester, department) {
    this.semester = semester;
    this.department = department;
  }

  /**
   * Applies semester-specific priority to a subject
   */
  getSubjectPriority(subject) {
    let priority = subject.priority || 1;

    // Sem 1: 1 credit subjects low priority
    if (this.semester === 1 && subject.credits === 1) {
      priority -= 2;
    }

    // Sem 8: Projects high priority
    if (this.semester === 8 && subject.subjectType === 'project') {
      priority += 10;
    }

    return priority;
  }

  /**
   * Validates a slot based on semester-specific rules
   */
  validateSlot(session, assignment) {
    const { room } = assignment;

    // Sem 2: Drawing hall constraints
    if (this.semester === 2 && session.subject.subjectName.toLowerCase().includes('drawing')) {
      if (room.roomType !== 'drawing_hall') {
        return { valid: false, reason: 'Drawing requires a Drawing Hall' };
      }
    }

    // Sem 5-7: Electives same time logic is usually handled at the generation level
    // by grouping variables, but we can check here if needed.

    return { valid: true };
  }

  /**
   * Modifies the domain of possible values for a session
   */
  refineDomain(session, domains) {
    // Sem 5-7: Elective balancing
    if (this.semester >= 5 && this.semester <= 7 && session.subject.subjectType === 'elective') {
      // Logic to prefer specific time slots for all electives of this semester
      // For now, we'll just flag it for potential logic implementation
    }

    // Sem 1: External departments (Maths/Physics/Chemistry)
    // Often these have fixed slots because teachers come from other departments
    if (this.semester === 1 && ['Maths', 'Physics', 'Chemistry'].some(s => session.subject.subjectName.includes(s))) {
      // Prefer morning slots
      return domains.sort((a, b) => {
        return parseInt(a.slots[0]) - parseInt(b.slots[0]);
      });
    }

    return domains;
  }

  /**
   * Returns specific session generation logic for the semester
   */
  getRequiredSessions(subject) {
    // Sem 8: Only projects
    if (this.semester === 8 && subject.subjectType !== 'project') {
      return 0; // Skip non-project subjects in Sem 8
    }

    return null; // Use default logic
  }
}

module.exports = ConstraintHandler;
