import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  dbService, 
  DailyTaskItem, 
  DailyTaskHistoryDay, 
  DailyTasksDoc 
} from '../lib/db';
import { 
  CheckSquare, 
  Plus, 
  Trash2, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Sparkles, 
  AlertCircle,
  RotateCcw,
  ListTodo,
  TrendingUp
} from 'lucide-react';

export function DailyTasks() {
  const { user } = useAuth();
  
  // State
  const [tasks, setTasks] = useState<DailyTaskItem[]>([]);
  const [history, setHistory] = useState<DailyTaskHistoryDay[]>([]);
  const [currentDate, setCurrentDate] = useState<string>(() => dbService.getTodayDateString());
  const [newTaskText, setNewTaskText] = useState('');
  const [loading, setLoading] = useState(true);
  const [addingTask, setAddingTask] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Accordion state for 7-Day History (stores expanded date keys)
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  // Quick suggestion chips for HSC students
  const suggestions = ['Study 4 Hours', 'Namaz / Prayers', 'Sleep by 11 PM', 'Physics Revision', 'Math CQ Practice', 'Chemistry MCQ Test'];

  // 1. Mount & Midnight Reset Logic (Lazy Evaluation)
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const initAndSubscribe = async () => {
      try {
        setLoading(true);
        // Midnight reset check: compares local YYYY-MM-DD against stored date
        // and archives up to 7 days if date rolled over
        const synced = await dbService.getAndSyncDailyTasks(user.uid);
        if (isMounted) {
          setTasks(synced.tasks || []);
          setHistory(synced.history || []);
          setCurrentDate(synced.date || dbService.getTodayDateString());
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Error initializing daily tasks:', err);
        if (isMounted) {
          setActionError('Failed to load tasks. Please refresh.');
          setLoading(false);
        }
      }

      // Realtime listener
      const unsubscribe = dbService.subscribeToDailyTasks(
        user.uid,
        (data: DailyTasksDoc) => {
          if (!isMounted) return;
          setTasks(data.tasks || []);
          setHistory(data.history || []);
          setCurrentDate(data.date || dbService.getTodayDateString());
        },
        (err) => {
          console.error('Realtime tasks listener error:', err);
        }
      );

      return unsubscribe;
    };

    let unsubFn: (() => void) | undefined;
    initAndSubscribe().then((unsub) => {
      unsubFn = unsub;
    });

    return () => {
      isMounted = false;
      if (unsubFn) unsubFn();
    };
  }, [user?.uid]);

  // Task Handlers
  const handleAddTask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user?.uid || !newTaskText.trim()) return;

    const textToAdd = newTaskText.trim();
    setNewTaskText('');
    setAddingTask(true);
    setActionError(null);

    // Optimistic UI update
    const optimisticTask: DailyTaskItem = {
      id: `temp-${Date.now()}`,
      text: textToAdd,
      isCompleted: false,
      createdAt: Date.now()
    };
    setTasks(prev => [...prev, optimisticTask]);

    try {
      await dbService.addDailyTask(user.uid, textToAdd);
    } catch (err) {
      console.error('Failed to add task:', err);
      setActionError('Could not save task. Please try again.');
      // Revert optimistic
      setTasks(prev => prev.filter(t => t.id !== optimisticTask.id));
    } finally {
      setAddingTask(false);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    if (!user?.uid) return;
    setActionError(null);

    // Optimistic update
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t))
    );

    try {
      await dbService.toggleDailyTask(user.uid, taskId);
    } catch (err) {
      console.error('Failed to toggle task:', err);
      // Revert
      setTasks(prev =>
        prev.map(t => (t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t))
      );
      setActionError('Failed to update task status.');
    }
  };

  const handleDeleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.uid) return;
    setActionError(null);

    const prevList = [...tasks];
    setTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      await dbService.deleteDailyTask(user.uid, taskId);
    } catch (err) {
      console.error('Failed to delete task:', err);
      setTasks(prevList);
      setActionError('Failed to delete task.');
    }
  };

  const toggleDateAccordion = (dateKey: string) => {
    setExpandedDates(prev => ({
      ...prev,
      [dateKey]: !prev[dateKey]
    }));
  };

  // Helper date formatter
  const formatHeaderDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const dateObj = new Date(y, m, d);
        return dateObj.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
    } catch {
      // ignore
    }
    return dateStr;
  };

  const completedTodayCount = tasks.filter(t => t.isCompleted).length;
  const totalTodayCount = tasks.length;
  const completionPercentage = totalTodayCount > 0 
    ? Math.round((completedTodayCount / totalTodayCount) * 100) 
    : 0;

  const todayPretty = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div id="daily-tasks-page" className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center shadow-lg shadow-[var(--glow-primary)]">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Daily Tasks</h1>
          </div>
          <p className="text-sm text-white/60">
            Build consistent daily routines. Your tasks automatically archive every midnight with 7-day tracking.
          </p>
        </div>

        {/* Date & Quick Reset Status */}
        <div className="flex items-center gap-3 bg-slate-800/80 border border-white/10 px-4 py-2.5 rounded-xl self-start md:self-auto">
          <Calendar className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
          <div className="text-xs">
            <div className="font-semibold text-white">{todayPretty}</div>
            <div className="text-white/50 flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Auto-resets at 12:00 AM local time
            </div>
          </div>
        </div>
      </div>

      {actionError && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =========================================================================
            SECTION 1: TODAY'S TASKS (7 Cols on desktop)
            ========================================================================= */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <div className="flex items-center gap-2.5">
                <ListTodo className="w-5 h-5 text-[var(--accent-primary)]" />
                <h2 className="text-lg font-bold text-white">Today's Tasks</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/80">
                  {completedTodayCount} of {totalTodayCount} done
                </span>
                {totalTodayCount > 0 && (
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    completionPercentage === 100 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30'
                  }`}>
                    {completionPercentage}%
                  </span>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {totalTodayCount > 0 && (
              <div className="w-full bg-slate-900/80 rounded-full h-2 mb-6 overflow-hidden border border-white/5">
                <div 
                  className={`h-full transition-all duration-300 rounded-full ${
                    completionPercentage === 100 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                      : 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]'
                  }`}
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            )}

            {/* Add Task Input & "+" Button */}
            <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <input
                  id="daily-task-input"
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder="Add a new task (e.g., Study 2h, Namaz, Revise Bio)..."
                  className="w-full bg-slate-900 border border-white/10 text-white placeholder-white/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-colors"
                  disabled={loading || addingTask}
                />
              </div>
              <button
                id="add-daily-task-button"
                type="submit"
                disabled={!newTaskText.trim() || loading || addingTask}
                className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-[var(--glow-primary)] border border-white/10 shrink-0"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline text-sm font-semibold">Add</span>
              </button>
            </form>

            {/* Quick Suggestion Chips */}
            <div className="mb-6">
              <div className="flex items-center gap-1.5 text-xs text-white/50 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>Quick suggestions:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => {
                      setNewTaskText(sug);
                      const input = document.getElementById('daily-task-input');
                      if (input) input.focus();
                    }}
                    className="text-xs bg-white/5 hover:bg-[var(--accent-primary)]/20 hover:text-white hover:border-[var(--accent-primary)]/40 border border-white/10 px-2.5 py-1 rounded-lg text-white/70 transition-colors"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Task List */}
            {loading ? (
              <div className="py-12 text-center text-white/50 text-sm animate-pulse flex flex-col items-center gap-2">
                <Clock className="w-6 h-6 text-[var(--accent-primary)] animate-spin" />
                <span>Synchronizing tasks with Firestore...</span>
              </div>
            ) : tasks.length === 0 ? (
              <div className="py-12 px-4 rounded-xl border border-dashed border-white/10 text-center bg-slate-900/40">
                <CheckSquare className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-white">No tasks for today yet</h3>
                <p className="text-xs text-white/50 max-w-sm mx-auto mt-1 mb-4">
                  Add the essential tasks you want to accomplish today. Completed tasks will stay saved and archive tonight.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {tasks.map((task) => {
                  const isDone = task.isCompleted;
                  return (
                    <div
                      key={task.id}
                      id={`task-item-${task.id}`}
                      onClick={() => handleToggleTask(task.id)}
                      className={`group flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isDone
                          ? 'bg-slate-900/50 border-white/5 text-white/50'
                          : 'bg-slate-900 border-white/10 text-white hover:border-[var(--accent-primary)]/40 hover:bg-slate-900/90'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 pr-3">
                        {/* Custom Styled Checkbox */}
                        <button
                          type="button"
                          aria-label={isDone ? 'Mark task incomplete' : 'Mark task completed'}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTask(task.id);
                          }}
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                            isDone 
                              ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20' 
                              : 'border-2 border-white/30 hover:border-[var(--accent-primary)] bg-white/5'
                          }`}
                        >
                          {isDone && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </button>

                        <span
                          className={`text-sm font-medium transition-all break-words select-none ${
                            isDone ? 'line-through text-white/40' : 'text-white'
                          }`}
                        >
                          {task.text}
                        </span>
                      </div>

                      <button
                        type="button"
                        aria-label="Delete task"
                        onClick={(e) => handleDeleteTask(task.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-white/5 transition-all shrink-0"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            SECTION 2: 7-DAY HISTORY (5 Cols on desktop)
            ========================================================================= */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <div className="flex items-center gap-2.5">
                <RotateCcw className="w-5 h-5 text-[var(--accent-primary)]" />
                <h2 className="text-lg font-bold text-white">7-Day History</h2>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/70">
                {history.length} / 7 days
              </span>
            </div>

            <p className="text-xs text-white/50 mb-4">
              Archived records of your previous daily tasks. Click on any date below to inspect what you accomplished.
            </p>

            {loading ? (
              <div className="py-8 text-center text-white/40 text-sm animate-pulse">
                Loading history...
              </div>
            ) : history.length === 0 ? (
              <div className="py-10 px-4 rounded-xl border border-dashed border-white/10 text-center bg-slate-900/40">
                <Calendar className="w-8 h-8 text-white/20 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-white/80">No archived history yet</h4>
                <p className="text-xs text-white/40 max-w-xs mx-auto mt-1">
                  When midnight passes, today's tasks will be archived here automatically for the last 7 days.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.slice(0, 7).map((dayRecord) => {
                  const dateKey = dayRecord.date;
                  const isExpanded = !!expandedDates[dateKey];
                  const completedCount = dayRecord.completedCount ?? dayRecord.tasks.filter(t => t.isCompleted).length;
                  const totalCount = dayRecord.totalCount ?? dayRecord.tasks.length;
                  const dayRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                  
                  // Completed tasks list
                  const completedTasks = dayRecord.tasks.filter(t => t.isCompleted);
                  const incompleteTasks = dayRecord.tasks.filter(t => !t.isCompleted);

                  return (
                    <div
                      key={dateKey}
                      id={`history-day-${dateKey}`}
                      className="rounded-xl border border-white/10 bg-slate-900 overflow-hidden transition-all"
                    >
                      {/* Accordion Date Header Button */}
                      <button
                        type="button"
                        onClick={() => toggleDateAccordion(dateKey)}
                        className="w-full flex items-center justify-between p-3.5 text-left hover:bg-white/5 transition-colors focus:outline-none"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Calendar className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
                          <div>
                            <div className="text-sm font-semibold text-white">
                              {formatHeaderDate(dateKey)}
                            </div>
                            <div className="text-[11px] text-white/50">
                              {completedCount} of {totalCount} tasks completed
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0 ml-2">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              dayRate === 100
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : dayRate >= 50
                                ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30'
                                : 'bg-white/5 text-white/60 border border-white/10'
                            }`}
                          >
                            {dayRate}%
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-white/50" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-white/50" />
                          )}
                        </div>
                      </button>

                      {/* Accordion Content */}
                      {isExpanded && (
                        <div className="border-t border-white/10 p-3.5 bg-slate-950/60 space-y-3">
                          {dayRecord.tasks.length === 0 ? (
                            <div className="text-xs text-white/40 py-2 text-center">
                              No tasks were recorded on this date.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {/* Completed Tasks */}
                              {completedTasks.length > 0 && (
                                <div className="space-y-1.5">
                                  <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Completed ({completedTasks.length})</span>
                                  </div>
                                  <div className="space-y-1 pl-4 border-l-2 border-emerald-500/30">
                                    {completedTasks.map((t) => (
                                      <div key={t.id} className="text-xs text-white/80 flex items-center gap-2 py-0.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                                        <span className="line-through text-white/60">{t.text}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Incomplete Tasks */}
                              {incompleteTasks.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                  <div className="text-[11px] font-semibold text-amber-400/80 flex items-center gap-1">
                                    <Circle className="w-3.5 h-3.5" />
                                    <span>Missed / Incomplete ({incompleteTasks.length})</span>
                                  </div>
                                  <div className="space-y-1 pl-4 border-l-2 border-amber-500/30">
                                    {incompleteTasks.map((t) => (
                                      <div key={t.id} className="text-xs text-white/60 flex items-center gap-2 py-0.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60 shrink-0"></span>
                                        <span>{t.text}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
