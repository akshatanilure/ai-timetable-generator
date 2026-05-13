import React, { useState, useEffect } from 'react';
import api from '../services/api';
import TimetableGrid from '../components/TimetableGrid';
import { FiSearch, FiPrinter, FiFileText, FiLayers } from 'react-icons/fi';

const StudentDashboard = () => {
  const [timetables, setTimetables] = useState([]);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    semester: '',
    division: ''
  });

  useEffect(() => {
    fetchTimetables();
  }, []);

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
      // Find timetable matching filters
      const match = timetables.find(t => 
        t.semester.toString() === filters.semester && 
        (t.division?.divisionName === filters.division || !filters.division)
      );

      if (match) {
        const res = await api.get(`/timetables/${match._id}`);
        setSelectedTimetable(res.data.data);
      } else {
        setSelectedTimetable(null);
        alert('No timetable found for this selection');
      }
    } catch (err) {
      console.error('Error searching timetable');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Student Portal</h1>
          <p className="text-sm text-gray-500">Find your class schedule quickly</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <select 
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-primary outline-none bg-gray-50"
            value={filters.semester}
            onChange={(e) => setFilters({...filters, semester: e.target.value})}
          >
            <option value="">Semester</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Sem {s}</option>)}
          </select>
          
          <select 
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-primary outline-none bg-gray-50"
            value={filters.division}
            onChange={(e) => setFilters({...filters, division: e.target.value})}
          >
            <option value="">Division</option>
            {['A', 'B', 'C', 'D'].map(d => <option key={d} value={d}>Div {d}</option>)}
          </select>

          <button 
            onClick={handleSearch}
            className="flex items-center px-6 py-2 bg-primary text-white rounded-xl hover:bg-indigo-700 transition-all font-medium"
          >
            <FiSearch className="mr-2" /> Search
          </button>
        </div>
      </div>

      {/* Main Content */}
      {selectedTimetable ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2 print:hidden">
            <div className="flex items-center text-gray-600">
              <FiLayers className="mr-2 text-primary" />
              <span className="font-bold">Semester {selectedTimetable.semester} - Division {selectedTimetable.division?.divisionName}</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handlePrint}
                className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:text-primary transition-all"
              >
                <FiPrinter className="mr-2" /> Print
              </button>
              <button 
                onClick={handlePrint}
                className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:text-primary transition-all"
              >
                <FiFileText className="mr-2" /> PDF
              </button>
            </div>
          </div>
          
          {/* Printable Area */}
          <div className="print:m-0 print:p-0">
            <div className="hidden print:block mb-6 text-center">
              <h1 className="text-2xl font-bold uppercase tracking-widest">Academic Timetable</h1>
              <p className="text-lg">Semester {selectedTimetable.semester} | Division {selectedTimetable.division?.divisionName}</p>
              <hr className="mt-4 border-gray-300" />
            </div>
            <TimetableGrid schedule={selectedTimetable.generatedSchedule} />
          </div>
        </div>
      ) : !loading && (
        <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-gray-100">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
            <FiSearch size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-700">Ready to find your schedule?</h2>
          <p className="text-gray-400 mt-2">Select your semester and division above to get started.</p>
        </div>
      )}

      {loading && (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
