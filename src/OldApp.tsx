/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GroupSelector } from './components/dashboard/GroupSelector';
import { SubjectSelector } from './components/dashboard/SubjectSelector';
import { MarkInputSection } from './components/dashboard/MarkInputSection';
import { DashboardSummary } from './components/dashboard/DashboardSummary';
import { SubjectResults } from './components/dashboard/SubjectResults';
import { Statistics } from './components/dashboard/Statistics';
import { ActionButtons } from './components/dashboard/ActionButtons';
import { TargetGPA } from './components/dashboard/TargetGPA';
import { AdmissionSection } from './components/admission/AdmissionSection';
import { SaveExamButton } from './components/dashboard/SaveExamButton';
import { useTrackerStore } from './store/useTrackerStore';
import { GraduationCap, Languages } from 'lucide-react';

export default function App() {
  const { language, setLanguage } = useTrackerStore();

  const toggleLanguage = () => {
    setLanguage(language === 'EN' ? 'BN' : 'EN');
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-brand-500 selection:text-white relative overflow-hidden font-sans">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/30 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/30 rounded-full blur-[120px]"></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[40%] bg-pink-500/20 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen h-full overflow-auto">
        <header className="sticky top-0 z-50 bg-white/5 backdrop-blur-2xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-tr from-brand-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">
                  HSC Tracker
                </h1>
              </div>
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-sm font-medium"
              >
                <Languages className="w-4 h-4" />
                {language === 'EN' ? 'বাংলা' : 'English'}
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-10 w-full flex-1">
          <section className="flex flex-col gap-6">
            <GroupSelector />
            <SubjectSelector />
          </section>

          <section>
            <DashboardSummary />
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div className="xl:col-span-7 flex flex-col gap-10">
              <MarkInputSection />
              <TargetGPA />
            </div>
            <div className="xl:col-span-5 flex flex-col gap-10">
              <SubjectResults />
              <Statistics />
            </div>
          </div>

          <ActionButtons />
          <SaveExamButton />
          
          <AdmissionSection />
        </main>
      </div>
    </div>
  );
}
