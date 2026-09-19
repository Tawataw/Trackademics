import React, { useEffect, useState } from 'react';
import { ShieldAlert, Users, MessageSquare, Copy, CheckCircle, Mail, RefreshCw, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { dbApi, AdminUserRecord, FeedbackRecord } from '../../lib/db';

export function AdminPanel() {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [feedback, setFeedback] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const [refreshingUsers, setRefreshingUsers] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  useEffect(() => {
    // 1. Initial fetch of registered users from Firestore
    refreshUsersList();

    // 2. Task 2: Real-time listener (onSnapshot) on the 'feedbacks' collection, ordered by createdAt descending
    const unsubscribeFeedback = dbApi.subscribeToFeedbacks(
      (feedbackList) => {
        setFeedback(feedbackList);
        setFeedbackLoading(false);
        setLoading(false);
      },
      (err) => {
        console.error('Failed to subscribe to feedbacks:', err);
        setFeedbackLoading(false);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeFeedback();
    };
  }, []);

  const refreshUsersList = async () => {
    setRefreshingUsers(true);
    try {
      const userList = await dbApi.getAdminUsers();
      setUsers(userList);
    } catch (err) {
      console.error('Failed to refresh user list from Firestore:', err);
    } finally {
      setRefreshingUsers(false);
    }
  };

  const copyEmail = (email: string) => {
    if (!email || email === 'N/A') return;
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const markAsRead = async (id: string) => {
    try {
      await dbApi.markFeedbackRead(id);
    } catch (e) {
      console.error('Failed to mark feedback as read in Firestore:', e);
    }
  };

  const unreadCount = feedback.filter(f => f.status === 'unread').length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-white p-8 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
        <p className="text-sm text-white/60">Loading admin dashboard and Firestore users...</p>
      </div>
    );
  }

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
        {/* User List Panel */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" /> User List ({users.length})
            </h2>
            <button
              onClick={refreshUsersList}
              disabled={refreshingUsers}
              title="Refresh User List"
              className="p-2 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-40"
            >
              <RefreshCw className={`w-4 h-4 ${refreshingUsers ? 'animate-spin text-brand-400' : ''}`} />
            </button>
          </div>

          <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-2">
            {refreshingUsers ? (
              <div className="flex items-center justify-center py-12 text-white/50 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                <span className="text-sm">Fetching users from Firestore...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center text-white/50 py-12 text-sm bg-white/[0.02] rounded-xl border border-white/5">
                No registered users found in Firestore.
              </div>
            ) : (
              users.map((u, i) => (
                <div key={u.uid || i} className="bg-[#1e293b] p-4 rounded-xl border border-white/5 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div className="font-bold text-base text-white">{u.name}</div>
                    <div className="text-xs text-white/70 bg-black/30 border border-white/10 px-2.5 py-1 rounded-md font-medium">
                      {u.class}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center bg-black/20 p-2.5 rounded-lg mt-1 border border-white/5">
                    <div className="text-sm text-white/80 flex items-center gap-2 truncate">
                      <Mail className="w-4 h-4 text-white/40 shrink-0" /> 
                      <span className="truncate">{u.email}</span>
                    </div>
                    <button 
                      onClick={() => copyEmail(u.email)} 
                      className="text-xs flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-md transition-colors text-white/80 shrink-0 ml-2"
                    >
                      {copiedEmail === u.email ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div className="text-xs text-white/40 mt-1 flex items-center justify-between">
                    <span>Account Creation Date:</span>
                    <span className="text-white/60 font-medium">
                      {new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Feedback Inbox Panel - Real-time onSnapshot from Firestore feedbacks collection */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-400" /> Feedback Inbox ({feedback.length})
            </h2>
            {unreadCount > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {unreadCount} unread
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-2">
            {feedbackLoading ? (
              <div className="flex items-center justify-center py-12 text-white/50 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                <span className="text-sm">Listening for real-time feedback...</span>
              </div>
            ) : feedback.length === 0 ? (
              <div className="text-center text-white/50 py-12 text-sm bg-white/[0.02] rounded-xl border border-white/5">
                No feedback received yet.
              </div>
            ) : (
              feedback.map(f => (
                <div 
                  key={f.id} 
                  className={`p-4 rounded-xl border flex flex-col gap-2 transition-all ${
                    f.status === 'unread' 
                      ? 'bg-[#1e293b] border-emerald-500/40 shadow-sm shadow-emerald-950/20' 
                      : 'bg-black/20 border-white/5 opacity-85'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {f.status === 'unread' && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      )}
                      <span className="font-bold text-xs uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-brand-300">
                        {f.category || 'Feedback'}
                      </span>
                    </div>
                    <div className="text-xs text-white/40">
                      {new Date(f.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>

                  <div className="text-sm text-white/90 my-1 bg-black/20 p-3 rounded-lg leading-relaxed whitespace-pre-wrap">
                    {f.message}
                  </div>
                  
                  <div className="flex justify-between items-center mt-1 pt-2 border-t border-white/10 text-xs">
                    <div className="text-white/60 flex items-center gap-1.5 truncate max-w-[220px]">
                      <Mail className="w-3.5 h-3.5 text-white/40 shrink-0" /> 
                      <span className="truncate">{f.userEmail || f.email || 'Anonymous'}</span>
                    </div>
                    
                    {f.status === 'unread' ? (
                      <button 
                        type="button"
                        onClick={() => markAsRead(f.id)} 
                        className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-md transition-colors font-medium cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Mark Read
                      </button>
                    ) : (
                      <span className="text-white/40 flex items-center gap-1 font-medium">
                        <CheckCircle className="w-3.5 h-3.5 text-white/30" /> Read
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
