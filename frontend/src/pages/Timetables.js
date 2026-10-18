import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import TimetableGrid from '../components/TimetableGrid';
import { useAuth } from '../context/AuthContext';
import { FiFilter, FiDownload, FiRefreshCw, FiAlertTriangle, FiTrash2 } from 'react-icons/fi';

const Timetables = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [timetables, setTimetables] = useState([]);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [loading, setLoading] = useState(true);



  const isPGTimetable = (t) => {
    if (!t) return false;
    if (t.program === 'PG') return true;
    if (t.division && t.division.program === 'PG') return true;
    return false;
  };

  const ugTimetables = timetables.filter(t => !isPGTimetable(t));
  const pgTimetables = timetables.filter(t => isPGTimetable(t));

  const fetchTimetableDetails = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/timetables/${id}`);
      setSelectedTimetable(res.data.data);
    } catch (err) {
      console.error('Error fetching details', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTimetables = useCallback(async (preserveId = null) => {
    try {
      const res = await api.get('/timetables');
      const list = res.data.data || [];
      setTimetables(list);
      if (list.length > 0) {
        let idToSelect = null;
        if (preserveId && list.some(t => t._id === preserveId)) {
          idToSelect = preserveId;
        } else {
          // Prefer first UG timetable if available, otherwise first PG timetable
          const firstUG = list.find(t => t.program !== 'PG' && t.division?.program !== 'PG');
          idToSelect = firstUG ? firstUG._id : list[0]._id;
        }
        fetchTimetableDetails(idToSelect);
      } else {
        setSelectedTimetable(null);
      }
    } catch (err) {
      console.error('Error fetching timetables', err);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Academic Timetables</h1>
          <p className="text-sm text-gray-500">View and manage saved timetables from MongoDB for all divisions</p>
        </div>
        
        <div className="flex items-center gap-3 print:hidden">
          <button 
            onClick={() => fetchTimetables(selectedTimetable?._id)}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg shadow-sm transition-all font-bold text-xs"
            title="Refresh from MongoDB"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
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
              <FiFilter className="mr-2" /> Timetable Selection
            </div>
            
            <div className="space-y-5">
              {/* UG Timetables Dropdown */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider">
                    UG Timetables
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                    {ugTimetables.length} Saved
                  </span>
                </div>
                <select 
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium text-gray-800"
                  onChange={(e) => {
                    if (e.target.value) fetchTimetableDetails(e.target.value);
                  }}
                  value={selectedTimetable && !isPGTimetable(selectedTimetable) ? selectedTimetable._id : ''}
                >
                  <option value="">-- Select UG Timetable --</option>
                  {ugTimetables.map(t => (
                    <option key={t._id} value={t._id}>
                      Semester {t.semester} - Division {t.division?.divisionName || 'A'}
                    </option>
                  ))}
                  {ugTimetables.length === 0 && (
                    <option value="" disabled>No UG timetables saved</option>
                  )}
                </select>
              </div>

              {/* PG Timetables Dropdown */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider">
                    PG Timetables
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full border border-purple-200">
                    {pgTimetables.length} Saved
                  </span>
                </div>
                <select 
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all font-medium text-gray-800"
                  onChange={(e) => {
                    if (e.target.value) fetchTimetableDetails(e.target.value);
                  }}
                  value={selectedTimetable && isPGTimetable(selectedTimetable) ? selectedTimetable._id : ''}
                >
                  <option value="">-- Select PG Timetable --</option>
                  {pgTimetables.map(t => (
                    <option key={t._id} value={t._id}>
                      Semester {t.semester} - Division {t.division?.divisionName || 'A'}
                    </option>
                  ))}
                  {pgTimetables.length === 0 && (
                    <option value="" disabled>No PG timetables saved</option>
                  )}
                </select>
              </div>

              {selectedTimetable && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="mb-3 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Currently Viewing</span>
                    <span className="text-xs font-extrabold text-gray-800 flex items-center gap-1.5 mt-0.5">
                      <span className={`px-1.5 py-0.5 text-[10px] rounded font-bold ${isPGTimetable(selectedTimetable) ? 'bg-purple-100 text-purple-800' : 'bg-indigo-100 text-indigo-800'}`}>
                        {isPGTimetable(selectedTimetable) ? 'PG' : 'UG'}
                      </span>
                      Sem {selectedTimetable.semester} - Div {selectedTimetable.division?.divisionName || 'A'}
                    </span>
                  </div>

                  {isAdmin && (
                    <button 
                      onClick={handleDelete}
                      className="w-full flex items-center justify-center px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg shadow-sm hover:bg-red-100 transition-all font-bold text-xs"
                    >
                      <FiTrash2 className="mr-2" /> Delete Timetable
                    </button>
                  )}
                </div>
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
            <TimetableGrid schedule={selectedTimetable.generatedSchedule} timetable={selectedTimetable} />
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
