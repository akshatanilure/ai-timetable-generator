const Teacher = require('../models/Teacher');

// @desc    Get all teachers
// @route   GET /api/teachers
// @access  Private (Admin/Teacher)
exports.getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find().populate('user', 'name email');
    
    // Check if semester is provided to compute dynamic workloads
    if (req.query.semester) {
      const semester = parseInt(req.query.semester);
      if (!isNaN(semester)) {
        const Timetable = require('../models/Timetable');
        const activeTimetables = await Timetable.find();
        
        const isCurrentOdd = semester % 2 !== 0;
        const sameParityTimetables = activeTimetables.filter(t => {
          const isOdd = t.semester % 2 !== 0;
          return isOdd === isCurrentOdd;
        });

        const timeToMinutes = (time) => {
          if (!time) return 0;
          const [hrs, mins] = time.split(':').map(Number);
          return hrs * 60 + mins;
        };

        const teachersJSON = teachers.map(t => {
          const tObj = t.toJSON();
          
          // Calculate dynamic workload for this teacher in the same parity cycle
          let dynamicWorkload = 0;
          sameParityTimetables.forEach(tt => {
            if (tt.generatedSchedule && Array.isArray(tt.generatedSchedule)) {
              tt.generatedSchedule.forEach(entry => {
                const hasFaculty = Array.isArray(entry.faculty)
                  ? entry.faculty.some(f => f.toString() === tObj._id.toString())
                  : entry.faculty && entry.faculty.toString() === tObj._id.toString();
                  
                if (hasFaculty) {
                  const duration = entry.endTime && entry.startTime
                    ? (timeToMinutes(entry.endTime) - timeToMinutes(entry.startTime)) / 60
                    : (entry.batch ? 2 : 1);
                  dynamicWorkload += duration;
                }
              });
            }
          });
          
          tObj.currentWorkload = dynamicWorkload;
          return tObj;
        });

        return res.status(200).json({
          success: true,
          count: teachersJSON.length,
          data: teachersJSON,
        });
      }
    }

    res.status(200).json({
      success: true,
      count: teachers.length,
      data: teachers,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single teacher
// @route   GET /api/teachers/:id
// @access  Private (Admin/Teacher)
exports.getTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).populate('user', 'name email');
    if (!teacher) {
      return res.status(404).json({ success: false, error: 'Teacher not found' });
    }
    res.status(200).json({ success: true, data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create new teacher
// @route   POST /api/teachers
// @access  Private (Admin)
exports.createTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.create(req.body);
    res.status(201).json({ success: true, data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update teacher
// @route   PUT /api/teachers/:id
// @access  Private (Admin/Teacher)
exports.updateTeacher = async (req, res) => {
  try {
    let teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ success: false, error: 'Teacher not found' });
    }

    // Make sure user is teacher owner or admin
    let isAuthorized = req.user.role === 'admin';

    if (!isAuthorized) {
      if (teacher.user) {
        isAuthorized = teacher.user.toString() === req.user.id;
      } else {
        // Fallback: match by email or name if user field is not populated/linked yet
        const emailMatch = teacher.email && req.user.email && 
          teacher.email.toLowerCase() === req.user.email.toLowerCase();
        const nameMatch = teacher.name && req.user.name && 
          (teacher.name.toLowerCase().includes(req.user.name.toLowerCase()) || 
           req.user.name.toLowerCase().includes(teacher.name.toLowerCase()));
        
        if (emailMatch || nameMatch) {
          isAuthorized = true;
        }
      }

      // If authorized, ensure the teacher profile is linked to the user ID
      if (isAuthorized) {
        req.body.user = req.user.id;
      }
    }

    if (!isAuthorized) {
      return res.status(401).json({ success: false, error: 'Not authorized to update this profile' });
    }

    teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete teacher
// @route   DELETE /api/teachers/:id
// @access  Private (Admin)
exports.deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ success: false, error: 'Teacher not found' });
    }

    await teacher.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
