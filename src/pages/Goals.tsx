import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dbApi, Goal } from '../lib/db';
import { Target, Plus, Trash2 } from 'lucide-react';

export function Goals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [type, setType] = useState<'GPA' | 'SUBJECT' | 'STUDY'>('GPA');
  const [target, setTarget] = useState(5.00);

  useEffect(() => {
    if (user) {
      dbApi.getGoals(user.uid).then(res => {
        setGoals(res);
        setLoading(false);
      });
    }
  }, [user]);

  const handleAddGoal = async () => {
    if (!user) return;
    const goal: Goal = {
      id: `${user.uid}_${Date.now()}`,
      uid: user.uid,
      type,
      target,
      current: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    await dbApi.saveGoal(goal);
    setGoals([goal, ...goals]);
  };

  const handleDelete = async (id: string) => {
    await dbApi.deleteGoal(id);
    setGoals(goals.filter(g => g.id !== id));
  };

  return (
    <div className="flex flex-col gap-8 text-white max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Goals</h1>
        <p className="text-white/60 mt-1">Set academic targets and track your progress.</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-brand-400" /> New Goal</h2>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="text-sm text-white/70 block mb-2">Type</label>
            <select 
              value={type}
              onChange={e => setType(e.target.value as any)}
              className="bg-[#1e293b] border border-white/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-brand-500 w-full"
            >
              <option value="GPA">Target GPA</option>
              <option value="STUDY">Study Time (Hours/Week)</option>
            </select>
          </div>
          <div className="flex-1 w-full">
            <label className="text-sm text-white/70 block mb-2">Target Value</label>
            <input 
              type="number"
              step={type === 'GPA' ? "0.01" : "1"}
              value={target}
              onChange={e => setTarget(parseFloat(e.target.value) || 0)}
              className="bg-[#1e293b] border border-white/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-brand-500 w-full"
            />
          </div>
          <button 
            onClick={handleAddGoal}
            className="bg-brand-500 hover:bg-brand-600 transition-colors text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" /> Add Goal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {goals.map(goal => (
          <div key={goal.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 relative group">
            <button 
              onClick={() => handleDelete(goal.id)}
              className="absolute top-4 right-4 text-white/30 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <div className="text-sm text-white/50 mb-2">{goal.type === 'GPA' ? 'Target GPA' : 'Target Weekly Study Hours'}</div>
            <div className="text-4xl font-bold text-white">{goal.target}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
