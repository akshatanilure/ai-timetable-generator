const { body, validationResult } = require('express-validator');

exports.validateRoom = [
  body('roomNumber').notEmpty().withMessage('Room number is required'),
  body('capacity').isNumeric().withMessage('Capacity must be a number'),
  body('roomType').isIn(['lecture', 'seminar', 'tutorial']).withMessage('Invalid room type'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
];

exports.validateLab = [
  body('labName').notEmpty().withMessage('Lab name is required'),
  body('labType').notEmpty().withMessage('Lab type is required'),
  body('capacity').isNumeric().withMessage('Capacity must be a number'),
  body('supportedSubjects').isArray().withMessage('Supported subjects must be an array'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
];
