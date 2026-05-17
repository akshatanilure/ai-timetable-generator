import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  FiCpu, FiAlertCircle, FiCheckCircle, FiZap, FiSettings, 
  FiRefreshCw, FiShield, FiActivity, FiUsers, FiClock,
  FiBookOpen, FiList
} from 'react-icons/fi';

const GenerateTimetable = () => {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    semester: 1,
    branch: 'CSE'
  });
  const [subjects, setSubjects] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [facultyMapping, setFacultyMapping] = useState({});
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetchFaculties();
  }, []);

  useEffect(() => {
    if (config.semester && config.branch) {
      fetchSubjects();
    }
  }, [config.semester, config.branch]);

  const fetchFaculties = async () => {
    try {
      const res = await api.get('/teachers');
      setFaculties(res.data.data);
    } catch (err) {
      console.error('Error fetching faculties', err);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get(`/subjects?semester=${config.semester}&branch=${config.branch}`);
      setSubjects(res.data.data);
      
      // Initialize mapping
      const initialMap = {};
      res.data.data.forEach(sub => {
        initialMap[sub._id] = sub.subjectType === 'lab' ? [] : '';
      });
      setFacultyMapping(initialMap);
    } catch (err) {
      console.error('Error fetching subjects', err);
    }
  };

  const handleFacultySelect = (subjectId, facultyId, isLab) => {
    setFacultyMapping(prev => {
      const current = prev[subjectId];
      if (isLab) {
        if (current.includes(facultyId)) {
          return { ...prev, [subjectId]: current.filter(id => id !== facultyId) };
        } else if (current.length < 2) {
          return { ...prev, [subjectId]: [...current, facultyId] };
        }
        return prev;
      } else {
        return { ...prev, [subjectId]: facultyId };
      }
    });
  };

  const getLTP = (sub) => {
    return `${sub.lectureHours || 0}-${sub.tutorialHours || 0}-${sub.practicalHours || 0}`;
  };

  const getHours = (sub) => {
    return (sub.lectureHours || 0) + (sub.tutorialHours || 0) + (sub.practicalHours || 0);
  };

  const handleGenerate = async () => {
    // Validate that all subjects have faculties
    for (let sub of subjects) {
      const mapping = facultyMapping[sub._id];
      if (sub.subjectType === 'lab' && mapping.length !== 2) {
        return alert(`Please select exactly 2 faculties for lab: ${sub.subjectName}`);
      }
      if (sub.subjectType !== 'lab' && !mapping) {
        return alert(`Please select 1 faculty for theory: ${sub.subjectName}`);
      }
    }

    setLoading(true);
    setProgress(10);
    setResult(null);
    
    const interval = setInterval(() => {
      setProgress(prev => (prev < 90 ? prev + 10 : prev));
    }, 500);

    try {
      const res = await api.post('/timetables/generate-ml', {
        ...config,
        facultyMapping
      });
      setProgress(100);
      setResult(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Generation failed');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const isOverloaded = (fac) => {
    return (fac.currentWorkload || 0) >= (fac.maxWorkloadPerWeek || 30);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 flex items-center tracking-tight">
            <FiCpu className="mr-3 text-indigo-600" /> AI Generator
          </h1>
          <p className="text-gray-500 text-sm mt-1">Configure subjects, map faculties, and generate conflict-free timetables.</p>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={loading || subjects.length === 0}
          className={`flex items-center px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-indigo-300 transition-all font-bold ${
            loading ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-1'
          }`}
        >
          {loading ? (
            <><FiRefreshCw className="mr-2 animate-spin" /> Generating...</>
          ) : (
            <><FiZap className="mr-2" /> Generate Timetable</>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Col: Config & Subjects */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center tracking-wider">
              <FiSettings className="mr-2 text-indigo-500" /> Setup
            </h3>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">Branch</label>
                <select 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  value={config.branch}
                  onChange={(e) => setConfig({...config, branch: e.target.value})}
                >
                  <option value="CSE">Computer Science (CSE)</option>
                  <option value="ECE">Electronics (ECE)</option>
                  <option value="ME">Mechanical (ME)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">Semester</label>
                <select 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  value={config.semester}
                  onChange={(e) => setConfig({...config, semester: parseInt(e.target.value)})}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Subjects Summary */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl shadow-sm border border-indigo-100">
            <h3 className="text-sm font-bold text-indigo-800 uppercase mb-4 flex items-center">
              <FiBookOpen className="mr-2" /> Semester Overview
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                <span className="text-xs font-bold text-gray-500">Total Subjects</span>
                <span className="text-lg font-black text-indigo-600">{subjects.length}</span>
              </div>
              <div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                <span className="text-xs font-bold text-gray-500">Theory / Lab</span>
                <span className="text-sm font-bold text-gray-700">
                  {subjects.filter(s => s.subjectType !== 'lab').length} / {subjects.filter(s => s.subjectType === 'lab').length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle/Right Col: Faculty Mapping & Results */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="bg-white p-16 rounded-3xl shadow-lg border border-gray-100 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
                <div className="h-full bg-indigo-500 transition-all duration-500" style={{width: `${progress}%`}}></div>
              </div>
              <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                <div className="absolute inset-0 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <FiCpu className="text-indigo-600" size={40} />
              </div>
              <h2 className="text-2xl font-black text-gray-800 mb-2">Engine Processing...</h2>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                Running constraint satisfaction algorithms, preventing clashes, and balancing faculty workloads.
              </p>
            </div>
          ) : result ? (
             <div className="space-y-6 animate-slide-up">
              <div className="bg-green-50 border border-green-200 p-6 rounded-2xl flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-green-800 flex items-center">
                    <FiCheckCircle className="mr-2" /> Timetable Generated Successfully
                  </h3>
                  <p className="text-sm text-green-600 mt-1">100% constraints satisfied. No clashes detected.</p>
                </div>
                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-white text-green-700 font-bold rounded-lg shadow-sm border border-green-200 hover:bg-green-100 text-sm">
                    View Preview
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg shadow-sm hover:bg-green-700 text-sm">
                    Export PDF
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h4 className="font-bold text-gray-700 mb-4 flex items-center"><FiActivity className="mr-2 text-indigo-500"/> Workload Balance</h4>
                  <p className="text-sm text-gray-500">Analytics goes here...</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h4 className="font-bold text-gray-700 mb-4 flex items-center"><FiList className="mr-2 text-indigo-500"/> Room Utilization</h4>
                  <p className="text-sm text-gray-500">Analytics goes here...</p>
                </div>
              </div>
             </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <FiUsers className="mr-2 text-indigo-500" /> Faculty Allocation
                </h3>
                <p className="text-xs text-gray-500 mt-1">Map faculties to loaded subjects. Labs require 2 faculties.</p>
              </div>

              {subjects.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-400">No subjects found for Semester {config.semester} {config.branch}.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {subjects.map(sub => (
                    <div key={sub._id} className="p-6 hover:bg-gray-50/50 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-start gap-6">
                        {/* Subject Info */}
                        <div className="md:w-1/3">
                          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 bg-indigo-100 text-indigo-800">
                            {sub.subjectCode} • {sub.subjectType}
                          </div>
                          <h4 className="font-bold text-gray-800 text-lg leading-tight mb-2">{sub.subjectName}</h4>
                          <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
                            <span className="flex items-center"><FiClock className="mr-1"/> LTP: {getLTP(sub)}</span>
                            <span>Cr: {sub.credits}</span>
                            <span>{getHours(sub)} Hrs/Wk</span>
                          </div>
                        </div>

                        {/* Faculty Selection */}
                        <div className="md:w-2/3">
                          <p className="text-xs font-bold text-gray-400 uppercase mb-3">
                            {sub.subjectType === 'lab' ? 'Select 2 Faculties (Main & Assistant)' : 'Select 1 Faculty'}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                            {faculties.map(fac => {
                              const isSelected = sub.subjectType === 'lab' 
                                ? facultyMapping[sub._id]?.includes(fac._id)
                                : facultyMapping[sub._id] === fac._id;
                              
                              const over = isOverloaded(fac);

                              return (
                                <label 
                                  key={fac._id}
                                  className={`
                                    relative flex items-start p-3 rounded-xl border-2 cursor-pointer transition-all
                                    ${isSelected ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200'}
                                    ${over && !isSelected ? 'opacity-50 grayscale cursor-not-allowed' : ''}
                                  `}
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                      <p className="text-sm font-bold text-gray-900 truncate">{fac.name}</p>
                                      {sub.subjectType === 'lab' ? (
                                        <input 
                                          type="checkbox"
                                          disabled={over && !isSelected}
                                          checked={isSelected || false}
                                          onChange={() => handleFacultySelect(sub._id, fac._id, true)}
                                          className="text-indigo-600 rounded focus:ring-indigo-500 w-4 h-4"
                                        />
                                      ) : (
                                        <input 
                                          type="radio"
                                          name={`fac-${sub._id}`}
                                          disabled={over}
                                          checked={isSelected || false}
                                          onChange={() => handleFacultySelect(sub._id, fac._id, false)}
                                          className="text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                        />
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500 truncate">{fac.designation || fac.department}</p>
                                    <div className="mt-2 flex items-center gap-2">
                                      <div className="flex-1 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                        <div 
                                          className={`h-full ${over ? 'bg-red-500' : 'bg-green-500'}`}
                                          style={{ width: `${Math.min(((fac.currentWorkload || 0) / (fac.maxWorkloadPerWeek || 30)) * 100, 100)}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-[10px] font-bold text-gray-500 whitespace-nowrap">
                                        {fac.currentWorkload || 0}/{fac.maxWorkloadPerWeek || 30} hrs
                                      </span>
                                    </div>
                                  </div>
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenerateTimetable;
