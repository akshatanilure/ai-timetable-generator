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
const { isAdminOrTeacher } = require('../middleware/roleMiddleware');

router.post('/generate', protect, isAdminOrTeacher, generateTimetable);
router.post('/generate-ml', protect, isAdminOrTeacher, generateTimetableML);
router.post('/save-ml', protect, isAdminOrTeacher, saveTimetableML);
router.post('/validate', protect, validateTimetable);
router.get('/:id/workload', protect, getWorkload);

router
  .route('/')
  .get(protect, getTimetables)
  .post(protect, isAdminOrTeacher, createTimetable);

router
  .route('/:id')
  .get(protect, getTimetable)
  .put(protect, isAdminOrTeacher, updateTimetable)
  .delete(protect, isAdminOrTeacher, deleteTimetable);

module.exports = router;
