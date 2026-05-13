const { body, validationResult } = require('express-validator');

exports.validateSubject = [
  body('subjectCode').notEmpty().withMessage('Subject code is required'),
  body('subjectName').notEmpty().withMessage('Subject name is required'),
  body('semester').isNumeric().withMessage('Semester must be a number'),
  body('department').notEmpty().withMessage('Department is required'),
  body('credits').isNumeric().withMessage('Credits must be a number'),
  body('subjectType')
    .isIn(['theory', 'lab', 'project', 'elective'])
    .withMessage('Invalid subject type'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
];
