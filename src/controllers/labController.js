const Lab = require('../models/Lab');

exports.getLabs = async (req, res) => {
  try {
    const labs = await Lab.find().populate('supportedSubjects', 'subjectName subjectCode');
    res.status(200).json({ success: true, count: labs.length, data: labs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getLab = async (req, res) => {
  try {
    const lab = await Lab.findById(req.params.id).populate('supportedSubjects', 'subjectName subjectCode');
    if (!lab) return res.status(404).json({ success: false, error: 'Lab not found' });
    res.status(200).json({ success: true, data: lab });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createLab = async (req, res) => {
  try {
    const lab = await Lab.create(req.body);
    res.status(201).json({ success: true, data: lab });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateLab = async (req, res) => {
  try {
    const lab = await Lab.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!lab) return res.status(404).json({ success: false, error: 'Lab not found' });
    res.status(200).json({ success: true, data: lab });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteLab = async (req, res) => {
  try {
    const lab = await Lab.findById(req.params.id);
    if (!lab) return res.status(404).json({ success: false, error: 'Lab not found' });
    await lab.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
