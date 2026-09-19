import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dbApi, EventItem } from '../lib/db';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  Clock, 
  MapPin, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle, 
  CalendarDays, 
  ChevronRight, 
  Sparkles,
  Search,
  Filter
} from 'lucide-react';

export function EventTracker() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'passed'>('all');

  // Form states
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Helper for today's local date string (YYYY-MM-DD)
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = useMemo(() => getTodayStr(), []);

  // Set default date when modal opens
  const openAddModal = () => {
    setName('');
    setDate(getTodayStr());
    setTime('');
    setLocation('');
    setNotes('');
    setFormError(null);
    setModalOpen(true);
  };

  // Real-time subscription to events
  useEffect(() => {
    setLoading(true);
    const uid = user?.uid || '';
    const unsubscribe = dbApi.subscribeToEvents(
      uid,
      (data) => {
        setEvents(data);
        setLoading(false);
      },
      (err) => {
        console.error('Failed to subscribe to events:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError('Event Name is required.');
      return;
    }
    if (!date) {
      setFormError('Event Date is required.');
      return;
    }

    setSubmitting(true);
    try {
      const uid = user?.uid || '';
      await dbApi.addEvent(uid, {
        name: trimmedName,
        date,
        time: time.trim() || undefined,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined
      });
      setModalOpen(false);
    } catch (err: any) {
      console.error('Failed to save event:', err);
      setFormError('Failed to save event. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete event
  const handleDelete = async (eventId: string) => {
    setDeletingId(eventId);
    try {
      const uid = user?.uid || '';
      await dbApi.deleteEvent(uid, eventId);
    } catch (err) {
      console.error('Failed to delete event:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // Date and Time formatting
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const obj = new Date(y, m - 1, d);
      return obj.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatDisplayTime = (timeStr?: string) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (isNaN(hours) || isNaN(minutes)) return timeStr;
    const period = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    const m = String(minutes).padStart(2, '0');
    return `${h}:${m} ${period}`;
  };

  const getRelativeText = (dateStr: string) => {
    if (dateStr === todayStr) return 'Today';
    const oneDay = 1000 * 60 * 60 * 24;
    const d1 = new Date(todayStr + 'T00:00:00');
    const d2 = new Date(dateStr + 'T00:00:00');
    const diffDays = Math.round((d2.getTime() - d1.getTime()) / oneDay);
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 1) return `In ${diffDays} days`;
    return `${Math.abs(diffDays)} days ago`;
  };

  // Categorize and sort events
  const { upcomingEvents, passedEvents } = useMemo(() => {
    const today = getTodayStr();

    let filtered = [...events];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          (e.location && e.location.toLowerCase().includes(q)) ||
          (e.notes && e.notes.toLowerCase().includes(q)) ||
          e.date.includes(q)
      );
    }

    const upcoming: EventItem[] = [];
    const passed: EventItem[] = [];

    filtered.forEach((item) => {
      // Future dates (including today) are Upcoming
      if (item.date >= today) {
        upcoming.push(item);
      } else {
        passed.push(item);
      }
    });

    // Upcoming: Closest date first (ascending)
    upcoming.sort((a, b) => {
      const keyA = a.date + ' ' + (a.time || '00:00');
      const keyB = b.date + ' ' + (b.time || '00:00');
      return keyA.localeCompare(keyB);
    });

    // Passed: Most recent past date first (descending)
    passed.sort((a, b) => {
      const keyA = a.date + ' ' + (a.time || '23:59');
      const keyB = b.date + ' ' + (b.time || '23:59');
      return keyB.localeCompare(keyA);
    });

    return { upcomingEvents: upcoming, passedEvents: passed };
  }, [events, searchQuery]);

  return (
    <div className="flex flex-col gap-8 text-white max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/15 border border-brand-500/30 text-brand-300 mb-2">
            <CalendarIcon className="w-3.5 h-3.5" />
            Schedule & Deadlines
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Event Tracker
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-1 max-w-2xl">
            Keep track of upcoming HSC exams, college practicals, test deadlines, and admission events in one place.
          </p>
        </div>

        <button
          id="add-event-btn"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-lg shadow-brand-500/25 active:scale-[0.98] transition-all cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          Add Event
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-800/90 border border-white/10 flex items-center gap-4 shadow-sm">
          <div className="p-3.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 shrink-0">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Upcoming Events</div>
            <div className="text-2xl font-bold text-white mt-0.5">
              {upcomingEvents.length}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-800/90 border border-white/10 flex items-center gap-4 shadow-sm">
          <div className="p-3.5 rounded-xl bg-slate-500/15 border border-slate-500/30 text-slate-400 shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Passed Events</div>
            <div className="text-2xl font-bold text-white mt-0.5">
              {passedEvents.length}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-800/90 border border-white/10 flex items-center gap-4 shadow-sm">
          <div className="p-3.5 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <div className="text-xs text-slate-400 font-medium">Next Milestone</div>
            <div className="text-sm font-bold text-white mt-0.5 truncate" title={upcomingEvents[0]?.name || 'None'}>
              {upcomingEvents.length > 0 ? (
                <>
                  <span>{upcomingEvents[0].name}</span>
                  <span className="text-xs text-brand-300 ml-1.5 font-normal">
                    ({getRelativeText(upcomingEvents[0].date)})
                  </span>
                </>
              ) : (
                'No upcoming events'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="event-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events, locations, notes..."
            className="w-full bg-slate-800/90 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
          />
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-white/10 self-stretch sm:self-auto">
          <button
            id="event-tab-all"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({upcomingEvents.length + passedEvents.length})
          </button>
          <button
            id="event-tab-upcoming"
            onClick={() => setActiveTab('upcoming')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'upcoming'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Upcoming ({upcomingEvents.length})
          </button>
          <button
            id="event-tab-passed"
            onClick={() => setActiveTab('passed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'passed'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Passed ({passedEvents.length})
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <CalendarIcon className="w-8 h-8 animate-pulse text-brand-400" />
          <div className="text-sm">Loading your events...</div>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {/* Section 1: Upcoming Events */}
          {(activeTab === 'all' || activeTab === 'upcoming') && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Upcoming Events
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    {upcomingEvents.length}
                  </span>
                </h2>
                <span className="text-xs text-slate-500">Sorted by closest date</span>
              </div>

              {upcomingEvents.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900/60 border border-white/10 text-center flex flex-col items-center gap-3">
                  <CalendarDays className="w-10 h-10 text-slate-600" />
                  <div className="text-sm font-semibold text-slate-300">No upcoming events found</div>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Keep yourself organized by scheduling test dates, submission deadlines, or exam sprint milestones.
                  </p>
                  <button
                    onClick={openAddModal}
                    className="mt-2 text-xs font-semibold px-4 py-2 rounded-xl bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 border border-brand-500/40 transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Your First Event
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcomingEvents.map((item) => {
                    const relativeText = getRelativeText(item.date);
                    const isToday = item.date === todayStr;

                    return (
                      <div
                        key={item.id}
                        id={`event-card-${item.id}`}
                        className="group relative p-5 rounded-2xl bg-slate-800/90 border border-white/10 hover:border-brand-500/50 hover:shadow-xl hover:shadow-brand-500/5 transition-all flex flex-col justify-between"
                      >
                        {/* Top row: Badges and Delete button */}
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-2.5">
                            <div className="flex items-center flex-wrap gap-2">
                              {/* Status Badge */}
                              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                                isToday
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                              }`}>
                                <Sparkles className="w-3 h-3" />
                                {isToday ? 'Today' : 'Upcoming'}
                              </span>

                              {/* Relative Time Tag */}
                              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                                {relativeText}
                              </span>
                            </div>

                            {/* Delete Action */}
                            <button
                              id={`delete-event-${item.id}`}
                              onClick={() => handleDelete(item.id)}
                              disabled={deletingId === item.id}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete Event"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Event Title */}
                          <h3 className="font-bold text-lg text-white mb-2 leading-snug group-hover:text-brand-300 transition-colors">
                            {item.name}
                          </h3>

                          {/* Date and Optional Time */}
                          <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-300 mb-3">
                            <div className="flex items-center gap-1.5">
                              <CalendarIcon className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                              <span>{formatDisplayDate(item.date)}</span>
                            </div>

                            {item.time && (
                              <div className="flex items-center gap-1.5 text-indigo-300">
                                <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                <span>{formatDisplayTime(item.time)}</span>
                              </div>
                            )}

                            {item.location && (
                              <div className="flex items-center gap-1.5 text-slate-300">
                                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                <span className="truncate max-w-[200px]">{item.location}</span>
                              </div>
                            )}
                          </div>

                          {/* Optional Short Notes */}
                          {item.notes && (
                            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                              <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                              <p className="whitespace-pre-wrap">{item.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Section 2: Passed Events */}
          {(activeTab === 'all' || activeTab === 'passed') && (
            <div className="flex flex-col gap-4 pt-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                  Passed Events
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-400 border border-slate-500/30">
                    {passedEvents.length}
                  </span>
                </h2>
                <span className="text-xs text-slate-500">Sorted by most recent past date</span>
              </div>

              {passedEvents.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900/40 border border-white/5 text-center text-slate-500 text-xs">
                  No passed events recorded.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {passedEvents.map((item) => {
                    const relativeText = getRelativeText(item.date);

                    return (
                      <div
                        key={item.id}
                        id={`event-card-${item.id}`}
                        // Dimmed card opacity and grayscale touch for Passed Events
                        className="opacity-60 hover:opacity-100 transition-opacity p-5 rounded-2xl bg-slate-900/90 border border-white/5 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-2.5">
                            <div className="flex items-center gap-2">
                              {/* Status Badge */}
                              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                                Passed
                              </span>
                              <span className="text-[11px] text-slate-500 font-medium">
                                {relativeText}
                              </span>
                            </div>

                            {/* Delete Action */}
                            <button
                              id={`delete-event-${item.id}`}
                              onClick={() => handleDelete(item.id)}
                              disabled={deletingId === item.id}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete Event"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Event Title */}
                          <h3 className="font-bold text-base text-slate-300 mb-2">
                            {item.name}
                          </h3>

                          {/* Details */}
                          <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-400 mb-3">
                            <div className="flex items-center gap-1.5">
                              <CalendarIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>{formatDisplayDate(item.date)}</span>
                            </div>

                            {item.time && (
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span>{formatDisplayTime(item.time)}</span>
                              </div>
                            )}

                            {item.location && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span className="truncate max-w-[200px]">{item.location}</span>
                              </div>
                            )}
                          </div>

                          {/* Short Notes */}
                          {item.notes && (
                            <div className="p-3 rounded-xl bg-slate-950/40 border border-white/5 text-xs text-slate-400 leading-relaxed flex items-start gap-2">
                              <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                              <p className="whitespace-pre-wrap">{item.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Event Modal */}
      {modalOpen && (
        <div
          id="add-event-modal-overlay"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setModalOpen(false)}
        >
          <div
            id="add-event-modal-card"
            className="relative w-full max-w-lg bg-gradient-to-b from-[#1e293b] to-[#0f172a] border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-brand-950/40 text-white my-8 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center shrink-0">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Add New Event</h2>
                  <p className="text-xs text-slate-400">Schedule an exam, deadline, or academic task</p>
                </div>
              </div>
              <button
                id="close-event-modal-btn"
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Field 1: Event Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Event Name <span className="text-brand-400">*</span>
                </label>
                <input
                  id="event-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. HSC Physics 1st Paper Model Test"
                  className="w-full bg-slate-900/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  required
                />
              </div>

              {/* Field 2 & 3: Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Date <span className="text-brand-400">*</span>
                  </label>
                  <input
                    id="event-date-input"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-900/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all [color-scheme:dark]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Time <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="event-time-input"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-slate-900/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Field 4: Location */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Location <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    id="event-location-input"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. College Auditorium, Room 302, Online"
                    className="w-full bg-slate-900/80 border border-white/15 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                </div>
              </div>

              {/* Field 5: Short Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Short Notes <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <textarea
                  id="event-notes-input"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Chapters 1-4, bring scientific calculator & formula sheet"
                  rows={3}
                  className="w-full bg-slate-900/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all resize-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="event-save-btn"
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-md shadow-brand-500/20 active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? 'Saving Event...' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
