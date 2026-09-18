cat << 'INNER_EOF' > src/pages/Login.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { GraduationCap, ShieldAlert, User, ArrowLeft } from 'lucide-react';

export function Login() {
  const { user, isAdmin, studentLogin, adminLogin } = useAuth();
  const navigate = useNavigate();
  
  const [view, setView] = useState<'options' | 'student' | 'admin'>('options');
  
  // Admin form state
  const [password, setPassword] = useState('');
  
  // Student form state
  const [name, setName] = useState('');
  const [studentClass, setStudentClass] = useState('Class 11');
  const [group, setGroup] = useState('SCIENCE');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (user) {
    if (isAdmin) return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError('');
    setLoading(true);
    try {
      const success = await studentLogin({ name, class: studentClass, group });
      if (success) {
        navigate('/');
      } else {
        setError('Login failed');
      }
    } catch (err) {
      setError('Login failed');
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
        
        <div className="w-16 h-16 bg-gradient-to-tr from-brand-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg mb-6">
          <GraduationCap className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">HSC Tracker 2.0</h1>
        <p className="text-white/60 text-center mb-10 max-w-md">Calculate your GPA, track your syllabus, and check university eligibility.</p>
        
        {view === 'options' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-xl">
            {/* Student Login Option */}
            <div className="bg-white/5 border border-white/10 p-8 rounded-2xl flex flex-col items-center text-center hover:bg-white/10 transition-colors cursor-pointer group" onClick={() => setView('student')}>
              <div className="w-14 h-14 bg-brand-500/20 text-brand-400 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <User className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Student Login</h2>
              <p className="text-sm text-white/50 mb-6">Set up your academic profile and track your progress.</p>
              <button 
                className="w-full bg-white text-[#0f172a] font-bold py-2.5 px-4 rounded-xl group-hover:bg-gray-100 transition-colors"
              >
                Continue as Student
              </button>
            </div>

            {/* Admin Login Option */}
            <div className="bg-white/5 border border-white/10 p-8 rounded-2xl flex flex-col items-center text-center hover:bg-white/10 transition-colors cursor-pointer group" onClick={() => setView('admin')}>
              <div className="w-14 h-14 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Admin Login</h2>
              <p className="text-sm text-white/50 mb-6">Access the secure dashboard for site administrators.</p>
              <button 
                className="w-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold py-2.5 px-4 rounded-xl group-hover:bg-red-500/30 transition-colors"
              >
                Enter Admin Mode
              </button>
            </div>
          </div>
        )}

        {view === 'student' && (
          <div className="bg-white/5 border border-white/10 p-8 rounded-2xl max-w-md w-full flex flex-col">
             <button onClick={() => setView('options')} className="text-white/50 hover:text-white mb-6 flex items-center gap-2 text-sm w-fit transition-colors">
               <ArrowLeft className="w-4 h-4" /> Back
             </button>
             <h2 className="text-2xl font-bold text-white mb-6">Student Setup</h2>
             <form onSubmit={handleStudentSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Full Name</label>
                <input 
                  required
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-500 focus:outline-none"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Class</label>
                <select 
                  value={studentClass} 
                  onChange={e => setStudentClass(e.target.value)}
                  className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-500 focus:outline-none"
                >
                  <option value="Class 11">Class 11</option>
                  <option value="Class 12">Class 12</option>
                  <option value="HSC Candidate">HSC Candidate</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Group</label>
                <select 
                  value={group} 
                  onChange={e => setGroup(e.target.value)}
                  className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-500 focus:outline-none"
                >
                  <option value="SCIENCE">Science</option>
                  <option value="ARTS">Arts</option>
                  <option value="COMMERCE">Commerce</option>
                </select>
              </div>
              {error && <div className="text-red-400 text-sm font-medium">{error}</div>}
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-brand-500 text-white font-bold py-3 px-4 rounded-xl hover:bg-brand-600 transition-colors mt-2 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Get Started'}
              </button>
            </form>
          </div>
        )}

        {view === 'admin' && (
          <div className="bg-white/5 border border-white/10 p-8 rounded-2xl max-w-md w-full flex flex-col items-center">
            <div className="w-16 h-16 bg-gradient-to-tr from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg mb-6">
              <ShieldAlert className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Admin Portal</h1>
            <p className="text-white/60 text-center mb-6">Enter the administrative password to access the secure dashboard.</p>
            
            <form onSubmit={handleAdminSubmit} className="w-full flex flex-col gap-4">
              <div>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Admin Password"
                  className="w-full bg-[#1e293b] border border-white/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>
              {error && <div className="text-red-400 text-sm text-center font-medium">{error}</div>}
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-red-500 text-white font-bold py-3 px-4 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
            </form>
            <button 
              onClick={() => setView('options')}
              className="mt-6 text-sm text-white/50 hover:text-white transition-colors"
            >
              Back to Login Options
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
INNER_EOF
