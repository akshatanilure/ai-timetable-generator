import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiBookOpen, FiX, FiCheck } from 'react-icons/fi';

const DEPARTMENTS = ['CSE', 'Chemistry', 'Electrical / EEE', 'Mathematics', 'Physics', 'Others'];
const SUBJECT_TYPES = [
  { value: 'theory', label: 'Theory' },
  { value: 'lab', label: 'Laboratory' },
  { value: 'elective', label: 'Elective' },
  { value: 'project', label: 'Project' }
];

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemFilter, setSelectedSemFilter] = useState('All');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    subjectName: '',
    subjectCode: '',
    semester: 1,
    department: 'CSE',
    branch: 'CSE',
    subjectType: 'theory',
    credits: 3,
    lectureHours: 3,
    tutorialHours: 0,
    practicalHours: 0,
    elective: false,
    isFullClassLab: false
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      setSubjects(res.data.data || []);
    } catch (err) {
      console.error('Error fetching subjects', err);
      toast.error('Failed to load subjects from server');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingSubject(null);
    setFormData({
      subjectName: '',
      subjectCode: '',
      semester: 1,
      department: 'CSE',
      branch: 'CSE',
      subjectType: 'theory',
      credits: 3,
      lectureHours: 3,
      tutorialHours: 0,
      practicalHours: 0,
      elective: false,
      isFullClassLab: false
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (sub) => {
    setEditingSubject(sub);
    setFormData({
      subjectName: sub.subjectName || '',
      subjectCode: sub.subjectCode || '',
      semester: sub.semester || 1,
      department: sub.department || 'CSE',
      branch: sub.branch || 'CSE',
      subjectType: sub.subjectType || 'theory',
      credits: sub.credits !== undefined ? sub.credits : 3,
      lectureHours: sub.lectureHours || 0,
      tutorialHours: sub.tutorialHours || 0,
      practicalHours: sub.practicalHours || 0,
      elective: Boolean(sub.elective),
      isFullClassLab: Boolean(sub.isFullClassLab)
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      try {
        await api.delete(`/subjects/${id}`);
        setSubjects(prev => prev.filter(s => s._id !== id));
        toast.success('Subject deleted successfully');
      } catch (err) {
        console.error('Delete error:', err);
        toast.error(err.response?.data?.error || 'Failed to delete subject');
      }
    }
  };

  const handleTypeChange = (newType) => {
    setFormData(prev => {
      let l = prev.lectureHours;
      let p = prev.practicalHours;
      if (newType === 'lab') {
        if (p === 0) p = 2;
        if (l === 3) l = 0;
      } else if (newType === 'theory') {
        if (l === 0) l = 3;
        p = 0;
      }
      return {
        ...prev,
        subjectType: newType,
        elective: newType === 'elective' ? true : prev.elective,
        lectureHours: l,
        practicalHours: p
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subjectName.trim() || !formData.subjectCode.trim()) {
      return toast.error('Please enter subject name and code');
    }

    setSubmitting(true);
    try {
      const payload = {
        subjectName: formData.subjectName.trim(),
        subjectCode: formData.subjectCode.trim().toUpperCase(),
        semester: Number(formData.semester),
        department: formData.department,
        branch: formData.branch || 'CSE',
        subjectType: formData.subjectType,
        credits: Number(formData.credits) || 0,
        lectureHours: Number(formData.lectureHours) || 0,
        tutorialHours: Number(formData.tutorialHours) || 0,
        practicalHours: Number(formData.practicalHours) || 0,
        elective: Boolean(formData.elective),
        isFullClassLab: Boolean(formData.isFullClassLab)
      };

      if (editingSubject) {
        const res = await api.put(`/subjects/${editingSubject._id}`, payload);
        const updated = res.data.data;
        setSubjects(prev => prev.map(s => s._id === editingSubject._id ? updated : s));
        toast.success('Subject updated successfully!');
      } else {
        const res = await api.post('/subjects', payload);
        const created = res.data.data;
        setSubjects(prev => [...prev, created]);
        toast.success('Subject added successfully!');
      }

      setIsModalOpen(false);
      setEditingSubject(null);
    } catch (err) {
      console.error('Save error:', err);
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Failed to save subject';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter logic
  const filteredSubjects = subjects.filter(s => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (s.subjectName || '').toLowerCase().includes(term) ||
                          (s.subjectCode || '').toLowerCase().includes(term) ||
                          (s.department || '').toLowerCase().includes(term);
    const matchesSem = selectedSemFilter === 'All' || s.semester === Number(selectedSemFilter);
    const matchesDept = selectedDeptFilter === 'All' || s.department === selectedDeptFilter;
    return matchesSearch && matchesSem && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Header with Title and Add Subject Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subjects Management</h1>
          <p className="text-xs text-gray-500 mt-1">Configure subjects, syllabus credit allocations, and departmental hours.</p>
        </div>
        <button 
          onClick={handleAddClick}
          className="flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm shadow-blue-200 transition-colors"
          style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
        >
          <FiPlus className="mr-2" size={16} /> Add Subject
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 focus-within:border-blue-500 transition-colors">
          <FiSearch className="text-gray-400 mr-2" size={18} />
          <input
            type="text"
            placeholder="Search subjects by code, name, or department..."
            className="w-full bg-transparent focus:outline-none text-sm font-medium text-gray-800"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters Row: Semesters & Departments */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
          {/* Semester Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-gray-400 mr-1">Semester:</span>
            {['All', 1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
              <button
                key={sem}
                onClick={() => setSelectedSemFilter(sem.toString())}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedSemFilter === sem.toString()
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {sem === 'All' ? 'All Sems' : `S${sem}`}
              </button>
            ))}
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400">Dept:</span>
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="text-xs font-semibold bg-gray-100 border border-gray-200 rounded-lg px-2.5 py-1 text-gray-700 outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Departments</option>
              {DEPARTMENTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Subjects Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Sem</th>
                <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Type</th>
                <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Hours (L-T-P)</th>
                <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Credits</th>
                <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-400 font-medium animate-pulse">
                    Fetching subjects curriculum...
                  </td>
                </tr>
              ) : filteredSubjects.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-400 font-medium">
                    No subjects found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredSubjects.map((sub) => (
                  <tr key={sub._id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mr-3 border border-blue-100">
                          <FiBookOpen size={16} />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                            {sub.subjectName}
                            {sub.elective && (
                              <span className="bg-amber-100 text-amber-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                                ELECTIVE
                              </span>
                            )}
                            {sub.isFullClassLab && (
                              <span className="bg-purple-100 text-purple-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                                FULL CLASS LAB
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-mono font-semibold text-gray-400">{sub.subjectCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                        {sub.department || 'CSE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md">
                        Sem {sub.semester}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 text-[11px] font-extrabold rounded-md uppercase border ${
                        sub.subjectType === 'lab' 
                          ? 'bg-amber-50 text-amber-700 border-amber-200' 
                          : sub.subjectType === 'elective'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : sub.subjectType === 'project'
                          ? 'bg-pink-50 text-pink-700 border-pink-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {sub.subjectType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-xs font-semibold text-gray-600">
                      {sub.lectureHours || 0} - {sub.tutorialHours || 0} - {sub.practicalHours || 0}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs font-extrabold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        {sub.credits}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => handleEditClick(sub)}
                        title="Edit Subject"
                        className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(sub._id, sub.subjectName)}
                        title="Delete Subject"
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Subject Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-2xl border border-gray-100 max-w-xl w-full relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FiBookOpen className="text-blue-600" />
                {editingSubject ? 'Edit Subject' : 'Add New Subject'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Subject Name */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
                  Subject Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Data Structures and Applications"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  value={formData.subjectName}
                  onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                />
              </div>

              {/* Subject Code & Department */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
                    Subject Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 22UCSC300"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono font-medium uppercase outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    value={formData.subjectCode}
                    onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  >
                    {DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Semester, Subject Type & Credits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
                    Semester <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    value={formData.subjectType}
                    onChange={(e) => handleTypeChange(e.target.value)}
                  >
                    {SUBJECT_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
                    Credits <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    step="0.5"
                    required
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                  />
                </div>
              </div>

              {/* Weekly Hours Breakdown: Lecture, Tutorial, Practical */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
                  Weekly Hours Breakdown
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="block text-[11px] font-bold text-gray-400 mb-1">Lecture (L)</span>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      value={formData.lectureHours}
                      onChange={(e) => setFormData({ ...formData, lectureHours: e.target.value })}
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-gray-400 mb-1">Tutorial (T)</span>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      value={formData.tutorialHours}
                      onChange={(e) => setFormData({ ...formData, tutorialHours: e.target.value })}
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-gray-400 mb-1">Practical (P)</span>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      value={formData.practicalHours}
                      onChange={(e) => setFormData({ ...formData, practicalHours: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Options */}
              <div className="pt-2 space-y-2 border-t border-gray-100">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.elective}
                    onChange={(e) => setFormData({ ...formData, elective: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-xs font-bold text-gray-700">Elective Subject (Multiple options per student pool)</span>
                </label>

                {formData.subjectType === 'lab' && (
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.isFullClassLab}
                      onChange={(e) => setFormData({ ...formData, isFullClassLab: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold text-gray-700">Full Class Lab (Attended together without batch division)</span>
                  </label>
                )}
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
                >
                  <FiCheck className="mr-1.5" size={16} />
                  {submitting ? 'Saving...' : editingSubject ? 'Update Subject' : 'Save Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subjects;
