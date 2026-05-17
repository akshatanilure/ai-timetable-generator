import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const res = await api.get('/teachers');
      setTeachers(res.data.data);
    } catch (err) {
      console.error('Error fetching teachers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        await api.delete(`/teachers/${id}`);
        setTeachers(teachers.filter(t => t._id !== id));
      } catch (err) {
        alert('Failed to delete teacher');
      }
    }
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Teachers Management</h1>
        <button className="flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 transition-colors">
          <FiPlus className="mr-2" /> Add Teacher
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center">
          <FiSearch className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search teachers by name or department..."
            className="w-full focus:outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Subjects</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="4" className="px-6 py-10 text-center text-gray-400">Loading teachers...</td></tr>
              ) : filteredTeachers.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-10 text-center text-gray-400">No teachers found.</td></tr>
              ) : (
                filteredTeachers.map((teacher) => (
                  <tr key={teacher._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{teacher.name}</div>
                      <div className="text-xs text-gray-500">{teacher.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{teacher.department}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {teacher.subjectsHandled.map(s => (
                          <span key={s} className="px-2 py-0.5 bg-indigo-50 text-primary text-[10px] font-bold rounded">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button className="text-gray-400 hover:text-primary transition-colors"><FiEdit2 size={18} /></button>
                      <button 
                        onClick={() => handleDelete(teacher._id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Teachers;
