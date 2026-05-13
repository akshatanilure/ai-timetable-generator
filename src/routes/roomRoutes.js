const express = require('express');
const { getRooms, getRoom, createRoom, updateRoom, deleteRoom } = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const { validateRoom } = require('../middleware/validation/infrastructureValidation');

const router = express.Router();

router.route('/').get(protect, getRooms).post(protect, isAdmin, validateRoom, createRoom);
router.route('/:id').get(protect, getRoom).put(protect, isAdmin, validateRoom, updateRoom).delete(protect, isAdmin, deleteRoom);

module.exports = router;
