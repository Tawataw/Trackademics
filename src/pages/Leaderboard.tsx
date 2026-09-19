import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dbApi } from '../lib/db';
import { formatClassName, formatGroupName } from '../utils/formatters';
import { 
  Trophy, 
  Medal, 
  School, 
  Search, 
  Sparkles, 
  RefreshCw, 
  UserCheck, 
  Clock, 
  GraduationCap, 
  Flame,
  ArrowUpRight,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface LeaderboardUser {
  uid: string;
  name: string;
  collegeName: string;
  class: string;
  group: string;
  email?: string;
  createdAt: number;
  studyPoints: number;
  totalStudyMinutes: number;
}

export function Leaderboard() {
  const { user, dbUser } = useAuth();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'points'>('newest');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Set up real-time listener on users collection
    setLoading(true);
    const unsubscribe = dbApi.subscribeToLeaderboardUsers(
      (data) => {
        setUsers(data);
        setLoading(false);
        setRefreshing(false);
      },
      (err) => {
        console.error('Leaderboard subscription error:', err);
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await dbApi.getLeaderboardUsers();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  // Ensure current user is in the list even if Firestore has local-only sync delay
  const displayedUsers: LeaderboardUser[] = React.useMemo(() => {
    let list = [...users];

    // Check if current user is in the remote list
    const currentUid = user?.uid;
    const exists = currentUid ? list.some(u => u.uid === currentUid) : false;

    if (!exists && currentUid && dbUser) {
      list.unshift({
        uid: currentUid,
        name: dbUser.name || 'You',
        collegeName: dbUser.collegeName || 'Not specified',
        class: dbUser.class || 'Class 12',
        group: dbUser.group || 'Science',
        email: user?.email || '',
        createdAt: dbUser.createdAt || Date.now(),
        studyPoints: 120,
        totalStudyMinutes: 0
      });
    }

    // Sort list
    if (sortBy === 'points') {
      list.sort((a, b) => b.studyPoints - a.studyPoints);
    } else {
      // Temporarily sort by creation date (newest first)
      list.sort((a, b) => b.createdAt - a.createdAt);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(u => 
        u.name.toLowerCase().includes(q) || 
        u.collegeName.toLowerCase().includes(q) ||
        u.class.toLowerCase().includes(q) ||
        u.group.toLowerCase().includes(q)
      );
    }

    return list;
  }, [users, user, dbUser, sortBy, searchQuery]);

  // Find current user's rank
  const currentUserRank = React.useMemo(() => {
    if (!user?.uid) return null;
    const index = displayedUsers.findIndex(u => u.uid === user.uid);
    return index !== -1 ? index + 1 : null;
  }, [displayedUsers, user]);

  // Unique colleges count
  const uniqueColleges = React.useMemo(() => {
    const set = new Set(
      displayedUsers
        .map(u => u.collegeName)
        .filter(c => c && c !== 'College / Institution Not Specified' && c !== 'Not specified')
    );
    return set.size;
  }, [displayedUsers]);

  return (
    <div className="flex flex-col gap-8 text-white max-w-6xl mx-auto pb-16">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300 mb-2">
            <Trophy className="w-3.5 h-3.5" />
            HSC Community Rankings
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight flex items-center gap-3">
            Student Leaderboard
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-1 max-w-2xl">
            See where fellow students stand across institutions nationwide. Track your academic standing, college representation, and study milestones.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            id="leaderboard-refresh-btn"
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-white/10 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer text-slate-300 hover:text-white"
            title="Refresh Leaderboard"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-brand-400' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Live Sync'}</span>
          </button>
        </div>
      </div>

      {/* Profile College Alert Banner if not configured */}
      {!dbUser?.collegeName && (
        <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/30 text-brand-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-brand-500/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-500/20 text-brand-400 shrink-0">
              <School className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-sm text-white">Add your College or Institution</div>
              <div className="text-xs text-brand-300/80">
                Show your institution proudly on the public leaderboard.
              </div>
            </div>
          </div>
          <Link
            to="/settings"
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-semibold text-xs rounded-xl transition-all inline-flex items-center gap-1.5 shadow-md shadow-brand-500/20 shrink-0"
          >
            Update in Settings
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Your Rank</div>
            <div className="text-2xl font-bold text-white mt-0.5">
              {currentUserRank ? `#${currentUserRank}` : '—'}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Students</div>
            <div className="text-2xl font-bold text-white mt-0.5">
              {loading ? '...' : displayedUsers.length}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Colleges Represented</div>
            <div className="text-2xl font-bold text-white mt-0.5">
              {uniqueColleges || 1}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
            <School className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <div className="text-xs text-slate-400 font-medium">Your Institution</div>
            <div className="text-sm font-bold text-white mt-0.5 truncate" title={dbUser?.collegeName || 'Not specified'}>
              {dbUser?.collegeName || 'Not specified'}
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Podium Highlights (if >= 3 users) */}
      {!loading && displayedUsers.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Rank 2 (Silver) */}
          <div className="order-2 md:order-1 p-5 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-slate-300">
              <Medal className="w-24 h-24" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-full bg-slate-400/20 text-slate-300 border border-slate-400/40 flex items-center justify-center font-bold text-sm">
                  #2
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/30">
                  Silver
                </span>
              </div>
              <div className="font-bold text-lg text-white truncate" title={displayedUsers[1].name}>
                {displayedUsers[1].name}
                {displayedUsers[1].uid === user?.uid && (
                  <span className="ml-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-brand-500 text-white">
                    YOU
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-brand-300 font-medium mt-1 truncate">
                <School className="w-3.5 h-3.5 shrink-0 text-brand-400" />
                <span className="truncate">{displayedUsers[1].collegeName}</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span>{formatClassName(displayedUsers[1].class)}</span>
              <span className="font-bold text-white">{displayedUsers[1].studyPoints} pts</span>
            </div>
          </div>

          {/* Rank 1 (Gold) */}
          <div className="order-1 md:order-2 p-6 rounded-2xl bg-gradient-to-b from-amber-950/40 via-slate-800/90 to-slate-800 border-2 border-amber-500/50 shadow-xl shadow-amber-500/10 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-15 text-amber-400">
              <Trophy className="w-28 h-28" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center justify-center font-extrabold text-base shadow-sm">
                  👑 #1
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Gold Leader
                </span>
              </div>
              <div className="font-extrabold text-xl text-white truncate" title={displayedUsers[0].name}>
                {displayedUsers[0].name}
                {displayedUsers[0].uid === user?.uid && (
                  <span className="ml-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-brand-500 text-white">
                    YOU
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold mt-1.5 truncate">
                <School className="w-4 h-4 shrink-0 text-amber-400" />
                <span className="truncate">{displayedUsers[0].collegeName}</span>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-amber-500/20 flex items-center justify-between text-xs">
              <span className="text-amber-200/80">{formatClassName(displayedUsers[0].class)} • {formatGroupName(displayedUsers[0].group)}</span>
              <span className="font-black text-amber-400 text-sm">{displayedUsers[0].studyPoints} pts</span>
            </div>
          </div>

          {/* Rank 3 (Bronze) */}
          <div className="order-3 md:order-3 p-5 rounded-2xl bg-slate-800/90 border border-amber-700/40 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-amber-600">
              <Medal className="w-24 h-24" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-full bg-amber-700/20 text-amber-400 border border-amber-700/40 flex items-center justify-center font-bold text-sm">
                  #3
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-700/20 text-amber-300 border border-amber-700/30">
                  Bronze
                </span>
              </div>
              <div className="font-bold text-lg text-white truncate" title={displayedUsers[2].name}>
                {displayedUsers[2].name}
                {displayedUsers[2].uid === user?.uid && (
                  <span className="ml-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-brand-500 text-white">
                    YOU
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-brand-300 font-medium mt-1 truncate">
                <School className="w-3.5 h-3.5 shrink-0 text-brand-400" />
                <span className="truncate">{displayedUsers[2].collegeName}</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span>{formatClassName(displayedUsers[2].class)}</span>
              <span className="font-bold text-white">{displayedUsers[2].studyPoints} pts</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="leaderboard-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student or college..."
            className="w-full bg-slate-800/90 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
          />
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <span className="text-xs text-slate-400 font-medium mr-1">Sort by:</span>
          <button
            id="leaderboard-sort-newest"
            onClick={() => setSortBy('newest')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              sortBy === 'newest'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            Newest Joined
          </button>
          <button
            id="leaderboard-sort-points"
            onClick={() => setSortBy('points')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              sortBy === 'points'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            Study Points
          </button>
        </div>
      </div>

      {/* Main Leaderboard Table / Cards */}
      <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        {/* Desktop Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-slate-800/80 border-b border-white/10 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <div className="col-span-1 text-center">Rank</div>
          <div className="col-span-6">Student & College / Institution</div>
          <div className="col-span-3">Class & Group</div>
          <div className="col-span-2 text-right">Study Points</div>
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="p-8 flex flex-col items-center justify-center gap-4 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-brand-400" />
            <span className="text-sm">Fetching student rankings from database...</span>
          </div>
        ) : displayedUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <Trophy className="w-12 h-12 text-slate-600" />
            <div className="font-semibold text-base text-white">No students matched your search</div>
            <p className="text-xs text-slate-500 max-w-sm">
              Try searching with a different student name or college name, or clear the search filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {displayedUsers.map((item, index) => {
              const rank = index + 1;
              const isCurrentUser = item.uid === user?.uid;

              return (
                <div
                  key={item.uid || index}
                  id={`leaderboard-row-${rank}`}
                  className={`p-4 md:px-6 md:py-4 transition-colors ${
                    isCurrentUser
                      ? 'bg-brand-500/10 border-l-4 border-l-brand-500 border-y border-brand-500/30'
                      : 'hover:bg-white/[0.02]'
                  }`}
                >
                  {/* Desktop Layout */}
                  <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                    {/* Rank */}
                    <div className="col-span-1 flex items-center justify-center">
                      {rank === 1 ? (
                        <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-black text-sm shadow-sm">
                          1
                        </span>
                      ) : rank === 2 ? (
                        <span className="w-8 h-8 rounded-xl bg-slate-400/20 text-slate-200 border border-slate-400/40 flex items-center justify-center font-bold text-sm">
                          2
                        </span>
                      ) : rank === 3 ? (
                        <span className="w-8 h-8 rounded-xl bg-amber-700/20 text-amber-300 border border-amber-700/40 flex items-center justify-center font-bold text-sm">
                          3
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-slate-400">
                          #{rank}
                        </span>
                      )}
                    </div>

                    {/* Full Name & College Name */}
                    <div className="col-span-6 flex items-center gap-3 min-w-0">
                      {/* Avatar icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        isCurrentUser
                          ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                          : rank === 1
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-300 border border-white/10'
                      }`}>
                        {item.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-sm truncate ${isCurrentUser ? 'text-brand-200 font-extrabold' : 'text-white'}`}>
                            {item.name}
                          </span>
                          {isCurrentUser && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-500 text-white shrink-0 shadow-sm">
                              YOU
                            </span>
                          )}
                        </div>

                        {/* Explicit College Name right below name */}
                        <div className="flex items-center gap-1.5 text-xs text-brand-300/90 font-medium mt-0.5 truncate">
                          <School className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                          <span className="truncate font-semibold" title={item.collegeName}>
                            {item.collegeName}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Class & Group */}
                    <div className="col-span-3">
                      <div className="text-xs font-semibold text-slate-300">
                        {formatClassName(item.class)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {formatGroupName(item.group)}
                      </div>
                    </div>

                    {/* Study Points / Metric */}
                    <div className="col-span-2 text-right">
                      <div className="text-sm font-bold text-amber-400 flex items-center justify-end gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>{item.studyPoints.toLocaleString()}</span>
                        <span className="text-xs text-slate-400 font-normal">pts</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  {/* Mobile Layout Card */}
                  <div className="md:hidden flex items-start gap-3">
                    {/* Rank Badge */}
                    <div className="shrink-0 mt-0.5">
                      {rank === 1 ? (
                        <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold text-xs">
                          #1
                        </span>
                      ) : rank === 2 ? (
                        <span className="w-7 h-7 rounded-lg bg-slate-400/20 text-slate-200 border border-slate-400/40 flex items-center justify-center font-bold text-xs">
                          #2
                        </span>
                      ) : rank === 3 ? (
                        <span className="w-7 h-7 rounded-lg bg-amber-700/20 text-amber-300 border border-amber-700/40 flex items-center justify-center font-bold text-xs">
                          #3
                        </span>
                      ) : (
                        <span className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 border border-white/10 flex items-center justify-center font-semibold text-xs">
                          #{rank}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`font-bold text-sm truncate ${isCurrentUser ? 'text-brand-200' : 'text-white'}`}>
                            {item.name}
                          </span>
                          {isCurrentUser && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-brand-500 text-white shrink-0">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-bold text-amber-400 shrink-0 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>{item.studyPoints}</span>
                        </div>
                      </div>

                      {/* College Name */}
                      <div className="flex items-center gap-1 text-xs text-brand-300 font-semibold mt-1 truncate">
                        <School className="w-3 h-3 text-brand-400 shrink-0" />
                        <span className="truncate">{item.collegeName}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-white/5">
                        <span>{formatClassName(item.class)} • {formatGroupName(item.group)}</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
