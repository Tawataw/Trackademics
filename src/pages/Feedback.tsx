import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { dbApi } from '../lib/db';

export function Feedback() {
  const { user, dbUser } = useAuth();
  const [category, setCategory] = useState('Bug Report');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    setLoading(true);
    setErrorMessage(null);
    try {
      const effectiveUserId = user?.uid || 'anonymous-user';
      const effectiveUserEmail = user?.email || dbUser?.email || (dbUser?.name ? `${dbUser.name} (no email)` : 'Anonymous');

      await dbApi.submitFeedback({
        userId: effectiveUserId,
        userEmail: effectiveUserEmail,
        message: message.trim(),
        category
      });
      
      setSuccess(true);
      setMessage('');
    } catch (err) {
      console.error('Failed to submit feedback to Firestore:', err);
      setErrorMessage('Failed to submit feedback. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 text-white max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Feedback</h1>
        <p className="text-white/60 mt-1">Help us improve HSC Tracker.</p>
      </div>

      {success ? (
        <div className="bg-brand-500/10 border border-brand-500/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4">
          <CheckCircle2 className="w-16 h-16 text-brand-400" />
          <h2 className="text-2xl font-bold">Thank you for your valuable feedback! 💙</h2>
          <p className="text-white/60">Your message has been received and will help us improve HSC Tracker.</p>
          <button 
            onClick={() => setSuccess(false)}
            className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors font-medium"
          >
            Submit Another
          </button>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <label className="text-sm font-medium text-white/70 block mb-2">Category</label>
              <select 
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="bg-[#1e293b] border border-white/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-brand-500 w-full"
              >
                <option value="Bug Report">Bug Report</option>
                <option value="Suggestion">Suggestion</option>
                <option value="Feature Request">Feature Request</option>
                <option value="Incorrect Information">Incorrect Information</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-white/70 block mb-2">Message</label>
              <textarea 
                required
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={6}
                className="bg-[#1e293b] border border-white/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-brand-500 w-full resize-none"
                placeholder="Describe your issue or suggestion here..."
              ></textarea>
            </div>

            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading || !message.trim()}
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 transition-colors text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Submitting Feedback...</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-5 h-5" />
                  <span>Submit Feedback</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
