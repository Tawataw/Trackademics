import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dbApi } from '../lib/db';
import { normalizeClass, formatClassName, formatGroupName, normalizeGroup } from '../utils/formatters';
import { Download, Trash2, User, Moon, Sun, Monitor, Save, Edit3, CheckCircle2, School } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Settings() {
  const { user, dbUser, updateDbUser, logOut, deleteAccountAndData } = useAuth();
  const navigate = useNavigate();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Theme state
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  
  // Profile edit state
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState(dbUser?.name || '');
  const [editCollege, setEditCollege] = useState(dbUser?.collegeName || '');
  const [editClass, setEditClass] = useState(() => normalizeClass(dbUser?.class) || '12');
  const [editGroup, setEditGroup] = useState(() => normalizeGroup(dbUser?.group));

  useEffect(() => {
    if (dbUser) {
      setEditName(dbUser.name || '');
      setEditCollege(dbUser.collegeName || '');
      setEditClass(normalizeClass(dbUser.class) || '12');
      setEditGroup(normalizeGroup(dbUser.group));
    }
  }, [dbUser]);

  const handleExport = async () => {
    if (!user) return;
    try {
      const exams = await dbApi.getExams(user.uid);
      const study = await dbApi.getStudySessions(user.uid);
      const syllabus = await dbApi.getSyllabusProgress(user.uid);
      
      const data = {
        profile: dbUser,
        exams,
        studySessions: study,
        syllabusProgress: syllabus
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hsc_tracker_export_${new Date().getTime()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAccountAndData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (deleteAccountAndData) {
        await deleteAccountAndData();
      } else {
        if (user.uid && user.uid !== 'admin-user' && user.uid !== 'student-user') {
          await dbApi.deleteUserAccountAndData(user.uid);
        }
        await logOut();
      }
      navigate('/login');
    } catch (err) {
      console.error('Account and data deletion failed:', err);
      alert('Failed to delete account and data. Please check your network connection and try again.');
      setLoading(false);
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };
  
  // Initialize theme on load
  useEffect(() => {
    if (theme === 'light') document.documentElement.classList.add('light');
    else document.documentElement.classList.remove('light');
  }, []);

  const handleSaveProfile = async () => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      await updateDbUser({
        name: trimmed,
        class: editClass,
        group: editGroup,
        collegeName: editCollege.trim()
      });
      setEditMode(false);
      const groupDisplayName = formatGroupName(editGroup);
      const classDisplayName = formatClassName(editClass);
      setSuccessMessage(`Profile updated! Class set to ${classDisplayName}, Group set to ${groupDisplayName}, and College updated. All features synchronized.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 text-white max-w-4xl mx-auto pb-10">
      <h1 className="text-3xl font-bold">Settings</h1>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-3 animate-in fade-in duration-300 shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-medium text-sm">{successMessage}</span>
        </div>
      )}
      
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2"><User className="w-5 h-5 text-blue-400" /> Account Profile</h2>
            <p className="text-sm text-white/60 mt-1">Manage your name, college/institution, academic class, and study group.</p>
          </div>
          {!editMode ? (
            <button 
              id="settings-edit-profile-btn"
              onClick={() => setEditMode(true)} 
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium cursor-pointer"
            >
              <Edit3 className="w-4 h-4" /> Edit Profile
            </button>
          ) : (
             <button 
              onClick={() => {
                setEditMode(false);
                setEditName(dbUser?.name || '');
                setEditCollege(dbUser?.collegeName || '');
                setEditClass(normalizeClass(dbUser?.class) || '12');
                setEditGroup(normalizeGroup(dbUser?.group));
              }} 
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-sm font-medium cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
        
        {editMode ? (
          <div className="p-6 flex flex-col gap-5">
            <div>
              <label className="text-sm text-white/70 block mb-2 font-medium">Full Name</label>
              <input 
                id="settings-input-name"
                type="text" 
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full bg-[#1e293b] border border-white/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-brand-500 transition-colors"
                placeholder="Student Name"
                required
              />
            </div>
            <div>
              <label className="text-sm text-white/70 block mb-2 font-medium">College / Institution Name</label>
              <input 
                id="settings-input-college"
                type="text" 
                value={editCollege}
                onChange={e => setEditCollege(e.target.value)}
                className="w-full bg-[#1e293b] border border-white/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-brand-500 transition-colors"
                placeholder="e.g. Notre Dame College, Dhaka College"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-white/70 block mb-2 font-medium">Academic Class</label>
                <select 
                  id="settings-select-class"
                  value={editClass} 
                  onChange={e => setEditClass(e.target.value as any)}
                  className="w-full bg-[#1e293b] border border-white/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-brand-500 cursor-pointer transition-colors"
                >
                  <option value="11">11 (Class 11 / 1st Year)</option>
                  <option value="12">12 (Class 12 / 2nd Year)</option>
                  <option value="HSC Candidate">HSC Candidate</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-white/70 block mb-2 font-medium">Study Group</label>
                <select 
                  id="settings-select-group"
                  value={editGroup} 
                  onChange={e => setEditGroup(e.target.value as any)}
                  className="w-full bg-[#1e293b] border border-white/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-brand-500 cursor-pointer transition-colors"
                >
                  <option value="SCIENCE">Science</option>
                  <option value="COMMERCE">Commerce</option>
                  <option value="ARTS">Arts</option>
                </select>
              </div>
            </div>
            <div className="pt-2">
              <button 
                id="settings-save-profile-btn"
                onClick={handleSaveProfile}
                disabled={loading || !editName.trim()}
                className="w-full sm:w-auto px-6 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl transition-all font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-500/20 active:scale-[0.98]"
              >
                <Save className="w-5 h-5" /> {loading ? 'Saving to Cloud...' : 'Save Profile Changes'}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-white/50 block mb-1">Full Name</label>
              <div className="font-semibold text-lg text-white">{dbUser?.name || 'Not set'}</div>
            </div>
            <div>
              <label className="text-sm text-white/50 block mb-1">Google Email</label>
              <div className="font-medium text-white/90">{user?.email || 'N/A'}</div>
            </div>
            <div>
              <label className="text-sm text-white/50 block mb-1">College / Institution</label>
              <div className="font-medium text-white flex items-center gap-2">
                <School className="w-4 h-4 text-brand-400 shrink-0" />
                <span>{dbUser?.collegeName || 'Not specified'}</span>
              </div>
            </div>
            <div>
              <label className="text-sm text-white/50 block mb-1">Class</label>
              <div className="font-medium text-white">{formatClassName(dbUser?.class)}</div>
            </div>
            <div>
              <label className="text-sm text-white/50 block mb-1">Study Group</label>
              <div className="font-medium text-white">
                {formatGroupName(dbUser?.group)}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold flex items-center gap-2"><Monitor className="w-5 h-5 text-purple-400" /> Appearance</h2>
        </div>
        <div className="p-6">
          <div className="flex gap-4">
            <button 
              onClick={() => handleThemeChange('dark')}
              className={`flex-1 py-4 border rounded-xl flex items-center justify-center gap-2 font-medium transition-colors ${
                theme === 'dark' ? 'bg-brand-500/20 border-brand-500 text-brand-400' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Moon className="w-5 h-5" /> Dark Mode
            </button>
            <button 
              onClick={() => handleThemeChange('light')}
              className={`flex-1 py-4 border rounded-xl flex items-center justify-center gap-2 font-medium transition-colors ${
                theme === 'light' ? 'bg-brand-500/20 border-brand-500 text-brand-400' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Sun className="w-5 h-5" /> Light Mode
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold flex items-center gap-2">Data & Privacy</h2>
          <p className="text-sm text-white/60 mt-1">Export your data or permanently delete your account.</p>
        </div>
        <div className="p-6 flex flex-col gap-6">
          <div>
            <h3 className="font-medium mb-2">Export My Data</h3>
            <p className="text-sm text-white/60 mb-4">Download a copy of all your exams, study sessions, and syllabus progress in JSON format.</p>
            <button onClick={handleExport} className="px-4 py-2 bg-white/10 hover:bg-white/20 transition-colors rounded-xl flex items-center gap-2 text-sm font-medium w-max">
              <Download className="w-4 h-4" /> Export Data
            </button>
          </div>
          
          <div className="pt-6 border-t border-white/10">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <Trash2 className="w-5 h-5 text-red-400" />
              <h3 className="font-semibold text-lg text-red-400">Danger Zone</h3>
            </div>
            <p className="text-sm text-white/60 mb-5 max-w-xl">
              Permanently delete all your academic records, exam data, syllabus tracking, and profile from the database. This action cannot be undone.
            </p>
            
            {!deleteConfirm ? (
              <button 
                id="btn-delete-account"
                type="button"
                onClick={() => setDeleteConfirm(true)} 
                className="px-5 py-3 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-semibold transition-all rounded-xl flex items-center gap-2 text-sm shadow-lg shadow-red-950/40 hover:shadow-red-900/50 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Delete My Data & Account
              </button>
            ) : (
              <div id="delete-account-confirmation" className="bg-red-500/10 border border-red-500/30 p-5 rounded-2xl animate-in fade-in duration-200 max-w-2xl">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 shrink-0 mt-0.5">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-bold text-red-400 mb-1">
                      Are you sure? This action is irreversible and will delete all your academic records.
                    </h4>
                    <p className="text-sm text-white/70 mb-4 leading-relaxed">
                      This will permanently delete your user document from Firestore (<code className="text-red-300 font-mono text-xs">users/{user?.uid || 'current'}</code>), erase all your exams, study logs, and syllabus progress, remove your name from the Admin directory, and sign you out.
                      <br /><br />
                      If you log in with this Google account in the future, you will be treated as a brand new student and prompted to complete onboarding again.
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <button 
                        id="btn-confirm-delete-account"
                        type="button"
                        onClick={handleDeleteAccountAndData} 
                        disabled={loading} 
                        className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white transition-all rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-red-950/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Deleting Account & Data...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            Yes, Delete My Data & Account
                          </>
                        )}
                      </button>
                      <button 
                        id="btn-cancel-delete-account"
                        type="button"
                        onClick={() => setDeleteConfirm(false)} 
                        disabled={loading}
                        className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white transition-colors rounded-xl text-sm font-medium cursor-pointer disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
