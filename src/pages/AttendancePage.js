import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';

import './AttendancePage.css';

function formatHrs(h) {
  if (h == null) return '—';
  const value = Number(h);
  if (Number.isNaN(value)) return '—';
  return value.toFixed(2) + 'h';
}

function formatMinutesAsHours(minutes) {
  if (minutes == null) return '—';
  const value = Number(minutes);
  if (Number.isNaN(value)) return '—';
  if (value >= 60) {
    return (value / 60).toFixed(2) + 'h';
  }
  return value + 'm';
}

function formatTime(seconds) {
  const hrs  = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2,'0')}:${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
}

// ─────────────────────────────────────────────────────────────
//  Camera capture overlay
// ─────────────────────────────────────────────────────────────
function PhotoCapture({ title, onConfirm, onCancel }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [snapshot, setSnapshot] = useState(null);
  const [camErr,   setCamErr]   = useState('');
  const [ready,    setReady]    = useState(false);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then(s => {
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.onloadedmetadata = () => setReady(true);
        }
      })
      .catch(() => setCamErr('Camera access denied. Please allow camera permission and try again.'));
    return () => streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  const snap = useCallback(() => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;
    c.width  = v.videoWidth  || 640;
    c.height = v.videoHeight || 480;
    c.getContext('2d').drawImage(v, 0, 0);
    setSnapshot(c.toDataURL('image/jpeg', 0.88));
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  const retake = () => {
    setSnapshot(null);
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then(s => {
        streamRef.current = s;
        if (videoRef.current) { videoRef.current.srcObject = s; setReady(true); }
      });
  };

  const confirm = () => {
    const c = canvasRef.current;
    c.toBlob(blob => {
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      onConfirm(file);
    }, 'image/jpeg', 0.88);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(15,10,30,0.72)',
      backdropFilter: 'blur(4px)',
      zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 440, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>{title}</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 3 }}>
              {snapshot ? 'Photo captured. Confirm or retake.' : 'Position your face in the frame and take a photo.'}
            </p>
          </div>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div style={{ borderRadius: 12, overflow: 'hidden', background: '#111', marginBottom: 16, aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {camErr ? (
            <p style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center', padding: 20 }}>{camErr}</p>
          ) : snapshot ? (
            <img src={snapshot} alt="captured" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
        </div>
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <div style={{ display: 'flex', gap: 10 }}>
          {!snapshot && !camErr && (
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={snap} disabled={!ready}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              Take Photo
            </button>
          )}
          {snapshot && (
            <>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={confirm}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Confirm
              </button>
              <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={retake}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
                </svg>
                Retake
              </button>
            </>
          )}
          {camErr && (
            <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={onCancel}>Close</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Main Attendance Page
// ─────────────────────────────────────────────────────────────
export default function AttendancePage() {
  const {
    currentUser,
    todayRecord, fetchTodayAttendance,
    attendanceHistory, fetchAttendanceHistory,
    monthlySummary, fetchMonthlySummary,
    // NOTE: activeBreak is intentionally NOT used for isBreak derivation —
    // it can be stale after page refresh. todayRecord is always fresh.
    checkIn, checkOut, startBreak, endBreak,
  } = useApp();

  const [checkingIn,   setCheckingIn]   = useState(false);
  const [checkingOut,  setCheckingOut]  = useState(false);
  const [breakLoading, setBreakLoading] = useState(false);
  const [msg,   setMsg]   = useState('');
  const [error, setError] = useState('');

  const [workingSeconds, setWorkingSeconds] = useState(0);
  const [breakSeconds,   setBreakSeconds]   = useState(0);
  const [breakStartTime, setBreakStartTime] = useState(null);

  // camera: null | 'checkin' | 'checkout'
  const [camera, setCamera] = useState(null);
  const cameraActionRef = useRef(null);

  const showAttendanceDetails = Boolean(
    currentUser?.role && !['admin', 'ceo'].includes(currentUser.role)
  );

  useEffect(() => {
    fetchTodayAttendance();
    if (showAttendanceDetails) {
      fetchAttendanceHistory();
      fetchMonthlySummary();
    }
  }, [fetchTodayAttendance, fetchAttendanceHistory, fetchMonthlySummary, showAttendanceDetails]);

  const today = todayRecord;

  // ── FIX 1: Derive isBreak from todayRecord ONLY ──────────────
  // Never use activeBreak here — it can be stale after page refresh
  // or after a failed endBreak(). todayRecord is always the source of truth.
  const isBreak = Boolean(today?.break_start_time && !today?.break_end_time);

  // ── FIX 2: Sync breakStartTime with a guard to avoid resetting a running timer ──
  useEffect(() => {
    if (isBreak && today?.break_start_time) {
      // Only set if not already tracking — prevents stomping a live timer on re-renders
      setBreakStartTime(prev => prev ?? new Date(today.break_start_time));
    }
    if (!isBreak) {
      setBreakStartTime(null);
      setBreakSeconds(0);
    }
  }, [isBreak, today?.break_start_time]);

  // Live timer
  useEffect(() => {
    let interval = null;
    if (today && !today.check_out_time) {
      interval = setInterval(() => {
        const now         = new Date();
        const checkInTime = new Date(today.check_in_time);
        const totalElapsed = Math.floor((now - checkInTime) / 1000);

        const pastBreakSeconds    = (today.break_minutes || 0) * 60;
        const currentBreakSeconds = isBreak && breakStartTime
          ? Math.floor((now - breakStartTime) / 1000)
          : 0;
        const totalBreakSeconds = pastBreakSeconds + currentBreakSeconds;

        setWorkingSeconds(Math.max(0, totalElapsed - totalBreakSeconds));
        setBreakSeconds(Math.max(0, currentBreakSeconds));
      }, 1000);
    } else {
      setWorkingSeconds(0);
      setBreakSeconds(0);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [today, isBreak, breakStartTime]);

  // ── Check In / Out ──────────────────────────────────────────
  const handleCheckIn = () => {
    setError('');
    cameraActionRef.current = 'checkin';
    setCamera('checkin');
  };

  const handleCheckOut = () => {
    setError('');
    cameraActionRef.current = 'checkout';
    setCamera('checkout');
  };

  const handlePhotoConfirmed = async (file) => {
    const action = cameraActionRef.current;
    setCamera(null);
    cameraActionRef.current = null;

    if (action === 'checkin') {
      setCheckingIn(true);
      setMsg('Getting your location…');
      try {
        setMsg('Uploading photo…');
        await checkIn(file);
        setMsg('');
      } catch (err) {
        setError(err.message || 'Check-in failed. Please try again.');
        setMsg('');
      } finally {
        setCheckingIn(false);
      }
    } else {
      setCheckingOut(true);
      setMsg('Calculating hours…');
      try {
        setMsg('Uploading photo…');
        await checkOut(file);
        setMsg('');
      } catch (err) {
        setError(err.message || 'Check-out failed. Please try again.');
        setMsg('');
      } finally {
        setCheckingOut(false);
      }
    }
  };

  // ── FIX 3: Break handler — correctly sequenced, no race conditions ──
  const handleBreak = async () => {
    setBreakLoading(true);
    setError('');
    try {
      if (isBreak) {
        // Resume work — end the break
        await endBreak();
        // Clear local timer state immediately on success,
        // before fetch so the timer stops right away
        setBreakStartTime(null);
        setBreakSeconds(0);
      } else {
        // Start break
        await startBreak();
        // Set local timer start immediately on success
        setBreakStartTime(new Date());
      }
      // Refresh from server ONLY on success — this re-derives isBreak
      // from fresh todayRecord, which is now the definitive state
      await fetchTodayAttendance();
    } catch (err) {
      const raw = err?.message || '';
      const lower = raw.toLowerCase();

      if (lower.includes('fetch') || lower.includes('network')) {
        // Network error — server state unknown, force a refresh to resync
        setError('Network error. Please check your connection and try again.');
        try { await fetchTodayAttendance(); } catch (_) { /* ignore secondary fetch error */ }
      } else if (lower.includes('already')) {
        // "already on break" or "already working" — state was already correct on server.
        // Resync silently so UI matches server without showing a confusing error.
        try { await fetchTodayAttendance(); } catch (_) { /* ignore */ }
        // Don't show an error — the user's action was a no-op, not a failure
      } else if (lower.includes('break')) {
        setError(raw);
      } else {
        setError('Could not update break status. Please try again.');
      }
    } finally {
      setBreakLoading(false);
    }
  };

  const statusLabel = !today           ? 'Not Checked In'
    : isBreak                          ? 'On Break'
    : today.check_out_time             ? 'Checked Out'
    : 'Present';

  const statusColor = !today           ? 'badge-red'
    : isBreak                          ? 'badge-orange'
    : today.check_out_time             ? 'badge-blue'
    : 'badge-green';

  const fmtTime = (iso) =>
    iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }) : '—';

  return (
    <div className="page animate-fadeup">

      {/* Camera overlay */}
      {camera === 'checkin' && (
        <PhotoCapture title="Check-In Photo" onConfirm={handlePhotoConfirmed} onCancel={() => setCamera(null)} />
      )}
      {camera === 'checkout' && (
        <PhotoCapture title="Check-Out Photo" onConfirm={handlePhotoConfirmed} onCancel={() => setCamera(null)} />
      )}

      {/* Page header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Attendance</h2>
          <p className="page-sub">Track your daily working hours</p>
        </div>
        <span className={`badge ${statusColor}`} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
          ● {statusLabel}
        </span>
      </div>

      {/* Check-in / out card */}
      <div className="card attend-main-card">
        <div className="attend-header">
          <div className="attend-avatar avatar avatar-xl">{currentUser?.avatar_initials}</div>
          <div className="attend-info">
            <h3>{currentUser?.name}</h3>
            <p>{currentUser?.designation} · {currentUser?.department}</p>
            <p className="attend-date">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Times row */}
        <div className="attend-times">
          <div className="attend-time-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span className="attend-time-label">Check-In</span>
            <span className="attend-time-val">{fmtTime(today?.check_in_time)}</span>
          </div>
          <div className="attend-time-divider">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </div>
          <div className="attend-time-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span className="attend-time-label">Check-Out</span>
            <span className="attend-time-val">{fmtTime(today?.check_out_time)}</span>
          </div>
        </div>

        {/* Live Timer */}
        {today && !today.check_out_time && (
          <div className="attend-live-timer">
            <div className="timer-section">
              <div className="timer-label">Working Time</div>
              <div className="timer-display timer-working">{formatTime(workingSeconds)}</div>
            </div>
            {isBreak && (
              <div className="timer-section">
                <div className="timer-label">Break Time</div>
                <div className="timer-display timer-break">{formatTime(breakSeconds)}</div>
              </div>
            )}
          </div>
        )}

        {/* Hours chips */}
        {today && (
          <div className="attend-hours-row">
            <div className="attend-hour-chip">
              <span>Normal</span>
              <strong>{formatHrs(today.normal_hours)}</strong>
            </div>
            <div className="attend-hour-chip attend-hour-chip-ot">
              <span>Overtime</span>
              <strong>{formatHrs(today.overtime_hours)}</strong>
            </div>
            <div className="attend-hour-chip attend-hour-chip-total">
              <span>Total</span>
              <strong>{formatHrs(today.total_hours)}</strong>
            </div>
            {today.break_minutes > 0 && (
              <div className="attend-hour-chip" style={{ background: '#fef3c7' }}>
                <span>Break</span>
                <strong style={{ color: '#d97706' }}>{formatMinutesAsHours(today.break_minutes)}</strong>
              </div>
            )}
          </div>
        )}

        {/* Break banner */}
        {isBreak && (
          <div className="break-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
              <line x1="6" y1="1" x2="6" y2="4"/>
              <line x1="10" y1="1" x2="10" y2="4"/>
              <line x1="14" y1="1" x2="14" y2="4"/>
            </svg>
            <span>You are currently on a <strong>break</strong></span>
          </div>
        )}

        {msg   && <p className="gps-msg">{msg}</p>}
        {error && <p className="gps-msg" style={{ color: 'var(--red)' }}>{error}</p>}

        {/* Action buttons */}
        <div className="attend-actions">
          {!today && (
            <button className="btn btn-primary btn-lg attend-btn" onClick={handleCheckIn} disabled={checkingIn}>
              {checkingIn ? (
                <svg className="spin-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 11 12 14 22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
              )}
              {checkingIn ? 'Checking In…' : '✓ Check In'}
            </button>
          )}

          {today && !today.check_out_time && (
            <>
              <button
                className={`btn btn-lg attend-btn ${isBreak ? 'btn-success' : 'btn-outline'}`}
                onClick={handleBreak}
                disabled={breakLoading}
              >
                {breakLoading ? (
                  <svg className="spin-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                ) : isBreak ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                  </svg>
                )}
                {breakLoading ? 'Please wait…' : isBreak ? 'Resume Work' : 'Take Break'}
              </button>

              <button className="btn btn-danger btn-lg attend-btn" onClick={handleCheckOut} disabled={checkingOut}>
                {checkingOut ? (
                  <svg className="spin-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                )}
                {checkingOut ? 'Checking Out…' : '← Check Out'}
              </button>
            </>
          )}

          {today?.check_out_time && (
            <div className="attend-done-msg">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              Great work today! See you tomorrow 🎉
            </div>
          )}
        </div>
      </div>

      {/* Monthly summary */}
      {monthlySummary && showAttendanceDetails && (
        <div className="grid-3" style={{ marginTop: 24, marginBottom: 24 }}>
          <div className="card attend-stat-mini">
            <span className="attend-stat-label">Normal Hours (Month)</span>
            <span className="attend-stat-val" style={{ color: 'var(--accent)' }}>
              {Number(monthlySummary.normal_hours || 0).toFixed(1)}h
            </span>
            <div className="progress-bar" style={{ marginTop: 8 }}>
              <div className="progress-fill" style={{ width: `${Math.min(((monthlySummary.normal_hours || 0) / 180) * 100, 100)}%` }} />
            </div>
            <span className="attend-stat-sub">Target: 180h</span>
          </div>
          <div className="card attend-stat-mini">
            <span className="attend-stat-label">Overtime (Month)</span>
            <span className="attend-stat-val" style={{ color: 'var(--orange)' }}>
              {Number(monthlySummary.overtime_hours || 0).toFixed(1)}h
            </span>
            <div className="progress-bar" style={{ marginTop: 8 }}>
              <div className="progress-fill" style={{ width: `${Math.min(((monthlySummary.overtime_hours || 0) / 40) * 100, 100)}%`, background: 'var(--orange)' }} />
            </div>
            <span className="attend-stat-sub">Max tracked: 40h</span>
          </div>
          <div className="card attend-stat-mini">
            <span className="attend-stat-label">Days Present (Month)</span>
            <span className="attend-stat-val" style={{ color: 'var(--green)' }}>
              {monthlySummary.present_days || 0}
            </span>
            <div className="progress-bar" style={{ marginTop: 8 }}>
              <div className="progress-fill" style={{ width: `${Math.min(((monthlySummary.present_days || 0) / 22) * 100, 100)}%`, background: 'var(--green)' }} />
            </div>
            <span className="attend-stat-sub">
              Absent: {monthlySummary.absent_days || 0} · On Leave: {monthlySummary.leave_days || 0}
            </span>
          </div>
        </div>
      )}

      {/* Attendance history */}
      {showAttendanceDetails && (
        <div className="card" style={{ padding: 24 }}>
          <h3 className="card-title">Attendance History</h3>
          {attendanceHistory.length === 0 ? (
            <p className="empty-msg">No records yet</p>
          ) : (
            <div className="attend-history">
              {attendanceHistory.map((r, i) => (
                <div key={r.id || i} className="history-card">
                  <div className="history-card-head">
                    <div>
                      <span className="history-day">
                        {new Date(r.date).toLocaleDateString('en-IN', { weekday: 'long' })}
                      </span>
                      <span className="history-date">
                        {new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <span className={`badge ${r.status === 'present' ? 'badge-green' : r.status === 'on_leave' ? 'badge-orange' : 'badge-red'}`}>
                      {r.status === 'present' ? 'Present' : r.status === 'on_leave' ? 'On Leave' : 'Absent'}
                    </span>
                  </div>

                  <div className="history-times">
                    <div className="history-time-box">
                      <span className="history-time-label">Check-In</span>
                      <span className="history-time-val">{fmtTime(r.check_in_time)}</span>
                      {r.check_in_photo_url ? (
                        <a href={r.check_in_photo_url} target="_blank" rel="noreferrer">
                          <img src={r.check_in_photo_url} alt="check-in" className="history-photo"
                            style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover', marginTop: 4 }} />
                        </a>
                      ) : (
                        <div className="history-photo-placeholder">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                            <circle cx="12" cy="13" r="4"/>
                          </svg>
                          <span>No Photo</span>
                        </div>
                      )}
                    </div>

                    <div className="history-time-box">
                      <span className="history-time-label">Check-Out</span>
                      <span className="history-time-val">{fmtTime(r.check_out_time)}</span>
                      {r.check_out_photo_url ? (
                        <a href={r.check_out_photo_url} target="_blank" rel="noreferrer">
                          <img src={r.check_out_photo_url} alt="check-out" className="history-photo"
                            style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover', marginTop: 4 }} />
                        </a>
                      ) : (
                        <div className="history-photo-placeholder">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                            <circle cx="12" cy="13" r="4"/>
                          </svg>
                          <span>No Photo</span>
                        </div>
                      )}
                    </div>

                    <div className="history-hours">
                      <div className="history-hour-item">
                        <span>Normal</span>
                        <strong style={{ color: 'var(--accent)' }}>{formatHrs(r.normal_hours)}</strong>
                      </div>
                      <div className="history-hour-item">
                        <span>Overtime</span>
                        <strong style={{ color: 'var(--orange)' }}>{formatHrs(r.overtime_hours)}</strong>
                      </div>
                      <div className="history-hour-item">
                        <span>Total</span>
                        <strong style={{ color: 'var(--green)' }}>{formatHrs(r.total_hours)}</strong>
                      </div>
                      {r.break_minutes > 0 && (
                        <div className="history-hour-item" style={{ marginTop: 8 }}>
                          <span>Break</span>
                          <strong style={{ color: 'var(--orange)' }}>{formatMinutesAsHours(r.break_minutes)}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
