import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import TimetableGrid from '../components/TimetableGrid';
import { FiUser, FiActivity, FiClock, FiPieChart, FiSearch } from 'react-icons/fi';

const TeacherDashboard = () => {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [timetables, setTimetables] = useState([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState('');
  const [workloadData, setWorkloadData] = useState(null);
  const [teacherSchedule, setTeacherSchedule] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teachersRes, timetablesRes] = await Promise.all([
          api.get('/teachers'),
          api.get('/timetables')
        ]);
        setTeachers(teachersRes.data.data);
        setTimetables(timetablesRes.data.data);
        
        if (timetablesRes.data.data.length > 0) {
          setSelectedTimetableId(timetablesRes.data.data[0]._id);
        }
      } catch (err) {
        console.error('Error loading initial data');
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedTeacherId && selectedTimetableId) {
      fetchTeacherMetrics();
    }
  }, [selectedTeacherId, selectedTimetableId, fetchTeacherMetrics]);

  const fetchTeacherMetrics = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Get full timetable to extract schedule
      const ttRes = await api.get(`/timetables/${selectedTimetableId}`);
      const fullSchedule = ttRes.data.data.generatedSchedule;
      
      // Filter sessions for this teacher
      const filtered = fullSchedule.filter(s => {
        if (Array.isArray(s.faculty)) {
          return s.faculty.some(f => f._id === selectedTeacherId || f === selectedTeacherId);
        }
        return (s.faculty?._id || s.faculty) === selectedTeacherId;
      });
      setTeacherSchedule(filtered);

      // 2. Get workload analytics
      const workloadRes = await api.get(`/timetables/${selectedTimetableId}/workload`);
      setWorkloadData(workloadRes.data.data[selectedTeacherId]);
    } catch (err) {
      console.error('Error fetching metrics');
    } finally {
      setLoading(false);
    }
  }, [selectedTeacherId, selectedTimetableId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Faculty Insight</h1>
        
        <div className="flex flex-col sm:flex-row gap-2">
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
          <select 
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none"
            value={selectedTimetableId}
            onChange={(e) => setSelectedTimetableId(e.target.value)}
          >
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
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Analytics Cards */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center">
                <FiPieChart className="mr-2" /> Workload Summary
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-sm text-gray-500">Weekly Hours</span>
                  <span className="text-2xl font-bold text-primary">{workloadData?.summary?.totalWeeklyHours || 0}h</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${(workloadData?.summary?.totalWeeklyHours / 40) * 100}%` }}></div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Theory</p>
                    <p className="text-lg font-bold text-blue-600">{workloadData?.summary?.lectureHours || 0}h</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Labs</p>
                    <p className="text-lg font-bold text-orange-600">{workloadData?.summary?.labHours || 0}h</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center">
                <FiClock className="mr-2" /> Daily Distribution
              </h3>
              <div className="space-y-3">
                {Object.entries(workloadData?.dailyWorkload || {}).map(([day, hours]) => (
                  <div key={day} className="flex items-center">
                    <span className="text-xs text-gray-500 w-20">{day}</span>
                    <div className="flex-1 bg-gray-100 h-1.5 rounded-full mx-2 overflow-hidden">
                      <div className="bg-indigo-400 h-full" style={{ width: `${(hours / 8) * 100}%` }}></div>
                    </div>
                    <span className="text-xs font-bold text-gray-700">{hours}h</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Teacher Timetable */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center text-gray-700 font-bold">
              <FiActivity className="mr-2" /> Personal Schedule
            </div>
            <TimetableGrid schedule={teacherSchedule} />
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
