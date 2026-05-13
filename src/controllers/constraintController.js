const Constraint = require('../models/Constraint');

exports.getConstraints = async (req, res) => {
  try {
    const constraints = await Constraint.find();
    res.status(200).json({ success: true, count: constraints.length, data: constraints });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getConstraintBySemester = async (req, res) => {
  try {
    const constraint = await Constraint.findOne({
      semester: req.params.semester,
      department: req.query.department || 'Computer Science', // Default for now
    });
    if (!constraint) return res.status(404).json({ success: false, error: 'Constraints not found for this semester' });
    res.status(200).json({ success: true, data: constraint });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.upsertConstraint = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;
    const { semester, department } = req.body;

    const constraint = await Constraint.findOneAndUpdate(
      { semester, department },
      req.body,
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: constraint });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteConstraint = async (req, res) => {
  try {
    const constraint = await Constraint.findById(req.params.id);
    if (!constraint) return res.status(404).json({ success: false, error: 'Constraint not found' });
    await constraint.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
