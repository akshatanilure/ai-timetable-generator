import React from 'react';

const TimetableGrid = ({ schedule }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const gridSlots = [
    { start: '08:00', end: '09:00', type: 'class' },
    { start: '09:00', end: '10:00', type: 'class' },
    { start: '10:00', end: '10:30', type: 'short_break', label: 'T E A   B R E A K' },
    { start: '10:30', end: '11:30', type: 'class' },
    { start: '11:30', end: '12:30', type: 'class' },
    { start: '12:30', end: '13:30', type: 'class' },
    { start: '13:30', end: '14:30', type: 'lunch_break', label: 'L U N C H   B R E A K' },
    { start: '14:30', end: '15:30', type: 'class' },
    { start: '15:30', end: '16:30', type: 'class' },
    { start: '16:30', end: '17:00', type: 'class' },
  ];

  const formatTime = (timeStr) => {
    const [hrs, mins] = timeStr.split(':');
    let h = parseInt(hrs);
    const ampm = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    return `${h}:${mins} ${ampm}`;
  };

  const getSessions = (day, slotStart) => {
    return schedule.filter(s => s.day === day && s.startTime === slotStart);
  };

  const getSlotSpan = (session) => {
    if (!session) return 1;
    const startIndex = gridSlots.findIndex(s => s.start === session.startTime);
    const endIndex = gridSlots.findIndex(s => s.end === session.endTime);
    if (startIndex === -1 || endIndex === -1) return 1;
    return endIndex - startIndex + 1;
  };

  // Extract unique subjects for the bottom table
  const uniqueSubjectsMap = new Map();
  schedule.forEach(session => {
    if (!session.subject) return;
    const code = session.subject.subjectCode || 'TBD';
    const facNames = Array.isArray(session.faculty) 
      ? session.faculty.map(f => f?.name || 'Unknown').join(' & ') 
      : session.faculty?.name || 'TBD';

    if (!uniqueSubjectsMap.has(code)) {
      uniqueSubjectsMap.set(code, {
        code: code,
        title: session.subject.subjectName,
        credits: session.subject.credits || '-',
        ltp: `${session.subject.lectureHours || 0}-${session.subject.tutorialHours || 0}-${session.subject.practicalHours || 0}`,
        instructors: new Set([facNames])
      });
    } else {
      uniqueSubjectsMap.get(code).instructors.add(facNames);
    }
  });

  const uniqueSubjects = Array.from(uniqueSubjectsMap.values()).map(s => ({
    ...s,
    instructors: Array.from(s.instructors).join(' / ')
  }));

  const skipSlots = {
    Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-x-auto bg-white rounded shadow border border-gray-300 p-2">
        <table className="w-full border-collapse border border-gray-400 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-2 w-24">Days</th>
              {gridSlots.map((slot, i) => (
                <th key={i} className="border border-gray-400 p-2 min-w-[120px] font-semibold text-center">
                  <div className="flex flex-col">
                    <span>{formatTime(slot.start)} to</span>
                    <span>{formatTime(slot.end)}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day, dayIndex) => (
              <tr key={day} className="h-20 hover:bg-gray-50 transition-colors">
                <td className="border border-gray-400 p-2 font-bold text-center bg-gray-50">
                  {day.substring(0, 3)}
                </td>
                
                {gridSlots.map((slot, slotIndex) => {
                  if (slot.type === 'short_break' || slot.type === 'lunch_break') {
                    if (dayIndex === 0) {
                      return (
                        <td 
                          key={slotIndex} 
                          rowSpan={days.length} 
                          className="border border-gray-400 bg-gray-100 text-center text-gray-700 font-bold w-12 tracking-[0.2em]"
                        >
                          <div className="flex items-center justify-center h-full">
                            <span style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}>
                              {slot.label}
                            </span>
                          </div>
                        </td>
                      );
                    }
                    return null;
                  }

                  if (skipSlots[day] > 0) {
                    skipSlots[day]--;
                    return null;
                  }

                  const sessions = getSessions(day, slot.start);
                  if (sessions.length > 0) {
                    const span = getSlotSpan(sessions[0]);
                    skipSlots[day] = span - 1;
                    
                    const isLabGroup = sessions.length > 1 || (sessions[0].batch && sessions[0].batch.batchName);
                    
                    return (
                      <td 
                        key={slotIndex} 
                        colSpan={span} 
                        className="border border-gray-400 p-2 text-center align-middle hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex flex-col items-center justify-center gap-1 text-xs">
                          {isLabGroup ? (
                            <>
                               <span className="font-bold text-gray-800">
                                  {sessions.map(s => {
                                    const code = s.subject?.subjectCode || s.subject?.subjectName || '';
                                    const bName = s.batch?.batchName;
                                    return bName ? `${code}(${bName})` : code;
                                  }).join('/')}
                               </span>
                            </>
                          ) : (
                            sessions.map((s, idx) => (
                              <React.Fragment key={idx}>
                                <span className="font-bold text-gray-800 text-sm">
                                  {s.subject?.subjectCode || s.subject?.subjectName}
                                </span>
                                {s.room && s.room.roomNumber && (
                                  <span className="text-gray-600 font-semibold">
                                    (R N {s.room.roomNumber.replace('R', '')})
                                  </span>
                                )}
                                {s.faculty && (Array.isArray(s.faculty) ? s.faculty[0]?.name : s.faculty.name) && (
                                  <span className="text-gray-500 italic mt-0.5">
                                    {Array.isArray(s.faculty) ? s.faculty[0]?.name : s.faculty.name}
                                  </span>
                                )}
                                {idx < sessions.length - 1 && <span className="text-gray-400 my-1 border-b border-gray-300 w-full block"></span>}
                              </React.Fragment>
                            ))
                          )}
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td key={slotIndex} className="border border-gray-400 p-2"></td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto bg-white rounded shadow border border-gray-300 p-2 mt-4">
        <table className="w-full border-collapse border border-gray-400 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-2 text-left font-bold w-32">Course Code</th>
              <th className="border border-gray-400 p-2 text-left font-bold">Course Title</th>
              <th className="border border-gray-400 p-2 text-center font-bold w-20">Credits</th>
              <th className="border border-gray-400 p-2 text-center font-bold w-24">L-T-P</th>
              <th className="border border-gray-400 p-2 text-left font-bold w-64">Course Instructor</th>
            </tr>
          </thead>
          <tbody>
            {uniqueSubjects.map((sub, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="border border-gray-400 p-2 font-semibold text-gray-800">{sub.code}</td>
                <td className="border border-gray-400 p-2 text-gray-800">{sub.title}</td>
                <td className="border border-gray-400 p-2 text-center text-gray-700">{sub.credits}</td>
                <td className="border border-gray-400 p-2 text-center text-gray-700">{sub.ltp}</td>
                <td className="border border-gray-400 p-2 text-gray-800 italic">{sub.instructors}</td>
              </tr>
            ))}
            {uniqueSubjects.length > 0 && (
              <tr className="bg-gray-50 font-bold">
                <td colSpan="2" className="border border-gray-400 p-2 text-right">Total</td>
                <td className="border border-gray-400 p-2 text-center">
                  {uniqueSubjects.reduce((acc, curr) => acc + (parseInt(curr.credits) || 0), 0)}
                </td>
                <td colSpan="2" className="border border-gray-400 p-2"></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TimetableGrid;
