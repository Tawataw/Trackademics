import { useTrackerStore } from '../../store/useTrackerStore';
import { Card } from '../ui/Card';
import { Trophy, Target, Star, Calculator, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export function DashboardSummary() {
  const { getResults, mainSubjects, optionalSubject } = useTrackerStore();
  const { overallResult } = getResults();

  const isReady = mainSubjects.length === 3 && optionalSubject !== null;

  if (!isReady) {
    return (
      <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2 border-white/20 bg-white/5">
        <Calculator className="w-12 h-12 text-white/40 mb-4" />
        <h3 className="text-xl font-medium text-white mb-2">Select Your Subjects</h3>
        <p className="text-white/50 max-w-sm">
          Please select your group, 3 main subjects, and 1 optional subject to start seeing your GPA prediction.
        </p>
      </Card>
    );
  }

  const passColor = overallResult.isPass ? "text-emerald-400" : "text-rose-400";
  const passBg = overallResult.isPass ? "bg-emerald-500/20 border-emerald-500/30" : "bg-rose-500/20 border-rose-500/30";
  const PassIcon = overallResult.isPass ? CheckCircle2 : AlertCircle;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Main Hero Card */}
      <Card className="col-span-1 md:col-span-2 lg:col-span-2 flex flex-col justify-between p-8 bg-gradient-to-br from-brand-600/40 to-purple-600/40 border border-white/10 relative overflow-hidden">
        <div className="absolute right-[-20px] top-[-20px] w-64 h-64 bg-brand-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-0 right-0 p-8 opacity-20">
          <Trophy className="w-32 h-32 text-white" />
        </div>
        <div className="relative z-10 flex flex-col gap-2">
          <span className="text-xs uppercase tracking-widest text-brand-300 font-bold mb-2 block">Expected HSC GPA</span>
          <div className="flex items-end gap-3 mt-1">
            <h2 className="text-6xl font-light tracking-tight text-white">
              {overallResult.finalGpa.toFixed(2)}
            </h2>
            <span className="text-2xl text-white/50 mb-1.5 font-light">/ 5.00</span>
          </div>
        </div>
        <div className="relative z-10 mt-6 flex items-center gap-3">
          <div className={cn("inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-sm font-semibold tracking-wide backdrop-blur-md", passBg, passColor)}>
            <PassIcon className="w-4 h-4" />
            {overallResult.isPass ? 'PASS' : 'FAIL'}
          </div>
          {!overallResult.isPass && (
            <span className="text-xs text-rose-400 font-medium">
              Failed: {overallResult.failedSubjects.join(', ')}
            </span>
          )}
        </div>
      </Card>

      <SummaryStat 
        label="Total Marks" 
        value={`${overallResult.totalMarks}`} 
        subValue={`/ ${overallResult.maxMarks}`}
        icon={Target}
        color="text-blue-400"
      />
      
      <div className="flex flex-col gap-4">
        <SummaryStat 
          label="Percentage" 
          value={`${overallResult.percentage.toFixed(2)}%`} 
          icon={Star}
          color="text-amber-400"
          className="h-full"
        />
        <SummaryStat 
          label="Optional Bonus" 
          value={`+${overallResult.optionalBonus.toFixed(2)}`} 
          icon={Calculator}
          color="text-brand-400"
          className="h-full"
        />
      </div>
    </div>
  );
}

function SummaryStat({ label, value, subValue, icon: Icon, color, className }: any) {
  return (
    <Card className={cn("flex flex-col justify-between p-6 bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl", className)}>
      <div className="flex justify-between items-start">
        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
          <Icon className={cn("w-6 h-6", color)} />
        </div>
      </div>
      <div className="mt-4">
        <span className="text-4xl font-bold block text-white">{value}</span>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-white/50 text-sm font-medium">{label}</span>
          {subValue && <span className="text-white/40 text-sm">{subValue}</span>}
        </div>
      </div>
    </Card>
  );
}
