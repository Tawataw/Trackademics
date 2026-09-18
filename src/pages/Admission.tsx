import React from 'react';
import { AdmissionSection } from '../components/admission/AdmissionSection';

export function Admission() {
  return (
    <div className="flex flex-col gap-8 text-white max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Admission Eligibility</h1>
        <p className="text-white/60 mt-1">Check which universities you are eligible to apply to based on your academic profile.</p>
      </div>
      <AdmissionSection />
    </div>
  );
}
