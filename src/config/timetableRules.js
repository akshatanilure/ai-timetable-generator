/**
 * Centralized Timetable Rules Configuration
 * Automatically provides semester-based timing, batch, lab, and staffing rules.
 */

const DEFAULT_TIMETABLE_RULES = {
  college_end_time: "16:30",
  period_duration: 60, // in minutes
  lab_duration_hours: 2, // exactly 2 continuous hours
  short_break_start: "10:00",
  short_break_end: "10:30",
  lunch_break_start: "12:30",
  lunch_break_end: "14:30",
};

/**
 * Returns complete rules for a specific semester
 * @param {number} semester - Semester number (1 to 8)
 * @returns {object} Timetable rules configuration for the semester
 */
function getRulesForSemester(semester) {
  const semNum = parseInt(semester, 10) || 1;
  const is8amStart = [1, 2, 5].includes(semNum);
  const collegeStartTime = is8amStart ? "08:00" : "09:00";

  let batchConfig = {
    numBatches: 2,
    batchNames: ["Batch A1", "Batch A2"],
    pairs: [["Batch A1", "Batch A2"]],
    facultyPerBatch: 3,
    fullClassFaculty: 2
  };

  if ([3, 4, 5, 6].includes(semNum)) {
    batchConfig = {
      numBatches: 3,
      batchNames: ["Batch A1", "Batch A2", "Batch A3"],
      pairs: [
        ["Batch A1", "Batch A2"],
        ["Batch A2", "Batch A3"],
        ["Batch A1", "Batch A3"]
      ],
      facultyPerBatch: 2,
      fullClassFaculty: 2
    };
  } else if (semNum >= 7) {
    batchConfig = {
      numBatches: 3,
      batchNames: ["Batch A1", "Batch A2", "Batch A3"],
      pairs: [
        ["Batch A1", "Batch A2"],
        ["Batch A2", "Batch A3"],
        ["Batch A1", "Batch A3"]
      ],
      facultyPerBatch: 2,
      fullClassFaculty: 2
    };
  }

  return {
    ...DEFAULT_TIMETABLE_RULES,
    semester: semNum,
    college_start_time: collegeStartTime,
    is8amStart,
    batchConfig
  };
}

module.exports = {
  DEFAULT_TIMETABLE_RULES,
  getRulesForSemester
};
