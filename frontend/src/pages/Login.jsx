import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContextInstance';
import { Target, LogIn, ArrowRight } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login');
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-main)' }}>
      {/* Left Side: Branding */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative overflow-hidden bg-slate-900">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-emerald-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-green-500 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-emerald-600 rounded-2xl shadow-xl shadow-emerald-600/20">
              <Target className="h-10 w-10 text-white" />
            </div>
            <span className="text-3xl font-black text-white tracking-tighter">ProjectHub</span>
          </div>
          <h1 className="text-5xl font-black text-white leading-[1.1] mb-6">
            Manage your projects with <span className="text-emerald-400">absolute precision.</span>
          </h1>
          <p className="text-lg leading-relaxed opacity-70 text-white">
            The all-in-one platform for professional teams to plan, track, and collaborate on complex deliverables.
          </p>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-12">
        <div className="max-w-md w-full">
          <div className="lg:hidden flex items-center gap-2 mb-12">
            <Target className="h-8 w-8 text-emerald-600" />
            <span className="text-2xl font-black tracking-tighter" style={{ color: 'var(--text-main)' }}>ProjectHub</span>
          </div>
          
          <div className="mb-10">
            <h2 className="text-3xl font-black mb-2" style={{ color: 'var(--text-main)' }}>Welcome Back</h2>
            <p className="font-medium" style={{ color: 'var(--text-muted)' }}>Enter your credentials to access your workspace.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold rounded-xl animate-shake dark:bg-rose-900/20 dark:border-rose-900/30 dark:text-rose-400">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Email Address</label>
                <input
                  type="email"
                  required
                  className="w-full border-2 border-transparent focus:border-emerald-600 rounded-xl px-4 py-3 transition-all outline-none"
                  style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)' }}
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Password</label>
                <input
                  type="password"
                  required
                  className="w-full border-2 border-transparent focus:border-emerald-600 rounded-xl px-4 py-3 transition-all outline-none"
                  style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm shadow-xl shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Sign In <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-10 text-center font-medium" style={{ color: 'var(--text-muted)' }}>
            New to ProjectHub?{' '}
            <Link to="/register" className="text-emerald-600 font-bold hover:underline underline-offset-4">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
