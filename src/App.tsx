import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { AcademicProgress } from './pages/AcademicProgress';
import { SyllabusTracker } from './pages/SyllabusTracker';
import { StudyTime } from './pages/StudyTime';
import { Goals } from './pages/Goals';
import { StudyLab } from './pages/StudyLab';
import { StudyLabTimer } from './pages/StudyLabTimer';
import { DailyTasks } from './pages/DailyTasks';
import { EventTracker } from './pages/EventTracker';
import { Leaderboard } from './pages/Leaderboard';
import { Admission } from './pages/Admission';
import { Feedback } from './pages/Feedback';
import { Settings } from './pages/Settings';
import { AdminPanel } from './pages/admin/AdminPanel';
import OldApp from './OldApp';

function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) {
  const { user, dbUser, isAdmin, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center text-white bg-[#0f172a]">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;
  
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="academic" element={<AcademicProgress />} />
            <Route path="legacy-calculator" element={<OldApp />} />
            <Route path="syllabus" element={<SyllabusTracker />} />
            <Route path="study-time" element={<StudyTime />} />
            <Route path="study-lab" element={<StudyLab />} />
            <Route path="daily-tasks" element={<DailyTasks />} />
            <Route path="events" element={<EventTracker />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="goals" element={<Goals />} />
            <Route path="admission" element={<Admission />} />
            <Route path="feedback" element={<Feedback />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="/study-lab/timer" element={<ProtectedRoute><StudyLabTimer /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPanel /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
