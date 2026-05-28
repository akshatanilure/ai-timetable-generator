import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  FiSettings, FiUser, FiSliders, FiLock, FiCheckCircle, 
  FiClock, FiBook, FiSave, FiAlertCircle, FiPlus, FiTrash 
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  
  const [activeSubTab, setActiveSubTab] = useState('profile'); // 'profile', 'faculty', 'security'
  const [loading, setLoading] = useState(false);
  const [teacherProfile, setTeacherProfile] = useState(null);
  
  // User Form State
  const [accountForm, setAccountForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  // Faculty Profile Form State
  const [facultyForm, setFacultyForm] = useState({
    designation: '',
    specialization: '',
    maxWorkloadPerWeek: 30,
    preferredSlots: []
  });

  // Temporary Slot State
  const [tempSlot, setTempSlot] = useState({
    day: 'Monday',
    startTime: '09:00',
    endTime: '13:00'
  });

  // Password State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (isTeacher) {
      fetchTeacherProfile();
    }
  }, [isTeacher]);

  const fetchTeacherProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/teachers');
      const currentTeacher = res.data.data.find(t => 
        t.user?._id === user?._id || t.user === user?._id ||
        t.name.toLowerCase().includes(user?.name?.toLowerCase())
      );
      
      if (currentTeacher) {
        setTeacherProfile(currentTeacher);
        setFacultyForm({
          designation: currentTeacher.designation || '',
          specialization: currentTeacher.specialization || '',
          maxWorkloadPerWeek: currentTeacher.maxWorkloadPerWeek || 30,
          preferredSlots: currentTeacher.preferredSlots || []
        });
      }
    } catch (err) {
      console.error('Error fetching teacher profile', err);
      toast.error('Failed to load faculty details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    toast.success('Account profile updated (simulation)');
  };

  const handleUpdateFaculty = async (e) => {
    e.preventDefault();
    if (!teacherProfile) return;
    
    setLoading(true);
    try {
      const res = await api.put(`/teachers/${teacherProfile._id}`, facultyForm);
      setTeacherProfile(res.data.data);
      toast.success('Faculty settings saved successfully!');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    toast.success('Password updated successfully (simulation)');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const addPreferredSlot = () => {
    const { day, startTime, endTime } = tempSlot;
    if (startTime >= endTime) {
      toast.error('Start time must be before End time');
      return;
    }

    setFacultyForm(prev => {
      const newSlots = [...prev.preferredSlots];
      const dayIndex = newSlots.findIndex(s => s.day === day);

      if (dayIndex > -1) {
        // Append slot to existing day list
        newSlots[dayIndex].slots.push({ startTime, endTime });
      } else {
        // Create new day entry
        newSlots.push({
          day,
          slots: [{ startTime, endTime }]
        });
      }

      return { ...prev, preferredSlots: newSlots };
    });
    toast.success(`Preferred slot added for ${day}`);
  };

  const removePreferredSlot = (dayName, slotIdx) => {
    setFacultyForm(prev => {
      const newSlots = prev.preferredSlots.map(group => {
        if (group.day === dayName) {
          const updatedSlots = group.slots.filter((_, idx) => idx !== slotIdx);
          return { ...group, slots: updatedSlots };
        }
        return group;
      }).filter(group => group.slots.length > 0); // remove day group if empty

      return { ...prev, preferredSlots: newSlots };
    });
    toast.success('Preferred slot removed');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
          <FiSettings size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">System Settings</h1>
          <p className="text-sm text-gray-500">Configure personal account profiles, faculty workloads, and preferred scheduling slots.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Nav */}
        <div className="md:col-span-1 bg-white p-4 rounded-3xl shadow-sm border border-gray-100 h-fit space-y-2">
          <button 
            onClick={() => setActiveSubTab('profile')}
            className={`w-full flex items-center px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeSubTab === 'profile' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <FiUser className="mr-2" size={16} /> Profile Details
          </button>
          
          {isTeacher && (
            <button 
              onClick={() => setActiveSubTab('faculty')}
              className={`w-full flex items-center px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeSubTab === 'faculty' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <FiSliders className="mr-2" size={16} /> Faculty Preferences
            </button>
          )}

          <button 
            onClick={() => setActiveSubTab('security')}
            className={`w-full flex items-center px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeSubTab === 'security' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <FiLock className="mr-2" size={16} /> Password & Security
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3">
          {activeSubTab === 'profile' && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-lg font-bold text-gray-800 flex items-center border-b pb-3">
                <FiUser className="mr-2 text-indigo-600" /> Account Information
              </h2>
              <form onSubmit={handleUpdateAccount} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">Display Name</label>
                    <input 
                      type="text" 
                      value={accountForm.name} 
                      onChange={e => setAccountForm({...accountForm, name: e.target.value})}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">Email Address</label>
                    <input 
                      type="email" 
                      value={accountForm.email} 
                      onChange={e => setAccountForm({...accountForm, email: e.target.value})}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">Account Role</label>
                  <input 
                    type="text" 
                    value={user?.role?.toUpperCase() || 'STUDENT'} 
                    disabled 
                    className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 outline-none select-none"
                  />
                </div>

                <button 
                  type="submit" 
                  className="flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100"
                >
                  <FiSave className="mr-2" /> Save Account Profile
                </button>
              </form>
            </div>
          )}

          {activeSubTab === 'faculty' && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-lg font-bold text-gray-800 flex items-center border-b pb-3">
                <FiSliders className="mr-2 text-indigo-600" /> Teaching Preferences
              </h2>

              {!teacherProfile && !loading && (
                <div className="p-4 bg-yellow-50 text-yellow-700 rounded-xl border border-yellow-200 flex items-center gap-2 text-sm">
                  <FiAlertCircle size={20} />
                  <span>No Teacher record found in the database matching your login name <strong>"{user.name}"</strong>. Please contact the administrator.</span>
                </div>
              )}

              {teacherProfile && (
                <form onSubmit={handleUpdateFaculty} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-2">Designation</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Assistant Professor"
                        value={facultyForm.designation} 
                        onChange={e => setFacultyForm({...facultyForm, designation: e.target.value})}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-2">Area of Specialization</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Data Science, Machine Learning"
                        value={facultyForm.specialization} 
                        onChange={e => setFacultyForm({...facultyForm, specialization: e.target.value})}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">Max Workload Per Week (Hours)</label>
                    <input 
                      type="number" 
                      min="1" max="40"
                      value={facultyForm.maxWorkloadPerWeek} 
                      onChange={e => setFacultyForm({...facultyForm, maxWorkloadPerWeek: parseInt(e.target.value) || 30})}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Preferred Slots Setup */}
                  <div className="pt-4 border-t border-gray-100 space-y-4">
                    <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <FiClock className="text-indigo-600" /> Configure Preferred Availability Slots
                    </h3>
                    <p className="text-xs text-gray-400">Specify custom weekly slots you prefer to teach in. The scheduling solver prioritizes these configurations.</p>
                    
                    {/* Render Registered Slots */}
                    <div className="space-y-2 mt-2">
                      {facultyForm.preferredSlots.length > 0 ? (
                        facultyForm.preferredSlots.map(group => (
                          <div key={group.day} className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">{group.day}</span>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                              {group.slots.map((slot, idx) => (
                                <div key={idx} className="flex justify-between items-center text-[10px] bg-white px-3 py-1.5 rounded-lg border border-gray-150">
                                  <span className="font-medium text-gray-600">{slot.startTime} – {slot.endTime}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400 italic">No preferred availability slots configured. Your availability defaults to college working hours.</p>
                      )}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 disabled:opacity-50"
                  >
                    <FiSave className="mr-2" /> Save Faculty Preferences
                  </button>
                </form>
              )}
            </div>
          )}

          {activeSubTab === 'security' && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-lg font-bold text-gray-800 flex items-center border-b pb-3">
                <FiLock className="mr-2 text-indigo-600" /> Security Settings
              </h2>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">Current Password</label>
                  <input 
                    type="password" 
                    value={passwordForm.currentPassword} 
                    onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">New Password</label>
                  <input 
                    type="password" 
                    value={passwordForm.newPassword} 
                    onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">Confirm New Password</label>
                  <input 
                    type="password" 
                    value={passwordForm.confirmPassword} 
                    onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button 
                  type="submit" 
                  className="flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100"
                >
                  <FiSave className="mr-2" /> Change Password
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
