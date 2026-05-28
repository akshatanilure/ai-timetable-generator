import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import TimetableGrid from '../components/TimetableGrid';
import { FiFilter, FiDownload, FiRefreshCw, FiAlertTriangle, FiTrash2 } from 'react-icons/fi';

const Timetables = () => {
  const [timetables, setTimetables] = useState([]);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);



  const fetchTimetableDetails = useCallback(async (id) => {
    setLoading(true);
    try {
      const res = await api.get(`/timetables/${id}`);
      setSelectedTimetable(res.data.data);
    } catch (err) {
      console.error('Error fetching details');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTimetables = useCallback(async () => {
    try {
      const res = await api.get('/timetables');
      setTimetables(res.data.data);
      if (res.data.data.length > 0) {
        fetchTimetableDetails(res.data.data[0]._id);
      }
    } catch (err) {
      console.error('Error fetching timetables');
    } finally {
      setLoading(false);
    }
  }, [fetchTimetableDetails]);

  useEffect(() => {
    fetchTimetables();
  }, [fetchTimetables]);

  const handleDelete = async () => {
    if (!selectedTimetable) return;
    if (!window.confirm('Are you sure you want to delete this timetable? This action cannot be undone.')) return;
    
    try {
      await api.delete(`/timetables/${selectedTimetable._id}`);
      alert('Timetable deleted successfully!');
      setSelectedTimetable(null);
      fetchTimetables();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete timetable');
    }
  };

  const handleGenerate = async () => {
    if (!window.confirm('Generate new timetable for Semester 1?')) return;
    
    setGenerating(true);
    try {
      await api.post('/timetables/generate', {
        semester: 1,
        department: 'Computer Science'
      });
      alert('Timetable generated successfully!');
      fetchTimetables();
    } catch (err) {
      alert(err.response?.data?.error || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Academic Timetables</h1>
          <p className="text-sm text-gray-500">View and manage schedules for all divisions</p>
        </div>
        
        <div className="flex items-center gap-3 print:hidden">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition-all font-bold text-xs"
          >
            <FiDownload /> Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 print:block">
        {/* Filters & Sidebar */}
        <div className="lg:col-span-1 space-y-4 print:hidden">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center mb-4 text-gray-700 font-bold">
              <FiFilter className="mr-2" /> Filters
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Select Timetable</label>
                <select 
                  className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:ring-1 focus:ring-primary outline-none"
                  onChange={(e) => fetchTimetableDetails(e.target.value)}
                  value={selectedTimetable?._id || ''}
                >
                  <option value="">-- Select --</option>
                  {timetables.map(t => (
                    <option key={t._id} value={t._id}>
                      Sem {t.semester} - Div {t.division?.divisionName || 'A'}
                    </option>
                  ))}
                </select>
              </div>

              {selectedTimetable && (
                <button 
                  onClick={handleDelete}
                  className="w-full mt-4 flex items-center justify-center px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg shadow-sm hover:bg-red-100 transition-all font-bold text-xs"
                >
                  <FiTrash2 className="mr-2" /> Delete Timetable
                </button>
              )}
            </div>
          </div>

          {selectedTimetable?.conflicts?.length > 0 && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
              <div className="flex items-center text-red-600 font-bold text-sm mb-2">
                <FiAlertTriangle className="mr-2" /> Conflicts Detected
              </div>
              <ul className="text-[10px] text-red-500 space-y-1">
                {selectedTimetable.conflicts.map((c, i) => (
                  <li key={i} className="flex items-start">
                    <span className="mr-1">•</span> {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Timetable Grid */}
        <div className="lg:col-span-3 print:w-full print:col-span-4">
          {loading ? (
            <div className="h-[500px] flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-400 font-medium">Loading Schedule...</p>
              </div>
            </div>
          ) : selectedTimetable ? (
            <TimetableGrid schedule={selectedTimetable.generatedSchedule} />
          ) : (
            <div className="h-[500px] flex items-center justify-center bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
              <p className="text-gray-400">No timetable selected or generated yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Timetables;
