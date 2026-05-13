const { body, validationResult } = require('express-validator');

exports.validateDivision = [
  body('semester').isNumeric().withMessage('Semester must be a number'),
  body('divisionName').notEmpty().withMessage('Division name is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('strength').isNumeric().withMessage('Strength must be a number'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
];

exports.validateBatch = [
  body('batchName').notEmpty().withMessage('Batch name is required'),
  body('division').isMongoId().withMessage('Valid division ID is required'),
  body('studentCount').isNumeric().withMessage('Student count must be a number'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
];
