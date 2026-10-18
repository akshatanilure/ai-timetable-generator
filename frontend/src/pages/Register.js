import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiUser, FiAlertCircle, FiBriefcase, FiLayers, FiGrid, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Register = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialRole = queryParams.get('role');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: initialRole && ['teacher', 'student', 'admin'].includes(initialRole) ? initialRole : 'student',
    department: 'Computer Science',
    semester: '1',
    division: 'A',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const roleParam = new URLSearchParams(location.search).get('role');
    if (roleParam && ['teacher', 'student', 'admin'].includes(roleParam)) {
      setFormData(prev => ({ ...prev, role: roleParam }));
    }
  }, [location.search]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      const msg = 'Password must be at least 6 characters long';
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Creating your account...');
    try {
      const resData = await register(formData);
      toast.success('Registration successful! Welcome.', { id: toastId });
      const actualRole = resData?.role || formData.role;
      if (actualRole === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (actualRole === 'teacher') {
        navigate('/teacher/dashboard', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Registration failed. Please try again.';
      setError(errMsg);
      toast.error(errMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 px-4 py-12 relative overflow-hidden font-sans">
      {/* Ambient background blur accents */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-cyan-400/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-violet-500/15 blur-3xl pointer-events-none" />

      {/* Register Card */}
      <div className="max-w-md w-full space-y-8 bg-white/95 backdrop-blur-md p-8 sm:p-10 rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 relative z-10">
        <div>
          <Link to="/" className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700 mb-6 transition-colors">
            <FiArrowLeft className="mr-2" /> Back to Home
          </Link>
          <h2 className="text-center text-4xl font-extrabold text-slate-900 tracking-tight">
            Create account
          </h2>
          <p className="mt-3 text-center text-base text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
              Sign in here
            </Link>
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 flex items-center rounded-xl text-red-700 shadow-sm">
            <FiAlertCircle className="text-red-500 mr-3 flex-shrink-0" size={20} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="relative">
              <FiUser className="absolute left-4 top-4 text-slate-400" size={18} />
              <input
                name="name"
                type="text"
                required
                className="appearance-none rounded-xl relative block w-full px-12 py-3.5 bg-slate-50/80 border border-slate-200 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all text-base shadow-sm"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="relative">
              <FiMail className="absolute left-4 top-4 text-slate-400" size={18} />
              <input
                name="email"
                type="email"
                required
                className="appearance-none rounded-xl relative block w-full px-12 py-3.5 bg-slate-50/80 border border-slate-200 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all text-base shadow-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="relative">
              <FiLock className="absolute left-4 top-4 text-slate-400" size={18} />
              <input
                name="password"
                type="password"
                required
                minLength={6}
                className="appearance-none rounded-xl relative block w-full px-12 py-3.5 bg-slate-50/80 border border-slate-200 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all text-base shadow-sm"
                placeholder="Password (min 6 chars)"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div className="relative">
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="appearance-none rounded-xl relative block w-full px-4 py-3.5 bg-slate-50/80 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all text-base shadow-sm cursor-pointer"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {formData.role === 'teacher' && (
              <div className="relative">
                <FiBriefcase className="absolute left-4 top-4 text-slate-400" size={18} />
                <input
                  name="department"
                  type="text"
                  required
                  className="appearance-none rounded-xl relative block w-full px-12 py-3.5 bg-slate-50/80 border border-slate-200 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all text-base shadow-sm"
                  placeholder="Department (e.g. Computer Science)"
                  value={formData.department}
                  onChange={handleChange}
                />
              </div>
            )}

            {formData.role === 'student' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <FiLayers className="absolute left-4 top-4 text-slate-400" size={18} />
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    className="appearance-none rounded-xl relative block w-full pl-12 pr-4 py-3.5 bg-slate-50/80 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all text-base shadow-sm cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>
                        Sem {sem}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <FiGrid className="absolute left-4 top-4 text-slate-400" size={18} />
                  <select
                    name="division"
                    value={formData.division}
                    onChange={handleChange}
                    className="appearance-none rounded-xl relative block w-full pl-12 pr-4 py-3.5 bg-slate-50/80 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all text-base shadow-sm cursor-pointer"
                  >
                    {['A', 'B', 'C', 'D'].map((div) => (
                      <option key={div} value={div}>
                        Div {div}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-base font-bold rounded-xl text-white bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 hover:from-sky-500 hover:via-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all ${
                loading ? 'opacity-70 cursor-not-allowed scale-95' : 'hover:scale-[1.01]'
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </div>
              ) : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
