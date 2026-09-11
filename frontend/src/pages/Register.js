import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiUser, FiAlertCircle, FiBriefcase, FiLayers, FiGrid } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    department: 'Computer Science',
    semester: '1',
    division: 'A',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

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
      await register(formData);
      toast.success('Registration successful! Welcome.', { id: toastId });
      navigate('/dashboard');
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Registration failed. Please try again.';
      setError(errMsg);
      toast.error(errMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950 px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-gray-900 p-10 rounded-3xl shadow-2xl border border-gray-800">
        <div>
          <h2 className="mt-2 text-center text-4xl font-extrabold text-white tracking-tight">
            Create account
          </h2>
          <p className="mt-3 text-center text-base text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-teal-500 hover:text-teal-400 transition-colors">
              Sign in here
            </Link>
          </p>
        </div>
        
        {error && (
          <div className="bg-red-950 border-l-4 border-red-500 p-4 flex items-center rounded-xl text-red-200">
            <FiAlertCircle className="text-red-400 mr-3 flex-shrink-0" size={20} />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="relative">
              <FiUser className="absolute left-4 top-4.5 text-gray-500" size={18} />
              <input
                name="name"
                type="text"
                required
                className="appearance-none rounded-xl relative block w-full px-12 py-4 bg-gray-800 border border-gray-700 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-base"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="relative">
              <FiMail className="absolute left-4 top-4.5 text-gray-500" size={18} />
              <input
                name="email"
                type="email"
                required
                className="appearance-none rounded-xl relative block w-full px-12 py-4 bg-gray-800 border border-gray-700 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-base"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="relative">
              <FiLock className="absolute left-4 top-4.5 text-gray-500" size={18} />
              <input
                name="password"
                type="password"
                required
                minLength={6}
                className="appearance-none rounded-xl relative block w-full px-12 py-4 bg-gray-800 border border-gray-700 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-base"
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
                className="appearance-none rounded-xl relative block w-full px-4 py-4 bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-base"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {formData.role === 'teacher' && (
              <div className="relative">
                <FiBriefcase className="absolute left-4 top-4.5 text-gray-500" size={18} />
                <input
                  name="department"
                  type="text"
                  required
                  className="appearance-none rounded-xl relative block w-full px-12 py-4 bg-gray-800 border border-gray-700 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-base"
                  placeholder="Department (e.g. Computer Science)"
                  value={formData.department}
                  onChange={handleChange}
                />
              </div>
            )}

            {formData.role === 'student' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <FiLayers className="absolute left-4 top-4.5 text-gray-500" size={18} />
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    className="appearance-none rounded-xl relative block w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-base"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>
                        Sem {sem}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <FiGrid className="absolute left-4 top-4.5 text-gray-500" size={18} />
                  <select
                    name="division"
                    value={formData.division}
                    onChange={handleChange}
                    className="appearance-none rounded-xl relative block w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-base"
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
              className={`group relative w-full flex justify-center py-4 px-4 border border-transparent text-base font-extrabold rounded-xl text-black bg-teal-500 hover:bg-teal-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all ${
                loading ? 'opacity-70 cursor-not-allowed scale-95' : 'hover:scale-[1.02]'
              }`}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
