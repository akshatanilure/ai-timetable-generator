const Timetable = require('../models/Timetable');
const Teacher = require('../models/Teacher');
const Room = require('../models/Room');
const Lab = require('../models/Lab');
const Subject = require('../models/Subject');
const Division = require('../models/Division');
const Batch = require('../models/Batch');
const Constraint = require('../models/Constraint');
const TimetableSetting = require('../models/TimetableSetting');
const TimetableGenerator = require('../services/timetableGenerator');
const ConflictChecker = require('../services/conflictChecker');
const WorkloadService = require('../services/workloadService');

// @desc    Get faculty workload for a timetable
// @route   GET /api/timetables/:id/workload
// @access  Private
exports.getWorkload = async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);
    if (!timetable) return res.status(404).json({ success: false, error: 'Timetable not found' });

    const teachers = await Teacher.find();
    const service = new WorkloadService(timetable.generatedSchedule, teachers);
    const report = service.getCompleteReport();

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
// @route   POST /api/timetables/validate
// @access  Private
exports.validateTimetable = async (req, res) => {
  try {
    const { schedule } = req.body;

    if (!schedule || !Array.isArray(schedule)) {
      return res.status(400).json({ success: false, error: 'Schedule array is required' });
    }

    const checker = new ConflictChecker(schedule);
    const report = checker.checkAll();

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
// @desc    Generate a new timetable
// @route   POST /api/timetables/generate
// @access  Private (Admin)
exports.generateTimetable = async (req, res) => {
  try {
    const { semester, branch, facultyMapping } = req.body;

    // 1-5. Load all necessary data
    const teachers = await Teacher.find();
    const rooms = await Room.find();
    const labs = await Lab.find().populate('supportedSubjects');
    const divisions = await Division.find({ semester, department: branch || 'CSE' });
    const subjects = await Subject.find({ semester, branch: branch || 'CSE' });
    const batches = await Batch.find().populate('division');
    
    // 6. Apply constraints
    const constraints = await Constraint.findOne({ semester, department: branch || 'CSE' });
    
    let settings = await TimetableSetting.findOne();
    if (!settings) {
      settings = await TimetableSetting.create({});
    }

    if (!divisions.length || !subjects.length) {
      return res.status(400).json({ success: false, error: 'No divisions or subjects found for the given criteria' });
    }

    // 7. Initialize Generator and Generate
    const generator = new TimetableGenerator({
      teachers,
      rooms,
      labs,
      divisions,
      subjects,
      constraints,
      batches,
      facultyMapping,
      settings,
    });

    const result = generator.generate();

    if (result.success) {
      // 8. Detect Conflicts
      const checker = new ConflictChecker(result.schedule);
      const conflictReport = checker.checkAll();

      // 9. Calculate Workload Report
      const workloadService = new WorkloadService(result.schedule, teachers);
      const workloadReport = workloadService.getCompleteReport();

      // 10. Save Timetable
      const timetable = await Timetable.create({
        semester,
        division: divisions[0]._id,
        generatedSchedule: result.schedule.map(entry => ({
          day: entry.day,
          startTime: entry.startTime,
          endTime: entry.endTime,
          subject: entry.subject._id,
          faculty: Array.isArray(entry.faculty) ? entry.faculty.map(f => f._id) : [entry.faculty._id],
          room: entry.room._id,
          batch: entry.batch ? entry.batch._id : undefined
        })),
        conflicts: conflictReport.conflicts.map(c => c.message),
        settings: {
          college_start_time: settings.college_start_time,
          college_end_time: settings.college_end_time,
          period_duration: settings.period_duration,
          short_break_start: settings.short_break_start,
          short_break_end: settings.short_break_end,
          lunch_break_start: settings.lunch_break_start,
          lunch_break_end: settings.lunch_break_end
        },
        createdBy: req.user.id,
        generatedAt: Date.now(),
      });

      // 11. Update Faculty Workload in DB
      for (const [facultyId, workload] of Object.entries(workloadReport)) {
        if (workload.summary.totalWeeklyHours > 0) {
          await Teacher.findByIdAndUpdate(facultyId, {
            $inc: { currentWorkload: workload.summary.totalWeeklyHours }
          });
        }
      }

      res.status(201).json({
        success: true,
        data: {
          timetable,
          conflicts: conflictReport,
          workload: workloadReport,
          matrix: result.matrix,
          slots: result.slots
        }
      });
    } else {
      res.status(422).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Generate a new timetable using the Python ML Engine
// @route   POST /api/timetables/generate-ml
// @access  Private (Admin)
exports.generateTimetableML = async (req, res) => {
  try {
    const { semester, branch, facultyMapping, divisions, facultyMaxWorkloads, fixedTimings } = req.body;

    // 1. Gather all data from MongoDB exactly like the normal generator
    const teachers = await Teacher.find();
    const rooms = await Room.find();
    const subjects = await Subject.find({ semester, branch: branch || 'CSE' });
    const constraints = await Constraint.findOne({ semester, department: branch || 'CSE' });

    if (!subjects.length) {
      return res.status(400).json({ success: false, error: 'No subjects found for the given criteria' });
    }

    // 2. Format the payload to send to Python
    const payload = {
      subjects,
      teachers,
      rooms,
      constraints: constraints || {},
      facultyMapping: facultyMapping || {},
      divisions: divisions || [{ name: 'DIV-A', strength: 60 }],
      facultyMaxWorkloads: facultyMaxWorkloads || {},
      fixedTimings: fixedTimings || {}
    };

    // 3. Make HTTP request to the Python FastAPI microservice
    console.log("Sending data to Python ML Engine...");
    
    // Using native fetch (requires Node 18+)
    const pythonResponse = await fetch('http://127.0.0.1:8000/api/ml/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!pythonResponse.ok) {
      throw new Error(`Python engine responded with status: ${pythonResponse.status}`);
    }

    const mlData = await pythonResponse.json();

    // 4. Return the simulated ML response to the frontend
    res.status(200).json({
      success: true,
      message: mlData.message,
      data: mlData
    });

  } catch (error) {
    console.error("ML Engine Error:", error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to communicate with Python ML Engine. Is it running on port 8000?',
      details: error.message 
    });
  }
};

// @desc    Save Timetables from ML Engine
// @route   POST /api/timetables/save-ml
// @access  Private (Admin)
exports.saveTimetableML = async (req, res) => {
  try {
    const { semester, branch, rawSchedules } = req.body;
    const Timetable = require('../models/Timetable');
    const Division = require('../models/Division');

    const divisions = await Division.find({ semester, department: branch || 'CSE' });
    const saved = [];
    
    for (const [divName, schedule] of Object.entries(rawSchedules)) {
      let div = divisions.find(d => d.divisionName === divName);
      if (!div) {
         div = await Division.create({
           divisionName: divName,
           semester,
           department: branch || 'CSE',
           totalStudents: 60
         });
      }
      
      const timetable = await Timetable.create({
        semester,
        division: div._id,
        generatedSchedule: schedule,
        createdBy: req.user.id
      });
      saved.push(timetable);
    }
    
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all timetables
// @route   GET /api/timetables
// @access  Private
exports.getTimetables = async (req, res) => {
  try {
    const timetables = await Timetable.find()
      .populate('division')
      .populate('createdBy', 'name');
    res.status(200).json({ success: true, count: timetables.length, data: timetables });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single timetable
// @route   GET /api/timetables/:id
// @access  Private
exports.getTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id)
      .populate('division')
      .populate('generatedSchedule.subject')
      .populate('generatedSchedule.faculty')
      .populate('generatedSchedule.room')
      .populate('generatedSchedule.batch');

    if (!timetable) return res.status(404).json({ success: false, error: 'Timetable not found' });
    res.status(200).json({ success: true, data: timetable });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create new timetable
// @route   POST /api/timetables
// @access  Private (Admin)
exports.createTimetable = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;
    const timetable = await Timetable.create(req.body);
    res.status(201).json({ success: true, data: timetable });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update timetable
// @route   PUT /api/timetables/:id
// @access  Private (Admin)
exports.updateTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!timetable) return res.status(404).json({ success: false, error: 'Timetable not found' });
    res.status(200).json({ success: true, data: timetable });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete timetable
// @route   DELETE /api/timetables/:id
// @access  Private (Admin)
exports.deleteTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);
    if (!timetable) return res.status(404).json({ success: false, error: 'Timetable not found' });
    await timetable.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
