const Timetable = require('../models/Timetable');
const Teacher = require('../models/Teacher');
const Room = require('../models/Room');
const Lab = require('../models/Lab');
const Subject = require('../models/Subject');
const Division = require('../models/Division');
const Batch = require('../models/Batch');
const Constraint = require('../models/Constraint');
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
    const { semester, department } = req.body;

    // 1-5. Load all necessary data
    const teachers = await Teacher.find();
    const rooms = await Room.find();
    const labs = await Lab.find().populate('supportedSubjects');
    const divisions = await Division.find({ semester, department });
    const subjects = await Subject.find({ semester, department });
    const batches = await Batch.find().populate('division');
    
    // 6. Apply constraints
    const constraints = await Constraint.findOne({ semester, department });

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
        generatedSchedule: result.schedule,
        conflicts: conflictReport.conflicts.map(c => c.message),
        createdBy: req.user.id,
        generatedAt: Date.now(),
      });

      res.status(201).json({
        success: true,
        data: {
          timetable,
          conflicts: conflictReport,
          workload: workloadReport
        }
      });
    } else {
      res.status(422).json({ success: false, error: result.error });
    }
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
