import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { OnboardingModal } from '../components/OnboardingModal';
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
    <div className="min-h-screen bg-[#0f172a] text-white flex">
      {/* Unclosable Onboarding Modal for first-time users or missing class/group */}
      {user && !isAdmin && needsOnboarding && <OnboardingModal />}
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white/5 border-r border-white/10 p-4">
        <div className="flex items-center gap-3 mb-10 px-2 pt-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-brand-500 to-purple-500 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold">HSC Tracker</span>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => 
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                  isActive ? 'bg-brand-500/20 text-brand-400' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-4 flex flex-col gap-3">
          <div className="px-3 text-sm text-white/60">
            <div className="font-medium text-white">{dbUser?.name}</div>
            <div className="text-xs">
              {formatClassName(dbUser?.class)} {dbUser?.group ? `• ${formatGroupName(dbUser.group)} Group` : ''}
            </div>
          </div>
          <button 
            onClick={logOut}
            className="flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-white/10 rounded-xl transition-colors text-sm font-medium"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Header & Overlay */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#0f172a]/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-brand-500 to-purple-500 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold">HSC Tracker</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2">
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-[73px] z-40 bg-[#0f172a] flex flex-col p-4 overflow-y-auto">
           <nav className="flex-1 flex flex-col gap-2">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                    isActive ? 'bg-brand-500/20 text-brand-400' : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="mt-8 border-t border-white/10 pt-4 flex flex-col gap-4">
             <div className="px-3">
              <div className="font-medium text-white">{dbUser?.name}</div>
              <div className="text-sm text-white/60">
                {formatClassName(dbUser?.class)} {dbUser?.group ? `• ${formatGroupName(dbUser.group)} Group` : ''}
              </div>
            </div>
            <button 
              onClick={logOut}
              className="flex items-center gap-3 px-3 py-3 text-red-400 hover:bg-white/10 rounded-xl transition-colors font-medium"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto w-full pt-[73px] md:pt-0">
         <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
         </div>
      </main>
    </div>
  );
}
