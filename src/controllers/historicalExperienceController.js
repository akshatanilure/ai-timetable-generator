const historicalExperienceService = require('../services/historicalExperienceService');
const HistoricalExperience = require('../models/HistoricalExperience');

// @desc    Import historical experience from Excel file (supports base64, buffer, or local path)
// @route   POST /api/experience/import
// @access  Public / Admin
exports.importHistoricalData = async (req, res) => {
  try {
    let fileBufferOrPath = null;
    if (req.body && req.body.base64) {
      const cleanBase64 = req.body.base64.replace(/^data:.*?;base64,/, '');
      fileBufferOrPath = Buffer.from(cleanBase64, 'base64');
    } else if (req.file && req.file.buffer) {
      fileBufferOrPath = req.file.buffer;
    } else if (req.body && req.body.filePath) {
      fileBufferOrPath = req.body.filePath;
    }

    const result = await historicalExperienceService.importHistoricalExcel(fileBufferOrPath);
    res.status(200).json({
      success: true,
      message: 'Historical experience data imported successfully',
      data: result
    });
  } catch (error) {
    console.error('Import Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get experience rankings for all subjects (or filtered by sem/program)
// @route   GET /api/experience/rankings
// @access  Public / Admin
exports.getRankings = async (req, res) => {
  try {
    const { semester, program } = req.query;
    const rankings = await historicalExperienceService.getAllSubjectsRankings(semester, program);
    res.status(200).json({
      success: true,
      count: Object.keys(rankings).length,
      data: rankings
    });
  } catch (error) {
    console.error('Get Rankings Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get experience ranking for a single subject
// @route   GET /api/experience/ranking/:subjectId
// @access  Public / Admin
exports.getSubjectRanking = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const ranking = await historicalExperienceService.getSubjectExperienceRanking(subjectId);
    res.status(200).json({
      success: true,
      data: ranking
    });
  } catch (error) {
    console.error('Get Subject Ranking Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get summary statistics of imported experience records
// @route   GET /api/experience/stats
// @access  Public / Admin
exports.getStats = async (req, res) => {
  try {
    const totalCount = await HistoricalExperience.countDocuments();
    const topCount = await HistoricalExperience.countDocuments({ isTopTeacher: true });
    const distinctSubjects = await HistoricalExperience.distinct('subjectNormalized');
    const distinctTeachers = await HistoricalExperience.distinct('teacherNormalized');

    res.status(200).json({
      success: true,
      data: {
        totalRecords: totalCount,
        topTeachersCount: topCount,
        uniqueSubjects: distinctSubjects.length,
        uniqueTeachers: distinctTeachers.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
