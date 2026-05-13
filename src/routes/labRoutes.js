const express = require('express');
const { getLabs, getLab, createLab, updateLab, deleteLab } = require('../controllers/labController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const { validateLab } = require('../middleware/validation/infrastructureValidation');

const router = express.Router();

router.route('/').get(protect, getLabs).post(protect, isAdmin, validateLab, createLab);
router.route('/:id').get(protect, getLab).put(protect, isAdmin, validateLab, updateLab).delete(protect, isAdmin, deleteLab);

module.exports = router;
