import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Login = () => {
  const { role: urlRole } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const role = urlRole || queryParams.get('role') || 'student';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (role) {
      toast(`Logging in as ${role.charAt(0).toUpperCase() + role.slice(1)}`, {
        icon: '🔑',
      });
    }
  }, [role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading('Authenticating...');
    try {
      await login(email, password);
      toast.success(`Welcome back, ${role}!`, { id: toastId });
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid credentials. Please try again.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const getRoleTitle = () => {
    switch(role) {
      case 'admin': return 'Administrator Login';
      case 'teacher': return 'Teacher Login';
      case 'student': return 'Student Login';
      default: return 'Login';
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950 px-4">
      <div className="max-w-md w-full space-y-8 bg-gray-900 p-10 rounded-3xl shadow-2xl border border-gray-800">
        <div>
          <Link to="/" className="flex items-center text-teal-500 hover:text-teal-400 mb-6 transition-colors">
            <FiArrowLeft className="mr-2" /> Back to Home
          </Link>
          <h2 className="text-center text-4xl font-extrabold text-white tracking-tight">
            {getRoleTitle()}
          </h2>
          <p className="mt-4 text-center text-sm text-gray-400">
            Enter your credentials to access your portal
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="relative">
              <FiMail className="absolute left-4 top-4 text-gray-500" />
              <input
                type="email"
                required
                className="appearance-none rounded-xl relative block w-full px-12 py-4 bg-gray-800 border border-gray-700 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <FiLock className="absolute left-4 top-4 text-gray-500" />
              <input
                type="password"
                required
                className="appearance-none rounded-xl relative block w-full px-12 py-4 bg-gray-800 border border-gray-700 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-700 rounded bg-gray-800"
              />
              <label htmlFor="remember-me" className="ml-2 block text-gray-400">
                Remember me
              </label>
            </div>
            <Link to="/forgot-password" stroke="currentColor" className="font-medium text-teal-500 hover:text-teal-400 transition-colors">
              Forgot password?
            </Link>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-xl text-black bg-teal-500 hover:bg-teal-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all ${
                loading ? 'opacity-70 cursor-not-allowed scale-95' : 'hover:scale-[1.02]'
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </div>
              ) : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-teal-500 hover:text-teal-400 transition-colors">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
