import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { dbApi } from '../lib/db';
import { normalizeClass, formatClassName, formatGroupName, normalizeGroup } from '../utils/formatters';
import { Download, Trash2, User, Palette, Sparkles, Check, Save, Edit3, CheckCircle2, School } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Settings() {
  const { user, dbUser, updateDbUser, logOut, deleteAccountAndData } = useAuth();
  const { currentTheme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
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

      {/* Theme Selection */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl">
        <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Palette className="w-5 h-5 text-indigo-400" /> Theme Selection
            </h2>
            <p className="text-sm text-white/60 mt-1">
              Personalize Trackademics with high-contrast, distraction-free aesthetic themes.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/80 border border-white/10 w-fit">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Active: <span className="text-white capitalize">{currentTheme === 'aurora' ? 'Aurora' : currentTheme === 'emerald' ? 'Emerald Matrix' : currentTheme === 'crimson' ? 'Crimson' : currentTheme === 'minimalist' ? 'Minimalist' : currentTheme === 'cyberpunk' ? 'Cyberpunk' : currentTheme === 'ocean' ? 'Ocean' : 'Deep Space'}</span>
          </span>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-5">
            {/* Theme Card 1: Deep Space */}
            <div
              id="theme-card-deep-space"
              onClick={() => setTheme('deep-space')}
              className={`group relative rounded-2xl p-5 border transition-all duration-300 cursor-pointer text-left flex flex-col justify-between ${
                currentTheme === 'deep-space'
                  ? 'bg-slate-950/90 border-cyan-500/60 shadow-lg shadow-cyan-500/15 ring-2 ring-cyan-500/40'
                  : 'bg-slate-950/40 border-white/10 hover:border-cyan-500/30 hover:bg-slate-950/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-sm shadow-cyan-400/50" />
                    <h3 className="font-bold text-lg text-white group-hover:text-cyan-300 transition-colors">
                      Deep Space
                    </h3>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      Default
                    </span>
                  </div>
                  {currentTheme === 'deep-space' && (
                    <div className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                  Slate-950 foundation with glowing cyan and electric blue accents. Engineered for deep focus and nighttime study.
                </p>

                {/* Visual Theme Preview Mockup */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-cyan-500/20 shadow-inner flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="h-2 w-16 rounded-full bg-cyan-400/80" />
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-cyan-400" />
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="p-2 rounded-lg bg-slate-800/80 border border-white/5">
                      <div className="h-1.5 w-8 rounded-full bg-slate-600 mb-1" />
                      <div className="h-2.5 w-12 rounded-full bg-cyan-400/60" />
                    </div>
                    <div className="p-2 rounded-lg bg-slate-800/80 border border-white/5">
                      <div className="h-1.5 w-8 rounded-full bg-slate-600 mb-1" />
                      <div className="h-2.5 w-10 rounded-full bg-blue-400/60" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                <span>Palette: Slate • Cyan • Blue</span>
                <button
                  type="button"
                  className={`px-3 py-1 rounded-lg font-medium text-xs transition-colors ${
                    currentTheme === 'deep-space'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-white/5 text-white/70 group-hover:text-white'
                  }`}
                >
                  {currentTheme === 'deep-space' ? 'Active Theme' : 'Select'}
                </button>
              </div>
            </div>

            {/* Theme Card 2: Aurora */}
            <div
              id="theme-card-aurora"
              onClick={() => setTheme('aurora')}
              className={`group relative rounded-2xl p-5 border transition-all duration-300 cursor-pointer text-left flex flex-col justify-between ${
                currentTheme === 'aurora'
                  ? 'bg-neutral-950/90 border-fuchsia-500/60 shadow-lg shadow-fuchsia-500/15 ring-2 ring-fuchsia-500/40'
                  : 'bg-neutral-950/40 border-white/10 hover:border-fuchsia-500/30 hover:bg-neutral-950/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-sm shadow-fuchsia-400/50" />
                    <h3 className="font-bold text-lg text-white group-hover:text-fuchsia-300 transition-colors">
                      Aurora
                    </h3>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20">
                      Neon
                    </span>
                  </div>
                  {currentTheme === 'aurora' && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white flex items-center justify-center font-bold">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <p className="text-xs text-neutral-300 mb-4 leading-relaxed">
                  Neutral-950 backdrop illuminated by radiant neon violet and fuchsia highlights. Modern, vibrant, and energetic.
                </p>

                {/* Visual Theme Preview Mockup */}
                <div className="p-3 rounded-xl bg-neutral-900/90 border border-fuchsia-500/20 shadow-inner flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="h-2 w-16 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400" />
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-violet-400" />
                      <div className="w-2 h-2 rounded-full bg-fuchsia-400" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="p-2 rounded-lg bg-neutral-800/80 border border-white/5">
                      <div className="h-1.5 w-8 rounded-full bg-neutral-600 mb-1" />
                      <div className="h-2.5 w-12 rounded-full bg-violet-400/60" />
                    </div>
                    <div className="p-2 rounded-lg bg-neutral-800/80 border border-white/5">
                      <div className="h-1.5 w-8 rounded-full bg-neutral-600 mb-1" />
                      <div className="h-2.5 w-10 rounded-full bg-fuchsia-400/60" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
                <span>Palette: Neutral • Violet • Fuchsia</span>
                <button
                  type="button"
                  className={`px-3 py-1 rounded-lg font-medium text-xs transition-colors ${
                    currentTheme === 'aurora'
                      ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40'
                      : 'bg-white/5 text-white/70 group-hover:text-white'
                  }`}
                >
                  {currentTheme === 'aurora' ? 'Active Theme' : 'Select'}
                </button>
              </div>
            </div>

            {/* Theme Card 3: Emerald Matrix */}
            <div
              id="theme-card-emerald"
              onClick={() => setTheme('emerald')}
              className={`group relative rounded-2xl p-5 border transition-all duration-300 cursor-pointer text-left flex flex-col justify-between ${
                currentTheme === 'emerald'
                  ? 'bg-zinc-950/90 border-emerald-500/60 shadow-lg shadow-emerald-500/15 ring-2 ring-emerald-500/40'
                  : 'bg-zinc-950/40 border-white/10 hover:border-emerald-500/30 hover:bg-zinc-950/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 shadow-sm shadow-emerald-400/50" />
                    <h3 className="font-bold text-lg text-white group-hover:text-emerald-300 transition-colors">
                      Emerald Matrix
                    </h3>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Matrix
                    </span>
                  </div>
                  {currentTheme === 'emerald' && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <p className="text-xs text-zinc-300 mb-4 leading-relaxed">
                  Deep zinc-950 charcoal background energized with fresh emerald green and mint highlights. Designed for endurance and crystal clarity.
                </p>

                {/* Visual Theme Preview Mockup */}
                <div className="p-3 rounded-xl bg-zinc-900/90 border border-emerald-500/20 shadow-inner flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="h-2 w-16 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" />
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <div className="w-2 h-2 rounded-full bg-teal-400" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="p-2 rounded-lg bg-zinc-800/80 border border-white/5">
                      <div className="h-1.5 w-8 rounded-full bg-zinc-600 mb-1" />
                      <div className="h-2.5 w-12 rounded-full bg-emerald-400/60" />
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-800/80 border border-white/5">
                      <div className="h-1.5 w-8 rounded-full bg-zinc-600 mb-1" />
                      <div className="h-2.5 w-10 rounded-full bg-teal-400/60" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
                <span>Palette: Zinc • Emerald • Mint</span>
                <button
                  type="button"
                  className={`px-3 py-1 rounded-lg font-medium text-xs transition-colors ${
                    currentTheme === 'emerald'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-white/5 text-white/70 group-hover:text-white'
                  }`}
                >
                  {currentTheme === 'emerald' ? 'Active Theme' : 'Select'}
                </button>
              </div>
            </div>

            {/* Theme Card 4: Crimson */}
            <div
              id="theme-card-crimson"
              onClick={() => setTheme('crimson')}
              className={`group relative rounded-2xl p-5 border transition-all duration-300 cursor-pointer text-left flex flex-col justify-between ${
                currentTheme === 'crimson'
                  ? 'bg-neutral-950/90 border-rose-500/60 shadow-lg shadow-rose-500/15 ring-2 ring-rose-500/40'
                  : 'bg-neutral-950/40 border-white/10 hover:border-rose-500/30 hover:bg-neutral-950/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-rose-600 to-orange-500 shadow-sm shadow-rose-500/50" />
                    <h3 className="font-bold text-lg text-white group-hover:text-rose-400 transition-colors">
                      Crimson
                    </h3>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      Sunset
                    </span>
                  </div>
                  {currentTheme === 'crimson' && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-rose-600 to-orange-500 text-white flex items-center justify-center font-bold">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <p className="text-xs text-neutral-300 mb-4 leading-relaxed">
                  Strict dark neutral-950 foundation with fiery rose-600 and vivid orange-500 sunset gradients. Bold, intense, and high-contrast.
                </p>

                {/* Visual Theme Preview Mockup */}
                <div className="p-3 rounded-xl bg-neutral-900/90 border border-rose-500/20 shadow-inner flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="h-2 w-16 rounded-full bg-gradient-to-r from-rose-500 to-orange-500" />
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-rose-500" />
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="p-2 rounded-lg bg-neutral-800/80 border border-white/5">
                      <div className="h-1.5 w-8 rounded-full bg-neutral-600 mb-1" />
                      <div className="h-2.5 w-12 rounded-full bg-rose-500/60" />
                    </div>
                    <div className="p-2 rounded-lg bg-neutral-800/80 border border-white/5">
                      <div className="h-1.5 w-8 rounded-full bg-neutral-600 mb-1" />
                      <div className="h-2.5 w-10 rounded-full bg-orange-400/60" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
                <span>Palette: Neutral • Rose • Orange</span>
                <button
                  type="button"
                  className={`px-3 py-1 rounded-lg font-medium text-xs transition-colors ${
                    currentTheme === 'crimson'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-white/5 text-white/70 group-hover:text-white'
                  }`}
                >
                  {currentTheme === 'crimson' ? 'Active Theme' : 'Select'}
                </button>
              </div>
            </div>

            {/* Theme Card 5: Minimalist */}
            <div
              id="theme-card-minimalist"
              onClick={() => setTheme('minimalist')}
              className={`group relative rounded-2xl p-5 border transition-all duration-300 cursor-pointer text-left flex flex-col justify-between ${
                currentTheme === 'minimalist'
                  ? 'bg-black border-white shadow-lg shadow-white/10 ring-2 ring-white/50'
                  : 'bg-black/60 border-white/10 hover:border-white/30 hover:bg-black/90'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-white shadow-sm shadow-white/40 border border-zinc-400" />
                    <h3 className="font-bold text-lg text-white group-hover:text-zinc-200 transition-colors">
                      Minimalist
                    </h3>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/20">
                      Mono
                    </span>
                  </div>
                  {currentTheme === 'minimalist' && (
                    <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center font-bold shadow-sm">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                  Distraction-free pure black canvas with zinc-900 cards and crisp, high-contrast solid white accents. Zero color clutter.
                </p>

                {/* Visual Theme Preview Mockup */}
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 shadow-inner flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="h-2 w-16 rounded-full bg-white" />
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-white" />
                      <div className="w-2 h-2 rounded-full bg-zinc-400" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                      <div className="h-1.5 w-8 rounded-full bg-zinc-600 mb-1" />
                      <div className="h-2.5 w-12 rounded-full bg-white" />
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                      <div className="h-1.5 w-8 rounded-full bg-zinc-600 mb-1" />
                      <div className="h-2.5 w-10 rounded-full bg-zinc-400" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
                <span>Palette: Black • Zinc • White</span>
                <button
                  type="button"
                  className={`px-3 py-1 rounded-lg font-medium text-xs transition-colors ${
                    currentTheme === 'minimalist'
                      ? 'bg-white text-black font-semibold'
                      : 'bg-white/5 text-white/70 group-hover:text-white'
                  }`}
                >
                  {currentTheme === 'minimalist' ? 'Active Theme' : 'Select'}
                </button>
              </div>
            </div>

            {/* Theme Card 6: Cyberpunk */}
            <div
              id="theme-card-cyberpunk"
              onClick={() => setTheme('cyberpunk')}
              className={`group relative rounded-2xl p-5 border transition-all duration-300 cursor-pointer text-left flex flex-col justify-between ${
                currentTheme === 'cyberpunk'
                  ? 'bg-slate-950 border-yellow-400 shadow-lg shadow-yellow-400/20 ring-2 ring-yellow-400/50'
                  : 'bg-slate-950/60 border-slate-800 hover:border-yellow-400/40 hover:bg-slate-950/90'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-yellow-400 to-pink-500 shadow-sm shadow-yellow-400/50" />
                    <h3 className="font-bold text-lg text-white group-hover:text-yellow-300 transition-colors">
                      Cyberpunk
                    </h3>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                      Neon
                    </span>
                  </div>
                  {currentTheme === 'cyberpunk' && (
                    <div className="w-6 h-6 rounded-full bg-yellow-400 text-black flex items-center justify-center font-bold shadow-sm">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                  Edgy Gen-Z aesthetic with deep slate-950, high-contrast neon yellow-400 & electric hot pink accents. Razor-sharp visibility.
                </p>

                {/* Visual Theme Preview Mockup */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 shadow-inner flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="h-2 w-16 rounded-full bg-gradient-to-r from-yellow-400 to-pink-500" />
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-yellow-400" />
                      <div className="w-2 h-2 rounded-full bg-pink-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="h-1.5 w-8 rounded-full bg-slate-700 mb-1" />
                      <div className="h-2.5 w-12 rounded-full bg-yellow-400" />
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="h-1.5 w-8 rounded-full bg-slate-700 mb-1" />
                      <div className="h-2.5 w-10 rounded-full bg-pink-500" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                <span>Palette: Slate-950 • Neon • Pink</span>
                <button
                  type="button"
                  className={`px-3 py-1 rounded-lg font-medium text-xs transition-colors ${
                    currentTheme === 'cyberpunk'
                      ? 'bg-gradient-to-r from-yellow-400 to-pink-500 text-black font-bold'
                      : 'bg-white/5 text-white/70 group-hover:text-white'
                  }`}
                >
                  {currentTheme === 'cyberpunk' ? 'Active Theme' : 'Select'}
                </button>
              </div>
            </div>

            {/* Theme Card 7: Ocean */}
            <div
              id="theme-card-ocean"
              onClick={() => setTheme('ocean')}
              className={`group relative rounded-2xl p-5 border transition-all duration-300 cursor-pointer text-left flex flex-col justify-between ${
                currentTheme === 'ocean'
                  ? 'bg-teal-950/80 border-cyan-400 shadow-lg shadow-cyan-400/20 ring-2 ring-cyan-400/50'
                  : 'bg-teal-950/30 border-teal-900/60 hover:border-cyan-400/40 hover:bg-teal-950/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-cyan-400 to-teal-400 shadow-sm shadow-cyan-400/50" />
                    <h3 className="font-bold text-lg text-white group-hover:text-cyan-300 transition-colors">
                      Ocean
                    </h3>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
                      Bioluminescent
                    </span>
                  </div>
                  {currentTheme === 'ocean' && (
                    <div className="w-6 h-6 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center font-bold shadow-sm">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <p className="text-xs text-teal-100/70 mb-4 leading-relaxed">
                  Calming deep oceanic aesthetic with teal-900/30 glassmorphism, soft aqua & teal accents, and tranquil bioluminescent glow.
                </p>

                {/* Visual Theme Preview Mockup */}
                <div className="p-3 rounded-xl bg-teal-950/70 border border-teal-800/40 shadow-inner flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="h-2 w-16 rounded-full bg-gradient-to-r from-cyan-400 to-teal-400" />
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-cyan-400" />
                      <div className="w-2 h-2 rounded-full bg-teal-400" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="p-2 rounded-lg bg-teal-900/40 border border-teal-800/40">
                      <div className="h-1.5 w-8 rounded-full bg-teal-700/60 mb-1" />
                      <div className="h-2.5 w-12 rounded-full bg-cyan-400" />
                    </div>
                    <div className="p-2 rounded-lg bg-teal-900/40 border border-teal-800/40">
                      <div className="h-1.5 w-8 rounded-full bg-teal-700/60 mb-1" />
                      <div className="h-2.5 w-10 rounded-full bg-teal-400" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-teal-800/30 flex items-center justify-between text-xs text-teal-200/60">
                <span>Palette: Teal-950 • Aqua • Mint</span>
                <button
                  type="button"
                  className={`px-3 py-1 rounded-lg font-medium text-xs transition-colors ${
                    currentTheme === 'ocean'
                      ? 'bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 font-bold'
                      : 'bg-white/5 text-white/70 group-hover:text-white'
                  }`}
                >
                  {currentTheme === 'ocean' ? 'Active Theme' : 'Select'}
                </button>
              </div>
            </div>
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
