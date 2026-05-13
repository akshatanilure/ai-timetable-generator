const express = require('express');
const {
  getConstraints,
  getConstraintBySemester,
  upsertConstraint,
  deleteConstraint,
} = require('../controllers/constraintController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

const router = express.Router();

router
  .route('/')
  .get(protect, getConstraints)
  .post(protect, isAdmin, upsertConstraint);

router
  .route('/semester/:semester')
  .get(protect, getConstraintBySemester);

router
  .route('/:id')
  .delete(protect, isAdmin, deleteConstraint);

module.exports = router;
