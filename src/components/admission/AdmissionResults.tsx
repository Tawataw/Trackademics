import React, { useState } from 'react';
import { EligibilityResult } from '../../engine/admission';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, RefreshCw, Filter, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AdmissionResultsProps {
  results: EligibilityResult[];
  language: 'EN' | 'BN';
  onRecheck: () => void;
}

export function AdmissionResults({ results, language, onRecheck }: AdmissionResultsProps) {
  const [filter, setFilter] = useState<'all' | 'eligible' | 'not-eligible'>('all');
  const [search, setSearch] = useState('');
  
  const t = {
    title: language === 'EN' ? 'Analysis Results' : 'ফলাফল বিশ্লেষণ',
    eligible: language === 'EN' ? 'ELIGIBLE' : 'আবেদনযোগ্য',
    notEligible: language === 'EN' ? 'NOT ELIGIBLE' : 'আবেদনযোগ্য নয়',
    all: language === 'EN' ? 'All' : 'সব',
    recheck: language === 'EN' ? 'Re-check' : 'পুনরায় যাচাই করুন',
    searchPlaceholder: language === 'EN' ? 'Search university...' : 'বিশ্ববিদ্যালয় খুঁজুন...',
    category: language === 'EN' ? 'Category: ' : 'ক্যাটাগরি: ',
    reasons: language === 'EN' ? 'Reason' : 'কারণ',
    examInfo: language === 'EN' ? 'Exam Info' : 'পরীক্ষার তথ্য'
  };

  const filteredResults = results.filter(r => {
    const matchSearch = r.university.toLowerCase().includes(search.toLowerCase()) || r.unit.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filter === 'all' ? true : (filter === 'eligible' ? r.isEligible : !r.isEligible);
    return matchSearch && matchStatus;
  });

  const categories = [
    "Medical & Dental",
    "Engineering & Technology",
    "Science / A-Type Units",
    "General / B-Type Units",
    "Public Universities"
  ];

  // Map to actual category names used in the engine
  const groupedResults = categories.map(cat => ({
    category: cat,
    items: filteredResults.filter(r => r.category === cat)
  })).filter(g => g.items.length > 0);

  const eligibleCount = results.filter(r => r.isEligible).length;
  const notEligibleCount = results.filter(r => !r.isEligible).length;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="text-3xl font-bold text-white">{results.length}</div>
          <div className="text-sm text-slate-400 font-medium">Total Analyzed</div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="text-3xl font-bold text-emerald-400">{eligibleCount}</div>
          <div className="text-sm text-emerald-500 font-medium">{t.eligible}</div>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="text-3xl font-bold text-red-400">{notEligibleCount}</div>
          <div className="text-sm text-red-500 font-medium">{t.notEligible}</div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/5 border border-white/10 p-4 rounded-2xl">
         <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${filter === 'all' ? 'bg-white/20 text-white' : 'bg-transparent text-slate-400 hover:text-white'}`}
            >
              {t.all}
            </button>
            <button 
              onClick={() => setFilter('eligible')}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${filter === 'eligible' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-transparent text-slate-400 hover:text-emerald-300'}`}
            >
              {t.eligible}
            </button>
            <button 
              onClick={() => setFilter('not-eligible')}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${filter === 'not-eligible' ? 'bg-red-500/20 text-red-300' : 'bg-transparent text-slate-400 hover:text-red-300'}`}
            >
              {t.notEligible}
            </button>
         </div>
         <div className="flex items-center gap-2 w-full md:w-auto">
            <button 
              onClick={onRecheck}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors shrink-0"
              title={t.recheck}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
         </div>
      </div>

      <div className="flex flex-col gap-10">
        {groupedResults.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
             No universities match your filters.
          </div>
        ) : (
          groupedResults.map(group => (
            <div key={group.category} className="flex flex-col gap-4">
              <div className="flex items-center gap-4 mb-2">
                <h3 className="text-xl font-bold text-white tracking-wide">{group.category}</h3>
                <div className="h-px bg-white/10 flex-1"></div>
              </div>
              
              <div className="flex flex-col gap-3">
                {group.items.map((result, idx) => (
                  <ResultCard key={`${result.university}-${result.unit}-${idx}`} result={result} language={language} t={t} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const ResultCard: React.FC<{ result: EligibilityResult; language: string; t: any }> = ({ result, language, t }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className={`border rounded-xl overflow-hidden transition-all duration-300 ${result.isEligible ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-[#1e293b]/50 border-white/10'}`}>
      <div 
        className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="flex-1">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              {result.university} 
              <span className="text-xs px-2 py-0.5 bg-white/10 text-white/70 rounded font-normal tracking-wide">{result.unit}</span>
            </h4>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className={`px-3 py-1 rounded-md text-xs font-bold tracking-widest ${result.isEligible ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            {result.isEligible ? `[ ${t.eligible} ]` : `[ ${t.notEligible} ]`}
          </span>
          {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="p-5 border-t border-white/5 bg-black/20">
          <h5 className="text-sm font-semibold text-slate-300 mb-3">{t.reasons}:</h5>
          <ul className="flex flex-col gap-2.5">
            {result.reasons.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm leading-relaxed">
                <span className="mt-0.5 shrink-0">
                  {reason.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                </span>
                <span className={reason.passed ? 'text-slate-300' : 'text-red-300 font-medium'}>
                  {language === 'EN' ? reason.textEn : reason.textBn}
                </span>
              </li>
            ))}
            
            {result.isEligible && (
              <li className="flex items-start gap-2 text-sm leading-relaxed mt-1">
                <span className="mt-0.5 shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </span>
                <span className="text-slate-300">
                  {language === 'EN' ? "All required conditions satisfied." : "সকল প্রয়োজনীয় শর্তাবলী সন্তুষ্ট।"}
                </span>
              </li>
            )}
            
            {!result.isEligible && (
              <li className="flex items-start gap-2 text-sm leading-relaxed mt-1 border-t border-white/10 pt-2">
                <span className="mt-0.5 shrink-0">
                  <XCircle className="w-4 h-4 text-red-400" />
                </span>
                <span className="text-red-300 font-bold">
                  {language === 'EN' ? "Therefore the requirement is not satisfied." : "অতএব প্রয়োজনীয় শর্ত পূরণ হয়নি।"}
                </span>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
