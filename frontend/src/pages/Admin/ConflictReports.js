import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiAlertTriangle, FiCheckCircle, FiInfo, FiRefreshCw } from 'react-icons/fi';

const ConflictReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // In a real app, this would be a dedicated endpoint
      const res = await api.get('/timetables');
      // Mocking conflict data for demonstration
      const mockConflicts = res.data.data.map(tt => ({
        id: tt._id,
        semester: tt.semester,
        conflicts: Math.floor(Math.random() * 5),
        status: Math.random() > 0.7 ? 'Critical' : 'Warning',
        lastChecked: new Date().toLocaleDateString()
      }));
      setReports(mockConflicts);
    } catch (err) {
      console.error('Error fetching conflict reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Conflict & Integrity Reports</h1>
          <p className="text-sm text-gray-500">Monitor scheduling overlaps and constraint violations</p>
        </div>
        <button 
          onClick={fetchReports}
          className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:text-primary transition-all"
        >
          <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {reports.map(report => (
          <div key={report.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center">
              <div className={`p-4 rounded-2xl mr-4 ${report.conflicts === 0 ? 'bg-green-50 text-green-600' : report.status === 'Critical' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'}`}>
                {report.conflicts === 0 ? <FiCheckCircle size={24} /> : <FiAlertTriangle size={24} />}
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Semester {report.semester} Timetable</h3>
                <p className="text-xs text-gray-400 font-medium">Last Audit: {report.lastChecked}</p>
              </div>
            </div>

            <div className="flex items-center space-x-8">
              <div className="text-center">
                <p className="text-2xl font-black text-gray-800">{report.conflicts}</p>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Conflicts Found</p>
              </div>
              
              <div className="flex flex-col items-end">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${report.conflicts === 0 ? 'bg-green-100 text-green-700' : report.status === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {report.conflicts === 0 ? 'Optimal' : report.status}
                </span>
                <button className="text-primary text-xs font-bold mt-2 hover:underline">View Detailed Log</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {reports.length === 0 && !loading && (
        <div className="bg-white p-20 rounded-3xl text-center border-2 border-dashed border-gray-100">
          <FiInfo className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500 font-medium">No active timetables found to audit.</p>
        </div>
      )}
    </div>
  );
};

export default ConflictReports;
