const express = require('express');
const {
  getSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject,
} = require('../controllers/subjectController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const { validateSubject } = require('../middleware/validation/subjectValidation');

const router = express.Router();

router
  .route('/')
  .get(protect, getSubjects)
  .post(protect, isAdmin, validateSubject, createSubject);

router
  .route('/:id')
  .get(protect, getSubject)
  .put(protect, isAdmin, validateSubject, updateSubject)
  .delete(protect, isAdmin, deleteSubject);

module.exports = router;
