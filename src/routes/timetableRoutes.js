const express = require('express');
const router = express.Router();
const {
  getTimetables,
  getTimetable,
  createTimetable,
  generateTimetable,
  validateTimetable,
  getWorkload,
  updateTimetable,
  deleteTimetable,
} = require('../controllers/timetableController');

const { protect } = require('../middleware/authMiddleware');
const { isAdminOrTeacher } = require('../middleware/roleMiddleware');

router.post('/generate', protect, isAdminOrTeacher, generateTimetable);
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
