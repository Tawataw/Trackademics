import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTrackerStore } from '../store/useTrackerStore';
import { dbApi, ExamRecord, SyllabusProgress, StudySession } from '../lib/db';
import { calculateOverallSyllabusProgress } from '../config/syllabus';
import { formatClassName, formatGroupName } from '../utils/formatters';
import { Link } from 'react-router-dom';
import { Trophy, BookOpen, Clock, TrendingUp, Target, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function Dashboard() {
  const { user, dbUser } = useAuth();
  const { currentTheme } = useTheme();
  const storeGroup = useTrackerStore(state => state.group);
  
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [syllabus, setSyllabus] = useState<SyllabusProgress[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const [fetchedExams, fetchedSyllabus, fetchedSessions] = await Promise.all([
          dbApi.getExams(user.uid),
          dbApi.getSyllabusProgress(user.uid),
          dbApi.getStudySessions(user.uid)
        ]);
        setExams(fetchedExams);
        setSyllabus(fetchedSyllabus);
        setSessions(fetchedSessions);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-white/70 gap-3">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium animate-pulse">Loading your dashboard data from cloud...</p>
      </div>
    );
  }

  const latestExam = exams.length > 0 ? exams[0] : null;
  const currentGPA = latestExam ? latestExam.GPA : 0;
  const totalMarks = latestExam ? latestExam.totalMarks : 0;
  
  const totalStudyMinutes = sessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const totalStudyHours = Math.floor(totalStudyMinutes / 60);
  const totalStudyMinsRemainder = totalStudyMinutes % 60;

  const activeGroup = (dbUser?.group && ['SCIENCE', 'ARTS', 'COMMERCE'].includes(dbUser.group.toUpperCase()))
    ? dbUser.group.toUpperCase()
    : storeGroup;

  const { overallCompleted, overallTotal, percent: syllabusPercent } = calculateOverallSyllabusProgress(
    activeGroup,
    syllabus,
    user?.uid
  );
  const displaySyllabusCompleted = Number.isInteger(overallCompleted) ? overallCompleted : Number(overallCompleted.toFixed(1));

  const chartColor = currentTheme === 'emerald' ? '#10b981' : currentTheme === 'aurora' ? '#d946ef' : currentTheme === 'crimson' ? '#e11d48' : currentTheme === 'minimalist' ? '#ffffff' : currentTheme === 'cyberpunk' ? '#facc15' : currentTheme === 'ocean' ? '#2dd4bf' : '#06b6d4';

  const chartData = [...exams].reverse().map(e => ({
    name: `${e.class} ${e.examType}`,
    GPA: e.GPA,
    Marks: e.totalMarks
  }));

  return (
    <div className="flex flex-col gap-8 text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 text-[var(--accent-primary)] text-xs font-semibold mb-2">
            Trackademics • Academic Management Ecosystem
          </div>
          <h1 className="text-3xl font-bold">Welcome to Trackademics, {dbUser?.name || 'Student'}</h1>
          <p className="text-white/60 mt-1">
            Empowering SSC, HSC, and Admission students with comprehensive academic analytics, syllabus tracking, and study management.
            {dbUser?.class && (
              <span className="block text-slate-400 text-xs mt-1">
                {formatClassName(dbUser?.class)} {activeGroup ? `• ${formatGroupName(activeGroup)} Group` : ''}
              </span>
            )}
          </p>
        </div>
        <Link 
          to="/academic" 
          className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] hover:opacity-90 shadow-md shadow-[var(--glow-primary)] border border-white/10 transition-all px-4 py-2 rounded-xl flex items-center gap-2 font-medium w-fit text-primary-foreground cursor-pointer"
        >
          <Plus className="w-5 h-5" /> Add Exam Result
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-2">
          <div className="flex items-center gap-3 text-white/70">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="font-medium">Current GPA</span>
          </div>
          <div className="text-3xl font-bold">{currentGPA > 0 ? currentGPA.toFixed(2) : '--'}</div>
          <div className="text-sm text-white/50">{latestExam ? `${latestExam.class} ${latestExam.examType}` : 'No exams yet'}</div>
        </div>
        
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-2">
          <div className="flex items-center gap-3 text-white/70">
            <Target className="w-5 h-5 text-blue-400" />
            <span className="font-medium">Total Marks</span>
          </div>
          <div className="text-3xl font-bold">{totalMarks > 0 ? totalMarks : '--'}</div>
          <div className="text-sm text-white/50">Latest Examination</div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-2">
          <div className="flex items-center gap-3 text-white/70">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <span className="font-medium">Syllabus</span>
          </div>
          <div className="text-3xl font-bold">{syllabusPercent}%</div>
          <div className="text-sm text-white/50">{displaySyllabusCompleted} / {overallTotal} completed</div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-2">
          <div className="flex items-center gap-3 text-white/70">
            <Clock className="w-5 h-5 text-purple-400" />
            <span className="font-medium">Study Time</span>
          </div>
          <div className="text-3xl font-bold">{totalStudyHours}h {totalStudyMinsRemainder}m</div>
          <div className="text-sm text-white/50">Total recorded time</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[var(--accent-primary)]" /> Academic Performance
          </h2>
          {exams.length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid tick={{ fill: 'rgba(255,255,255,0.5)' }} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.5)' }} />
                  <YAxis yAxisId="left" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.5)' }} domain={[0, 5]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card-bg-solid, #1e293b)', borderColor: 'var(--border-subtle, rgba(255,255,255,0.1))', borderRadius: '0.75rem', color: 'var(--text-main, #fff)' }} 
                    itemStyle={{ color: 'var(--text-main, #fff)' }} 
                  />
                  <Line yAxisId="left" type="monotone" dataKey="GPA" stroke={chartColor} strokeWidth={3} dot={{ r: 6, fill: chartColor }} activeDot={{ r: 8, fill: chartColor }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center text-white/40">
              <TrendingUp className="w-12 h-12 mb-3 opacity-20" />
              <p>No exam data available yet</p>
              <Link to="/academic" className="text-[var(--accent-primary)] mt-2 hover:underline">Add Exam Result</Link>
            </div>
          )}
        </div>

        {/* Action Plan */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col">
          <h2 className="text-xl font-bold mb-6">Recommended Focus</h2>
          {exams.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-white/40 text-center">
              <p>Not enough data yet.</p>
              <p className="text-sm mt-2">Add exam records and syllabus progress to get personalized recommendations.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <p className="font-medium">1. Complete missing chapters</p>
                <p className="text-sm text-white/60 mt-1">You have completed {syllabusPercent}% of your syllabus. Try to hit {Math.min(100, syllabusPercent + 10)}% this month.</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <p className="font-medium">2. Review latest exam</p>
                <p className="text-sm text-white/60 mt-1">Identify which subjects in {latestExam?.examType} had the lowest marks and target them.</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <p className="font-medium">3. Track your study time</p>
                <p className="text-sm text-white/60 mt-1">Consistency is key. Log your hours daily to build a streak.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
