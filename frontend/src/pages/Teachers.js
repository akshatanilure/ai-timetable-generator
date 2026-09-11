import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'CSE',
    subjectsInput: '',
    maxWorkloadPerWeek: 30
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        department: formData.department,
        subjectsHandled: formData.subjectsInput.split(',').map(s => s.trim()).filter(Boolean),
        maxWorkloadPerDay: 6, // default safe constraint value
        maxWorkloadPerWeek: parseInt(formData.maxWorkloadPerWeek) || 30
      };

      const res = await api.post('/teachers', payload);
      setTeachers([...teachers, res.data.data]);
      setIsModalOpen(false);
      setFormData({
        name: '',
        email: '',
        department: 'CSE',
        subjectsInput: '',
        maxWorkloadPerWeek: 30
      });
      alert('Teacher added successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add teacher');
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
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 transition-colors font-bold text-xs shadow-sm"
        >
          <FiPlus className="mr-2" size={16} /> Add Teacher
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

      {/* Add Teacher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full relative animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Add New Teacher</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">FULL NAME</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Dr. Anand Vaidya"
                  className="w-full p-3 bg-gray-50 border border-gray-250 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">EMAIL ADDRESS</label>
                <input 
                  type="email" 
                  required
                  placeholder="e.g. vaidya@college.edu"
                  className="w-full p-3 bg-gray-50 border border-gray-250 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">DEPARTMENT</label>
                  <select 
                    className="w-full p-3 bg-gray-50 border border-gray-250 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                    value={formData.department}
                    onChange={e => setFormData({...formData, department: e.target.value})}
                  >
                    <option value="CSE">CSE</option>
                    <option value="Maths">Maths</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Mechanical">Mechanical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">MAX WEEKLY HOURS</label>
                  <input 
                    type="number" 
                    required
                    min="1" max="40"
                    className="w-full p-3 bg-gray-50 border border-gray-250 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                    value={formData.maxWorkloadPerWeek}
                    onChange={e => setFormData({...formData, maxWorkloadPerWeek: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">SUBJECTS HANDLED (COMMA SEPARATED)</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Mathematics-I, Mathematics-II"
                  className="w-full p-3 bg-gray-50 border border-gray-250 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                  value={formData.subjectsInput}
                  onChange={e => setFormData({...formData, subjectsInput: e.target.value})}
                />
                <p className="text-[10px] text-gray-400 mt-1">Separate subject codes or names with commas.</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-600 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-primary hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100"
                >
                  Save Teacher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teachers;
