import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import HomePage from './pages/HomePage';
import AttendancePage from './pages/AttendancePage';
import GroupChatPage from './pages/GroupChatPage';
import ProfilePage from './pages/ProfilePage';
import LeavePage from './pages/LeavePage';
import AdminAttendancePage from './pages/AdminAttendancePage';
import TasksPage from './pages/TasksPage';
import Sidebar from './components/Sidebar';

const BACKEND_URL = process.env.REACT_APP_API_URL || '/api';

function useKeepAlive() {
  useEffect(() => {
    const ping = () => fetch(`${BACKEND_URL}/health`, { method: 'GET' }).catch(() => {});
    ping();
    const interval = setInterval(ping, 4 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
}

function LoadingScreen() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:48, height:48, borderRadius:'50%', background:'var(--lavender)', color:'var(--accent)', fontSize:'1.5rem', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>A</div>
        <svg className="spin-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
      </div>
    </div>
  );
}

function AdminGuard({ children }) {
  const { currentUser } = useApp();
  if (!currentUser || !['admin','ceo'].includes(currentUser.role)) return <Navigate to="/home" replace />;
  return children;
}

function ProtectedLayout({ children }) {
  const { currentUser, authLoading } = useApp();
  if (authLoading) return <LoadingScreen />;
  if (!currentUser) return <Navigate to="/login" replace />;
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        {children}
      </div>
    </div>
  );
}

function AppRoutes() {
  const { authLoading } = useApp();

  if (authLoading) return <LoadingScreen />;

  return (
    <>
      {/* DEMO MODE: Login, landing, and screenshot popup removed */}
      <Routes>
        <Route path="/"      element={<Navigate to="/home" replace />} />
        <Route path="/login" element={<Navigate to="/home" replace />} />

        <Route path="/home"              element={<ProtectedLayout><HomePage /></ProtectedLayout>} />
        <Route path="/attendance"        element={<ProtectedLayout><AttendancePage /></ProtectedLayout>} />
        <Route path="/attendance/manage" element={<ProtectedLayout><AdminAttendancePage /></ProtectedLayout>} />
        <Route path="/tasks"             element={<ProtectedLayout><TasksPage /></ProtectedLayout>} />
        <Route path="/chat"              element={<ProtectedLayout><GroupChatPage /></ProtectedLayout>} />
        <Route path="/profile"           element={<ProtectedLayout><ProfilePage /></ProtectedLayout>} />
        <Route path="/leaves"            element={<ProtectedLayout><LeavePage /></ProtectedLayout>} />

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  useKeepAlive();
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}