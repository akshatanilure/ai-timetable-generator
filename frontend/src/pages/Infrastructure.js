import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiSearch, 
  FiBox, 
  FiSliders, 
  FiCpu, 
  FiCheckCircle, 
  FiAlertTriangle,
  FiBookOpen,
  FiActivity
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const Infrastructure = () => {
  // Lists & Loading State
  const [rooms, setRooms] = useState([]);
  const [labs, setLabs] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('rooms'); // 'rooms' | 'labs'

  // Interactive Target Capacity States (saved in LocalStorage for persistence)
  const [targetRooms, setTargetRooms] = useState(() => {
    const saved = localStorage.getItem('targetRooms');
    return saved !== null ? parseInt(saved) : 4;
  });
  const [targetLabs, setTargetLabs] = useState(() => {
    const saved = localStorage.getItem('targetLabs');
    return saved !== null ? parseInt(saved) : 5;
  });

  // Modal Overlay States
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [editingLab, setEditingLab] = useState(null);

  // Form States
  const [roomFormData, setRoomFormData] = useState({
    roomNumber: '',
    capacity: 60,
    roomType: 'lecture'
  });

  const [labFormData, setLabFormData] = useState({
    labName: '',
    labType: 'computer',
    capacity: 30,
    supportedSubjects: [],
    equipmentInput: ''
  });

  // Sync targets to localStorage
  useEffect(() => {
    localStorage.setItem('targetRooms', targetRooms.toString());
  }, [targetRooms]);

  useEffect(() => {
    localStorage.setItem('targetLabs', targetLabs.toString());
  }, [targetLabs]);

  // Initial Fetch
  useEffect(() => {
    fetchInfrastructure();
  }, []);

  const fetchInfrastructure = async () => {
    try {
      setLoading(true);
      const [roomsRes, labsRes, subjectsRes] = await Promise.all([
        api.get('/rooms'),
        api.get('/labs'),
        api.get('/subjects')
      ]);
      const roomsData = roomsRes.data.data || [];
      const labsData = labsRes.data.data || [];
      
      setRooms(roomsData);
      setLabs(labsData);
      setSubjects(subjectsRes.data.data || []);

      // If localStorage is not explicitly set, or holds outdated hardcoded mock placeholders (6 or 4),
      // dynamically initialize the target states to exactly match actual seeded backend resource counts!
      const savedRooms = localStorage.getItem('targetRooms');
      if (savedRooms === null || parseInt(savedRooms) === 6) {
        setTargetRooms(roomsData.length);
        localStorage.setItem('targetRooms', roomsData.length.toString());
      }
      
      const savedLabs = localStorage.getItem('targetLabs');
      if (savedLabs === null || parseInt(savedLabs) === 4) {
        setTargetLabs(labsData.length);
        localStorage.setItem('targetLabs', labsData.length.toString());
      }
    } catch (err) {
      console.error('Error fetching infrastructure data', err);
      toast.error('Failed to load infrastructure resources');
    } finally {
      setLoading(false);
    }
  };

  // --- Auto-Provisioning Engine ---
  const handleAutoProvision = async () => {
    const missingRooms = targetRooms - rooms.length;
    const missingLabs = targetLabs - labs.length;

    if (missingRooms <= 0 && missingLabs <= 0) {
      toast.success('Infrastructure is already fully provisioned to match targets!');
      return;
    }

    const provisionPromise = new Promise(async (resolve, reject) => {
      try {
        let createdRoomsCount = 0;
        let createdLabsCount = 0;

        // Provision Classrooms
        if (missingRooms > 0) {
          // Find maximum room number of format Rxxx
          let maxNum = 100;
          rooms.forEach(r => {
            const num = parseInt(r.roomNumber.replace(/\D/g, ''));
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          });

          for (let i = 1; i <= missingRooms; i++) {
            const nextRoomNum = `R${maxNum + i}`;
            await api.post('/rooms', {
              roomNumber: nextRoomNum,
              capacity: 60,
              roomType: 'lecture'
            });
            createdRoomsCount++;
          }
        }

        // Provision Laboratories
        if (missingLabs > 0) {
          // Identify potential default subject for lab support
          const labSubject = subjects.find(s => s.subjectType === 'lab') || null;
          const supportedSubjects = labSubject ? [labSubject._id] : [];

          for (let i = 1; i <= missingLabs; i++) {
            const labNum = labs.length + i;
            const nextLabName = `CS Lab ${labNum}`;
            await api.post('/labs', {
              labName: nextLabName,
              labType: 'computer',
              capacity: 30,
              supportedSubjects,
              equipment: ['PCs', 'LAN Switch']
            });
            createdLabsCount++;
          }
        }

        await fetchInfrastructure();
        resolve({ rooms: createdRoomsCount, labs: createdLabsCount });
      } catch (err) {
        console.error('Auto-provisioning failed:', err);
        reject(err);
      }
    });

    toast.promise(provisionPromise, {
      loading: 'Provisioning default Classrooms & Labs...',
      success: (data) => `Successfully provisioned ${data.rooms} rooms and ${data.labs} labs!`,
      error: 'Provisioning failed. Check for duplicate numbers/names.'
    });
  };

  // --- Reactive Auto-Provisioning on Input Target Change ---
  const handleRoomsTargetChange = async (newVal) => {
    setTargetRooms(newVal);
    const diff = newVal - rooms.length;
    if (diff > 0) {
      const provisionPromise = new Promise(async (resolve, reject) => {
        try {
          let maxNum = 100;
          rooms.forEach(r => {
            const num = parseInt(r.roomNumber.replace(/\D/g, ''));
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          });

          for (let i = 1; i <= diff; i++) {
            const nextRoomNum = `R${maxNum + i}`;
            await api.post('/rooms', {
              roomNumber: nextRoomNum,
              capacity: 60,
              roomType: 'lecture'
            });
          }
          await fetchInfrastructure();
          resolve(diff);
        } catch (err) {
          console.error('Auto-provisioning classrooms dynamically failed:', err);
          reject(err);
        }
      });

      toast.promise(provisionPromise, {
        loading: `Automatically creating ${diff} classrooms...`,
        success: `Successfully created ${diff} classrooms!`,
        error: 'Automatic creation failed.'
      });
    }
  };

  const handleLabsTargetChange = async (newVal) => {
    setTargetLabs(newVal);
    const diff = newVal - labs.length;
    if (diff > 0) {
      const provisionPromise = new Promise(async (resolve, reject) => {
        try {
          const labSubject = subjects.find(s => s.subjectType === 'lab') || null;
          const supportedSubjects = labSubject ? [labSubject._id] : [];

          for (let i = 1; i <= diff; i++) {
            const labNum = labs.length + i;
            const nextLabName = `CS Lab ${labNum}`;
            await api.post('/labs', {
              labName: nextLabName,
              labType: 'computer',
              capacity: 30,
              supportedSubjects,
              equipment: ['PCs', 'LAN Switch']
            });
          }
          await fetchInfrastructure();
          resolve(diff);
        } catch (err) {
          console.error('Auto-provisioning labs dynamically failed:', err);
          reject(err);
        }
      });

      toast.promise(provisionPromise, {
        loading: `Automatically creating ${diff} laboratories...`,
        success: `Successfully created ${diff} laboratories!`,
        error: 'Automatic creation failed.'
      });
    }
  };

  // --- Classroom CRUD ---
  const handleRoomDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this classroom?')) {
      try {
        await api.delete(`/rooms/${id}`);
        setRooms(rooms.filter(r => r._id !== id));
        toast.success('Classroom deleted');
      } catch (err) {
        toast.error('Failed to delete classroom');
      }
    }
  };

  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRoom) {
        const res = await api.put(`/rooms/${editingRoom._id}`, roomFormData);
        setRooms(rooms.map(r => r._id === editingRoom._id ? res.data.data : r));
        toast.success('Classroom updated successfully');
      } else {
        const res = await api.post('/rooms', roomFormData);
        setRooms([...rooms, res.data.data]);
        toast.success('Classroom added successfully');
      }
      setIsRoomModalOpen(false);
      setEditingRoom(null);
      setRoomFormData({ roomNumber: '', capacity: 60, roomType: 'lecture' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Classroom operation failed');
    }
  };

  const openEditRoom = (room) => {
    setEditingRoom(room);
    setRoomFormData({
      roomNumber: room.roomNumber,
      capacity: room.capacity,
      roomType: room.roomType
    });
    setIsRoomModalOpen(true);
  };

  // --- Laboratory CRUD ---
  const handleLabDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this laboratory?')) {
      try {
        await api.delete(`/labs/${id}`);
        setLabs(labs.filter(l => l._id !== id));
        toast.success('Laboratory deleted');
      } catch (err) {
        toast.error('Failed to delete laboratory');
      }
    }
  };

  const handleLabSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        labName: labFormData.labName,
        labType: labFormData.labType,
        capacity: parseInt(labFormData.capacity) || 30,
        supportedSubjects: labFormData.supportedSubjects,
        equipment: labFormData.equipmentInput.split(',').map(eq => eq.trim()).filter(Boolean)
      };

      if (editingLab) {
        const res = await api.put(`/labs/${editingLab._id}`, payload);
        setLabs(labs.map(l => l._id === editingLab._id ? res.data.data : l));
        toast.success('Laboratory updated successfully');
      } else {
        const res = await api.post('/labs', payload);
        setLabs([...labs, res.data.data]);
        toast.success('Laboratory added successfully');
      }
      setIsLabModalOpen(false);
      setEditingLab(null);
      setLabFormData({ labName: '', labType: 'computer', capacity: 30, supportedSubjects: [], equipmentInput: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Laboratory operation failed');
    }
  };

  const openEditLab = (lab) => {
    setEditingLab(lab);
    setLabFormData({
      labName: lab.labName,
      labType: lab.labType,
      capacity: lab.capacity,
      supportedSubjects: lab.supportedSubjects ? lab.supportedSubjects.map(s => s._id || s) : [],
      equipmentInput: lab.equipment ? lab.equipment.join(', ') : ''
    });
    setIsLabModalOpen(true);
  };

  const handleLabSubjectToggle = (subjectId) => {
    const current = [...labFormData.supportedSubjects];
    if (current.includes(subjectId)) {
      setLabFormData({
        ...labFormData,
        supportedSubjects: current.filter(id => id !== subjectId)
      });
    } else {
      setLabFormData({
        ...labFormData,
        supportedSubjects: [...current, subjectId]
      });
    }
  };

  // --- Search Filtering ---
  const filteredRooms = rooms.filter(r => 
    r.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.roomType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLabs = labs.filter(l => 
    l.labName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.labType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Live status badge calculations
  const roomsDiff = targetRooms - rooms.length;
  const labsDiff = targetLabs - labs.length;
  const totalUnderProvisioned = (roomsDiff > 0 ? roomsDiff : 0) + (labsDiff > 0 ? labsDiff : 0);

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <FiBox className="text-indigo-600 mr-2" /> Rooms & Labs Management
          </h1>
          <p className="text-sm text-gray-500">Configure targets and allocate scheduling spaces across your departments</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'rooms' ? (
            <button 
              onClick={() => {
                setEditingRoom(null);
                setRoomFormData({ roomNumber: '', capacity: 60, roomType: 'lecture' });
                setIsRoomModalOpen(true);
              }}
              className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold text-xs shadow-md shadow-indigo-100"
            >
              <FiPlus className="mr-2" size={16} /> Add Classroom
            </button>
          ) : (
            <button 
              onClick={() => {
                setEditingLab(null);
                setLabFormData({ labName: '', labType: 'computer', capacity: 30, supportedSubjects: [], equipmentInput: '' });
                setIsLabModalOpen(true);
              }}
              className="flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all font-bold text-xs shadow-md shadow-teal-100"
            >
              <FiPlus className="mr-2" size={16} /> Add Laboratory
            </button>
          )}
        </div>
      </div>

      {/* --- Interactive Targets Configuration Panel --- */}
      <div className="bg-gradient-to-r from-indigo-50 to-teal-50 p-6 rounded-3xl border border-indigo-100/50 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 flex items-center text-sm tracking-wide uppercase">
            <FiSliders className="text-indigo-600 mr-2 animate-pulse" /> Interactive Target Capacities
          </h3>
          {totalUnderProvisioned > 0 ? (
            <button
              onClick={handleAutoProvision}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white font-bold text-[11px] rounded-lg hover:bg-indigo-700 transition-all shadow-sm cursor-pointer"
            >
              <FiCpu className="animate-spin" size={12} /> Auto-Provision {totalUnderProvisioned} Missing Spaces
            </button>
          ) : (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 font-bold text-[10px] rounded-full">
              <FiCheckCircle size={12} /> Fully Provisioned
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Classrooms Input Only (No Slider, No Specified Max Limit) */}
          <div className="bg-white p-6 rounded-2xl border border-indigo-50/50 flex flex-col justify-between space-y-4 shadow-sm">
            <div className="flex justify-between items-center gap-4">
              <div>
                <p className="font-bold text-gray-755 text-sm">Enter the number of rooms for classes:</p>
                <p className="text-xs font-semibold text-indigo-655 mt-1">Number of classrooms you entered: <span className="font-extrabold text-base text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-lg border border-indigo-200">{targetRooms}</span></p>
              </div>
              <input 
                type="number" 
                min="1"
                value={targetRooms}
                onChange={e => {
                  const val = Math.max(1, parseInt(e.target.value) || 1);
                  handleRoomsTargetChange(val);
                }}
                className="w-24 p-2.5 bg-indigo-50 border border-indigo-150 rounded-xl text-center font-extrabold text-indigo-750 outline-none text-base focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-inner"
              />
            </div>
            <div className="flex items-center justify-between text-xs font-semibold pt-3 border-t border-gray-50">
              <span className="text-gray-500">Currently Seeded: <span className="font-bold text-gray-800">{rooms.length}</span></span>
              {roomsDiff > 0 ? (
                <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1">
                  <FiAlertTriangle size={10} /> {roomsDiff} Under-provisioned
                </span>
              ) : roomsDiff === 0 ? (
                <span className="text-green-600 font-bold">Target Reached</span>
              ) : (
                <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">+{Math.abs(roomsDiff)} Extra Classrooms</span>
              )}
            </div>
          </div>

          {/* Laboratories Input Only (No Slider, No Specified Max Limit) */}
          <div className="bg-white p-6 rounded-2xl border border-teal-50/50 flex flex-col justify-between space-y-4 shadow-sm">
            <div className="flex justify-between items-center gap-4">
              <div>
                <p className="font-bold text-gray-755 text-sm">Enter the number of lab rooms:</p>
                <p className="text-xs font-semibold text-teal-655 mt-1">Number of labs you entered: <span className="font-extrabold text-base text-teal-705 bg-teal-100/70 px-2 py-0.5 rounded-lg border border-teal-200">{targetLabs}</span></p>
              </div>
              <input 
                type="number" 
                min="1"
                value={targetLabs}
                onChange={e => {
                  const val = Math.max(1, parseInt(e.target.value) || 1);
                  handleLabsTargetChange(val);
                }}
                className="w-24 p-2.5 bg-teal-50 border border-teal-150 rounded-xl text-center font-extrabold text-teal-750 outline-none text-base focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all shadow-inner"
              />
            </div>
            <div className="flex items-center justify-between text-xs font-semibold pt-3 border-t border-gray-50">
              <span className="text-gray-500">Currently Seeded: <span className="font-bold text-gray-800">{labs.length}</span></span>
              {labsDiff > 0 ? (
                <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1">
                  <FiAlertTriangle size={10} /> {labsDiff} Under-provisioned
                </span>
              ) : labsDiff === 0 ? (
                <span className="text-green-600 font-bold">Target Reached</span>
              ) : (
                <span className="text-teal-600 bg-teal-50 px-2 py-0.5 rounded">+{Math.abs(labsDiff)} Extra Laboratories</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- Filter & Tabbed Grid Display --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Search and Tabs Bar */}
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex bg-gray-200/60 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('rooms')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'rooms' 
                  ? 'bg-white text-indigo-700 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Classrooms ({rooms.length})
            </button>
            <button
              onClick={() => setActiveTab('labs')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'labs' 
                  ? 'bg-white text-teal-700 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Laboratories ({labs.length})
            </button>
          </div>

          <div className="flex items-center bg-white px-3 py-2 rounded-xl border border-gray-200 max-w-xs w-full shadow-inner">
            <FiSearch className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder={activeTab === 'rooms' ? "Search classrooms..." : "Search laboratories..."}
              className="w-full bg-transparent focus:outline-none text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Data Tables */}
        <div className="overflow-x-auto">
          {activeTab === 'rooms' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Room Number</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Capacity</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Room Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan="4" className="px-6 py-10 text-center text-gray-400 animate-pulse">Loading classrooms...</td></tr>
                ) : filteredRooms.length === 0 ? (
                  <tr><td colSpan="4" className="px-6 py-10 text-center text-gray-400">No Classrooms found. Adjust your search or target numbers above.</td></tr>
                ) : (
                  filteredRooms.map((room) => (
                    <tr key={room._id} className="group hover:bg-indigo-50/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-800 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse"></span>
                          {room.roomNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 font-bold rounded-lg text-xs">
                          {room.capacity} seats
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs uppercase font-bold text-indigo-600/80">
                        {room.roomType}
                      </td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button 
                          onClick={() => openEditRoom(room)}
                          className="p-1 text-gray-400 hover:text-indigo-600 transition-colors cursor-pointer"
                        >
                          <FiEdit2 size={15} />
                        </button>
                        <button 
                          onClick={() => handleRoomDelete(room._id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Lab Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Capacity</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Lab Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Supported Subjects</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Equipment</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-400 animate-pulse">Loading laboratories...</td></tr>
                ) : filteredLabs.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-400">No Laboratories found. Adjust your search or target numbers above.</td></tr>
                ) : (
                  filteredLabs.map((lab) => (
                    <tr key={lab._id} className="group hover:bg-teal-50/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-800 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-pulse"></span>
                          {lab.labName}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 font-bold rounded-lg text-xs">
                          {lab.capacity} stations
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs uppercase font-bold text-teal-600/80">
                        {lab.labType}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {lab.supportedSubjects && lab.supportedSubjects.length > 0 ? (
                            lab.supportedSubjects.map(sub => (
                              <span key={sub._id || sub} className="px-2 py-0.5 bg-teal-50 text-teal-700 text-[9px] font-bold rounded border border-teal-100/50 flex items-center gap-1">
                                <FiBookOpen size={10} /> {sub.subjectCode || 'Sub'}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-gray-400 italic">No assigned subjects</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {lab.equipment && lab.equipment.length > 0 ? (
                            lab.equipment.map(eq => (
                              <span key={eq} className="px-2 py-0.5 bg-gray-50 text-gray-600 text-[9px] font-semibold rounded border border-gray-200/50">
                                {eq}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-gray-400">None</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button 
                          onClick={() => openEditLab(lab)}
                          className="p-1 text-gray-400 hover:text-teal-600 transition-colors cursor-pointer"
                        >
                          <FiEdit2 size={15} />
                        </button>
                        <button 
                          onClick={() => handleLabDelete(lab._id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* --- ADD / EDIT CLASSROOM MODAL --- */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full relative animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <FiBox className="text-indigo-600" /> {editingRoom ? 'Modify Classroom' : 'Add New Classroom'}
            </h2>
            <form onSubmit={handleRoomSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">ROOM NUMBER / NAME</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. R103, Seminar-1"
                  className="w-full p-3 bg-gray-50 border border-gray-250 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-semibold"
                  value={roomFormData.roomNumber}
                  onChange={e => setRoomFormData({...roomFormData, roomNumber: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">SEATING CAPACITY</label>
                  <input 
                    type="number" 
                    required
                    min="1" max="200"
                    placeholder="e.g. 60"
                    className="w-full p-3 bg-gray-50 border border-gray-250 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-semibold"
                    value={roomFormData.capacity}
                    onChange={e => setRoomFormData({...roomFormData, capacity: parseInt(e.target.value) || 0})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">ROOM TYPE</label>
                  <select 
                    className="w-full p-3 bg-gray-50 border border-gray-250 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-semibold"
                    value={roomFormData.roomType}
                    onChange={e => setRoomFormData({...roomFormData, roomType: e.target.value})}
                  >
                    <option value="lecture">Lecture</option>
                    <option value="seminar">Seminar</option>
                    <option value="tutorial">Tutorial</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-250 rounded-xl text-xs font-bold text-gray-600 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 cursor-pointer"
                >
                  {editingRoom ? 'Save Changes' : 'Create Classroom'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD / EDIT LABORATORY MODAL --- */}
      {isLabModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 max-w-lg w-full relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <FiActivity className="text-teal-600" /> {editingLab ? 'Modify Laboratory' : 'Add New Laboratory'}
            </h2>
            <form onSubmit={handleLabSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">LABORATORY NAME</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. CS Lab 2, Physics Lab"
                  className="w-full p-3 bg-gray-50 border border-gray-250 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all font-semibold"
                  value={labFormData.labName}
                  onChange={e => setLabFormData({...labFormData, labName: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">STATION CAPACITY</label>
                  <input 
                    type="number" 
                    required
                    min="1" max="100"
                    placeholder="e.g. 30"
                    className="w-full p-3 bg-gray-50 border border-gray-250 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all font-semibold"
                    value={labFormData.capacity}
                    onChange={e => setLabFormData({...labFormData, capacity: parseInt(e.target.value) || 0})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">LAB TYPE (SUBJECT FOCUS)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. computer, chemistry"
                    className="w-full p-3 bg-gray-50 border border-gray-250 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all font-semibold"
                    value={labFormData.labType}
                    onChange={e => setLabFormData({...labFormData, labType: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">EQUIPMENT & RESOURCES (COMMA SEPARATED)</label>
                <input 
                  type="text" 
                  placeholder="e.g. PCs, Laser, Reagents, Titration Kits"
                  className="w-full p-3 bg-gray-50 border border-gray-250 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all font-semibold"
                  value={labFormData.equipmentInput}
                  onChange={e => setLabFormData({...labFormData, equipmentInput: e.target.value})}
                />
                <p className="text-[10px] text-gray-400 mt-1">Separate specific physical resources with commas.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">MAPPED CURRICULUM SUBJECTS (LAB SESSIONS)</label>
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 max-h-[160px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {subjects.length === 0 ? (
                    <p className="text-xs text-gray-400 col-span-2 text-center py-4">No curriculum subjects available</p>
                  ) : (
                    subjects.map((sub) => {
                      const isChecked = labFormData.supportedSubjects.includes(sub._id);
                      return (
                        <div 
                          key={sub._id}
                          onClick={() => handleLabSubjectToggle(sub._id)}
                          className={`p-2 rounded-xl border text-[11px] font-bold cursor-pointer transition-all flex items-center justify-between ${
                            isChecked 
                              ? 'bg-teal-50 border-teal-200 text-teal-700' 
                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <div className="truncate pr-1">
                            <p className="truncate">{sub.subjectName}</p>
                            <p className="text-[9px] text-gray-400 font-semibold">{sub.subjectCode}</p>
                          </div>
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[8px] font-bold ${
                            isChecked ? 'bg-teal-500 border-teal-500 text-white' : 'border-gray-300 bg-white'
                          }`}>
                            {isChecked && '✓'}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setIsLabModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-250 rounded-xl text-xs font-bold text-gray-600 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-750 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-100 cursor-pointer"
                >
                  {editingLab ? 'Save Changes' : 'Create Laboratory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Infrastructure;
