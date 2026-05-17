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
    let facRequired = 2;

    // 1. Find suitable lab rooms
    const suitableLabs = this.generator.labs.filter(l => 
      l.supportedSubjects.some(s => s._id.toString() === subject._id.toString()) &&
      l.capacity >= (batch ? batch.studentCount : division.strength)
    );

    // 2. Find suitable faculty (need 2)
    let suitableFaculty = [];
    const mappedFacs = this.generator.facultyMapping[subject._id.toString()];
    if (mappedFacs) {
      const ids = mappedFacs.lab || (Array.isArray(mappedFacs) ? mappedFacs : [mappedFacs]);
      suitableFaculty = this.generator.teachers.filter(t => ids.includes(t._id.toString()));
    } else {
      suitableFaculty = this.generator.teachers.filter(t => 
        t.subjectsHandled.includes(subject.subjectName)
      );
    }

    facRequired = Math.min(2, suitableFaculty.length);
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

    console.log(`[LabAllocator] allocate failed for ${subject.subjectName} | labs: ${suitableLabs.length} | facs: ${suitableFaculty.length}`);
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
