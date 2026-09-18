import React, { useState } from 'react';
import { useTrackerStore } from '../../store/useTrackerStore';
import { GroupType } from '../../types';
import { Search, X } from 'lucide-react';

export interface AdmissionFormResult {
  sscGpa: number;
  sscGpaNo4th: number;
  sscMathGpa?: number;
  sscPhysicsGpa?: number;
  sscChemistryGpa?: number;
}

interface AdmissionFormProps {
  group?: GroupType;
  onSubmit: (data: AdmissionFormResult) => void;
  onCancel: () => void;
}

export function AdmissionForm({ group: propGroup, onSubmit, onCancel }: AdmissionFormProps) {
  const { language, group: storeGroup } = useTrackerStore();
  const group = propGroup || storeGroup;
  const [sscGpa, setSscGpa] = useState<string>('');
  const [sscGpaNo4th, setSscGpaNo4th] = useState<string>('');
  
  const [sscMath, setSscMath] = useState<string>('');
  const [sscPhysics, setSscPhysics] = useState<string>('');
  const [sscChemistry, setSscChemistry] = useState<string>('');
  
  const [error, setError] = useState<string>('');

  const t = {
    title: language === 'EN' ? 'Enter SSC Information' : 'SSC এর তথ্য দিন',
    sscGpaLabel: language === 'EN' ? 'SSC GPA (With 4th Subject)' : 'SSC জিপিএ (৪র্থ বিষয় সহ)',
    sscGpaNo4thLabel: language === 'EN' ? 'SSC GPA (Without 4th Subject)' : 'SSC জিপিএ (৪র্থ বিষয় ব্যতীত)',
    sscMath: language === 'EN' ? 'SSC Math GPA' : 'SSC গণিত জিপিএ',
    sscPhysics: language === 'EN' ? 'SSC Physics GPA' : 'SSC পদার্থবিজ্ঞান জিপিএ',
    sscChemistry: language === 'EN' ? 'SSC Chemistry GPA' : 'SSC রসায়ন জিপিএ',
    submit: language === 'EN' ? 'Analyze Eligibility' : 'যোগ্যতা যাচাই করুন',
    cancel: language === 'EN' ? 'Cancel' : 'বাতিল করুন',
    errorInvalid: language === 'EN' ? 'Please enter a valid GPA between 0.00 and 5.00' : 'দয়া করে ০.০০ থেকে ৫.০০ এর মধ্যে সঠিক জিপিএ দিন'
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const gpa = parseFloat(sscGpa);
    const gpaNo4th = parseFloat(sscGpaNo4th);
    
    if (isNaN(gpa) || gpa < 0 || gpa > 5 || isNaN(gpaNo4th) || gpaNo4th < 0 || gpaNo4th > 5) {
      setError(t.errorInvalid);
      return;
    }
    
    let math = undefined, phy = undefined, chem = undefined;
    if (group === 'SCIENCE') {
       math = parseFloat(sscMath);
       phy = parseFloat(sscPhysics);
       chem = parseFloat(sscChemistry);
       if (isNaN(math) || math < 0 || math > 5 || isNaN(phy) || phy < 0 || phy > 5 || isNaN(chem) || chem < 0 || chem > 5) {
          setError(t.errorInvalid);
          return;
       }
    }
    
    setError('');
    onSubmit({
      sscGpa: gpa,
      sscGpaNo4th: gpaNo4th,
      sscMathGpa: math,
      sscPhysicsGpa: phy,
      sscChemistryGpa: chem
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4 text-white">{t.title}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-slate-400 font-medium">{t.sscGpaLabel}</label>
            <input
              type="number" step="0.01" min="0" max="5" value={sscGpa} onChange={(e) => { setSscGpa(e.target.value); setError(''); }}
              className="bg-surface-900/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500/50" placeholder="5.00" required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-slate-400 font-medium">{t.sscGpaNo4thLabel}</label>
            <input
              type="number" step="0.01" min="0" max="5" value={sscGpaNo4th} onChange={(e) => { setSscGpaNo4th(e.target.value); setError(''); }}
              className="bg-surface-900/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500/50" placeholder="5.00" required
            />
          </div>
        </div>

        {group === 'SCIENCE' && (
          <div className="mt-4 border-t border-white/10 pt-4">
             <p className="text-sm text-white/60 mb-4">BUET requires individual SSC subject GPAs:</p>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-slate-400 font-medium">{t.sscMath}</label>
                  <input type="number" step="0.01" min="0" max="5" value={sscMath} onChange={(e) => setSscMath(e.target.value)} className="bg-surface-900/50 border border-white/10 text-white rounded-xl px-4 py-3" required />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-slate-400 font-medium">{t.sscPhysics}</label>
                  <input type="number" step="0.01" min="0" max="5" value={sscPhysics} onChange={(e) => setSscPhysics(e.target.value)} className="bg-surface-900/50 border border-white/10 text-white rounded-xl px-4 py-3" required />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-slate-400 font-medium">{t.sscChemistry}</label>
                  <input type="number" step="0.01" min="0" max="5" value={sscChemistry} onChange={(e) => setSscChemistry(e.target.value)} className="bg-surface-900/50 border border-white/10 text-white rounded-xl px-4 py-3" required />
                </div>
             </div>
          </div>
        )}

        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
      </div>

      <div className="flex gap-4">
        <button type="button" onClick={onCancel} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl flex-1 sm:flex-none">
          <X className="w-4 h-4 inline" /> {t.cancel}
        </button>
        <button type="submit" className="px-8 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl flex-1 sm:flex-none">
          <Search className="w-4 h-4 inline" /> {t.submit}
        </button>
      </div>
    </form>
  );
}
