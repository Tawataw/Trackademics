import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTrackerStore } from '../store/useTrackerStore';
import { dbApi, SyllabusProgress } from '../lib/db';
import { formatClassName, formatGroupName } from '../utils/formatters';
import { 
  SYLLABUS_DATA, 
  SyllabusSubjectConfig, 
  ChapterBasedSyllabus, 
  CountBasedSyllabus, 
  SyllabusChapter,
  getChapterProgressInfo,
  calculatePaperProgress,
  calculateOverallSyllabusProgress
} from '../config/syllabus';
import { CheckCircle2, Circle, Minus, Plus } from 'lucide-react';

export function SyllabusTracker() {
  const { user, dbUser } = useAuth();
  const storeGroup = useTrackerStore(state => state.group);
  const [progress, setProgress] = useState<Record<string, SyllabusProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      dbApi.getSyllabusProgress(user.uid).then(res => {
        const pMap: Record<string, SyllabusProgress> = {};
        res.forEach(p => pMap[p.id] = p);
        setProgress(pMap);
        setLoading(false);
      });
    }
  }, [user]);

  if (loading) return <div className="text-white animate-pulse">Loading syllabus...</div>;

  const userGroup = (dbUser?.group && ['SCIENCE', 'ARTS', 'COMMERCE'].includes(dbUser.group.toUpperCase())) 
    ? dbUser.group.toUpperCase() 
    : (storeGroup || 'SCIENCE');
  const relevantSubjects = SYLLABUS_DATA.filter(s => s.group === 'COMMON' || s.group === userGroup);

  const toggleChapter = async (
    subjectId: string,
    paper: string,
    chapterId: string,
    paperConfig: ChapterBasedSyllabus
  ) => {
    if (!user) return;
    const progressId = `${user.uid}_${subjectId}_${paper}`;
    const existing = progress[progressId] || {
      id: progressId,
      uid: user.uid,
      subject: subjectId,
      paper,
      completedItems: [],
      numericCounts: {},
      totalItems: paperConfig.chapters.length,
      updatedAt: Date.now()
    };
    
    let newCompleted = [...(existing.completedItems || [])];
    if (newCompleted.includes(chapterId)) {
      newCompleted = newCompleted.filter(id => id !== chapterId);
    } else {
      newCompleted.push(chapterId);
    }

    // Compute proportional total completion across all chapters
    let paperCompleted = 0;
    paperConfig.chapters.forEach(chap => {
      if (chap.isNumeric && chap.maxCount) {
        const c = typeof existing.numericCounts?.[chap.id] === 'number'
          ? existing.numericCounts[chap.id]
          : (newCompleted.includes(chap.id) ? chap.maxCount : 0);
        paperCompleted += Math.max(0, Math.min(chap.maxCount, c)) / chap.maxCount;
      } else {
        if (newCompleted.includes(chap.id)) paperCompleted += 1;
      }
    });
    
    const newProgress: SyllabusProgress = {
      ...existing,
      completedItems: newCompleted,
      completedCount: Number(paperCompleted.toFixed(2)),
      totalItems: paperConfig.chapters.length,
      updatedAt: Date.now()
    };
    setProgress(prev => ({ ...prev, [progressId]: newProgress }));
    await dbApi.saveSyllabusProgress(newProgress);
  };

  const setNumericChapterCount = async (
    subjectId: string,
    paper: string,
    chapterId: string,
    rawCount: number,
    maxCount: number,
    paperConfig: ChapterBasedSyllabus
  ) => {
    if (!user) return;
    const progressId = `${user.uid}_${subjectId}_${paper}`;
    const existing = progress[progressId] || {
      id: progressId,
      uid: user.uid,
      subject: subjectId,
      paper,
      completedItems: [],
      numericCounts: {},
      totalItems: paperConfig.chapters.length,
      updatedAt: Date.now()
    };

    const count = isNaN(rawCount) ? 0 : Math.max(0, Math.min(maxCount, rawCount));
    const newNumericCounts = { ...(existing.numericCounts || {}), [chapterId]: count };

    let newCompleted = [...(existing.completedItems || [])];
    if (count === maxCount) {
      if (!newCompleted.includes(chapterId)) newCompleted.push(chapterId);
    } else {
      newCompleted = newCompleted.filter(id => id !== chapterId);
    }

    // Compute proportional total completion across all chapters
    let paperCompleted = 0;
    paperConfig.chapters.forEach(chap => {
      if (chap.id === chapterId) {
        paperCompleted += count / maxCount;
      } else if (chap.isNumeric && chap.maxCount) {
        const c = typeof newNumericCounts[chap.id] === 'number'
          ? newNumericCounts[chap.id]
          : (newCompleted.includes(chap.id) ? chap.maxCount : 0);
        paperCompleted += Math.max(0, Math.min(chap.maxCount, c)) / chap.maxCount;
      } else {
        if (newCompleted.includes(chap.id)) paperCompleted += 1;
      }
    });

    const newProgress: SyllabusProgress = {
      ...existing,
      completedItems: newCompleted,
      numericCounts: newNumericCounts,
      completedCount: Number(paperCompleted.toFixed(2)),
      totalItems: paperConfig.chapters.length,
      updatedAt: Date.now()
    };

    setProgress(prev => ({ ...prev, [progressId]: newProgress }));
    await dbApi.saveSyllabusProgress(newProgress);
  };

  const setNumericCount = async (subjectId: string, paper: string, count: number, totalItems: number) => {
    if (!user) return;
    const progressId = `${user.uid}_${subjectId}_${paper}`;
    const completedItems = Array.from({length: count}).map((_, i) => `item_${i}`);
    const newProgress: SyllabusProgress = {
      id: progressId,
      uid: user.uid,
      subject: subjectId,
      paper,
      completedItems,
      completedCount: count,
      totalItems,
      updatedAt: Date.now()
    };
    setProgress(prev => ({ ...prev, [progressId]: newProgress }));
    await dbApi.saveSyllabusProgress(newProgress);
  };

  const renderPaper = (
    subjectId: string,
    paperName: string,
    paperConfig: ChapterBasedSyllabus | CountBasedSyllabus | undefined
  ) => {
    if (!paperConfig) return null;
    const progressId = `${user?.uid}_${subjectId}_${paperName}`;
    const currProg = progress[progressId];
    const { completed, total } = calculatePaperProgress(paperConfig, currProg);
    const displayCompleted = Number.isInteger(completed) ? completed : Number(completed.toFixed(1));
    
    if (paperConfig.type === 'chapters') {
      return (
        <div className="mb-6 last:mb-0">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-bold text-white/80">{paperName === 'paper1' ? '1st Paper' : '2nd Paper'}</h4>
            <span className="text-sm font-medium text-brand-400">{displayCompleted} / {total}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {paperConfig.chapters.map(chap => {
              const info = getChapterProgressInfo(chap, currProg);

              if (chap.isNumeric && chap.maxCount) {
                return (
                  <div
                    key={chap.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                      info.count === chap.maxCount
                        ? 'bg-brand-500/10 border-brand-500/30'
                        : info.count > 0
                        ? 'bg-white/[0.07] border-white/20'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-white">{chap.name}</span>
                          {info.count === chap.maxCount && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-brand-400" /> Completed
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-white/50">
                          {info.count} of {chap.maxCount} completed ({Math.round(info.ratio * 100)}%)
                        </span>
                      </div>
                    </div>

                    {/* Progress track */}
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.round(info.ratio * 100)}%` }}
                      />
                    </div>

                    {/* Modern numeric stepper & input controls */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-xs text-white/60 font-medium">Completed units:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setNumericChapterCount(subjectId, paperName, chap.id, info.count - 1, chap.maxCount!, paperConfig)}
                          disabled={info.count <= 0}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-white"
                          aria-label="Decrease count"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            max={chap.maxCount}
                            value={info.count}
                            onChange={e => {
                              const val = parseInt(e.target.value);
                              setNumericChapterCount(subjectId, paperName, chap.id, isNaN(val) ? 0 : val, chap.maxCount!, paperConfig);
                            }}
                            className="w-14 text-center bg-black/40 border border-white/15 focus:border-brand-400 rounded-lg py-1 text-sm font-bold text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="text-xs text-white/40 font-medium">/ {chap.maxCount}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setNumericChapterCount(subjectId, paperName, chap.id, info.count + 1, chap.maxCount!, paperConfig)}
                          disabled={info.count >= chap.maxCount}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-white"
                          aria-label="Increase count"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={chap.id}
                  type="button"
                  onClick={() => toggleChapter(subjectId, paperName, chap.id, paperConfig)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-colors ${
                    info.isChecked ? 'bg-brand-500/10 border-brand-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {info.isChecked ? (
                    <CheckCircle2 className="w-5 h-5 text-brand-400 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-white/30 flex-shrink-0" />
                  )}
                  <span className={`text-sm ${info.isChecked ? 'text-white font-medium' : 'text-white/70'}`}>
                    {chap.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      );
    } else {
      const completed = currProg ? currProg.completedItems.length : 0;
      const total = paperConfig.totalItems;
      return (
        <div className="mb-6 last:mb-0">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-bold text-white/80">{paperName === 'paper1' ? '1st Paper' : '2nd Paper'}</h4>
            <span className="text-sm font-medium text-brand-400">{completed} / {total}</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-2">
            <label className="text-sm text-white/70">{paperConfig.itemName} completed:</label>
            <input 
              type="range" 
              min="0" 
              max={total} 
              value={completed} 
              onChange={e => setNumericCount(subjectId, paperName, parseInt(e.target.value), total)}
              className="w-full accent-brand-500"
            />
          </div>
        </div>
      );
    }
  };

  const { overallCompleted, overallTotal, percent: overallPercent } = calculateOverallSyllabusProgress(
    userGroup,
    progress,
    user?.uid
  );
  const displayOverallCompleted = Number.isInteger(overallCompleted) ? overallCompleted : Number(overallCompleted.toFixed(1));

  return (
    <div className="flex flex-col gap-8 text-white max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Syllabus Tracker</h1>
        <p className="text-white/60 mt-1">
          Track your preparation for HSC {formatClassName(dbUser?.class)} ({formatGroupName(userGroup)} Group).
        </p>
      </div>

      <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Overall Progress</h2>
          <p className="text-sm text-white/60">{displayOverallCompleted} out of {overallTotal} topics completed</p>
        </div>
        <div className="text-3xl font-bold text-brand-400">{overallPercent}%</div>
      </div>

      <div className="flex flex-col gap-6">
        {relevantSubjects.map(subject => {
          let sTotal = 0;
          let sComp = 0;
          if (subject.paper1) {
            const p1Prog = progress[`${user?.uid}_${subject.id}_paper1`];
            const p1Calc = calculatePaperProgress(subject.paper1, p1Prog);
            sTotal += p1Calc.total;
            sComp += p1Calc.completed;
          }
          if (subject.paper2) {
            const p2Prog = progress[`${user?.uid}_${subject.id}_paper2`];
            const p2Calc = calculatePaperProgress(subject.paper2, p2Prog);
            sTotal += p2Calc.total;
            sComp += p2Calc.completed;
          }
          const sPct = sTotal > 0 ? Math.round((sComp / sTotal) * 100) : 0;

          return (
            <div key={subject.id} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                <h3 className="text-xl font-bold">{subject.name}</h3>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full transition-all duration-300" style={{ width: `${sPct}%` }}></div>
                  </div>
                  <span className="text-sm font-bold w-10 text-right">{sPct}%</span>
                </div>
              </div>
              
              {renderPaper(subject.id, 'paper1', subject.paper1)}
              {renderPaper(subject.id, 'paper2', subject.paper2)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
