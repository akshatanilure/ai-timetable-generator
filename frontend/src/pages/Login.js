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
  
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin/dashboard', { replace: true });
      else if (user.role === 'teacher') navigate('/teacher/dashboard', { replace: true });
      else navigate('/student/dashboard', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (role && !user) {
      toast(`Logging in as ${role.charAt(0).toUpperCase() + role.slice(1)}`, {
        icon: '🔑',
      });
    }
  }, [role, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading('Authenticating...');
    try {
      const resData = await login(email, password);
      const actualRole = resData.role;
      toast.success(`Welcome back, ${resData.name || actualRole}!`, { id: toastId });
      if (actualRole === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (actualRole === 'teacher') {
        navigate('/teacher/dashboard', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 px-4 relative overflow-hidden font-sans">
      {/* Ambient background blur accents */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-cyan-400/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-violet-500/15 blur-3xl pointer-events-none" />

      {/* Login Card */}
      <div className="max-w-md w-full space-y-8 bg-white/95 backdrop-blur-md p-8 sm:p-10 rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 relative z-10">
        <div>
          <Link to="/" className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700 mb-6 transition-colors">
            <FiArrowLeft className="mr-2" /> Back to Home
          </Link>
          <h2 className="text-center text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            {getRoleTitle()}
          </h2>
          <p className="mt-3 text-center text-base text-slate-600">
            Enter your credentials to access your portal
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="relative">
              <FiMail className="absolute left-4 top-4 text-slate-400" size={18} />
              <input
                type="email"
                required
                className="appearance-none rounded-xl relative block w-full px-12 py-3.5 bg-slate-50/80 border border-slate-200 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all text-base shadow-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <FiLock className="absolute left-4 top-4 text-slate-400" size={18} />
              <input
                type="password"
                required
                className="appearance-none rounded-xl relative block w-full px-12 py-3.5 bg-slate-50/80 border border-slate-200 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all text-base shadow-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm sm:text-base">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded bg-white cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-slate-600 cursor-pointer">
                Remember me
              </label>
            </div>
            <Link to="/forgot-password" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
              Forgot password?
            </Link>
          </div>

          <div>
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
                  Signing in...
                </div>
              ) : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-slate-600 text-sm sm:text-base">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
