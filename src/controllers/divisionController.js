const Division = require('../models/Division');

exports.getDivisions = async (req, res) => {
  try {
    const divisions = await Division.find();
    res.status(200).json({ success: true, count: divisions.length, data: divisions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getDivision = async (req, res) => {
  try {
    const division = await Division.findById(req.params.id);
    if (!division) return res.status(404).json({ success: false, error: 'Division not found' });
    res.status(200).json({ success: true, data: division });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createDivision = async (req, res) => {
  try {
    const division = await Division.create(req.body);
    res.status(201).json({ success: true, data: division });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateDivision = async (req, res) => {
  try {
    const division = await Division.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!division) return res.status(404).json({ success: false, error: 'Division not found' });
    res.status(200).json({ success: true, data: division });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteDivision = async (req, res) => {
  try {
    const division = await Division.findById(req.params.id);
    if (!division) return res.status(404).json({ success: false, error: 'Division not found' });
    await division.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
