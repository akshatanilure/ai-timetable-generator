import React from 'react';

const TimetableGrid = ({ schedule }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'
  ];

  const getSession = (day, slot) => {
    return schedule.find(s => s.day === day && s.startTime === slot);
  };

  const getSlotSpan = (session) => {
    if (!session) return 1;
    const start = parseInt(session.startTime.split(':')[0]);
    const end = parseInt(session.endTime.split(':')[0]);
    return end - start;
  };

  const getColorClass = (type) => {
    switch (type) {
      case 'lab': return 'bg-orange-100 border-l-4 border-orange-500 text-orange-700';
      case 'elective': return 'bg-purple-100 border-l-4 border-purple-500 text-purple-700';
      default: return 'bg-blue-100 border-l-4 border-blue-500 text-blue-700';
    }
  };

  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="p-4 border-b border-r border-gray-100 text-xs font-bold text-gray-400 uppercase w-24">Time</th>
            {days.map(day => (
              <th key={day} className="p-4 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase min-w-[150px]">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map(slot => (
            <tr key={slot} className="h-24">
              <td className="p-4 border-r border-b border-gray-50 text-xs font-bold text-gray-400 text-center">
                {slot}
              </td>
              {days.map(day => {
                const session = getSession(day, slot);
                if (session) {
                  const span = getSlotSpan(session);
                  // Only render if it's the start slot
                  return (
                    <td 
                      key={`${day}-${slot}`} 
                      rowSpan={span}
                      className={`p-2 border-b border-gray-50 align-top`}
                    >
                      <div className={`h-full p-3 rounded-lg text-xs flex flex-col justify-between ${getColorClass(session.type)}`}>
                        <div>
                          <p className="font-bold uppercase tracking-tight">{session.subject?.subjectName || 'Subject'}</p>
                          <p className="mt-1 opacity-80">{session.room?.roomNumber || 'Room'}</p>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <p className="font-medium truncate italic">
                            {Array.isArray(session.faculty) 
                              ? session.faculty.map(f => f.name).join(', ') 
                              : session.faculty?.name || 'Faculty'}
                          </p>
                          {session.batch && (
                            <span className="px-1.5 py-0.5 bg-white/50 rounded text-[10px] font-bold">
                              {session.batch.batchName}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                  );
                }
                
                // Logic to skip cells covered by rowSpan
                // Simplified for this version: we check if there's an ongoing session
                const ongoing = schedule.find(s => {
                  const sStart = parseInt(s.startTime.split(':')[0]);
                  const sEnd = parseInt(s.endTime.split(':')[0]);
                  const current = parseInt(slot.split(':')[0]);
                  return s.day === day && current > sStart && current < sEnd;
                });
                
                if (ongoing) return null;

                return (
                  <td key={`${day}-${slot}`} className="p-2 border-b border-gray-50 bg-gray-50/20 group hover:bg-gray-50 transition-colors">
                    {slot === '13:00' && (
                      <div className="h-full flex items-center justify-center text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                        Lunch Break
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TimetableGrid;
