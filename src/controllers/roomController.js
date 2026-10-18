const Room = require('../models/Room');

exports.getRooms = async (req, res) => {
  try {
    const prog = req.query.program || 'UG';
    const query = prog === 'PG'
      ? { program: 'PG' }
      : { $or: [{ program: 'UG' }, { program: { $exists: false } }, { program: null }] };
    const rooms = await Room.find(query);
    res.status(200).json({ success: true, count: rooms.length, data: rooms });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, error: 'Room not found' });
    res.status(200).json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createRoom = async (req, res) => {
  try {
    const roomData = {
      ...req.body,
      program: req.body.program || 'UG',
    };
    const room = await Room.create(roomData);
    res.status(201).json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!room) return res.status(404).json({ success: false, error: 'Room not found' });
    res.status(200).json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, error: 'Room not found' });
    await room.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
