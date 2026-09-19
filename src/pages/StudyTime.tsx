import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dbApi, StudySession } from '../lib/db';
import { Clock, Plus, Target } from 'lucide-react';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function StudyTime() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMins, setNewMins] = useState(0);

  useEffect(() => {
    if (user) {
      dbApi.getStudySessions(user.uid).then(res => {
        setSessions(res);
        setLoading(false);
      });
    }
  }, [user]);

  const handleAddSession = async () => {
    if (!user || newMins <= 0) return;
    const session: StudySession = {
      id: `${user.uid}_${Date.now()}`,
      uid: user.uid,
      date: Date.now(),
      durationMinutes: newMins,
      createdAt: Date.now()
    };
    
    await dbApi.saveStudySession(session);
    await dbApi.addStudyMinutes(user.uid, newMins);
    setSessions([session, ...sessions]);
    setNewMins(0);
  };

  const today = startOfDay(new Date());
  
  // Chart Data (Last 7 Days)
  const chartData = Array.from({length: 7}).map((_, i) => {
    const d = subDays(today, 6 - i);
    const daySessions = sessions.filter(s => isSameDay(new Date(s.date), d));
    const mins = daySessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);
    return {
      name: format(d, 'EEE'),
      minutes: mins,
      hours: (mins / 60).toFixed(1)
    };
  });

  const todayMins = chartData[6].minutes;
  const totalMins = sessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);

  return (
    <div className="flex flex-col gap-8 text-white max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Study Time Tracker</h1>
        <p className="text-white/60 mt-1">Log your study hours to build consistency.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Clock className="w-5 h-5 text-brand-400" /> Log Session</h2>
          <div className="flex flex-col gap-4">
            <label className="text-sm text-white/70">Duration (Minutes)</label>
            <input 
              type="number" 
              value={newMins}
              onChange={e => setNewMins(parseInt(e.target.value) || 0)}
              className="bg-[#1e293b] border border-white/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-brand-500 w-full"
            />
            <button 
              onClick={handleAddSession}
              className="bg-brand-500 hover:bg-brand-600 transition-colors text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 mt-2"
            >
              <Plus className="w-5 h-5" /> Add Study Time
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-center items-center text-center">
            <div className="text-sm text-white/60 mb-2">Today's Study</div>
            <div className="text-4xl font-bold text-brand-400">{Math.floor(todayMins / 60)}h {todayMins % 60}m</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-center items-center text-center">
            <div className="text-sm text-white/60 mb-2">Total Time</div>
            <div className="text-4xl font-bold text-white">{Math.floor(totalMins / 60)}h {totalMins % 60}m</div>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-6">Last 7 Days</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 0, bottom: 5, left: 0 }}>
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.5)' }} />
              <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.5)' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '0.75rem' }} 
                itemStyle={{ color: '#fff' }} 
              />
              <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
