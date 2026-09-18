import React from 'react';
import { useTrackerStore } from '../../store/useTrackerStore';
import { COMMON_SUBJECTS } from '../../config/subjects';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { SubjectConfig, PaperConfig } from '../../types';

export function MarkInputSection() {
  const { 
    mainSubjects, optionalSubject, marks, setMarks,
    getAvailableMainSubjects, getAvailableOptionalSubjects 
  } = useTrackerStore();

  const allConfigs = [
    ...COMMON_SUBJECTS,
    ...getAvailableMainSubjects().filter(s => mainSubjects.includes(s.id)),
  ];

  const optionalConf = getAvailableOptionalSubjects().find(s => s.id === optionalSubject);
  if (optionalConf) {
    allConfigs.push({ ...optionalConf, name: `${optionalConf.name} (Optional)` });
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold text-white px-1">Enter Expected Marks</h2>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {allConfigs.map(subj => (
          <SubjectCard key={subj.id} subject={subj} marks={marks[subj.id] || {}} setMarks={(paper, comp, val) => setMarks(subj.id, paper, comp, val)} />
        ))}
      </div>
    </div>
  );
}

function SubjectCard({ subject, marks, setMarks }: { key?: React.Key; subject: SubjectConfig, marks: any, setMarks: (p: any, c: any, v: any) => void }) {
  return (
    <Card className="flex flex-col gap-5">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <h3 className="text-lg font-medium text-white">{subject.name}</h3>
      </div>
      
      <div className="flex flex-col gap-6">
        {subject.papers.map((paper, idx) => (
          <PaperInput 
            key={idx} 
            paperKey={idx === 0 ? 'paper1' : 'paper2'}
            paper={paper} 
            marks={marks[idx === 0 ? 'paper1' : 'paper2'] || {}} 
            setMarks={(comp, val) => setMarks(idx === 0 ? 'paper1' : 'paper2', comp, val)} 
          />
        ))}
      </div>
    </Card>
  );
}

function PaperInput({ paperKey, paper, marks, setMarks }: { key?: React.Key; paperKey: string, paper: PaperConfig, marks: any, setMarks: (c: any, v: any) => void }) {
  const comps = paper.components;
  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-sm font-medium text-white/60">{paper.name}</h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {comps.cq !== undefined && (
          <ComponentInput label="CQ" max={comps.cq} val={marks.cq} onChange={(v) => setMarks('cq', v)} />
        )}
        {comps.mcq !== undefined && (
          <ComponentInput label="MCQ" max={comps.mcq} val={marks.mcq} onChange={(v) => setMarks('mcq', v)} />
        )}
        {comps.practical !== undefined && (
          <ComponentInput label="Practical" max={comps.practical} val={marks.practical} onChange={(v) => setMarks('practical', v)} />
        )}
        {comps.written !== undefined && (
          <ComponentInput label="Written" max={comps.written} val={marks.written} onChange={(v) => setMarks('written', v)} />
        )}
      </div>
    </div>
  );
}

function ComponentInput({ label, max, val, onChange }: { label: string, max: number, val: number | undefined, onChange: (v: number) => void }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let num = parseInt(e.target.value, 10);
    if (isNaN(num)) num = 0;
    if (num < 0) num = 0;
    if (num > max) num = max;
    if (e.target.value === '') {
      onChange(0);
      return;
    }
    onChange(num);
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-xs font-medium text-white/50">
        {label} <span className="text-white/30">/{max}</span>
      </label>
      <input
        type="number"
        min={0}
        max={max}
        value={val === undefined || val === 0 && val !== val ? '' : val}
        onChange={handleChange}
        placeholder="0"
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-white/20 focus:outline-none focus:border-brand-500 focus:bg-white/10 transition-all font-mono text-sm"
      />
    </div>
  );
}
