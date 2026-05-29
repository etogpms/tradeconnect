import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { isDemoMode } from '../../lib/supabaseClient';
import { Wrench, Lock, Mail, User, Phone, CheckCircle, AlertTriangle } from 'lucide-react';

// =========================================================================
// 1. LOGIN PAGE
// =========================================================================
export const LoginPage: React.FC = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn(email);
    setLoading(false);

    if (result.success) {
      // We route dynamically based on current user context
      setTimeout(() => {
        const storedUser = JSON.parse(localStorage.getItem('tc_current_user') || 'null');
        if (storedUser) {
          if (storedUser.role === 'client') navigate('/client');
          else if (storedUser.role === 'tradie') navigate('/tradie');
          else navigate('/admin');
        } else {
          navigate('/');
        }
      }, 200);
    } else {
      setError(result.error || 'Login failed. Verify credentials.');
    }
  };

  const handleQuickLogin = async (demoEmail: string, role: string) => {
    setError('');
    setLoading(true);
    const result = await signIn(demoEmail);
    setLoading(false);

    if (result.success) {
      if (role === 'client') navigate('/client');
      else if (role === 'tradie') navigate('/tradie');
      else navigate('/admin');
    } else {
      setError('Failed to trigger quick login');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <Wrench className="w-8 h-8 text-orange-500" />
            <span className="font-extrabold text-2xl tracking-tight text-white">
              Trade<span className="text-orange-500">Connect</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold text-zinc-100">Welcome back</h2>
          <p className="text-xs text-zinc-400 mt-1">Sign in to your client or tradie account</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                required
                placeholder="you@domain.com.au"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">Password</label>
              <Link to="/forgot-password" className="text-[10px] font-semibold text-orange-400 hover:underline">Forgot password?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                required
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 rounded-lg text-sm transition-all cursor-pointer shadow-md shadow-orange-600/10"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Quick Sandbox Login for Demo Mode */}
        {isDemoMode && (
          <div className="pt-4 border-t border-zinc-800 space-y-3 bg-zinc-900">
            <span className="block text-[10px] text-zinc-500 font-bold uppercase text-center tracking-wider">
              Quick Access Demo Sandbox
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleQuickLogin('client@tradeconnect.com.au', 'client')}
                className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 text-[10px] font-bold py-2 rounded text-zinc-300 cursor-pointer"
              >
                Client Dave
              </button>
              <button
                onClick={() => handleQuickLogin('tradie@tradeconnect.com.au', 'tradie')}
                className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 text-[10px] font-bold py-2 rounded text-zinc-300 cursor-pointer"
              >
                Tradie Steve
              </button>
              <button
                onClick={() => handleQuickLogin('admin@tradeconnect.com.au', 'admin')}
                className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 text-[10px] font-bold py-2 rounded text-zinc-300 cursor-pointer"
              >
                Admin Alice
              </button>
            </div>
          </div>
        )}

        <div className="text-center text-xs text-zinc-400">
          New to the platform?{' '}
          <Link to="/register" className="text-orange-400 font-bold hover:underline">Create an account</Link>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 2. REGISTER PAGE
// =========================================================================
export const RegisterPage: React.FC = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [role, setRole] = useState<'client' | 'tradie'>((searchParams.get('role') as any) || 'client');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const result = await signUp(email, fullName, role, mobile);
    setLoading(false);

    if (result.success) {
      // Redirect to onboarding/setup based on role
      if (role === 'client') {
        navigate('/client');
      } else {
        navigate('/tradie/profile'); // redirect tradie to profile onboarding
      }
    } else {
      setError(result.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <Wrench className="w-8 h-8 text-orange-500" />
            <span className="font-extrabold text-2xl tracking-tight text-white">
              Trade<span className="text-orange-500">Connect</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold text-zinc-100">Create account</h2>
          <p className="text-xs text-zinc-400 mt-1">Join the TradeConnect two-sided platform</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          <button
            type="button"
            onClick={() => setRole('client')}
            className={`py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
              role === 'client' 
                ? 'bg-orange-600 text-white shadow' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            I need services (Client)
          </button>
          <button
            type="button"
            onClick={() => setRole('tradie')}
            className={`py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
              role === 'tradie' 
                ? 'bg-orange-600 text-white shadow' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            I provide services (Tradie)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Full Name / Business Owner</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                required
                placeholder="Steve Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="tel"
                required
                placeholder="0412 345 678"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                required
                placeholder="name@domain.com.au"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                required
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                required
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 rounded-lg text-sm transition-all cursor-pointer shadow-md shadow-orange-600/10"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="text-center text-xs text-zinc-400">
          Already registered?{' '}
          <Link to="/login" className="text-orange-400 font-bold hover:underline">Log in here</Link>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 3. FORGOT PASSWORD PAGE
// =========================================================================
export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <Wrench className="w-8 h-8 text-orange-500" />
            <span className="font-extrabold text-2xl tracking-tight text-white">
              Trade<span className="text-orange-500">Connect</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold text-zinc-100">Reset password</h2>
          <p className="text-xs text-zinc-400 mt-1">We will email you a recovery link</p>
        </div>

        {submitted ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white">Email Sent!</h4>
            <p className="text-zinc-400 text-xs leading-relaxed">
              An email has been sent to <strong>{email}</strong> containing instructions to reset your account password.
            </p>
            <Link to="/login" className="inline-block text-xs font-bold text-orange-400 hover:underline pt-2">Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  required
                  placeholder="you@domain.com.au"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3 py-2 text-sm text-zinc-200 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 rounded-lg text-sm transition-all cursor-pointer shadow-md shadow-orange-600/10"
            >
              Request Link
            </button>
            <div className="text-center text-xs">
              <Link to="/login" className="text-zinc-400 hover:text-zinc-200">Cancel and go back</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
