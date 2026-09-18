import React, { useState, useEffect } from 'react';
import { useTrackerStore } from '../../store/useTrackerStore';
import { useAuth } from '../../contexts/AuthContext';
import { GroupType } from '../../types';
import { GraduationCap, ArrowRight, XCircle } from 'lucide-react';
import { AdmissionForm, AdmissionFormResult } from './AdmissionForm';
import { AdmissionResults } from './AdmissionResults';
import { checkAdmissionEligibility, AdmissionParams } from '../../engine/admission';
import { EligibilityResult } from '../../types';

export function AdmissionSection() {
  const { dbUser } = useAuth();
  const { language, getResults, group, setGroup } = useTrackerStore();
  const [showSection, setShowSection] = useState<'prompt' | 'form' | 'results' | 'hidden'>('prompt');
  
  const [eligibilityResults, setEligibilityResults] = useState<EligibilityResult[]>([]);

  const effectiveGroup = (dbUser?.group && ['SCIENCE', 'ARTS', 'COMMERCE'].includes(dbUser.group.toUpperCase()))
    ? (dbUser.group.toUpperCase() as GroupType)
    : group;

  useEffect(() => {
    if (dbUser?.group && ['SCIENCE', 'ARTS', 'COMMERCE'].includes(dbUser.group.toUpperCase())) {
      const g = dbUser.group.toUpperCase() as GroupType;
      if (group !== g) {
        setGroup(g);
      }
    }
  }, [dbUser?.group, group, setGroup]);

  const t = {
    title: language === 'EN' ? 'University Admission Eligibility' : 'বিশ্ববিদ্যালয় ভর্তি যোগ্যতা',
    promptText: language === 'EN' 
      ? 'Would you like to check which university admission tests you may be eligible to apply for based on your SSC and HSC results?'
      : 'আপনি কি জানতে চান আপনার SSC ও HSC ফলাফলের ভিত্তিতে কোন কোন বিশ্ববিদ্যালয়ের ভর্তি পরীক্ষায় আবেদন করতে পারবেন?',
    yesBtn: language === 'EN' ? 'Yes, Check Eligibility' : 'হ্যাঁ, যোগ্যতা যাচাই করুন',
    skipBtn: language === 'EN' ? 'Skip for Now' : 'এখন স্কিপ করুন',
    checkLaterBtn: language === 'EN' ? 'Check University Admission Eligibility' : 'বিশ্ববিদ্যালয় ভর্তি যোগ্যতা যাচাই করুন',
    noticeText: language === 'EN'
      ? 'Notice: The university admission eligibility list is based on the admission circulars for the 2025–26 academic session.'
      : 'বিজ্ঞপ্তি: বিশ্ববিদ্যালয় ভর্তি যোগ্যতার তালিকাটি ২০২৫–২৬ শিক্ষাবর্ষের সার্কুলার অনুযায়ী করা হয়েছে।'
  };

  const handleCheck = (data: AdmissionFormResult) => {
    const { overallResult, subjectResults } = getResults();
    
    const params: AdmissionParams = {
      group: effectiveGroup,
      sscGpa: data.sscGpa,
      sscGpaNo4th: data.sscGpaNo4th,
      hscOverallResult: overallResult,
      hscSubjectResults: subjectResults,
      sscSubjectGpas: {
         'math': data.sscMathGpa || 0,
         'physics': data.sscPhysicsGpa || 0,
         'chemistry': data.sscChemistryGpa || 0
      }
    };
    
    const results = checkAdmissionEligibility(params);
    setEligibilityResults(results);
    setShowSection('results');
  };

  if (showSection === 'hidden') {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl mt-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-brand-500/20 rounded-xl">
               <GraduationCap className="w-6 h-6 text-brand-400" />
             </div>
             <h2 className="text-xl font-semibold">{t.title}</h2>
          </div>
          <button 
            onClick={() => setShowSection('form')}
            className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl transition-colors font-medium flex items-center gap-2"
          >
            {t.checkLaterBtn} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10 flex flex-col gap-6" id="admission-section">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden relative">
        <div className="bg-brand-500/10 border-b border-brand-500/20 p-2 overflow-hidden">
           <div className="animate-marquee whitespace-nowrap text-brand-300 font-medium text-sm flex items-center justify-center">
             <span className="inline-block">{t.noticeText}</span>
           </div>
        </div>
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
             <div className="p-3 bg-gradient-to-tr from-brand-500 to-purple-500 rounded-xl shadow-lg shadow-brand-500/20 text-white">
               <GraduationCap className="w-6 h-6" />
             </div>
             <h2 className="text-2xl font-bold tracking-tight">{t.title}</h2>
          </div>

          {showSection === 'prompt' && (
            <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in duration-500">
              <p className="text-lg text-slate-300 mb-8 max-w-2xl leading-relaxed">
                {t.promptText}
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <button 
                  onClick={() => setShowSection('form')}
                  className="w-full sm:w-auto px-8 py-4 bg-brand-500 hover:bg-brand-600 text-white rounded-xl transition-all font-medium flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20"
                >
                  {t.yesBtn} <ArrowRight className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setShowSection('hidden')}
                  className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {t.skipBtn}
                </button>
              </div>
            </div>
          )}

          {showSection === 'form' && (
            <AdmissionForm group={effectiveGroup} onSubmit={handleCheck} onCancel={() => setShowSection('prompt')} />
          )}

          {showSection === 'results' && (
            <AdmissionResults results={eligibilityResults} language={language} onRecheck={() => setShowSection('form')} />
          )}
        </div>
      </div>
    </div>
  );
}
