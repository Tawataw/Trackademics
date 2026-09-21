import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dbApi, ExamRecord } from '../lib/db';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Calendar, BookOpen, Calculator, X, Loader2, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export function AcademicProgress() {
  const { user, dbUser } = useAuth();
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Add Exam Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form fields
  const [formExamType, setFormExamType] = useState('Half-Yearly');
  const [formClass, setFormClass] = useState(dbUser?.class || 'Class 11');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formTotalMarks, setFormTotalMarks] = useState('1100');
  const [formGPA, setFormGPA] = useState('5.00');
  const [formStatus, setFormStatus] = useState<'Pass' | 'Fail'>('Pass');

  useEffect(() => {
    if (dbUser?.class) {
      setFormClass(dbUser.class);
    }
  }, [dbUser]);

  useEffect(() => {
    let isMounted = true;
    if (user?.uid) {
      setLoading(true);
      dbApi.getExams(user.uid)
        .then(res => {
          if (isMounted) {
            setExams(res);
            setLoading(false);
          }
        })
        .catch(err => {
          console.error('Error loading exams from Firestore:', err);
          if (isMounted) {
            setLoading(false);
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!user?.uid) return;
    if (!window.confirm('Are you sure you want to delete this exam record? This will permanently remove it from your cloud profile.')) {
      return;
    }

    // Task 4: Immediate UI update (optimistic removal)
    const previousExams = [...exams];
    setExams(prev => prev.filter(e => e.id !== id));
    setDeletingId(id);

    try {
      // Task 3: Remove directly from Firestore document users/{uid}
      await dbApi.deleteExam(id, user.uid);
      setSuccessMessage('Exam record removed successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to delete exam from Firestore:', err);
      // Revert if write failed
      setExams(previousExams);
      alert('Failed to delete exam from Firestore database. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    const gpaNum = parseFloat(formGPA);
    const marksNum = parseFloat(formTotalMarks);

    if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 5.0) {
      setErrorMessage('Please enter a valid GPA between 0.00 and 5.00');
      return;
    }

    if (isNaN(marksNum) || marksNum < 0) {
      setErrorMessage('Please enter valid total marks');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const examId = `${user.uid}_${Date.now()}`;
    const newExam: ExamRecord = {
      id: examId,
      uid: user.uid,
      class: formClass,
      group: dbUser?.group || 'SCIENCE',
      examType: formExamType,
      date: new Date(formDate).getTime() || Date.now(),
      subjects: [],
      totalMarks: marksNum,
      GPA: Math.min(5.0, Math.max(0, gpaNum)),
      status: formStatus
    };

    // Task 4: Immediate optimistic update on screen
    setExams(prev => [newExam, ...prev.filter(e => e.id !== examId)]);
    setShowAddModal(false);

    try {
      // Task 2: Write directly to Firestore document users/{uid}
      await dbApi.saveExam(newExam);
      setSuccessMessage('New examination record saved to cloud database.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to write new exam to Firestore:', err);
      // Revert optimistic update
      setExams(prev => prev.filter(e => e.id !== examId));
      alert('Failed to save exam to cloud database. Please verify your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 text-white max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Exam History</h1>
          <p className="text-white/60 mt-1">Track your examination performances and GPA trends in Firebase Firestore.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            id="add-exam-record-btn"
            onClick={() => {
              setErrorMessage(null);
              setShowAddModal(true);
            }}
            className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] hover:opacity-90 border border-white/10 transition-all px-4 py-2.5 rounded-xl flex items-center gap-2 font-semibold shadow-lg shadow-[var(--glow-primary)] text-sm whitespace-nowrap cursor-pointer text-primary-foreground"
          >
            <Plus className="w-4 h-4" /> Add Exam
          </button>
          <Link
            id="calculator-link-btn"
            to="/legacy-calculator"
            className="bg-white/10 hover:bg-white/20 border border-white/10 transition-colors px-4 py-2.5 rounded-xl flex items-center gap-2 font-semibold text-sm whitespace-nowrap"
          >
            <Calculator className="w-4 h-4 text-[var(--accent-primary)]" /> Subject Calculator
          </Link>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-400 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-white/50">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
          <p className="text-sm">Fetching exam records from Firestore...</p>
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-white/5 border border-white/10 p-12 rounded-2xl flex flex-col items-center justify-center text-center">
          <BookOpen className="w-16 h-16 text-white/20 mb-4" />
          <h2 className="text-xl font-bold mb-2">No exam records yet</h2>
          <p className="text-white/60 mb-6 max-w-md">Add your examination result to start tracking your academic progress and see your GPA trend in the dashboard.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] hover:opacity-90 shadow-lg shadow-[var(--glow-primary)] border border-white/10 transition-all text-primary-foreground px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-5 h-5" /> Add Exam Record
            </button>
            <Link 
              to="/legacy-calculator" 
              className="bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <Calculator className="w-5 h-5 text-[var(--accent-primary)]" /> Use Calculator
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.map(exam => (
            <div 
              key={exam.id} 
              id={`exam-card-${exam.id}`}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4 relative group hover:border-white/20 transition-colors"
            >
              <button 
                id={`delete-exam-btn-${exam.id}`}
                onClick={() => handleDelete(exam.id)}
                disabled={deletingId === exam.id}
                title="Delete exam record"
                className="absolute top-4 right-4 p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-80 group-hover:opacity-100 disabled:opacity-30"
              >
                {deletingId === exam.id ? (
                  <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>

              <div className="flex justify-between items-start pr-8">
                <div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] rounded-md border border-[var(--accent-primary)]/30 inline-block mb-1">
                    {exam.class}
                  </span>
                  <div className="text-xl font-bold text-white mt-1">{exam.examType}</div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${exam.status === 'Pass' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                  {exam.status}
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-white/50">
                <Calendar className="w-3.5 h-3.5" /> 
                {exam.date ? format(new Date(exam.date), 'MMMM d, yyyy') : 'No date'}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 mt-1">
                <div>
                  <div className="text-xs text-white/50 mb-0.5">GPA</div>
                  <div className="text-2xl font-bold text-[var(--accent-primary)]">{exam.GPA ? exam.GPA.toFixed(2) : '0.00'}</div>
                </div>
                <div>
                  <div className="text-xs text-white/50 mb-0.5">Total Marks</div>
                  <div className="text-2xl font-bold text-white">{exam.totalMarks || 0}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Exam Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1e293b] border border-white/15 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative flex flex-col gap-5 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/30 rounded-lg flex items-center justify-center text-[var(--accent-primary)]">
                  <Plus className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold">Add Examination Record</h2>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-white/50 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleAddExam} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-white/70 mb-1.5 block">Class</label>
                  <select
                    value={formClass}
                    onChange={e => setFormClass(e.target.value)}
                    className="w-full bg-[#0f172a] border border-white/20 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent-primary)]"
                  >
                    <option value="Class 11">Class 11</option>
                    <option value="Class 12">Class 12</option>
                    <option value="HSC Candidate">HSC Candidate</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/70 mb-1.5 block">Exam Type</label>
                  <select
                    value={formExamType}
                    onChange={e => setFormExamType(e.target.value)}
                    className="w-full bg-[#0f172a] border border-white/20 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent-primary)]"
                  >
                    <option value="Half-Yearly">Half-Yearly</option>
                    <option value="Yearly">Yearly</option>
                    <option value="Pre-Test">Pre-Test</option>
                    <option value="Test">Test</option>
                    <option value="Model Test">Model Test</option>
                    <option value="HSC Final">HSC Final</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-white/70 mb-1.5 block">Date of Exam</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    required
                    className="w-full bg-[#0f172a] border border-white/20 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/70 mb-1.5 block">Result Status</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as 'Pass' | 'Fail')}
                    className="w-full bg-[#0f172a] border border-white/20 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent-primary)]"
                  >
                    <option value="Pass">Pass</option>
                    <option value="Fail">Fail</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-white/70 mb-1.5 block">GPA (Out of 5.00)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.00"
                    max="5.00"
                    value={formGPA}
                    onChange={e => setFormGPA(e.target.value)}
                    required
                    placeholder="5.00"
                    className="w-full bg-[#0f172a] border border-white/20 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/70 mb-1.5 block">Total Marks</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="2000"
                    value={formTotalMarks}
                    onChange={e => setFormTotalMarks(e.target.value)}
                    required
                    placeholder="1100"
                    className="w-full bg-[#0f172a] border border-white/20 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/15 text-white/80 hover:bg-white/5 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] hover:opacity-90 disabled:opacity-50 px-5 py-2.5 rounded-xl text-primary-foreground text-sm font-bold flex items-center gap-2 shadow-lg shadow-[var(--glow-primary)] border border-white/10 transition-all cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Exam to Cloud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

