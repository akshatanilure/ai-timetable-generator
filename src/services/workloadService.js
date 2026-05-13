/**
 * Faculty Workload Calculation Service
 */

class WorkloadService {
  constructor(timetable, teachers) {
    this.timetable = timetable; // Full schedule array
    this.teachers = teachers;   // Array of all teachers
  }

  /**
   * Generates a complete workload report for all teachers
   */
  getCompleteReport() {
    const report = {};
    this.teachers.forEach(t => {
      report[t._id] = this.getFacultyWorkload(t._id);
    });
    return report;
  }

  /**
   * Calculates detailed workload for a single faculty member
   */
  getFacultyWorkload(facultyId) {
    const facIdStr = facultyId.toString();
    const assignedSessions = this.timetable.filter(s => {
      if (Array.isArray(s.faculty)) {
        return s.faculty.some(f => (f._id?.toString() || f.toString()) === facIdStr);
      }
      return (s.faculty._id?.toString() || s.faculty.toString()) === facIdStr;
    });

    const dailyWorkload = {};
    let totalWeeklyHours = 0;
    let labHours = 0;
    let lectureHours = 0;

    assignedSessions.forEach(s => {
      const { day, type } = s;
      
      // Calculate duration
      const start = parseInt(s.startTime.split(':')[0]);
      const end = parseInt(s.endTime.split(':')[0]);
      const hours = end - start;

      // Update daily stats
      dailyWorkload[day] = (dailyWorkload[day] || 0) + hours;
      
      // Update totals
      totalWeeklyHours += hours;
      if (type === 'lab') labHours += hours;
      else lectureHours += hours;
    });

    return {
      facultyId: facIdStr,
      summary: {
        totalWeeklyHours,
        labHours,
        lectureHours,
        avgHoursPerDay: (totalWeeklyHours / 5).toFixed(2) // Assuming 5 working days
      },
      dailyWorkload,
      assignedSessionsCount: assignedSessions.length
    };
  }
}

module.exports = WorkloadService;
