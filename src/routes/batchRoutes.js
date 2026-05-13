const express = require('express');
const { getBatches, getBatch, createBatch, updateBatch, deleteBatch } = require('../controllers/batchController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const { validateBatch } = require('../middleware/validation/academicValidation');

const router = express.Router();

router.route('/').get(protect, getBatches).post(protect, isAdmin, validateBatch, createBatch);
router.route('/:id').get(protect, getBatch).put(protect, isAdmin, validateBatch, updateBatch).delete(protect, isAdmin, deleteBatch);

module.exports = router;
