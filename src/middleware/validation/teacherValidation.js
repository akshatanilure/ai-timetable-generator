const { body, validationResult } = require('express-validator');

exports.validateTeacher = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('subjectsHandled').isArray().withMessage('Subjects handled must be an array'),
  body('maxWorkloadPerDay').isNumeric().withMessage('Max workload per day must be a number'),
  body('maxWorkloadPerWeek').isNumeric().withMessage('Max workload per week must be a number'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
];
