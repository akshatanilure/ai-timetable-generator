const Room = require('../models/Room');
const mongoose = require('mongoose');

/**
 * Format room display name cleanly
 * e.g. "18" -> "Room 18", "CSE-Seminar-Hall" -> "CSE Seminar Hall", "PG-101" -> "PG-101"
 */
function formatRoomDisplay(roomNumber) {
  if (!roomNumber) return 'No Room Assigned';
  const str = String(roomNumber).trim();
  if (str.toLowerCase().includes('seminar')) {
    return 'CSE Seminar Hall';
  }
  if (str.toLowerCase().startsWith('room')) {
    return str;
  }
  if (str.toUpperCase().startsWith('PG') || str.toUpperCase().startsWith('R')) {
    return str;
  }
  return `Room ${str}`;
}

/**
 * Normalize room identifier for clash comparison
 */
function normalizeRoomIdentifier(roomNumber) {
  if (!roomNumber) return '';
  let s = String(roomNumber).toLowerCase();
  for (const word of ['room', 'hall']) {
    s = s.replace(word, '');
  }
  return s.replace(/[-_\s]/g, '').trim();
}

/**
 * Automatic Room Allocation across divisions avoiding clashes,
 * using exclusively the rooms configured in Infrastructure for the given program (UG or PG).
 * 
 * @param {Array} divisions - Array of division objects [{ name, strength, assignedRoom, ... }]
 * @param {Array} availableRooms - Optional array of Room documents from DB/request
 * @param {Set} occupiedRoomNorms - Set of normalized room identifiers already occupied by other active semesters
 * @param {string} program - 'UG' or 'PG'
 * @param {number|string} semester - Optional semester number for reporting warnings
 * @returns {Promise<Array>} updated divisions with assigned rooms and capacities (has .warnings property)
 */
async function allocateRoomsForDivisions(divisions, availableRooms = [], occupiedRoomNorms = new Set(), program = 'UG', semester = null) {
  const prog = program === 'PG' ? 'PG' : 'UG';

  let allRooms = [];
  if (mongoose.connection.readyState === 1) {
    const query = prog === 'PG'
      ? { program: 'PG' }
      : { $or: [{ program: 'UG' }, { program: { $exists: false } }, { program: null }] };
    allRooms = await Room.find(query);
  }

  // Fallback to provided availableRooms filtered by program if DB query returned nothing
  if (!allRooms || allRooms.length === 0) {
    allRooms = (Array.isArray(availableRooms) ? availableRooms : []).filter(r => {
      if (prog === 'PG') return r.program === 'PG';
      return r.program !== 'PG';
    });
  }

  // Filter only classrooms (lecture rooms)
  const lectureRooms = allRooms.filter(r => r.roomType === 'lecture' || !r.roomType);

  // Sort classrooms dynamically by natural order
  lectureRooms.sort((a, b) => {
    return String(a.roomNumber).localeCompare(String(b.roomNumber), undefined, { numeric: true, sensitivity: 'base' });
  });

  const assignedInCurrentRun = occupiedRoomNorms instanceof Set ? occupiedRoomNorms : new Set();
  const updatedDivisions = [];
  const warnings = [];

  for (let i = 0; i < divisions.length; i++) {
    const div = { ...divisions[i] };
    const divStrength = parseInt(div.strength, 10) || (prog === 'PG' ? 30 : 60);
    const requestedRoom = div.assignedRoom || div.rawRoomNumber;

    let matchedRoom = null;

    // 1. Check if division already requested a specific valid room from this program that is not yet occupied
    if (requestedRoom) {
      const normReq = normalizeRoomIdentifier(requestedRoom);
      if (!assignedInCurrentRun.has(normReq)) {
        matchedRoom = lectureRooms.find(r => 
          normalizeRoomIdentifier(r.roomNumber) === normReq &&
          (r.capacity || 0) >= divStrength
        );
      }
    }

    // 2. If no valid unassigned requested room, find best available room with capacity >= strength
    if (!matchedRoom) {
      // Find candidate rooms from configured infrastructure that are not occupied
      const candidates = lectureRooms.filter(r => {
        const norm = normalizeRoomIdentifier(r.roomNumber);
        return !assignedInCurrentRun.has(norm) && (r.capacity || 0) >= divStrength;
      });

      if (candidates.length > 0) {
        // Sort candidates: closest capacity match first, then natural room order
        candidates.sort((a, b) => {
          const diffA = (a.capacity || 0) - divStrength;
          const diffB = (b.capacity || 0) - divStrength;
          if (diffA !== diffB) return diffA - diffB;
          return String(a.roomNumber).localeCompare(String(b.roomNumber), undefined, { numeric: true, sensitivity: 'base' });
        });
        matchedRoom = candidates[0];
      }
    }

    // 3. If a suitable room is found, assign it
    if (matchedRoom) {
      const chosenNorm = normalizeRoomIdentifier(matchedRoom.roomNumber);
      assignedInCurrentRun.add(chosenNorm);

      const display = formatRoomDisplay(matchedRoom.roomNumber);
      div.assignedRoom = display;
      div.rawRoomNumber = matchedRoom.roomNumber;
      div.roomId = matchedRoom._id ? matchedRoom._id.toString() : null;
      div.roomCapacity = matchedRoom.capacity || divStrength;
      div.strength = divStrength;
      div.roomWarning = null;
    } else {
      // 4. If no suitable room is available:
      // Do NOT assign an invalid or occupied room, and do NOT fabricate non-existent rooms.
      const semLabel = semester ? `Sem ${semester} ` : '';
      const divLabel = div.name || `DIV-${i + 1}`;
      const warnMsg = `No suitable unassigned ${prog} room available in Infrastructure for ${semLabel}${divLabel} (Class Strength: ${divStrength}).`;
      
      div.assignedRoom = null;
      div.rawRoomNumber = null;
      div.roomId = null;
      div.roomCapacity = null;
      div.strength = divStrength;
      div.roomWarning = warnMsg;
      warnings.push(warnMsg);
    }

    updatedDivisions.push(div);
  }

  // Attach warnings property to the returned array for easy inspection
  updatedDivisions.warnings = warnings;
  return updatedDivisions;
}

module.exports = {
  formatRoomDisplay,
  normalizeRoomIdentifier,
  allocateRoomsForDivisions
};
