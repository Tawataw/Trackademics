import { useTrackerStore } from '../../store/useTrackerStore';
import { Button } from '../ui/Button';
import { RefreshCcw, Share2, Printer } from 'lucide-react';

export function ActionButtons() {
  const { resetAll, getResults, group, mainSubjects, optionalSubject } = useTrackerStore();

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all data? This cannot be undone.")) {
      resetAll();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const { overallResult } = getResults();
    if (mainSubjects.length !== 3 || !optionalSubject) {
        alert("Please complete your subject selection and marks first.");
        return;
    }

    const text = `HSC Tracker
Group: ${group === 'ARTS' ? 'Arts / Humanities' : group.charAt(0).toUpperCase() + group.slice(1).toLowerCase()}

Total Marks: ${overallResult.totalMarks}/${overallResult.maxMarks}
Percentage: ${overallResult.percentage.toFixed(2)}%
GPA: ${overallResult.finalGpa.toFixed(2)}
Status: ${overallResult.isPass ? 'PASS' : 'FAIL'}
`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My HSC Result Prediction',
          text: text,
        });
        return;
      } catch (err) {
        console.error("Share failed", err);
      }
    }
    
    // Fallback
    try {
      await navigator.clipboard.writeText(text);
      alert("Result copied to clipboard!");
    } catch (err) {
      alert("Failed to copy text.");
    }
  };

  return (
    <div className="flex flex-wrap gap-4 items-center mt-8 pt-8 border-t border-white/10 pb-8">
      <Button variant="secondary" onClick={handleShare} className="gap-2">
        <Share2 className="w-4 h-4" /> Share / Copy
      </Button>
      <Button variant="secondary" onClick={handlePrint} className="gap-2">
        <Printer className="w-4 h-4" /> Print Result
      </Button>
      <div className="flex-1" />
      <Button variant="outline" onClick={handleReset} className="gap-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 hover:border-rose-500/30">
        <RefreshCcw className="w-4 h-4" /> Reset All Data
      </Button>
    </div>
  );
}
