import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dbApi, StudySubject } from '../lib/db';
import { 
  Plus, 
  Trash2, 
  Play, 
  Clock, 
  X, 
  Check, 
  Loader2, 
  Sparkles,
  FlaskConical,
  Timer,
  Zap,
  CheckCircle2
} from 'lucide-react';

export const COLOR_OPTIONS = [
  { id: 'brand', label: 'Brand Indigo', bg: 'bg-brand-500', dot: 'bg-brand-500', text: 'text-brand-400', border: 'border-brand-500/30', ring: 'ring-brand-400', hex: '#6366f1' },
  { id: 'blue', label: 'Blue', bg: 'bg-blue-500', dot: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500/30', ring: 'ring-blue-400', hex: '#3b82f6' },
  { id: 'green', label: 'Green', bg: 'bg-emerald-500', dot: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/30', ring: 'ring-emerald-400', hex: '#10b981' },
  { id: 'purple', label: 'Purple', bg: 'bg-purple-500', dot: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500/30', ring: 'ring-purple-400', hex: '#a855f7' },
  { id: 'orange', label: 'Orange', bg: 'bg-orange-500', dot: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500/30', ring: 'ring-orange-400', hex: '#f97316' },
  { id: 'pink', label: 'Pink', bg: 'bg-pink-500', dot: 'bg-pink-500', text: 'text-pink-400', border: 'border-pink-500/30', ring: 'ring-pink-400', hex: '#ec4899' },
  { id: 'cyan', label: 'Cyan', bg: 'bg-cyan-500', dot: 'bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-500/30', ring: 'ring-cyan-400', hex: '#06b6d4' },
];

export function getColorMeta(colorId?: string) {
  if (!colorId) return COLOR_OPTIONS[0]; // Default to brand indigo
  const match = COLOR_OPTIONS.find(c => c.id === colorId.toLowerCase());
  return match || COLOR_OPTIONS[0];
}

export type StudySessionMode = 'marathon' | 'sprint';

export function StudyLab() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [subjects, setSubjects] = useState<StudySubject[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add Subject Modal state (Task 1)
  const [modalOpen, setModalOpen] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Design Your Session Modal state (Task 2)
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<StudySubject | null>(null);
  const [selectedMode, setSelectedMode] = useState<StudySessionMode>('marathon');
  const [focusTime, setFocusTime] = useState<number | string>(25);
  const [breakTime, setBreakTime] = useState<number | string>(5);

  // Completed Session Banner State (from returning timer)
  const [completedSessionInfo, setCompletedSessionInfo] = useState<{
    subjectName: string;
    mode: string;
    totalSeconds: number;
  } | null>(null);

  useEffect(() => {
    const locState = location.state as {
      completedSession?: { subjectName: string; mode: string; totalSeconds: number };
    } | null;
    if (locState?.completedSession) {
      setCompletedSessionInfo(locState.completedSession);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Real-time synchronization from users/{uid}/studySubjects
  useEffect(() => {
    if (!user) {
      setSubjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = dbApi.subscribeToStudySubjects(
      user.uid,
      (data) => {
        setSubjects(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error in studySubjects listener:', err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user]);

  const handleOpenModal = () => {
    setSubjectName('');
    setError(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setError(null);
  };

  // Task 1: Create subject without theme color selection (auto-assigns brand indigo color)
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!subjectName.trim()) {
      setError('Please enter a subject name');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await dbApi.addStudySubject(user.uid, {
        name: subjectName.trim(),
        color: 'brand' // Automatically assign the primary brand color
      });
      setModalOpen(false);
      setSubjectName('');
    } catch (err: any) {
      console.error('Failed to create study subject:', err);
      setError(err?.message || 'Failed to create subject. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!user) return;
    try {
      await dbApi.deleteStudySubject(user.uid, subjectId);
    } catch (err) {
      console.error('Failed to delete subject:', err);
      alert('Failed to delete subject. Please try again.');
    }
  };

  // Task 2: Open "Design Your Session" modal
  const handleOpenSessionModal = (subject: StudySubject) => {
    setSelectedSubject(subject);
    setSelectedMode('marathon');
    setFocusTime(25);
    setBreakTime(5);
    setSessionModalOpen(true);
  };

  const handleCloseSessionModal = () => {
    setSessionModalOpen(false);
    setSelectedSubject(null);
  };

  const handleBeginSession = () => {
    if (!selectedSubject) return;
    const finalFocus = Number(focusTime) > 0 ? Number(focusTime) : 25;
    const finalBreak = Number(breakTime) > 0 ? Number(breakTime) : 5;
    const modeName = selectedMode === 'sprint' ? 'Exam Sprint' : 'Marathon Session';

    const sessionData = {
      subject: selectedSubject,
      mode: modeName,
      focusTime: finalFocus,
      breakTime: finalBreak
    };

    try {
      sessionStorage.setItem('hsc_active_study_session', JSON.stringify(sessionData));
    } catch (e) {
      // ignore
    }

    handleCloseSessionModal();
    navigate('/study-lab/timer', { 
      state: { 
        subject: selectedSubject, 
        mode: modeName, 
        focusTime: finalFocus, 
        breakTime: finalBreak 
      } 
    });
  };

  return (
    <div className="flex flex-col gap-8 text-white max-w-5xl mx-auto">
      {/* Completed Session Notification Banner */}
      {completedSessionInfo && (
        <div 
          id="banner-session-completed"
          className="bg-brand-500/15 border border-brand-500/30 rounded-2xl p-4 flex items-center justify-between gap-4 animate-in fade-in duration-200 shadow-lg shadow-brand-500/5"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-brand-500/25 border border-brand-500/40 text-brand-300 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                Session Completed: {completedSessionInfo.subjectName}
              </p>
              <p className="text-xs text-white/70 mt-0.5">
                Recorded {Math.floor(completedSessionInfo.totalSeconds / 60)}m {completedSessionInfo.totalSeconds % 60}s of dedicated focus ({completedSessionInfo.mode}).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCompletedSessionInfo(null)}
            className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Area matching Goals page styling */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span>Study Lab</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              Focus Space
            </span>
          </h1>
          <p className="text-white/60 mt-1">Focus on your subjects and track dedicated study sessions.</p>
        </div>

        <button
          id="btn-add-subject"
          type="button"
          onClick={handleOpenModal}
          className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] hover:opacity-90 active:scale-[0.98] transition-all text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[var(--glow-primary)] border border-white/10 cursor-pointer w-full sm:w-auto shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>+ Add Subject</span>
        </button>
      </div>

      {/* Subject Cards Grid (Unlimited subjects supported) */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/50 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
          <p className="text-sm">Loading your subjects...</p>
        </div>
      ) : subjects.length === 0 ? (
        <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-10 text-center flex flex-col items-center justify-center max-w-xl mx-auto my-6 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 flex items-center justify-center text-[var(--accent-primary)] mb-4 shadow-inner">
            <FlaskConical className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No Study Subjects Created</h2>
          <p className="text-white/60 text-sm max-w-md mb-6 leading-relaxed">
            Create your subjects to organize your study routines. Add as many subjects as you like (Physics, Higher Math, Chemistry, Biology, Bangla, etc.) with no limits.
          </p>
          <button
            type="button"
            onClick={handleOpenModal}
            className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] hover:opacity-90 active:scale-[0.98] transition-all text-white font-semibold py-2.5 px-5 rounded-xl flex items-center gap-2 text-sm shadow-lg shadow-[var(--glow-primary)] border border-white/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Subject</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map((subject) => {
            const colorMeta = getColorMeta(subject.color);
            return (
              <div
                key={subject.id}
                id={`subject-card-${subject.id}`}
                className="bg-slate-800/80 hover:bg-slate-800 border border-white/10 hover:border-white/20 rounded-2xl p-6 relative group transition-all duration-200 flex flex-col justify-between shadow-lg shadow-black/20"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span 
                        className={`w-3.5 h-3.5 rounded-full shrink-0 ${colorMeta.dot}`} 
                        style={{ boxShadow: `0 0 10px ${colorMeta.hex}80` }}
                        aria-hidden="true" 
                      />
                      <h3 className="text-lg font-bold text-white truncate" title={subject.name}>
                        {subject.name}
                      </h3>
                    </div>
                    <button
                      id={`btn-delete-subject-${subject.id}`}
                      type="button"
                      onClick={() => handleDeleteSubject(subject.id)}
                      className="text-white/30 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                      title="Delete Subject"
                      aria-label={`Delete ${subject.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="inline-flex items-center gap-2 bg-black/30 border border-white/5 px-3 py-1.5 rounded-xl text-sm font-mono text-white/70">
                    <Clock className="w-3.5 h-3.5 text-white/40" />
                    <span>Today: 00:00:00</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10">
                  <button
                    id={`btn-play-subject-${subject.id}`}
                    type="button"
                    onClick={() => handleOpenSessionModal(subject)}
                    className="w-full py-2.5 px-4 rounded-xl bg-[var(--accent-primary)]/20 hover:bg-[var(--accent-primary)]/30 text-white border border-[var(--accent-primary)]/40 transition-all font-medium text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] shadow-sm shadow-[var(--glow-primary)]"
                    title="Design and begin your session"
                  >
                    <Play className="w-4 h-4 fill-current text-[var(--accent-primary)]" />
                    <span>Play</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task 1: Updated Add Subject Modal (No theme color picker, auto brand color, no subject limit) */}
      {modalOpen && (
        <div 
          id="modal-add-subject"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-add-subject-title"
        >
          <div className="bg-slate-800 border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150 relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/30 flex items-center justify-center text-[var(--accent-primary)]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h2 id="modal-add-subject-title" className="text-xl font-bold text-white">
                  Add New Subject
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={submitting}
                className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateSubject} className="mt-5 flex flex-col gap-5">
              {/* Subject Name Input */}
              <div>
                <label htmlFor="input-subject-name" className="text-sm font-medium text-white/80 block mb-2">
                  Subject Name
                </label>
                <input
                  id="input-subject-name"
                  type="text"
                  autoFocus
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="e.g. Physics 1st Paper, Higher Math, Chemistry"
                  disabled={submitting}
                  className="bg-[#0f172a] border border-white/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] w-full text-sm placeholder:text-white/30"
                />
              </div>

              {error && (
                <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 mt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !subjectName.trim()}
                  className="px-6 py-2.5 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] hover:opacity-90 active:scale-[0.98] text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-[var(--glow-primary)] border border-white/10 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Save Subject</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task 2: "Design Your Session" Modal */}
      {sessionModalOpen && selectedSubject && (
        <div 
          id="modal-design-session"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-design-session-title"
        >
          <div className="bg-slate-800 border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150 relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h2 id="modal-design-session-title" className="text-xl font-bold text-white flex items-center gap-2">
                  <span>Design Your Session</span>
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span 
                    className={`w-2.5 h-2.5 rounded-full ${getColorMeta(selectedSubject.color).dot}`} 
                    aria-hidden="true" 
                  />
                  <span className="text-xs font-semibold text-white/70">
                    {selectedSubject.name}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseSessionModal}
                className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close session design modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Study Modes Selection */}
            <div className="mt-5 flex flex-col gap-3.5">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block">
                Select Study Mode
              </label>

              {/* Mode 1: Marathon Session */}
              <button
                id="btn-mode-marathon"
                type="button"
                onClick={() => setSelectedMode('marathon')}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-4 cursor-pointer relative ${
                  selectedMode === 'marathon'
                    ? 'bg-brand-500/15 border-brand-500 shadow-md shadow-brand-500/10 ring-1 ring-brand-500'
                    : 'bg-[#0f172a]/70 hover:bg-[#0f172a] border-white/10 hover:border-white/20'
                }`}
              >
                <div className={`p-3 rounded-xl shrink-0 ${
                  selectedMode === 'marathon'
                    ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/40'
                    : 'bg-white/5 text-white/60 border border-white/5'
                }`}>
                  <Timer className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-white">
                      Marathon Session
                    </h3>
                    {selectedMode === 'marathon' && (
                      <CheckCircle2 className="w-5 h-5 text-[var(--accent-primary)] shrink-0" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-[var(--accent-primary)] mt-0.5">
                    Open-ended stopwatch
                  </p>
                  <p className="text-xs text-white/50 mt-1 leading-relaxed">
                    Continuous study tracking. Ideal for deep work, problem sets, and uninterrupted reading sessions.
                  </p>
                </div>
              </button>

              {/* Mode 2: Exam Sprint */}
              <button
                id="btn-mode-sprint"
                type="button"
                onClick={() => setSelectedMode('sprint')}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-4 cursor-pointer relative ${
                  selectedMode === 'sprint'
                    ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)] shadow-md shadow-[var(--glow-primary)] ring-1 ring-[var(--accent-primary)]'
                    : 'bg-[#0f172a]/70 hover:bg-[#0f172a] border-white/10 hover:border-white/20'
                }`}
              >
                <div className={`p-3 rounded-xl shrink-0 ${
                  selectedMode === 'sprint'
                    ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/40'
                    : 'bg-white/5 text-white/60 border border-white/5'
                }`}>
                  <Zap className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-white">
                      Exam Sprint
                    </h3>
                    {selectedMode === 'sprint' && (
                      <CheckCircle2 className="w-5 h-5 text-[var(--accent-primary)] shrink-0" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-[var(--accent-primary)] mt-0.5">
                    Structured Intervals (e.g., 25m focus, 5m break)
                  </p>
                  <p className="text-xs text-white/50 mt-1 leading-relaxed">
                    High-focus Pomodoro cycles simulating timed exam drills with scheduled recovery pauses.
                  </p>
                </div>
              </button>

              {/* Task 1: Dynamically revealed Exam Sprint configuration inputs */}
              {selectedMode === 'sprint' && (
                <div 
                  id="sprint-interval-inputs"
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-xl bg-[#0f172a] border border-white/10 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div>
                    <label htmlFor="input-focus-time" className="text-xs font-semibold text-white/80 block mb-1.5">
                      Focus Time (mins)
                    </label>
                    <input
                      id="input-focus-time"
                      type="number"
                      min={1}
                      max={180}
                      value={focusTime}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFocusTime(val === '' ? '' : Math.max(1, parseInt(val, 10) || 1));
                      }}
                      onBlur={() => {
                        if (!focusTime || Number(focusTime) < 1) {
                          setFocusTime(25);
                        }
                      }}
                      className="w-full bg-slate-800 border border-white/10 text-white rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-colors"
                      placeholder="25"
                    />
                  </div>
                  <div>
                    <label htmlFor="input-break-time" className="text-xs font-semibold text-white/80 block mb-1.5">
                      Break Time (mins)
                    </label>
                    <input
                      id="input-break-time"
                      type="number"
                      min={1}
                      max={60}
                      value={breakTime}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBreakTime(val === '' ? '' : Math.max(1, parseInt(val, 10) || 1));
                      }}
                      onBlur={() => {
                        if (!breakTime || Number(breakTime) < 1) {
                          setBreakTime(5);
                        }
                      }}
                      className="w-full bg-slate-800 border border-white/10 text-white rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-colors"
                      placeholder="5"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-3">
              <button
                type="button"
                onClick={handleCloseSessionModal}
                className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-begin-session"
                type="button"
                onClick={handleBeginSession}
                className="flex-2 py-3 px-6 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] hover:opacity-90 active:scale-[0.98] text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-[var(--glow-primary)] border border-white/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Begin Session</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

