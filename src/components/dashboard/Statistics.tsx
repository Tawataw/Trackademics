import { useTrackerStore } from '../../store/useTrackerStore';
import { Card } from '../ui/Card';
import { getMarksNeededForNextGrade } from '../../engine/calculator';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function Statistics() {
  const { getResults, mainSubjects, optionalSubject } = useTrackerStore();
  const isReady = mainSubjects.length === 3 && optionalSubject !== null;

  if (!isReady) return null;

  const { subjectResults } = getResults();

  // Grade Distribution
  const gradeCounts = { 'A+': 0, 'A': 0, 'A-': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 };
  subjectResults.forEach(r => {
    if (gradeCounts[r.grade as keyof typeof gradeCounts] !== undefined) {
      gradeCounts[r.grade as keyof typeof gradeCounts]++;
    }
  });

  const chartData = Object.keys(gradeCounts).map(grade => ({
    grade,
    count: gradeCounts[grade as keyof typeof gradeCounts]
  }));

  // Strongest / Weakest (Main Subjects Only)
  const mainResults = subjectResults.filter(r => !r.name.includes('(Optional)'));
  let strongest = mainResults[0];
  let weakest = mainResults[0];

  mainResults.forEach(r => {
    if (r.percentage > strongest.percentage) strongest = r;
    if (r.percentage < weakest.percentage) weakest = r;
  });

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold text-white px-1">Detailed Analytics</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="flex flex-col gap-6">
          <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider">Grade Distribution</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff', backdropFilter: 'blur(12px)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.grade === 'F' ? '#f43f5e' : entry.grade === 'A+' ? '#8b5cf6' : 'rgba(255,255,255,0.2)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <svg className="w-24 h-24 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
            </div>
            <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider">Strongest Subject</h3>
            <div className="relative z-10 flex items-end justify-between mt-2">
              <div className="flex flex-col">
                <span className="text-xl font-semibold text-white">{strongest.name}</span>
                <span className="text-sm text-white/60">{strongest.totalMarks} / {strongest.maxMarks} ({strongest.percentage.toFixed(1)}%)</span>
              </div>
              <div className="text-2xl font-bold text-emerald-400">{strongest.grade}</div>
            </div>
          </Card>

          <Card className="flex flex-col gap-2 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
              <svg className="w-24 h-24 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            </div>
            <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider">Weakest Subject</h3>
            <div className="relative z-10 flex items-end justify-between mt-2">
              <div className="flex flex-col">
                <span className="text-xl font-semibold text-white">{weakest.name}</span>
                <span className="text-sm text-white/60">{weakest.totalMarks} / {weakest.maxMarks} ({weakest.percentage.toFixed(1)}%)</span>
              </div>
              <div className="text-2xl font-bold text-rose-400">{weakest.grade}</div>
            </div>
          </Card>
        </div>
      </div>

      <Card className="flex flex-col gap-4 overflow-x-auto">
        <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-2">Improvement Guide</h3>
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-white/10 text-xs text-white/50 uppercase tracking-wider">
              <th className="pb-3 px-2">Subject</th>
              <th className="pb-3 px-2">Current</th>
              <th className="pb-3 px-2">Grade</th>
              <th className="pb-3 px-2">Next Grade</th>
              <th className="pb-3 px-2 text-right">Marks Needed</th>
            </tr>
          </thead>
          <tbody>
            {subjectResults.map(r => {
              // Convert ICT to 200 scale for calculation logic
              const evaluationMarks = r.id === 'ict' ? r.totalMarks * 2 : r.totalMarks;
              const { nextGrade, needed } = getMarksNeededForNextGrade(evaluationMarks);
              // convert needed back if ICT
              const neededActual = r.id === 'ict' ? needed / 2 : needed;

              return (
                <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-2 font-medium text-white/90">{r.name}</td>
                  <td className="py-3 px-2 text-white/60">{r.totalMarks} <span className="text-xs">/ {r.maxMarks}</span></td>
                  <td className="py-3 px-2">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-white/10 text-white/80">{r.grade}</span>
                  </td>
                  <td className="py-3 px-2">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-brand-500/20 text-brand-300">{nextGrade}</span>
                  </td>
                  <td className="py-3 px-2 text-right font-medium text-brand-300">
                    {neededActual > 0 ? `+${neededActual}` : 'Maxed'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
