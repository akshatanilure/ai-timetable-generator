const express = require('express');
const router = express.Router();
const {
  getTimetables,
  getTimetable,
  createTimetable,
  generateTimetable,
  generateTimetableML,
  validateTimetable,
  getWorkload,
  updateTimetable,
  deleteTimetable,
  saveTimetableML,
} = require('../controllers/timetableController');

const { protect } = require('../middleware/authMiddleware');
const { isAdmin, isAdminOrTeacher } = require('../middleware/roleMiddleware');

router.post('/generate', protect, isAdmin, generateTimetable);
router.post('/generate-ml', protect, isAdmin, generateTimetableML);
router.post('/save-ml', protect, isAdmin, saveTimetableML);
router.post('/validate', protect, isAdmin, validateTimetable);
router.get('/:id/workload', protect, isAdminOrTeacher, getWorkload);

router
  .route('/')
  .get(protect, getTimetables)
  .post(protect, isAdmin, createTimetable);

router
  .route('/:id')
  .get(protect, getTimetable)
  .put(protect, isAdmin, updateTimetable)
  .delete(protect, isAdmin, deleteTimetable);

module.exports = router;
