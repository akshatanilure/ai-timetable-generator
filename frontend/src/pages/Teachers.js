import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiBriefcase, FiUsers } from 'react-icons/fi';

const FACULTY_WORKLOAD_MAP = [
  { tokens: ['kulkarni', 'u'], altTokens: ['kulkarni', 'umakant'], designation: 'Professor', extraRoles: 'HOD', concessionHours: 2, totalWorkingHours: 12 },
  { tokens: ['joshi', 'shrihari'], designation: 'Professor', extraRoles: 'NAAC Coordinator', concessionHours: 1, totalWorkingHours: 13 },
  { tokens: ['vadavi', 'jayateerth'], altTokens: ['vadavi', 'j'], designation: 'Associate Professor', extraRoles: 'Dean SW', concessionHours: 2, totalWorkingHours: 12 },
  { tokens: ['raghavendra'], designation: 'Associate Professor', extraRoles: 'MIS Officer', concessionHours: 2, totalWorkingHours: 12 },
  { tokens: ['kulkarni', 'shrinivas'], altTokens: ['kulkarni', 's'], designation: 'Associate Professor', extraRoles: 'Dean IPD', concessionHours: 2, totalWorkingHours: 12 },
  { tokens: ['kulkarni', 'nita'], designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, totalWorkingHours: 16 },
  { tokens: ['kulkarni', 'vidyagouri'], designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, totalWorkingHours: 16 },
  { tokens: ['yadawad', 'ranganath'], altTokens: ['yadawad', 'r'], designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, totalWorkingHours: 16 },
  { tokens: ['vaidya', 'anand'], designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, totalWorkingHours: 16 },
  { tokens: ['yadawad', 'shreedhar'], altTokens: ['yadawad', 's'], designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, totalWorkingHours: 16 },
  { tokens: ['umarji', 'indira'], designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, totalWorkingHours: 16 },
  { tokens: ['negalur', 'govind'], designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, totalWorkingHours: 16 },
  { tokens: ['patravali'], altTokens: ['patrawal'], designation: 'Assistant Professor', extraRoles: 'Coordinator CCF', concessionHours: 2, totalWorkingHours: 14 },
  { tokens: ['sandhya'], designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, totalWorkingHours: 16 },
  { tokens: ['prathap'], altTokens: ['pratap'], designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, totalWorkingHours: 16 },
  { tokens: ['vaddatti'], altTokens: ['vadadatti'], designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, totalWorkingHours: 16 },
  { tokens: ['shetty', 'rani'], designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, totalWorkingHours: 16 },
  { tokens: ['patil', 'rashmi'], designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, totalWorkingHours: 16 },
  { tokens: ['sambrani', 'yashodha'], designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, totalWorkingHours: 16 },
  { tokens: ['pashupatimath'], designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, totalWorkingHours: 16 },
  { tokens: ['sharada'], designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, totalWorkingHours: 16 },
  { tokens: ['chate'], designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, totalWorkingHours: 16 },
  { tokens: ['amashi', 'radhika'], designation: 'Assistant Professor', extraRoles: '', concessionHours: 0, totalWorkingHours: 16 }
];

const getFacultyWorkloadInfo = (teacher) => {
  const normName = (teacher.name || '').toLowerCase().replace(/[^a-z]/g, '');
  const match = FACULTY_WORKLOAD_MAP.find(item => {
    const primary = item.tokens.every(tok => normName.includes(tok));
    const alt = item.altTokens ? item.altTokens.every(tok => normName.includes(tok)) : false;
    return primary || alt;
  });

  const designation = (teacher.designation !== undefined && teacher.designation !== null)
    ? teacher.designation
    : (match ? match.designation : '');

  const extraRoles = (teacher.extraRoles !== undefined && teacher.extraRoles !== null)
    ? teacher.extraRoles
    : (match ? match.extraRoles : '');

  const concessionHours = (teacher.concessionHours !== undefined && teacher.concessionHours !== null)
    ? teacher.concessionHours
    : (match ? match.concessionHours : '');

  const totalWorkingHours = (teacher.maxWorkloadPerWeek !== undefined && teacher.maxWorkloadPerWeek <= 24)
    ? teacher.maxWorkloadPerWeek 
    : (match ? match.totalWorkingHours : '');

  return {
    designation,
    extraRoles,
    concessionHours,
    totalWorkingHours
  };
};

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'CSE',
    designation: 'Assistant Professor',
    extraRoles: '',
    concessionHours: '0',
    maxWorkloadPerWeek: 16
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

  const handleAddClick = () => {
    setEditingTeacher(null);
    setFormData({
      name: '',
      email: '',
      department: 'CSE',
      designation: 'Assistant Professor',
      extraRoles: '',
      concessionHours: '0',
      maxWorkloadPerWeek: 16
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (teacher) => {
    const info = getFacultyWorkloadInfo(teacher);
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name || '',
      email: teacher.email || '',
      department: teacher.department || 'CSE',
      designation: info.designation || '',
      extraRoles: info.extraRoles || '',
      concessionHours: info.concessionHours !== '' ? info.concessionHours : '0',
      maxWorkloadPerWeek: info.totalWorkingHours !== '' ? info.totalWorkingHours : (teacher.maxWorkloadPerWeek || 16)
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this teacher profile?')) {
      try {
        await api.delete(`/teachers/${id}`);
        setTeachers(teachers.filter(t => t._id !== id));
      } catch (err) {
        alert('Failed to delete teacher profile');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        email: formData.email || `${formData.name.toLowerCase().replace(/[^a-z]/g, '')}@college.edu`,
        department: formData.department,
        designation: formData.designation,
        extraRoles: formData.extraRoles,
        concessionHours: parseInt(formData.concessionHours) || 0,
        subjectsHandled: editingTeacher ? editingTeacher.subjectsHandled : [],
        maxWorkloadPerDay: 6,
        maxWorkloadPerWeek: parseInt(formData.maxWorkloadPerWeek) || 16
      };

      if (editingTeacher) {
        const res = await api.put(`/teachers/${editingTeacher._id}`, payload);
        setTeachers(prev => prev.map(t => t._id === editingTeacher._id ? res.data.data : t));
        alert('Teacher updated successfully!');
      } else {
        const res = await api.post('/teachers', payload);
        setTeachers(prev => [...prev, res.data.data]);
        alert('Teacher added successfully!');
      }
      setIsModalOpen(false);
      setEditingTeacher(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save teacher details');
    }
  };

  const filteredTeachers = teachers.filter(t => {
    const search = searchTerm.toLowerCase();
    const info = getFacultyWorkloadInfo(t);
    return (
      t.name.toLowerCase().includes(search) ||
      t.department.toLowerCase().includes(search) ||
      (info.designation && info.designation.toLowerCase().includes(search)) ||
      (info.extraRoles && info.extraRoles.toLowerCase().includes(search))
    );
  });

  // Unique departments for filter tabs
  const allDepts = Array.from(new Set(teachers.map(t => t.department || 'CSE'))).sort();

  // Group teachers by department
  const groupedTeachers = filteredTeachers.reduce((acc, t) => {
    const dept = t.department || 'Other';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(t);
    return acc;
  }, {});

  const displayDepts = selectedDeptFilter === 'All' 
    ? Object.keys(groupedTeachers).sort()
    : Object.keys(groupedTeachers).filter(d => d === selectedDeptFilter);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faculty Management</h1>
          <p className="text-xs text-gray-500 mt-1">Organized by Department with exact workload & responsibility allocation.</p>
        </div>
        <button 
          onClick={handleAddClick}
          className="flex items-center justify-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all font-bold text-xs shadow-sm shadow-indigo-200"
        >
          <FiPlus className="mr-2" size={16} /> Add Teacher
        </button>
      </div>

      {/* Search & Department Filter Tabs */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 focus-within:border-indigo-500 transition-colors">
          <FiSearch className="text-gray-400 mr-2" size={18} />
          <input
            type="text"
            placeholder="Search faculty by name, department, designation or role..."
            className="w-full bg-transparent focus:outline-none text-sm font-medium text-gray-800"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Department Filter Pills */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
          <button
            onClick={() => setSelectedDeptFilter('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedDeptFilter === 'All'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Departments ({teachers.length})
          </button>
          {allDepts.map(dept => {
            const count = teachers.filter(t => t.department === dept).length;
            return (
              <button
                key={dept}
                onClick={() => setSelectedDeptFilter(dept)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedDeptFilter === dept
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {dept} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Grouped Department Tables */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl text-center text-gray-400 font-medium border border-gray-100">
          Loading faculty profiles...
        </div>
      ) : displayDepts.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl text-center text-gray-400 font-medium border border-gray-100">
          No faculty members found matching your search filter.
        </div>
      ) : (
        <div className="space-y-6">
          {displayDepts.map(dept => {
            const deptTeachers = groupedTeachers[dept] || [];
            return (
              <div key={dept} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Department Section Header */}
                <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white px-6 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiBriefcase className="text-indigo-200" size={18} />
                    <h3 className="font-bold text-sm uppercase tracking-wide">
                      {dept} Department
                    </h3>
                  </div>
                  <span className="bg-indigo-700 text-indigo-100 text-xs font-bold px-3 py-1 rounded-full border border-indigo-500/40">
                    <FiUsers className="inline mr-1" size={12} /> {deptTeachers.length} Faculty
                  </span>
                </div>

                {/* Department Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-100">
                        <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Faculty Name</th>
                        <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Designation</th>
                        <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Extra Roles & Responsibilities</th>
                        <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Concession Hours</th>
                        <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Total Working Hours</th>
                        <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {deptTeachers.map((teacher) => {
                        const info = getFacultyWorkloadInfo(teacher);
                        return (
                          <tr key={teacher._id} className="hover:bg-indigo-50/30 transition-colors">
                            <td className="px-6 py-4 font-bold text-gray-900 text-sm">
                              {teacher.name}
                            </td>
                            <td className="px-6 py-4 text-xs font-semibold text-gray-800">
                              {info.designation || ''}
                            </td>
                            <td className="px-6 py-4 text-xs font-semibold">
                              {info.extraRoles ? (
                                <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md font-bold text-[11px] border border-indigo-100 inline-block">
                                  {info.extraRoles}
                                </span>
                              ) : ''}
                            </td>
                            <td className="px-6 py-4 text-xs font-bold text-gray-600 text-center">
                              {info.concessionHours !== '' && info.concessionHours !== null ? `${info.concessionHours} hrs` : ''}
                            </td>
                            <td className="px-6 py-4 text-xs font-black text-indigo-900 text-center">
                              {info.totalWorkingHours !== '' ? (
                                <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block font-extrabold">
                                  {info.totalWorkingHours} hrs
                                </span>
                              ) : ''}
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                              <button 
                                onClick={() => handleEditClick(teacher)}
                                title="Edit Faculty Details"
                                className="p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition-colors"
                              >
                                <FiEdit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDelete(teacher._id)}
                                title="Delete Faculty Profile"
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Teacher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 max-w-lg w-full relative animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-indigo-900 mb-6 flex items-center gap-2">
              <FiEdit2 className="text-indigo-600" />
              {editingTeacher ? 'Edit Faculty Member' : 'Add New Faculty Member'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">FULL NAME</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Dr. Anand Vaidya"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium transition-all"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">DEPARTMENT</label>
                  <select 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium transition-all"
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
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">DESIGNATION</label>
                  <input 
                    type="text"
                    placeholder="e.g. Assistant Professor"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium transition-all"
                    value={formData.designation}
                    onChange={e => setFormData({...formData, designation: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">EXTRA ROLES & RESPONSIBILITIES</label>
                <input 
                  type="text"
                  placeholder="e.g. HOD / NAAC Coordinator / Dean SW"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium transition-all"
                  value={formData.extraRoles}
                  onChange={e => setFormData({...formData, extraRoles: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">CONCESSION HOURS</label>
                  <input 
                    type="number"
                    min="0" max="10"
                    placeholder="e.g. 2"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium transition-all"
                    value={formData.concessionHours}
                    onChange={e => setFormData({...formData, concessionHours: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">TOTAL WORKING HOURS</label>
                  <input 
                    type="number" 
                    required
                    min="1" max="40"
                    placeholder="e.g. 16"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium transition-all"
                    value={formData.maxWorkloadPerWeek}
                    onChange={e => setFormData({...formData, maxWorkloadPerWeek: e.target.value})}
                  />
                </div>
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
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100"
                >
                  {editingTeacher ? 'Update Teacher' : 'Save Teacher'}
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
