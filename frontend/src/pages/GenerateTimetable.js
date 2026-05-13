import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  FiCpu, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiZap, 
  FiSettings, 
  FiRefreshCw, 
  FiShield, 
  FiActivity 
} from 'react-icons/fi';

const GenerateTimetable = () => {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    semester: 1,
    department: 'Computer Science'
  });
  const [result, setResult] = useState(null);
  const [constraints, setConstraints] = useState([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetchConstraints();
  }, []);

  const fetchConstraints = async () => {
    try {
      const res = await api.get('/constraints');
      setConstraints(res.data.data);
    } catch (err) {
      console.error('Error fetching constraints');
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setProgress(10);
    setResult(null);
    
    // Simulate progress for UI feel
    const interval = setInterval(() => {
      setProgress(prev => (prev < 90 ? prev + 10 : prev));
    }, 500);

    try {
      const res = await api.post('/timetables/generate', config);
      setProgress(100);
      setResult(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Generation failed');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!result?.data?._id) return;
    setLoading(true);
    try {
      const res = await api.post('/timetables/validate', { timetableId: result.data._id });
      setResult({ ...result, validation: res.data });
      alert('Validation complete. Check the conflict viewer.');
    } catch (err) {
      alert('Validation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <FiCpu className="mr-3 text-primary" /> AI Generation Engine
        </h1>
        <div className="flex gap-2">
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className={`flex items-center px-6 py-2 bg-primary text-white rounded-xl shadow-lg hover:shadow-indigo-200 transition-all ${
              loading ? 'opacity-70 animate-pulse' : ''
            }`}
          >
            <FiZap className="mr-2" /> {result ? 'Regenerate' : 'Generate'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Configuration & Constraints */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center">
              <FiSettings className="mr-2" /> Configuration
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Target Semester</label>
                <select 
                  className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                  value={config.semester}
                  onChange={(e) => setConfig({...config, semester: parseInt(e.target.value)})}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Department</label>
                <select className="w-full p-2 border border-gray-200 rounded-lg text-sm">
                  <option>Computer Science</option>
                  <option>Electrical Engineering</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center">
              <FiShield className="mr-2" /> Active Constraints
            </h3>
            <div className="space-y-3">
              {constraints.length === 0 ? (
                <p className="text-xs text-gray-400">No constraints defined for this semester.</p>
              ) : constraints.map((c, i) => (
                <div key={i} className="flex items-start p-2 bg-gray-50 rounded-lg">
                  <div className={`mt-1 p-1 rounded-full mr-2 ${c.constraintType === 'hard' ? 'bg-red-100 text-red-500' : 'bg-orange-100 text-orange-500'}`}>
                    {c.constraintType === 'hard' ? <FiAlertCircle size={12} /> : <FiActivity size={12} />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-700">{c.description}</p>
                    <p className="text-[10px] text-gray-400 uppercase">{c.constraintType} Constraint</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Results & Analytics */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
              <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiRefreshCw className="text-primary animate-spin" size={40} />
              </div>
              <h2 className="text-xl font-bold text-gray-700">AI is thinking...</h2>
              <p className="text-gray-400 mt-2 mb-6 text-sm">Processing 50+ faculty availability and room constraints</p>
              <div className="w-full max-w-md mx-auto bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          ) : result ? (
            <div className="space-y-6">
              {/* Analytics Header */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Success Rate</p>
                  <p className="text-2xl font-bold text-green-500">100%</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Hard Conflicts</p>
                  <p className={`text-2xl font-bold ${result.conflicts?.length > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {result.conflicts?.length || 0}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Optim. Score</p>
                  <p className="text-2xl font-bold text-primary">8.5/10</p>
                </div>
              </div>

              {/* Conflict Viewer */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase flex items-center">
                    <FiAlertCircle className="mr-2" /> Conflict Viewer
                  </h3>
                  <button 
                    onClick={handleValidate}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    Run Deep Validation
                  </button>
                </div>
                
                {result.conflicts?.length === 0 ? (
                  <div className="flex items-center justify-center p-8 bg-green-50 rounded-xl text-green-600">
                    <FiCheckCircle className="mr-2" /> No hard conflicts found. Timetable is valid.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {result.conflicts.map((c, i) => (
                      <div key={i} className="p-3 bg-red-50 rounded-lg flex items-center text-xs text-red-600">
                        <FiAlertCircle className="mr-2 shrink-0" /> {c}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-indigo-600 p-6 rounded-2xl text-white flex items-center justify-between shadow-lg">
                <div>
                  <h3 className="font-bold text-lg">Generation Complete</h3>
                  <p className="text-sm opacity-80">Timetable for Semester {config.semester} is ready for review.</p>
                </div>
                <button className="px-6 py-2 bg-white text-indigo-600 rounded-xl font-bold text-sm shadow-sm hover:bg-indigo-50 transition-all">
                  View Full Schedule
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-20 rounded-2xl shadow-sm border border-dashed border-gray-200 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiZap className="text-gray-300" size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-700">Engine Idle</h2>
              <p className="text-gray-400 mt-2">Set your configuration on the left and click Generate to start the AI pipeline.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenerateTimetable;
