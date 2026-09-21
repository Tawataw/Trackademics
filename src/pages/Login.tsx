import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { GraduationCap, ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';

export function Login() {
  const { user, isAdmin, signInWithGoogle, adminLogin } = useAuth();
  const navigate = useNavigate();
  
  const [view, setView] = useState<'options' | 'admin'>('options');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (user) {
    if (isAdmin) return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        setError('Google sign-in was cancelled. Please try again.');
      } else if (err?.code === 'auth/network-request-failed') {
        setError('Network error: Unable to reach Google. Check your internet connection.');
      } else {
        setError(err?.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const success = await adminLogin(password);
      if (success) {
        navigate('/admin');
      } else {
        setError('Invalid admin password');
      }
    } catch (err) {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] dark:bg-[#0f172a] flex items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-2xl flex flex-col items-center">
        
        <div className="w-16 h-16 bg-gradient-to-tr from-brand-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg mb-6 shadow-brand-500/10">
          <GraduationCap className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Trackademics</h1>
        <p className="text-white/60 text-center mb-10 max-w-md text-sm sm:text-base">
          Academic Management Ecosystem for SSC to Admission students. Calculate your GPA, track your syllabus progress, and store your academic records in the cloud.
        </p>
        
        {view === 'options' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-xl">
            {/* Student Google Login Option */}
            <div className="bg-white/5 border border-white/10 p-8 rounded-2xl flex flex-col items-center text-center hover:bg-white/[0.07] hover:border-white/20 transition-all cursor-pointer group shadow-xl relative overflow-hidden">
              <div className="w-14 h-14 bg-brand-500/20 text-brand-400 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Student Login</h2>
              <p className="text-sm text-white/50 mb-6 flex-1">
                Sign in with Google to sync GPA, marks, syllabus, and study history to Firestore.
              </p>
              
              <button 
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white text-[#0f172a] font-semibold py-3 px-4 rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-3 shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign in with Google</span>
                  </>
                )}
              </button>
            </div>

            {/* Admin Login Option */}
            <div 
              className="bg-white/5 border border-white/10 p-8 rounded-2xl flex flex-col items-center text-center hover:bg-white/[0.07] hover:border-white/20 transition-all cursor-pointer group shadow-xl relative overflow-hidden" 
              onClick={() => setView('admin')}
            >
              <div className="w-14 h-14 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Admin Login</h2>
              <p className="text-sm text-white/50 mb-6 flex-1">
                Access the administrative dashboard with master password authentication.
              </p>
              <button 
                className="w-full bg-red-500/20 text-red-400 border border-red-500/30 font-semibold py-3 px-4 rounded-xl group-hover:bg-red-500/30 transition-all"
              >
                Enter Admin Mode
              </button>
            </div>
          </div>
        )}

        {view === 'admin' && (
          <div className="bg-white/5 border border-white/10 p-8 rounded-2xl max-w-md w-full flex flex-col items-center shadow-xl">
            <div className="w-16 h-16 bg-gradient-to-tr from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg mb-6">
              <ShieldAlert className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Admin Portal</h1>
            <p className="text-white/60 text-center mb-6 text-sm">
              Enter the administrative password to access the secure dashboard.
            </p>
            
            <form onSubmit={handleAdminSubmit} className="w-full flex flex-col gap-4">
              <div>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Admin Password"
                  className="w-full bg-[#1e293b] border border-white/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-brand-500 text-sm"
                  required
                />
              </div>
              {error && <div className="text-red-400 text-sm text-center font-medium">{error}</div>}
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-red-500 text-white font-bold py-3 px-4 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 text-sm"
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
            </form>
            <button 
              onClick={() => { setView('options'); setError(''); }}
              className="mt-6 text-sm text-white/50 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Login Options
            </button>
          </div>
        )}

        {error && view === 'options' && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center max-w-md w-full">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
