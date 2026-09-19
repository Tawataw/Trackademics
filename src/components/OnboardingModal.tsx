import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { normalizeClass } from '../utils/formatters';
import { GraduationCap, FlaskConical, Briefcase, BookOpen, CheckCircle, ArrowRight, Loader2, Sparkles, School } from 'lucide-react';

export function OnboardingModal() {
  const { user, dbUser, completeOnboarding } = useAuth();
  
  const [name, setName] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [selectedClass, setSelectedClass] = useState<'11' | '12' | 'HSC Candidate' | ''>('');
  const [selectedGroup, setSelectedGroup] = useState<'SCIENCE' | 'ARTS' | 'COMMERCE' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!name) {
      setName(user?.displayName || dbUser?.name || '');
    }
    if (!collegeName && dbUser?.collegeName) {
      setCollegeName(dbUser.collegeName);
    }
    if (!selectedClass && dbUser?.class) {
      const norm = normalizeClass(dbUser.class);
      if (norm) setSelectedClass(norm);
    }
    if (!selectedGroup && dbUser?.group && ['SCIENCE', 'ARTS', 'COMMERCE'].includes(dbUser.group.toUpperCase())) {
      setSelectedGroup(dbUser.group.toUpperCase() as 'SCIENCE' | 'ARTS' | 'COMMERCE');
    }
  }, [user, dbUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedCollege = collegeName.trim();

    if (!trimmedName) {
      setError('Please enter your full name.');
      return;
    }
    if (!trimmedCollege) {
      setError('Please enter your College or Institution name.');
      return;
    }
    if (!selectedClass) {
      setError('Please select your academic class (11, 12, or HSC Candidate).');
      return;
    }
    if (!selectedGroup) {
      setError('Please choose your study group (Science, Arts, or Commerce).');
      return;
    }

    setIsSubmitting(true);
    try {
      await completeOnboarding({
        name: trimmedName,
        class: selectedClass,
        group: selectedGroup,
        collegeName: trimmedCollege
      });
    } catch (err: any) {
      console.error('Failed to complete onboarding:', err);
      setError('Failed to save profile. Please check your internet connection and try again.');
      setIsSubmitting(false);
    }
  };

  const classOptions: { id: '11' | '12' | 'HSC Candidate'; title: string; subtitle: string }[] = [
    { id: '11', title: 'Class 11', subtitle: 'HSC 1st Year' },
    { id: '12', title: 'Class 12', subtitle: 'HSC 2nd Year' },
    { id: 'HSC Candidate', title: 'HSC Candidate', subtitle: 'Examinee' }
  ];

  const groupOptions: { id: 'SCIENCE' | 'COMMERCE' | 'ARTS'; name: string; icon: any; desc: string; color: string; badge: string }[] = [
    {
      id: 'SCIENCE',
      name: 'Science',
      icon: FlaskConical,
      desc: 'Physics, Chemistry, Higher Math, Biology',
      color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/40 text-blue-400',
      badge: 'bg-blue-500/10 text-blue-300 border-blue-500/30'
    },
    {
      id: 'COMMERCE',
      name: 'Commerce',
      icon: Briefcase,
      desc: 'Accounting, Management, Finance, Marketing',
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/40 text-amber-400',
      badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30'
    },
    {
      id: 'ARTS',
      name: 'Arts',
      icon: BookOpen,
      desc: 'Economics, Civics, Logic, Islamic History',
      color: 'from-purple-500/20 to-pink-500/10 border-purple-500/40 text-purple-400',
      badge: 'bg-purple-500/10 text-purple-300 border-purple-500/30'
    }
  ];

  return (
    <div 
      id="onboarding-modal-overlay"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
      // Prevent outside click dismiss
      onClick={(e) => e.stopPropagation()}
    >
      <div 
        id="onboarding-modal-card"
        className="relative w-full max-w-2xl bg-gradient-to-b from-[#1e293b] to-[#0f172a] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-brand-900/30 my-8 text-white animate-in fade-in zoom-in-95 duration-300"
      >
        {/* Header decoration */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/25 shrink-0">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30 mb-1">
              <Sparkles className="w-3 h-3" />
              Welcome to HSC Tracker
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Complete Your Profile Setup</h1>
            <p className="text-sm text-slate-400 mt-1">
              Personalize your HSC journey. We'll tailor your syllabus tracker, exam targets, and university admission eligibility based on your selections.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Full Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Full Name <span className="text-brand-400">*</span>
            </label>
            <input
              id="onboarding-input-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Abdullah Al Mamun"
              className="w-full bg-slate-900/80 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              required
            />
            {user?.email && (
              <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                Connected Google Account: <span className="text-slate-300 font-medium">{user.email}</span>
              </p>
            )}
          </div>

          {/* Step 2: College / Institution Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              College / Institution Name <span className="text-brand-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <School className="w-5 h-5 text-brand-400" />
              </div>
              <input
                id="onboarding-input-college"
                type="text"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                placeholder="e.g. Notre Dame College, Dhaka College, Rajuk Uttara"
                className="w-full bg-slate-900/80 border border-white/15 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              Your college/institution will be shown next to your name on the Leaderboard.
            </p>
          </div>

          {/* Step 3: Academic Class */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Academic Class (11, 12, HSC Candidate) <span className="text-brand-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {classOptions.map((c) => {
                const isSelected = selectedClass === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    id={`onboarding-class-${c.id.replace(/\s+/g, '-').toLowerCase()}`}
                    onClick={() => setSelectedClass(c.id)}
                    className={`flex flex-col sm:items-start justify-between p-4 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-brand-500/15 border-brand-500 ring-2 ring-brand-500/40 text-white shadow-md'
                        : 'bg-slate-900/50 border-white/10 text-slate-400 hover:bg-slate-900 hover:border-white/20 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="font-bold text-base text-white">{c.title}</div>
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-brand-400 shrink-0" />
                      )}
                    </div>
                    <div className="text-xs text-slate-400">{c.subtitle}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Academic Group */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Academic Group <span className="text-brand-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {groupOptions.map((g) => {
                const isSelected = selectedGroup === g.id;
                const Icon = g.icon;
                return (
                  <button
                    key={g.id}
                    type="button"
                    id={`onboarding-group-${g.id.toLowerCase()}`}
                    onClick={() => setSelectedGroup(g.id)}
                    className={`flex flex-col p-4 rounded-2xl border text-left transition-all relative ${
                      isSelected
                        ? `bg-gradient-to-br ${g.color} ring-2 ring-brand-500/50 text-white shadow-lg`
                        : 'bg-slate-900/50 border-white/10 text-slate-400 hover:bg-slate-900 hover:border-white/20 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <div className={`p-2.5 rounded-xl bg-white/5 border border-white/10 ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      )}
                    </div>
                    <div className="font-bold text-base text-white mb-1">{g.name}</div>
                    <div className="text-xs text-slate-400 leading-relaxed">{g.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action button */}
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400 text-center sm:text-left">
              You can change your Class or Group anytime in <span className="text-slate-300 font-medium">Settings</span>.
            </p>
            <button
              id="onboarding-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-lg shadow-brand-500/25 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving Profile...
                </>
              ) : (
                <>
                  Complete Setup & Launch
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
