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
    const facRequired = 2;

    // 1. Find suitable lab rooms
    const suitableLabs = this.generator.labs.filter(l => 
      l.supportedSubjects.some(s => s._id.toString() === subject._id.toString()) &&
      l.capacity >= (batch ? batch.studentCount : division.strength)
    );

    // 2. Find suitable faculty (need 2)
    const suitableFaculty = this.generator.teachers.filter(t => 
      t.subjectsHandled.includes(subject.subjectName)
    );

    if (suitableFaculty.length < facRequired) return null;

    // 3. Try combinations
    for (const lab of suitableLabs) {
      // Find 2 available faculty for ALL slots in the duration
      const availableFacPairs = this.findFacultyPairs(suitableFaculty, day, slots);
      
      for (const facPair of availableFacPairs) {
        // Check if Lab Room is free
        if (this.isRoomFree(lab, day, slots)) {
          return {
            lab,
            faculty: facPair,
            day,
            slots
          };
        }
      }
    }

    return null;
  }

  findFacultyPairs(facultyPool, day, slots) {
    const pairs = [];
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

    // Create pairs (Simple combination)
    for (let i = 0; i < available.length; i++) {
      for (let j = i + 1; j < available.length; j++) {
        pairs.push([available[i], available[j]]);
      }
    }
    
    // Heuristic: Shuffle pairs to distribute workload
    return pairs.sort(() => Math.random() - 0.5);
  }

  isRoomFree(room, day, slots) {
    return slots.every(slot => {
      const key = `${day}-${slot}`;
      return !this.generator.roomAssignments.get(room._id.toString())?.has(key);
    });
  }
}

module.exports = LabAllocator;
