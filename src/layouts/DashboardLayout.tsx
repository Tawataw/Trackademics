import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { OnboardingModal } from '../components/OnboardingModal';
import { XerneasMentorModal } from '../components/XerneasMentorModal';
import { formatClassName, formatGroupName } from '../utils/formatters';
import { 
  LayoutDashboard, 
  GraduationCap, 
  BookOpen, 
  Clock, 
  Target, 
  Building, 
  MessageSquare, 
  Settings,
  LogOut, ShieldAlert,
  Menu,
  X,
  Calculator,
  FlaskConical,
  CheckSquare,
  Trophy,
  Calendar,
  Globe
} from 'lucide-react';

export function DashboardLayout() {
  const { user, dbUser, logOut, isAdmin, needsOnboarding } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/academic', label: 'Academic Progress', icon: GraduationCap },
    { to: '/legacy-calculator', label: 'Legacy Calculator', icon: Calculator },
    { to: '/syllabus', label: 'Syllabus Tracker', icon: BookOpen },
    { to: '/study-time', label: 'Study Time', icon: Clock },
    { to: '/study-lab', label: 'Study Lab', icon: FlaskConical },
    { to: '/study-hub', label: 'Study Hub', icon: Globe },
    { to: '/daily-tasks', label: 'Daily Tasks', icon: CheckSquare },
    { to: '/events', label: 'Event Tracker', icon: Calendar },
    { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { to: '/goals', label: 'Goals', icon: Target },
    { to: '/admission', label: 'Admission Eligibility', icon: Building },
    { to: '/feedback', label: 'Feedback', icon: MessageSquare },
    { to: '/settings', label: 'Settings', icon: Settings },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin Panel', icon: ShieldAlert }] : []),
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex transition-colors duration-300">
      {/* Unclosable Onboarding Modal for first-time users or missing class/group */}
      {user && !isAdmin && needsOnboarding && <OnboardingModal />}
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[var(--card-bg)] backdrop-blur-xl border-r border-[var(--border-subtle)] p-4 transition-colors duration-300">
        <div className="flex items-center gap-3 mb-10 px-2 pt-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-lg flex items-center justify-center flex-shrink-0 shadow-md shadow-[var(--glow-primary)]">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight block leading-tight text-[var(--text-main)]">Trackademics</span>
            <span className="text-[10px] text-[var(--text-muted)] block font-medium">SSC to Admission</span>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-1.5 overflow-y-auto pr-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => 
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 font-semibold shadow-sm' 
                    : 'text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-main)]'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-[var(--border-subtle)] pt-4 flex flex-col gap-3">
          <div className="px-3 text-sm text-[var(--text-muted)]">
            <div className="font-medium text-[var(--text-main)]">{dbUser?.name}</div>
            <div className="text-xs">
              {formatClassName(dbUser?.class)} {dbUser?.group ? `• ${formatGroupName(dbUser.group)} Group` : ''}
            </div>
          </div>
          <button 
            onClick={logOut}
            className="flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-white/10 rounded-xl transition-colors text-sm font-medium cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Header & Overlay */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[var(--bg-main)]/90 backdrop-blur-md border-b border-[var(--border-subtle)] flex items-center justify-between p-4 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-lg flex items-center justify-center flex-shrink-0 shadow-md shadow-[var(--glow-primary)]">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <span className="text-lg font-bold block leading-none text-[var(--text-main)]">Trackademics</span>
            <span className="text-[9px] text-[var(--text-muted)] block font-medium">SSC to Admission</span>
          </div>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-[var(--text-main)]">
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-[73px] z-40 bg-[var(--bg-main)] flex flex-col p-4 overflow-y-auto transition-colors duration-300">
           <nav className="flex-1 flex flex-col gap-2">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 font-semibold shadow-sm' 
                      : 'text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-main)]'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="mt-8 border-t border-[var(--border-subtle)] pt-4 flex flex-col gap-4">
             <div className="px-3">
              <div className="font-medium text-[var(--text-main)]">{dbUser?.name}</div>
              <div className="text-sm text-[var(--text-muted)]">
                {formatClassName(dbUser?.class)} {dbUser?.group ? `• ${formatGroupName(dbUser.group)} Group` : ''}
              </div>
            </div>
            <button 
              onClick={logOut}
              className="flex items-center gap-3 px-3 py-3 text-red-400 hover:bg-white/10 rounded-xl transition-colors font-medium cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto w-full pt-[73px] md:pt-0 bg-[var(--bg-main)] transition-colors duration-300">
         <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
         </div>
      </main>

      {/* Xerneas AI Floating Action Button and Slide-Out Mentor Modal */}
      <XerneasMentorModal />
    </div>
  );
}
