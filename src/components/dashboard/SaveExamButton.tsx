import React, { useState } from 'react';
import { useTrackerStore } from '../../store/useTrackerStore';
import { useAuth } from '../../contexts/AuthContext';
import { dbApi } from '../../lib/db';
import { Save, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function SaveExamButton() {
  const { getResults } = useTrackerStore();
  const { user, dbUser } = useAuth();
  const navigate = useNavigate();
  const [examType, setExamType] = useState('Half-Yearly');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!user || !dbUser) return null;

  const handleSave = async () => {
    const results = getResults();
    setLoading(true);
    
    try {
      const examId = `${user.uid}_${Date.now()}`;
      await dbApi.saveExam({
        id: examId,
        uid: user.uid,
        class: dbUser.class || 'Class 11',
        group: dbUser.group || 'SCIENCE',
        examType,
        date: Date.now(),
        subjects: results.subjectResults,
        totalMarks: results.overallResult.totalMarks,
        GPA: results.overallResult.finalGpa,
        status: results.overallResult.isPass ? 'Pass' : 'Fail'
      });
      setSaved(true);
      setTimeout(() => navigate('/academic'), 1500);
    } catch (e) {
      console.error('Failed to save exam to cloud:', e);
      alert('Failed to save exam record to cloud database. Please verify your connection.');
      setLoading(false);
    }
  };

  const types = dbUser.class === 'Class 11' ? ['Half-Yearly', 'Yearly'] : 
                dbUser.class === 'Class 12' ? ['Pre-Test', 'Test'] : 
                ['Test', 'HSC Result'];

  // Default selection if current is invalid for class
  React.useEffect(() => {
    if (!types.includes(examType)) {
      setExamType(types[0]);
    }
  }, [JSON.stringify(types), examType]);

  const results = getResults();
  const isTestAndClass12 = dbUser.class === 'Class 12' && examType === 'Test';

  return (
    <div className="flex flex-col gap-4 mt-8">
      {isTestAndClass12 && (
        <div className={`p-4 rounded-2xl border flex gap-3 ${results.overallResult.isPass ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
          <Info className={`w-5 h-5 shrink-0 ${results.overallResult.isPass ? 'text-emerald-400' : 'text-red-400'}`} />
          <p className="text-sm font-medium text-white/90">
            {results.overallResult.isPass 
              ? "Congratulations! You have passed the Test Examination and are now eligible to sit for the HSC Examination."
              : "You did not pass the Test Examination. Don’t give up—use your performance report to identify weak areas and prepare for the next opportunity."}
          </p>
        </div>
      )}
      
      <div className="bg-brand-500/10 border border-brand-500/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg text-brand-400 mb-1">Save Examination Record</h3>
          <p className="text-sm text-white/70">Save this calculation to your academic history to track progress.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select 
            value={examType}
            onChange={e => setExamType(e.target.value)}
            className="bg-[#1e293b] border border-white/20 text-white rounded-xl px-4 py-2 focus:outline-none focus:border-brand-500 w-full sm:w-40"
          >
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button 
            onClick={handleSave}
            disabled={loading || saved}
            className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 transition-colors text-white font-bold py-2 px-6 rounded-xl flex items-center gap-2 whitespace-nowrap"
          >
            <Save className="w-4 h-4" />
            {saved ? 'Saved!' : loading ? 'Saving...' : 'Save Exam'}
          </button>
        </div>
      </div>
    </div>
  );
}
