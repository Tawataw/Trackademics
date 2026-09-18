cat << 'INNER_EOF' > src/pages/admin/AdminPanel.tsx
import React, { useEffect, useState } from 'react';
import { ShieldAlert, Users, MessageSquare, Copy, CheckCircle, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AdminPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      // Mocking fetch with localStorage
      const storedFeedback = localStorage.getItem('hsc_feedback');
      if (storedFeedback) {
        setFeedback(JSON.parse(storedFeedback).sort((a: any, b: any) => b.createdAt - a.createdAt));
      } else {
        setFeedback([]);
      }
      
      const storedStudent = localStorage.getItem('student_user');
      if (storedStudent) {
        const student = JSON.parse(storedStudent);
        setUsers([{
          name: student.name,
          email: student.email || 'N/A',
          class: student.class,
          createdAt: Date.now()
        }]);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
  };

  const markAsRead = async (id: string) => {
    try {
      const storedFeedback = localStorage.getItem('hsc_feedback');
      if (storedFeedback) {
        let fList = JSON.parse(storedFeedback);
        fList = fList.map((f: any) => f.id === id ? { ...f, status: 'read' } : f);
        localStorage.setItem('hsc_feedback', JSON.stringify(fList));
        setFeedback(fList.sort((a: any, b: any) => b.createdAt - a.createdAt));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="text-white p-8 animate-pulse">Loading admin data...</div>;

  return (
    <div className="flex flex-col gap-8 text-white max-w-7xl mx-auto p-4 sm:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-brand-400" />
          <h1 className="text-3xl font-bold">Admin Panel</h1>
        </div>
        <Link to="/" className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">Exit Admin</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-blue-400" /> User List ({users.length})</h2>
          <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-2">
            {users.map((u, i) => (
              <div key={i} className="bg-[#1e293b] p-4 rounded-xl border border-white/5 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="font-bold">{u.name}</div>
                  <div className="text-xs text-white/50 bg-black/20 px-2 py-1 rounded-md">{u.class}</div>
                </div>
                
                <div className="flex justify-between items-center bg-black/20 p-2 rounded-lg mt-1">
                  <div className="text-sm text-white/70 flex items-center gap-2">
                    <Mail className="w-4 h-4" /> {u.email}
                  </div>
                  <button onClick={() => copyEmail(u.email)} className="text-xs flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors">
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                
                <div className="text-xs text-white/40 mt-1">
                  Joined: {new Date(u.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-green-400" /> Feedback Inbox ({feedback.length})</h2>
          <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-2">
            {feedback.map(f => (
              <div key={f.id} className={`p-4 rounded-xl border flex flex-col gap-2 ${f.status === 'unread' ? 'bg-[#1e293b] border-brand-500/50' : 'bg-black/20 border-white/5'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {f.status === 'unread' && <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />}
                    <div className="font-bold text-sm text-brand-400">{f.category}</div>
                  </div>
                  <div className="text-xs text-white/40">{new Date(f.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-sm text-white/90 my-1 bg-black/20 p-3 rounded-lg leading-relaxed">{f.message}</div>
                
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/10">
                  <div className="text-xs text-white/50 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {f.email}
                  </div>
                  
                  {f.status === 'unread' ? (
                    <button onClick={() => markAsRead(f.id)} className="text-xs flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors">
                      <CheckCircle className="w-3 h-3" /> Mark Read
                    </button>
                  ) : (
                    <span className="text-xs text-white/30 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Read</span>
                  )}
                </div>
              </div>
            ))}
            {feedback.length === 0 && <div className="text-center text-white/50 py-10">No feedback yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
INNER_EOF
