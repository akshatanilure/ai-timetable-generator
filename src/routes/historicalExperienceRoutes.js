const express = require('express');
const router = express.Router();
const experienceController = require('../controllers/historicalExperienceController');

router.post('/import', experienceController.importHistoricalData);
router.get('/rankings', experienceController.getRankings);
router.get('/ranking/:subjectId', experienceController.getSubjectRanking);
router.get('/stats', experienceController.getStats);

module.exports = router;

