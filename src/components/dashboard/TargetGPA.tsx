import { useState } from 'react';
import { useTrackerStore } from '../../store/useTrackerStore';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Target, TrendingUp } from 'lucide-react';
import { cn } from '../../utils/cn';

export function TargetGPA() {
  const { getResults, mainSubjects, optionalSubject, targetGpa, setTargetGpa } = useTrackerStore();
  const [inputVal, setInputVal] = useState(targetGpa?.toString() || '');
  
  const isReady = mainSubjects.length === 3 && optionalSubject !== null;
  if (!isReady) return null;

  const { overallResult } = getResults();
  
  const handleSave = () => {
    let v = parseFloat(inputVal);
    if (isNaN(v)) {
      setTargetGpa(null);
      setInputVal('');
      return;
    }
    if (v < 0) v = 0;
    if (v > 5.0) v = 5.0;
    setTargetGpa(v);
    setInputVal(v.toString());
  };

  const gap = targetGpa ? targetGpa - overallResult.finalGpa : null;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold text-white px-1">Target GPA & What-If Analysis</h2>
      <Card className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1 max-w-xs">
            <Input 
              label="Set Target GPA (0.00 - 5.00)" 
              type="number" 
              step="0.01"
              min="0"
              max="5"
              value={inputVal} 
              onChange={e => setInputVal(e.target.value)} 
              placeholder="e.g. 5.00"
            />
          </div>
          <button 
            onClick={handleSave}
            className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2.5 rounded-2xl font-medium transition-colors mb-0.5 shadow-lg shadow-brand-500/20 whitespace-nowrap"
          >
            Set Target
          </button>
        </div>

        {targetGpa !== null && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/10">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-white/50">Target</span>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-brand-400" />
                <span className="text-2xl font-bold text-white">{targetGpa.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-white/50">Current</span>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-white/40" />
                <span className="text-2xl font-bold text-white">{overallResult.finalGpa.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-white/50">Gap</span>
              <span className={cn(
                "text-2xl font-bold",
                (gap ?? 0) > 0 ? "text-amber-400" : "text-emerald-400"
              )}>
                {(gap ?? 0) > 0 ? `+${gap?.toFixed(2)}` : 'Met'}
              </span>
            </div>
          </div>
        )}
        
        {targetGpa !== null && gap !== null && gap > 0 && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-200/90">
            <p>You need to improve your GPA by <strong>{gap.toFixed(2)}</strong> points.</p>
            <p className="mt-1">Check the <strong>Improvement Guide</strong> to see which subjects are closest to the next grade boundary.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
