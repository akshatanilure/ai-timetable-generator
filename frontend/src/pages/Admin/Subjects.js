import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiBookOpen } from 'react-icons/fi';

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      setSubjects(res.data.data);
    } catch (err) {
      console.error('Error fetching subjects');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter(s => 
    s.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.subjectCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Subjects Management</h1>
        <button className="flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 transition-shadow shadow-md">
          <FiPlus className="mr-2" /> Add Subject
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center">
          <FiSearch className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search by code or name..."
            className="w-full bg-transparent focus:outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Subject</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Credits</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Sem</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-400 animate-pulse">Fetching curriculum...</td></tr>
              ) : filteredSubjects.map((sub) => (
                <tr key={sub._id} className="group hover:bg-indigo-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded bg-indigo-100 text-primary flex items-center justify-center mr-3">
                        <FiBookOpen size={16} />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-700">{sub.subjectName}</div>
                        <div className="text-xs text-gray-400">{sub.subjectCode}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-600">{sub.credits}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase ${
                      sub.subjectType === 'lab' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {sub.subjectType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-bold">S{sub.semester}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button className="p-1 text-gray-300 hover:text-primary transition-colors"><FiEdit2 size={16} /></button>
                    <button className="p-1 text-gray-300 hover:text-red-500 transition-colors"><FiTrash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Subjects;
