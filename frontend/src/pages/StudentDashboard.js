import React, { useState, useEffect } from 'react';
import api from '../services/api';
import TimetableGrid from '../components/TimetableGrid';
import { useAuth } from '../context/AuthContext';
import { FiSearch, FiPrinter, FiLayers, FiInfo, FiBook, FiCalendar } from 'react-icons/fi';

const StudentDashboard = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  
  const [timetables, setTimetables] = useState([]);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [activeTab, setActiveTab] = useState('timetable'); // 'timetable' or 'subjects'
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    semester: user?.semester || '',
    division: user?.division || ''
  });

  const hasProfileData = isStudent && user?.semester && user?.division;

  useEffect(() => {
    fetchTimetables();
  }, []);

  useEffect(() => {
    if (timetables.length > 0 && hasProfileData) {
      handleSearch();
    }
  }, [timetables, user, hasProfileData]);

  const fetchTimetables = async () => {
    try {
      const res = await api.get('/timetables');
      setTimetables(res.data.data);
    } catch (err) {
      console.error('Error loading timetables');
    }
  };

  const handleSearch = async () => {
    if (!filters.semester) return;
    
    setLoading(true);
    try {
      const normalizeDiv = (name) => {
        if (!name) return '';
        return name.replace(/div[\-\s]?/i, '').trim().toLowerCase();
      };

      const match = timetables.find(t => {
        const tSem = t.semester ? t.semester.toString() : '';
        const fSem = filters.semester ? filters.semester.toString() : '';
        const tDiv = normalizeDiv(t.division?.divisionName);
        const fDiv = normalizeDiv(filters.division);
        return tSem === fSem && (tDiv === fDiv || !filters.division);
      });

      if (match) {
        const res = await api.get(`/timetables/${match._id}`);
        setSelectedTimetable(res.data.data);
      } else {
        setSelectedTimetable(null);
      }
    } catch (err) {
      console.error('Error searching timetable', err);
    } finally {
      setLoading(false);
    }
  };

  const getSubjectSchedule = () => {
    if (!selectedTimetable) return [];
    const subjects = {};
    selectedTimetable.generatedSchedule.forEach(session => {
      const subName = session.subject?.subjectName;
      if (!subName) return;
      if (!subjects[subName]) subjects[subName] = [];
      subjects[subName].push(session);
    });
    return Object.entries(subjects);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Student Portal</h1>
          <p className="text-sm text-gray-500">
            {isStudent ? `Welcome back, ${user.name}` : 'Institutional Schedule Viewer'}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {!hasProfileData && (
            <div className="flex items-center gap-2">
              <select 
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-indigo-600 outline-none bg-gray-50"
                value={filters.semester}
                onChange={(e) => setFilters({...filters, semester: e.target.value})}
              >
                <option value="">Semester</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Sem {s}</option>)}
              </select>
              
              <select 
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-indigo-600 outline-none bg-gray-50"
                value={filters.division}
                onChange={(e) => setFilters({...filters, division: e.target.value})}
              >
                <option value="">Division</option>
                {['A', 'B', 'C', 'D'].map(d => <option key={d} value={d}>Div {d}</option>)}
              </select>
              
              <button 
                onClick={handleSearch}
                className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-100"
              >
                <FiSearch className="mr-2" /> Load
              </button>
            </div>
          )}
          {hasProfileData && (
            <div className="flex items-center bg-green-50 px-4 py-2 rounded-xl border border-green-100 text-green-700 text-sm font-bold">
              <FiLayers className="mr-2" /> Semester {user.semester} — Division {user.division}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-2xl w-fit print:hidden">
        <button 
          onClick={() => setActiveTab('timetable')}
          className={`flex items-center px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'timetable' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <FiCalendar className="mr-2" /> Class Timetable
        </button>
        <button 
          onClick={() => setActiveTab('subjects')}
          className={`flex items-center px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'subjects' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <FiBook className="mr-2" /> Subject Schedule
        </button>
      </div>

      {/* Main Content */}
      {selectedTimetable ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'timetable' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2 print:hidden">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Weekly Grid View</span>
                <button 
                  onClick={() => window.print()}
                  className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:text-indigo-600 transition-all"
                >
                  <FiPrinter className="mr-2" /> Export to PDF
                </button>
              </div>
              <div className="print:shadow-none print:border-none">
                <TimetableGrid schedule={selectedTimetable.generatedSchedule} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getSubjectSchedule().map(([subject, sessions]) => (
                <div key={subject} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800">{subject}</h3>
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg uppercase">{sessions.length} sessions</span>
                  </div>
                  <div className="space-y-3">
                    {sessions.map((s, i) => (
                      <div key={i} className="flex items-center text-xs text-gray-500 bg-gray-50 p-3 rounded-2xl">
                        <FiCalendar className="mr-2 text-indigo-400" />
                        <span className="font-bold w-24 uppercase">{s.day}</span>
                        <span className="flex-1 text-gray-700 font-semibold">{s.startTime} - {s.endTime}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : !loading && (
        <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-gray-100">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
            <FiSearch size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-700">No schedule loaded</h2>
          <p className="text-gray-400 mt-2">Please select your academic details to view your timetable.</p>
        </div>
      )}

      {loading && (
        <div className="h-96 flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
          <p className="text-sm font-bold text-gray-500 animate-pulse">Syncing academic records...</p>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
