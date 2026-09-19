/**
 * Specialized Lab Allocation Engine
 * Handles the complexities of batch-wise lab scheduling
 */

class LabAllocator {
  constructor(generator) {
    this.generator = generator;
  }

  /**
   * Attempts to find a valid allocation for a lab session
   * Requires 2 faculty members and specialized lab rooms
   */
  allocate(session, day, slots) {
    const { subject, division, batch } = session;
    const semNum = division?.semester || this.generator?.timetableRules?.semester || 1;
    const isFullClass = subject?.isFullClassLab || session.isFullClassLab || (!batch && session.type === 'lab');
    const batchConfig = this.generator?.timetableRules?.batchConfig || {};

    let targetFacRequired = 2;
    if (isFullClass) {
      targetFacRequired = batchConfig.fullClassFaculty || 2;
    } else if (batchConfig.facultyPerBatch) {
      targetFacRequired = batchConfig.facultyPerBatch;
    } else if ([1, 2].includes(semNum)) {
      targetFacRequired = 3;
    } else {
      targetFacRequired = 2;
    }

    // 1. Find suitable lab rooms
    let suitableLabs = this.generator.labs.filter(l => 
      l.supportedSubjects && l.supportedSubjects.length > 0 &&
      l.supportedSubjects.some(s => (s._id || s).toString() === subject._id.toString())
    );

    if (suitableLabs.length === 0) {
      // Fallback: any lab room with capacity
      suitableLabs = this.generator.labs.filter(l => 
        (l.roomType === 'lab' || l.capacity >= 20)
      );
    }

    // 2. Find suitable faculty
    let suitableFaculty = [];
    const mappedFacs = this.generator.facultyMapping[subject._id.toString()];
    if (mappedFacs) {
      const ids = mappedFacs.lab || (Array.isArray(mappedFacs) ? mappedFacs : [mappedFacs]);
      suitableFaculty = this.generator.teachers.filter(t => ids.includes(t._id.toString()));
    }
    if (suitableFaculty.length < targetFacRequired) {
      const fallbackFacs = this.generator.teachers.filter(t => 
        t.subjectsHandled && t.subjectsHandled.includes(subject.subjectName)
      );
      suitableFaculty = fallbackFacs.length >= targetFacRequired ? fallbackFacs : this.generator.teachers;
    }

    const facRequired = Math.min(targetFacRequired, suitableFaculty.length);
    if (facRequired === 0) return null;

    // 3. Try combinations
    for (const lab of suitableLabs) {
      // Find available faculty for ALL slots in the duration
      const availableFacGroups = this.findFacultyGroups(suitableFaculty, day, slots, facRequired);
      
      for (const facGroup of availableFacGroups) {
        // Check if Lab Room is free
        if (this.isRoomFree(lab, day, slots)) {
          return {
            lab,
            faculty: facGroup,
            day,
            slots
          };
        }
      }
    }

    return null;
  }

  findFacultyGroups(facultyPool, day, slots, facRequired) {
    const groups = [];
    const available = facultyPool.filter(f => {
      return slots.every(slot => {
        const key = `${day}-${slot}`;
        // Check if already assigned in generator
        if (this.generator.facultyAssignments.get(f._id.toString())?.has(key)) return false;
        // Check teacher availability model
        if (f.availability?.length > 0) {
          const dayAvail = f.availability.find(a => a.day === day);
          if (!dayAvail || !dayAvail.slots.some(s => s.startTime <= slot && s.endTime > slot)) return false;
        }
        return true;
      });
    });

    if (available.length < facRequired) return [];

    if (facRequired === 1) {
      available.forEach(f => groups.push([f]));
    } else if (facRequired === 2) {
      for (let i = 0; i < available.length; i++) {
        for (let j = i + 1; j < available.length; j++) {
          groups.push([available[i], available[j]]);
        }
      }
    } else if (facRequired >= 3) {
      for (let i = 0; i < available.length; i++) {
        for (let j = i + 1; j < available.length; j++) {
          for (let k = j + 1; k < available.length; k++) {
            groups.push([available[i], available[j], available[k]]);
          }
        }
      }
    }
    
    // Heuristic: Shuffle groups to distribute workload
    return groups.sort(() => Math.random() - 0.5);
  }

  isRoomFree(room, day, slots) {
    return slots.every(slot => {
      const key = `${day}-${slot}`;
      return !this.generator.roomAssignments.get(room._id.toString())?.has(key);
    });
  }
}

module.exports = LabAllocator;
