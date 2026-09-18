import React from 'react';
import { useTrackerStore } from '../../store/useTrackerStore';
import { Card } from '../ui/Card';
import { cn } from '../../utils/cn';
import { SubjectResult } from '../../types';

export function SubjectResults() {
  const { getResults, mainSubjects, optionalSubject } = useTrackerStore();
  const isReady = mainSubjects.length === 3 && optionalSubject !== null;

  if (!isReady) return null;

  const { subjectResults } = getResults();

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold text-white px-1">Subject Results</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {subjectResults.map((result) => (
          <ResultCard key={result.id} result={result} />
        ))}
      </div>
    </div>
  );
}

function ResultCard({ result, key }: { key?: React.Key, result: SubjectResult }) {
  const isFail = result.gpa === 0;
  
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <h3 className="text-base font-medium text-white">{result.name}</h3>
        <div className={cn(
          "px-2.5 py-1 rounded-md text-xs font-bold tracking-wider",
          isFail ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-brand-500/20 text-brand-300 border border-brand-500/30"
        )}>
          {result.grade}
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-white/50 font-medium uppercase">Total</span>
          <span className="text-xl font-semibold text-white/90">
            {result.totalMarks} <span className="text-sm text-white/40 font-normal">/ {result.maxMarks}</span>
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-white/50 font-medium uppercase">%</span>
          <span className="text-xl font-semibold text-white/90">
            {result.percentage.toFixed(1)}%
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-white/50 font-medium uppercase">GPA</span>
          <span className={cn(
            "text-xl font-semibold",
            isFail ? "text-rose-400" : "text-brand-300"
          )}>
            {result.gpa.toFixed(2)}
          </span>
        </div>
      </div>

      {(result.paper1Max || result.paper2Max) && (
        <div className="mt-2 pt-3 border-t border-white/5 flex items-center justify-between text-sm text-white/50">
          {result.paper1Max && (
            <span>1st: {result.paper1Total || 0}/{result.paper1Max}</span>
          )}
          {result.paper2Max && (
            <span>2nd: {result.paper2Total || 0}/{result.paper2Max}</span>
          )}
        </div>
      )}
    </Card>
  );
}
