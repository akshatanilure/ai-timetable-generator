const { authorize } = require('./authMiddleware');

exports.isAdmin = authorize('admin');
exports.isTeacher = authorize('teacher');
exports.isStudent = authorize('student');
exports.isAdminOrTeacher = authorize('admin', 'teacher');
