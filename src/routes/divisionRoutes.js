const express = require('express');
const { getDivisions, getDivision, createDivision, updateDivision, deleteDivision } = require('../controllers/divisionController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const { validateDivision } = require('../middleware/validation/academicValidation');

const router = express.Router();

router.route('/').get(protect, getDivisions).post(protect, isAdmin, validateDivision, createDivision);
router.route('/:id').get(protect, getDivision).put(protect, isAdmin, validateDivision, updateDivision).delete(protect, isAdmin, deleteDivision);

module.exports = router;
