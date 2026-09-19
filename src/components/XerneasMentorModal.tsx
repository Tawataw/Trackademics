import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { dbApi, EventItem, DailyTaskItem } from '../lib/db';
import { 
  Bot, 
  Sparkles, 
  X, 
  Send, 
  Loader2, 
  RefreshCw, 
  Trophy, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  isAnalysis?: boolean;
}

interface UserContextData {
  studyPoints: number;
  totalStudyMinutes: number;
  pendingTasks: DailyTaskItem[];
  allTasks: DailyTaskItem[];
  upcomingEvents: EventItem[];
  fetchedAt: number;
}

export function XerneasMentorModal() {
  const { user, dbUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loadingContext, setLoadingContext] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [contextData, setContextData] = useState<UserContextData | null>(null);
  const [contextError, setContextError] = useState<string | null>(null);
  const [showContextDetails, setShowContextDetails] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, analyzing, isOpen]);

  // Fetch Firebase Data Context when opened
  const fetchUserContext = async () => {
    if (!user) return;
    setLoadingContext(true);
    setContextError(null);

    try {
      const uid = user.uid;

      // 1. Fetch studyPoints & totalStudyMinutes from user profile document
      let studyPoints = dbUser?.studyPoints ?? 0;
      let totalStudyMinutes = dbUser?.totalStudyMinutes ?? 0;

      try {
        const userDocRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const uData = userSnap.data();
          if (typeof uData.studyPoints === 'number') studyPoints = uData.studyPoints;
          if (typeof uData.totalStudyMinutes === 'number') totalStudyMinutes = uData.totalStudyMinutes;
        }
      } catch (err) {
        console.warn('Could not fetch latest user doc, using cached auth profile:', err);
      }

      // 2. Fetch today's task list from Daily Tasks module
      let allTasks: DailyTaskItem[] = [];
      let pendingTasks: DailyTaskItem[] = [];
      try {
        const dailyDoc = await dbApi.getAndSyncDailyTasks(uid);
        allTasks = dailyDoc.tasks || [];
        pendingTasks = allTasks.filter(t => !t.isCompleted);
      } catch (err) {
        console.warn('Failed to fetch daily tasks for mentor:', err);
      }

      // 3. Fetch upcoming events from Event Tracker module
      let upcomingEvents: EventItem[] = [];
      try {
        const allEvents = await dbApi.getEvents(uid);
        const todayStr = new Date().toISOString().split('T')[0];
        upcomingEvents = allEvents
          .filter(e => e.date >= todayStr)
          .sort((a, b) => a.date.localeCompare(b.date));
      } catch (err) {
        console.warn('Failed to fetch events for mentor:', err);
      }

      setContextData({
        studyPoints,
        totalStudyMinutes,
        pendingTasks,
        allTasks,
        upcomingEvents,
        fetchedAt: Date.now()
      });
    } catch (err: any) {
      console.error('Error fetching context for Xerneas AI:', err);
      setContextError('Could not sync full context. Mentor will use available session data.');
    } finally {
      setLoadingContext(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUserContext();
    }
  }, [isOpen, user]);

  // Handle "Analyze My Progress" action
  const handleAnalyzeProgress = async () => {
    if (analyzing) return;
    setAnalyzing(true);

    const studyPoints = contextData?.studyPoints ?? dbUser?.studyPoints ?? 0;
    const totalStudyMinutes = contextData?.totalStudyMinutes ?? dbUser?.totalStudyMinutes ?? 0;
    
    // Format pending tasks
    const pendingTasksList = contextData?.pendingTasks || [];
    const tasksString = pendingTasksList.length > 0 
      ? pendingTasksList.map(t => `• ${t.text}`).join('; ')
      : 'No pending tasks today (All completed or no tasks scheduled)';

    // Format upcoming events
    const upcomingEventsList = contextData?.upcomingEvents || [];
    const eventsString = upcomingEventsList.length > 0
      ? upcomingEventsList.map(e => `• ${e.name} on ${e.date}${e.time ? ` at ${e.time}` : ''}`).join('; ')
      : 'No upcoming events/exams scheduled';

    // Construct prompt per Task 4 specification
    const prompt = `You are Xerneas AI, a strict but highly motivating study mentor for an HSC/Admission student. The user currently has ${studyPoints} points (${totalStudyMinutes} mins studied). Their pending tasks today are: ${tasksString}. Their upcoming events are: ${eventsString}. Based strictly on this data, give a short, punchy, 3-4 sentence personalized feedback on their progress and what they should focus on right now. Reply in Bengali or Banglish.`;

    const userMsgId = 'user_' + Date.now();
    setMessages(prev => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        text: '📊 Analyze my study progress & schedule!',
        timestamp: Date.now(),
        isAnalysis: true
      }
    ]);

    // Task 2: Safety check before calling model.generateContent()
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || !apiKey.trim()) {
      setMessages(prev => [
        ...prev,
        {
          id: 'assistant_' + Date.now(),
          sender: 'assistant',
          text: '⚠️ API Key Missing in Preview! Please test Xerneas AI on the live Vercel site.',
          timestamp: Date.now(),
          isAnalysis: true
        }
      ]);
      setAnalyzing(false);
      return;
    }

    try {
      // Task 2: Implement Native REST API Call using browser fetch
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Gemini REST API Error:', response.status, response.statusText, errorData);
        throw new Error(`REST API HTTP ${response.status}: ${JSON.stringify(errorData)}`);
      }

      // Task 3: Response & Error Handling
      const data = await response.json();
      const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';

      setMessages(prev => [
        ...prev,
        {
          id: 'assistant_' + Date.now(),
          sender: 'assistant',
          text: botReply,
          timestamp: Date.now(),
          isAnalysis: true
        }
      ]);
    } catch (err: any) {
      console.error('Xerneas AI Native Fetch error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: 'error_' + Date.now(),
          sender: 'assistant',
          text: 'নেটওয়ার্ক সমস্যা হচ্ছে, কনসোল চেক করো।',
          timestamp: Date.now()
        }
      ]);
    } finally {
      setAnalyzing(false);
    }
  };

  // Handle custom user follow-up message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputValue.trim();
    if (!query || analyzing) return;

    const userMsgId = 'user_' + Date.now();
    setMessages(prev => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        text: query,
        timestamp: Date.now()
      }
    ]);
    setInputValue('');
    setAnalyzing(true);

    // Task 2: Safety check before calling API
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || !apiKey.trim()) {
      setMessages(prev => [
        ...prev,
        {
          id: 'assistant_' + Date.now(),
          sender: 'assistant',
          text: '⚠️ API Key Missing in Preview! Please test Xerneas AI on the live Vercel site.',
          timestamp: Date.now()
        }
      ]);
      setAnalyzing(false);
      return;
    }

    const studyPoints = contextData?.studyPoints ?? dbUser?.studyPoints ?? 0;
    const totalStudyMinutes = contextData?.totalStudyMinutes ?? dbUser?.totalStudyMinutes ?? 0;
    const pendingTasksList = contextData?.pendingTasks || [];
    const tasksString = pendingTasksList.length > 0 
      ? pendingTasksList.map(t => `• ${t.text}`).join('; ')
      : 'No pending tasks today';
    const upcomingEventsList = contextData?.upcomingEvents || [];
    const eventsString = upcomingEventsList.length > 0
      ? upcomingEventsList.map(e => `• ${e.name} on ${e.date}`).join('; ')
      : 'No upcoming events';

    const prompt = `You are Xerneas AI, a strict but inspiring HSC/Admission study mentor. The student has ${studyPoints} study points and ${totalStudyMinutes} total study minutes logged. Pending tasks: ${tasksString}. Upcoming events: ${eventsString}. The student asks: "${query}". Answer in Bengali or Banglish in 2-4 concise, highly motivating, actionable sentences.`;

    try {
      // Task 2: Native REST API Call using browser fetch
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Gemini REST API Error:', response.status, response.statusText, errorData);
        throw new Error(`REST API HTTP ${response.status}: ${JSON.stringify(errorData)}`);
      }

      // Task 3: Response & Error Handling
      const data = await response.json();
      const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';

      setMessages(prev => [
        ...prev,
        {
          id: 'assistant_' + Date.now(),
          sender: 'assistant',
          text: botReply,
          timestamp: Date.now()
        }
      ]);
    } catch (err: any) {
      console.error('Xerneas AI Native Fetch error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: 'error_' + Date.now(),
          sender: 'assistant',
          text: 'নেটওয়ার্ক সমস্যা হচ্ছে, কনসোল চেক করো।',
          timestamp: Date.now()
        }
      ]);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <>
      {/* Task 2: Glowing Floating Action Button (FAB) at Bottom-Right */}
      <button
        id="xerneas-fab-btn"
        onClick={() => setIsOpen(true)}
        aria-label="Open Xerneas AI Study Mentor"
        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 group flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/40 hover:shadow-indigo-500/60 border border-indigo-400/30 transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none"
      >
        {/* Ambient glow effect */}
        <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 opacity-60 blur group-hover:opacity-100 animate-pulse transition duration-700 pointer-events-none" />
        
        <span className="relative flex items-center justify-center w-7 h-7 rounded-full bg-white/20 text-white shadow-inner">
          <Sparkles className="w-4 h-4 animate-spin-slow" />
        </span>
        
        <span className="relative font-semibold text-sm tracking-wide hidden xs:inline-block sm:inline-block">
          Xerneas AI
        </span>

        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
        </span>
      </button>

      {/* Task 2: Sleek Dark-Themed Slide-Out Sidebar / Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Slide-out Panel */}
          <div 
            id="xerneas-mentor-sidebar"
            className="fixed inset-y-0 right-0 w-full sm:w-[480px] md:w-[520px] bg-slate-900 border-l border-white/10 shadow-2xl flex flex-col z-50 text-white animate-in slide-in-from-right duration-300"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 bg-slate-900/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 ring-2 ring-indigo-400/30">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
                      Xerneas AI
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Mentor
                      </span>
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400">Context-Aware HSC & Admission Coach</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  id="xerneas-refresh-context-btn"
                  onClick={fetchUserContext}
                  disabled={loadingContext}
                  title="Sync fresh Firestore data"
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingContext ? 'animate-spin text-indigo-400' : ''}`} />
                </button>
                <button
                  id="xerneas-close-btn"
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close mentor"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Task 3: Context Indicator Pill Strip */}
            <div className="px-4 py-2.5 bg-slate-950/60 border-b border-white/5 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Live Sync Context:
                </span>
                <button
                  onClick={() => setShowContextDetails(!showContextDetails)}
                  className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 text-[11px]"
                >
                  {showContextDetails ? 'Hide details' : 'View details'}
                  {showContextDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-slate-800/80 border border-white/5 flex flex-col items-center">
                  <div className="flex items-center gap-1 text-amber-400 font-semibold">
                    <Trophy className="w-3 h-3" />
                    <span>{contextData?.studyPoints ?? dbUser?.studyPoints ?? 0} pts</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {contextData?.totalStudyMinutes ?? dbUser?.totalStudyMinutes ?? 0}m studied
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-slate-800/80 border border-white/5 flex flex-col items-center">
                  <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{contextData?.pendingTasks.length ?? 0} Pending</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Daily Tasks</span>
                </div>

                <div className="p-2 rounded-lg bg-slate-800/80 border border-white/5 flex flex-col items-center">
                  <div className="flex items-center gap-1 text-indigo-400 font-semibold">
                    <Calendar className="w-3 h-3" />
                    <span>{contextData?.upcomingEvents.length ?? 0} Events</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Upcoming</span>
                </div>
              </div>

              {/* Collapsible Context Details Panel */}
              {showContextDetails && (
                <div className="mt-1 p-2.5 rounded-lg bg-slate-900 border border-white/10 text-xs space-y-2 max-h-36 overflow-y-auto">
                  <div>
                    <span className="font-semibold text-slate-300">Pending Tasks:</span>
                    {contextData?.pendingTasks && contextData.pendingTasks.length > 0 ? (
                      <ul className="list-disc list-inside text-slate-400 mt-1 space-y-0.5">
                        {contextData.pendingTasks.map(t => (
                          <li key={t.id} className="truncate">{t.text}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-500 italic mt-0.5">None pending today</p>
                    )}
                  </div>

                  <div>
                    <span className="font-semibold text-slate-300">Upcoming Events:</span>
                    {contextData?.upcomingEvents && contextData.upcomingEvents.length > 0 ? (
                      <ul className="list-disc list-inside text-slate-400 mt-1 space-y-0.5">
                        {contextData.upcomingEvents.map(e => (
                          <li key={e.id} className="truncate">{e.name} ({e.date})</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-500 italic mt-0.5">No upcoming events logged</p>
                    )}
                  </div>
                </div>
              )}

              {contextError && (
                <p className="text-[11px] text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  {contextError}
                </p>
              )}
            </div>

            {/* Task 4: Prominent "Analyze My Progress" Button */}
            <div className="p-4 bg-slate-900 border-b border-white/10">
              <button
                id="xerneas-analyze-btn"
                onClick={handleAnalyzeProgress}
                disabled={analyzing || loadingContext}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50 transition-all duration-200 transform active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analyzing your study data with Xerneas...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                    <span>Analyze My Progress</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-center text-slate-400 mt-2">
                Generates instant, strict & motivating Bengali/Banglish feedback based on your points, tasks & dates.
              </p>
            </div>

            {/* Chat History Area */}
            <div 
              id="xerneas-chat-messages" 
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50"
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-inner">
                    <Bot className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-1">
                    Welcome to Xerneas AI Study Mentor
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs mb-5 leading-relaxed">
                    আমি তোমার পড়াশোনার ডেটা বিশ্লেষণ করে সরাসরি পরামর্শ দিতে প্রস্তুত। উপরের 
                    <strong className="text-indigo-400"> "Analyze My Progress" </strong> 
                    বাটনে ক্লিক করো অথবা সরাসরি প্রশ্ন করো।
                  </p>

                  <div className="w-full space-y-2">
                    <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold text-left">
                      Quick Questions:
                    </p>
                    <button
                      onClick={() => {
                        setInputValue('আজকের বাকি পড়াগুলো শেষ করার জন্য আমাকে একটা স্ট্রিক্ট রুটিন দাও।');
                      }}
                      className="w-full text-left p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-white/5 text-xs text-slate-300 hover:text-white transition-colors flex items-center justify-between"
                    >
                      <span>আজকের বাকি পড়া শেষ করার স্ট্রিক্ট রুটিন দাও</span>
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                    </button>
                    <button
                      onClick={() => {
                        setInputValue('ফিজিক্স এবং ম্যাথে বেশি পয়েন্ট তোলার সেরা স্ট্র্যাটেজি কী?');
                      }}
                      className="w-full text-left p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-white/5 text-xs text-slate-300 hover:text-white transition-colors flex items-center justify-between"
                    >
                      <span>ফিজিক্স এবং ম্যাথে পয়েন্ট তোলার স্ট্র্যাটেজি কী?</span>
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                    </button>
                  </div>
                </div>
              ) : (
                messages.map(msg => (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-start gap-2.5 max-w-[88%]">
                      {msg.sender === 'assistant' && (
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white flex-shrink-0 mt-0.5 shadow-sm">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div
                        className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                            : 'bg-slate-800/90 border border-indigo-500/20 text-slate-100 shadow-sm'
                        }`}
                      >
                        {msg.isAnalysis && msg.sender === 'assistant' && (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 mb-1.5 pb-1 border-b border-white/10">
                            <Sparkles className="w-3.5 h-3.5" />
                            Xerneas Progress Assessment
                          </div>
                        )}
                        <p className="whitespace-pre-wrap font-sans">{msg.text}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 px-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}

              {analyzing && (
                <div className="flex items-start gap-2.5 max-w-[85%]">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white flex-shrink-0 mt-0.5 animate-pulse">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-800 border border-indigo-500/20 text-slate-300 text-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                    <span>Xerneas is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form 
              onSubmit={handleSendMessage}
              className="p-3.5 bg-slate-900 border-t border-white/10 flex items-center gap-2"
            >
              <input
                id="xerneas-chat-input"
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="Ask Xerneas (e.g., পড়ার রুটিন বা পরামর্শ)..."
                disabled={analyzing}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
              />
              <button
                id="xerneas-send-btn"
                type="submit"
                disabled={!inputValue.trim() || analyzing}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center shadow-md shadow-indigo-600/30"
                aria-label="Send message to mentor"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
