import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import AttendancePage from './pages/AttendancePage';
import GroupChatPage from './pages/GroupChatPage';
import ProfilePage from './pages/ProfilePage';
import LeavePage from './pages/LeavePage';
import AdminAttendancePage from './pages/AdminAttendancePage';
import TasksPage from './pages/TasksPage';
import Sidebar from './components/Sidebar';

const CAPTURE_INTERVAL_MS = 5 * 60 * 1000;
const STORAGE_KEY = 'screenshot_permission';
const BACKEND_URL = process.env.REACT_APP_API_URL || '/api';

function useKeepAlive() {
  useEffect(() => {
    const ping = () => fetch(`${BACKEND_URL}/health`, { method: 'GET' }).catch(() => {});
    ping();
    const interval = setInterval(ping, 4 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
}

function ScreenshotPermissionPopup({ onAllow, onDeny }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:16 }}>
      <div style={{ background:'var(--card-bg,#fff)', borderRadius:20, padding:'36px 32px 28px', maxWidth:420, width:'100%', boxShadow:'0 24px 64px rgba(0,0,0,0.18)', display:'flex', flexDirection:'column', alignItems:'center' }}>
        <div style={{ width:72, height:72, borderRadius:20, background:'var(--lavender,#f0ecff)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent,#6c47ff)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        </div>
        <h2 style={{ fontSize:'1.35rem', fontWeight:700, color:'var(--text,#1a1a2e)', margin:'0 0 10px', textAlign:'center' }}>Screen Monitoring</h2>
        <p style={{ fontSize:14, color:'var(--muted,#888)', textAlign:'center', lineHeight:1.6, margin:'0 0 20px' }}>
          Your organization requires periodic screen captures during work hours. Screenshots are taken every <strong>5 minutes</strong> and are only visible to your admin.
        </p>
        <div style={{ width:'100%', background:'var(--soft-purple,#f8f6ff)', borderRadius:14, padding:'12px 18px', marginBottom:24, border:'1px solid var(--border,#ebebeb)' }}>
          {[['🔒','Encrypted & stored securely'],['👁️','Visible only to Admin / CEO'],['🕐','Captured every 5 minutes'],['📅','Deleted after retention period']].map(([icon,text]) => (
            <div key={text} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 0' }}>
              <span style={{ fontSize:16 }}>{icon}</span>
              <span style={{ fontSize:13, color:'var(--text2,#555)', fontWeight:500 }}>{text}</span>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:12, width:'100%', marginBottom:14 }}>
          <button onClick={onDeny} style={{ flex:1, padding:'12px 0', borderRadius:12, border:'1.5px solid var(--border,#ddd)', background:'transparent', color:'var(--text2,#555)', fontWeight:600, fontSize:14, cursor:'pointer' }}>Not Now</button>
          <button onClick={onAllow} style={{ flex:2, padding:'12px 0', borderRadius:12, border:'none', background:'var(--accent,#6c47ff)', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer' }}>Allow & Continue</button>
        </div>
        <p style={{ fontSize:11.5, color:'var(--muted,#aaa)', textAlign:'center', lineHeight:1.5, margin:0 }}>You can stop sharing at any time from your browser's screen share indicator.</p>
      </div>
    </div>
  );
}

function useScreenshotCapture(userRole) {
  const [showPopup, setShowPopup] = useState(false);
  const streamRef   = useRef(null);
  const intervalRef = useRef(null);

  const getAuthToken = async () => {
    const res = await fetch(`${BACKEND_URL}/api/imagekit/auth`, { headers: { Authorization: `Bearer ${localStorage.getItem('attendx_token')}` } });
    if (!res.ok) throw new Error('Failed to get ImageKit auth');
    return res.json();
  };
  const saveToDB = async (url) => {
    await fetch(`${BACKEND_URL}/api/screenshots`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('attendx_token')}` }, body: JSON.stringify({ url, taken_at: new Date().toISOString() }) });
  };
  const captureFrame = useCallback((stream) => new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.srcObject = stream; video.muted = true; video.play();
    video.onloadedmetadata = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280; canvas.height = video.videoHeight || 720;
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('toBlob failed')), 'image/jpeg', 0.8);
    };
    video.onerror = reject;
  }), []);
  const doCapture = useCallback(async () => {
    if (!streamRef.current) return;
    try {
      const blob = await captureFrame(streamRef.current);
      const auth = await getAuthToken();
      const fd = new FormData();
      fd.append('file', blob, `screenshot_${Date.now()}.jpg`);
      fd.append('fileName', `screenshot_${Date.now()}.jpg`);
      fd.append('signature', auth.signature); fd.append('expire', auth.expire);
      fd.append('token', auth.token); fd.append('publicKey', auth.publicKey);
      fd.append('folder', '/screenshots');
      const r = await fetch('https://upload.imagekit.io/api/v1/files/upload', { method:'POST', body:fd });
      await saveToDB((await r.json()).url);
    } catch (err) { console.error('[Screenshot] Failed:', err); }
  }, [captureFrame]); // eslint-disable-line react-hooks/exhaustive-deps
  const startCapturing = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video:{ width:1280, height:720 }, audio:false });
      streamRef.current = stream;
      stream.getVideoTracks()[0].onended = () => { clearInterval(intervalRef.current); streamRef.current = null; localStorage.setItem(STORAGE_KEY,'denied'); };
      localStorage.setItem(STORAGE_KEY,'granted');
      await doCapture();
      intervalRef.current = setInterval(doCapture, CAPTURE_INTERVAL_MS);
    } catch (err) { console.error('[Screenshot] error:', err); localStorage.setItem(STORAGE_KEY,'idle'); }
  }, [doCapture]);
  useEffect(() => {
    if (userRole !== 'employee') return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved || saved === 'idle') setShowPopup(true);
    else if (saved === 'granted') startCapturing();
  }, [userRole, startCapturing]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { clearInterval(intervalRef.current); streamRef.current?.getTracks().forEach(t => t.stop()); }, []);
  const handleAllow = useCallback(async () => { setShowPopup(false); await startCapturing(); }, [startCapturing]);
  const handleDeny  = useCallback(() => { setShowPopup(false); localStorage.setItem(STORAGE_KEY,'denied'); }, []);
  return { showPopup, handleAllow, handleDeny };
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
  if (!currentUser || !['admin','ceo'].includes(currentUser.role)) return <Navigate to="/" replace />;
  return children;
}

// ✅ FIX: Removed ForceResetGuard from ProtectedLayout entirely.
// The old ForceResetGuard redirected to /login when forceReset=true,
// but /login redirects back to / when currentUser exists → infinite loop.
// Now forceReset is handled in LoginPage itself (it already shows the
// reset form when forceReset=true), so no redirect guard is needed here.
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
  const { currentUser, authLoading, forceReset } = useApp();
  const { showPopup, handleAllow, handleDeny } = useScreenshotCapture(currentUser?.role);

  if (authLoading) return <LoadingScreen />;

  return (
    <>
      {showPopup && currentUser && <ScreenshotPermissionPopup onAllow={handleAllow} onDeny={handleDeny} />}
      <Routes>
        {/* ✅ FIX: /login shows LoginPage when forceReset OR no user.
            LoginPage internally renders the reset form when forceReset=true.
            This breaks the /login ↔ / redirect loop. */}
        <Route path="/login" element={
          currentUser && !forceReset
            ? <Navigate to="/" replace />
            : <LoginPage />
        } />
        <Route path="/" element={<ProtectedLayout><HomePage /></ProtectedLayout>} />
        <Route path="/attendance" element={<ProtectedLayout><AttendancePage /></ProtectedLayout>} />
        <Route path="/attendance/manage" element={<ProtectedLayout><AdminGuard><AdminAttendancePage /></AdminGuard></ProtectedLayout>} />
        <Route path="/tasks" element={<ProtectedLayout><TasksPage /></ProtectedLayout>} />
        <Route path="/chat" element={<ProtectedLayout><GroupChatPage /></ProtectedLayout>} />
        <Route path="/profile" element={<ProtectedLayout><ProfilePage /></ProtectedLayout>} />
        <Route path="/leaves" element={<ProtectedLayout><LeavePage /></ProtectedLayout>} />
        <Route path="*" element={currentUser ? <Navigate to="/" replace /> : <Navigate to="/login" replace />} />
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