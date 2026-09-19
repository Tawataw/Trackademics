import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dbApi, StudySession, StudySubject } from '../lib/db';
import { getColorMeta, StudySessionMode } from './StudyLab';
import { Play, Pause, Square } from 'lucide-react';

interface SessionLocationState {
  subject?: StudySubject;
  mode?: string;
  focusTime?: number;
  breakTime?: number;
}

export function StudyLabTimer() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Task 3: Strictly use useLocation() to read location.state
  const locState = (location.state || {}) as SessionLocationState;

  // Retrieve subject from router state or sessionStorage fallback
  const [subject] = useState<StudySubject | null>(() => {
    if (locState.subject) return locState.subject;
    try {
      const stored = sessionStorage.getItem('hsc_active_study_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.subject) return parsed.subject;
      }
    } catch (e) {
      // ignore
    }
    return null;
  });

  const [mode] = useState<string>(() => {
    if (locState.mode) return locState.mode;
    try {
      const stored = sessionStorage.getItem('hsc_active_study_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.mode) return parsed.mode;
      }
    } catch (e) {
      // ignore
    }
    return 'Exam Sprint';
  });

  const isExamSprint = typeof mode === 'string' && (mode === 'Exam Sprint' || mode.toLowerCase().includes('sprint'));

  // Task 3: Strictly use location.state.focusTime and location.state.breakTime
  const focusTime = Number(
    locState.focusTime ?? 
    (() => {
      try {
        const stored = sessionStorage.getItem('hsc_active_study_session');
        return stored ? JSON.parse(stored)?.focusTime : undefined;
      } catch {
        return undefined;
      }
    })() ?? 
    25
  );

  const breakTime = Number(
    locState.breakTime ?? 
    (() => {
      try {
        const stored = sessionStorage.getItem('hsc_active_study_session');
        return stored ? JSON.parse(stored)?.breakTime : undefined;
      } catch {
        return undefined;
      }
    })() ?? 
    5
  );

  // Task 3: Pre-start countdown (3, 2, 1)
  const [preStartCount, setPreStartCount] = useState<number | null>(3);
  
  // Timer States
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0); // For marathon
  const [sprintPhase, setSprintPhase] = useState<'focus' | 'break'>('focus'); // For exam sprint

  // Task 4: Initialize the countdown timer strictly using location.state.focusTime * 60 (convert to seconds).
  // REMOVE any hardcoded 25-minute fallbacks that override the user's input.
  const [sprintRemainingSeconds, setSprintRemainingSeconds] = useState<number>(() => {
    const rawFocus = location.state?.focusTime;
    if (rawFocus !== undefined && rawFocus !== null && !isNaN(Number(rawFocus))) {
      return Number(rawFocus) * 60;
    }
    return focusTime * 60;
  });
  const [totalFocusSeconds, setTotalFocusSeconds] = useState(0); // Cumulative focus time for exam sprint

  // Refs to maintain latest values in interval
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const modeRef = useRef(mode);
  modeRef.current = mode;

  const sprintPhaseRef = useRef(sprintPhase);
  sprintPhaseRef.current = sprintPhase;

  const focusTimeRef = useRef(focusTime);
  focusTimeRef.current = focusTime;

  const breakTimeRef = useRef(breakTime);
  breakTimeRef.current = breakTime;

  // If no subject is available, return to study lab
  useEffect(() => {
    if (!subject) {
      navigate('/study-lab', { replace: true });
    }
  }, [subject, navigate]);

  // Pre-start countdown effect (3 -> 2 -> 1 -> start)
  useEffect(() => {
    if (preStartCount === null) return;

    if (preStartCount > 1) {
      const timer = setTimeout(() => {
        setPreStartCount((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (preStartCount === 1) {
      const timer = setTimeout(() => {
        setPreStartCount(null); // Begin main timer
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [preStartCount]);

  // Main Timer Interval
  useEffect(() => {
    if (preStartCount !== null) return; // Wait for pre-start countdown

    const interval = setInterval(() => {
      if (isPausedRef.current) return;

      if (!isExamSprint) {
        // Count-Up Stopwatch for Marathon Session
        setElapsedSeconds((prev) => prev + 1);
      } else {
        // Exam Sprint Pomodoro Countdown
        setSprintRemainingSeconds((prev) => {
          if (prev <= 1) {
            // Switch phase
            if (sprintPhaseRef.current === 'focus') {
              sprintPhaseRef.current = 'break';
              setSprintPhase('break');
              return breakTimeRef.current * 60; // Dynamic custom break
            } else {
              sprintPhaseRef.current = 'focus';
              setSprintPhase('focus');
              return focusTimeRef.current * 60; // Dynamic custom focus
            }
          }
          return prev - 1;
        });

        // If currently in focus phase, increment focus counter
        if (sprintPhaseRef.current === 'focus') {
          setTotalFocusSeconds((prev) => prev + 1);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [preStartCount, isExamSprint]);

  // Task 4: End session handler
  const handleEndSession = async () => {
    const totalStudied = !isExamSprint ? elapsedSeconds : totalFocusSeconds;
    const studyMinutes = Math.round(totalStudied / 60);

    // Save session & update totalStudyMinutes and studyPoints in Firestore
    if (user && studyMinutes > 0) {
      try {
        const session: StudySession = {
          id: `${user.uid}_${Date.now()}`,
          uid: user.uid,
          date: Date.now(),
          durationMinutes: studyMinutes,
          createdAt: Date.now()
        };
        await dbApi.saveStudySession(session);
        await dbApi.addStudyMinutes(user.uid, studyMinutes);
      } catch (err) {
        console.warn('Failed to save study session on timer completion:', err);
      }
    }
    
    // Clean up stored session
    try {
      sessionStorage.removeItem('hsc_active_study_session');
    } catch (e) {
      // ignore
    }

    // Return to Study Lab dashboard with session data
    navigate('/study-lab', {
      replace: true,
      state: {
        completedSession: {
          subjectName: subject?.name || 'Subject',
          mode: isExamSprint ? 'Exam Sprint' : 'Marathon Session',
          totalSeconds: totalStudied
        }
      }
    });
  };

  const togglePause = () => {
    setIsPaused((prev) => !prev);
  };

  // Helper formatting: HH:MM:SS or MM:SS
  const formatTime = (totalSec: number, alwaysIncludeHours = false) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (alwaysIncludeHours || hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  if (!subject) return null;

  const colorMeta = getColorMeta(subject.color);

  return (
    <div 
      id="study-lab-immersive-timer"
      className="fixed inset-0 z-50 min-h-screen bg-slate-900 text-white flex flex-col justify-between items-center p-6 sm:p-10 select-none overflow-hidden"
    >
      {/* Top Header Area: Subject Name Badge */}
      <div className="w-full flex justify-center items-center pt-2 sm:pt-4">
        <div 
          id="timer-subject-badge"
          className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-800/90 border border-white/10 shadow-lg backdrop-blur-md"
        >
          <span 
            className={`w-2.5 h-2.5 rounded-full ${colorMeta.dot} shrink-0`} 
            style={{ boxShadow: `0 0 8px ${colorMeta.hex}80` }}
            aria-hidden="true" 
          />
          <span className="text-sm font-bold text-white tracking-wide truncate max-w-[200px] sm:max-w-xs">
            {subject.name}
          </span>
          <span className="text-white/20">•</span>
          <span className="text-xs font-semibold text-brand-300">
            {!isExamSprint
              ? 'Marathon Session'
              : sprintPhase === 'focus'
              ? `Exam Sprint • Focus (${focusTime}m)`
              : `Exam Sprint • Break (${breakTime}m)`}
          </span>
        </div>
      </div>

      {/* Centerpiece: Timer UI with Large Typography & Subtle Indigo/Purple Glowing Effect */}
      <div className="relative flex flex-col items-center justify-center my-auto w-full">
        {/* Subtle indigo/purple glowing backdrop behind the timer text */}
        <div 
          className="absolute w-80 h-80 sm:w-[450px] sm:h-[450px] rounded-full bg-brand-500/15 blur-3xl pointer-events-none -z-10"
          aria-hidden="true" 
        />

        {preStartCount !== null ? (
          /* Pre-start Countdown (3, 2, 1) */
          <div className="flex flex-col items-center justify-center animate-in zoom-in-75 duration-200">
            <span className="text-xs uppercase tracking-widest font-bold text-brand-300/70 mb-2">
              Ready...
            </span>
            <div 
              id="prestart-countdown"
              className="text-8xl sm:text-9xl font-mono font-bold text-brand-400 drop-shadow-[0_0_35px_rgba(99,102,241,0.5)]"
            >
              {preStartCount}
            </div>
          </div>
        ) : (
          /* Active Timer Display: Clean Typography with Subtle Glowing Effect */
          <div className="flex flex-col items-center justify-center">
            <div 
              id="main-timer-display"
              className="text-7xl sm:text-8xl md:text-9xl font-mono font-bold tracking-tight text-white drop-shadow-[0_0_30px_rgba(99,102,241,0.4)]"
            >
              {!isExamSprint
                ? formatTime(elapsedSeconds, true)
                : formatTime(sprintRemainingSeconds, false)}
            </div>

            {/* Subtle session status pulse */}
            <div className="mt-5 flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs text-white/50">
              <span 
                className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} 
              />
              <span>
                {isPaused 
                  ? 'Session Paused' 
                  : !isExamSprint 
                  ? 'Active Stopwatch' 
                  : sprintPhase === 'focus' 
                  ? `Focus Interval (${focusTime}m)` 
                  : `Recovery Break (${breakTime}m)`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Area: Controls (Pause/Resume and End Session) */}
      <div className="w-full flex justify-center items-center pb-4 sm:pb-8">
        <div className="flex items-center gap-4">
          {/* Pause / Resume Button */}
          <button
            id="btn-timer-pause-resume"
            type="button"
            onClick={togglePause}
            disabled={preStartCount !== null}
            className={`min-w-[140px] py-3.5 px-6 rounded-2xl border font-bold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
              isPaused
                ? 'bg-brand-500 hover:bg-brand-600 text-white border-brand-400 shadow-lg shadow-brand-500/25'
                : 'bg-slate-800/90 hover:bg-slate-800 text-white/90 border-white/10 hover:border-white/20'
            }`}
          >
            {isPaused ? (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Resume</span>
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </>
            )}
          </button>

          {/* End Session Button */}
          <button
            id="btn-timer-end-session"
            type="button"
            onClick={handleEndSession}
            disabled={preStartCount !== null}
            className="min-w-[140px] py-3.5 px-6 rounded-2xl bg-red-500/20 hover:bg-red-500/30 active:scale-95 text-red-300 hover:text-white border border-red-500/30 font-bold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg shadow-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Square className="w-4 h-4 fill-current" />
            <span>End Session</span>
          </button>
        </div>
      </div>
    </div>
  );
}
