import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import TimetableGrid from '../components/TimetableGrid';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiActivity, FiClock, FiPieChart, FiSearch, FiBookOpen, FiUserCheck } from 'react-icons/fi';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const isAdmin = user?.role === 'admin';
  
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [timetables, setTimetables] = useState([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState('');
  const [workloadData, setWorkloadData] = useState(null);
  const [teacherSchedule, setTeacherSchedule] = useState([]);
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const teachersRes = await api.get('/teachers');
        setTeachers(teachersRes.data.data);
        
        if (isTeacher) {
          // Find matching teacher record by user reference or name
          const currentTeacher = teachersRes.data.data.find(t => 
            t.user?._id === user?._id || t.user === user?._id
          );
          if (currentTeacher) {
            setSelectedTeacherId(currentTeacher._id);
          } else {
            // Name matching fallback
            const nameMatch = teachersRes.data.data.find(t => 
              t.name.toLowerCase().includes(user?.name?.toLowerCase()) || 
              user?.name?.toLowerCase().includes(t.name.toLowerCase())
            );
            if (nameMatch) {
              setSelectedTeacherId(nameMatch._id);
            }
          }
        }
        
        const timetablesRes = await api.get('/timetables');
        setTimetables(timetablesRes.data.data);
        
        if (timetablesRes.data.data.length > 0) {
          setSelectedTimetableId(timetablesRes.data.data[0]._id);
        }
      } catch (err) {
        console.error('Error loading initial data', err);
      }
    };
    fetchData();
  }, [isTeacher, user]);

  const fetchTeacherMetrics = useCallback(async () => {
    if (!selectedTeacherId || !selectedTimetableId) return;
    
    setLoading(true);
    try {
      const ttRes = await api.get(`/timetables/${selectedTimetableId}`);
      const fullSchedule = ttRes.data.data.generatedSchedule;
      
      const filtered = fullSchedule.filter(s => {
        if (Array.isArray(s.faculty)) {
          return s.faculty.some(f => f._id === selectedTeacherId || f === selectedTeacherId);
        }
        return (s.faculty?._id || s.faculty) === selectedTeacherId;
      });
      setTeacherSchedule(filtered);

      const subjects = [...new Set(filtered.map(s => s.subject?.subjectName))].filter(Boolean);
      setAssignedSubjects(subjects);

      const workloadRes = await api.get(`/timetables/${selectedTimetableId}/workload`);
      setWorkloadData(workloadRes.data.data[selectedTeacherId]);
    } catch (err) {
      console.error('Error fetching metrics');
    } finally {
      setLoading(false);
    }
  }, [selectedTeacherId, selectedTimetableId]);

  useEffect(() => {
    fetchTeacherMetrics();
  }, [selectedTeacherId, selectedTimetableId, fetchTeacherMetrics]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            {isTeacher ? <FiUserCheck className="mr-2 text-indigo-600" /> : <FiUser className="mr-2 text-indigo-600" />}
            {isTeacher ? 'My Schedule & Workload' : 'Faculty Insight'}
          </h1>
          {isTeacher && <p className="text-sm text-gray-500 mt-1">Hello, Prof. {user.name}. Here is your weekly academic summary.</p>}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          {isAdmin && (
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <select 
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none min-w-[200px]"
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
              >
                <option value="">Select Teacher...</option>
                {teachers.map(t => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
          <select 
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none"
            value={selectedTimetableId}
            onChange={(e) => setSelectedTimetableId(e.target.value)}
          >
            <option value="">Select Timetable...</option>
            {timetables.map(t => (
              <option key={t._id} value={t._id}>Timetable: Sem {t.semester}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedTeacherId ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border-2 border-dashed border-gray-200">
          <FiUser className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-gray-500 font-medium">Please select a faculty member to view their dashboard</h3>
        </div>
      ) : loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center">
                <FiPieChart className="mr-2" /> Weekly Workload
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-sm text-gray-500 font-medium">Total Commited Hours</span>
                  <span className="text-2xl font-black text-indigo-600 tracking-tighter">{workloadData?.summary?.totalWeeklyHours || 0}h</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-indigo-600 h-3 rounded-full shadow-inner" style={{ width: `${Math.min((workloadData?.summary?.totalWeeklyHours / 40) * 100, 100)}%` }}></div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Theory</p>
                    <p className="text-xl font-black text-blue-600">{workloadData?.summary?.lectureHours || 0}h</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Labs/Prac</p>
                    <p className="text-xl font-black text-orange-600">{workloadData?.summary?.labHours || 0}h</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center">
                <FiBookOpen className="mr-2" /> Assigned Courses
              </h3>
              <div className="flex flex-wrap gap-2">
                {assignedSubjects.length > 0 ? assignedSubjects.map(sub => (
                  <span key={sub} className="px-4 py-2 bg-indigo-50 text-indigo-700 text-xs font-black rounded-xl border border-indigo-100 shadow-sm">
                    {sub}
                  </span>
                )) : <p className="text-gray-400 text-sm italic">No courses assigned to this faculty.</p>}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center">
                <FiClock className="mr-2" /> Day-wise Intensity
              </h3>
              <div className="space-y-4">
                {Object.entries(workloadData?.dailyWorkload || {}).map(([day, hours]) => (
                  <div key={day} className="flex items-center group">
                    <span className="text-xs font-bold text-gray-400 w-12 group-hover:text-gray-800 transition-colors uppercase">{day.slice(0,3)}</span>
                    <div className="flex-1 bg-gray-100 h-2 rounded-full mx-3 overflow-hidden">
                      <div className="bg-indigo-400 h-full group-hover:bg-indigo-600 transition-all" style={{ width: `${Math.min((hours / 8) * 100, 100)}%` }}></div>
                    </div>
                    <span className="text-xs font-black text-gray-700 w-8 text-right">{hours}h</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between text-gray-700">
              <div className="flex items-center font-bold">
                <FiActivity className="mr-2 text-teal-500" /> Academic Calendar
              </div>
              <span className="text-[10px] uppercase font-bold tracking-tighter text-gray-400">Weekly View</span>
            </div>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <TimetableGrid schedule={teacherSchedule} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
