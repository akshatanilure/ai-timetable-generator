const express = require('express');
const {
  getTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  deleteTeacher,
} = require('../controllers/teacherController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin, isAdminOrTeacher } = require('../middleware/roleMiddleware');
const { validateTeacher } = require('../middleware/validation/teacherValidation');

const router = express.Router();

router
  .route('/')
  .get(protect, isAdminOrTeacher, getTeachers)
  .post(protect, isAdmin, validateTeacher, createTeacher);

router
  .route('/:id')
  .get(protect, isAdminOrTeacher, getTeacher)
  .put(protect, isAdminOrTeacher, validateTeacher, updateTeacher)
  .delete(protect, isAdmin, deleteTeacher);

module.exports = router;
