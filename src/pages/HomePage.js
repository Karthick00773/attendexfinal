// ============================================================
//  ScreenshotStatusBadge.jsx
//
//  A small status badge to show in your dashboard/navbar
//  so the employee knows screen capture is active.
//
//  Usage:
//    <ScreenshotStatusBadge
//      isCapturing={isCapturing}
//      lastCaptured={lastCaptured}
//      captureCount={captureCount}
//    />
// ============================================================

import { useState } from 'react';

export function ScreenshotStatusBadge({ isCapturing, lastCaptured, captureCount }) {
  const [showTooltip, setShowTooltip] = useState(false);

  const formatTime = (date) => {
    if (!date) return 'Never';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      style={badge.wrap}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Pulsing dot */}
      <span style={{ ...badge.dot, background: isCapturing ? '#22c55e' : '#f59e0b' }}>
        {isCapturing && <span style={badge.pulse} />}
      </span>

      <span style={badge.label}>
        {isCapturing ? 'Monitoring Active' : 'Monitoring Paused'}
      </span>

      {/* Tooltip */}
      {showTooltip && (
        <div style={badge.tooltip}>
          <div style={badge.tooltipRow}>
            <span>Status</span>
            <strong style={{ color: isCapturing ? '#22c55e' : '#f59e0b' }}>
              {isCapturing ? 'Active' : 'Paused'}
            </strong>
          </div>
          <div style={badge.tooltipRow}>
            <span>Last capture</span>
            <strong>{formatTime(lastCaptured)}</strong>
          </div>
          <div style={badge.tooltipRow}>
            <span>Total today</span>
            <strong>{captureCount} shots</strong>
          </div>
        </div>
      )}
    </div>
  );
}

const badge = {
  wrap: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    padding: '6px 14px',
    background: 'var(--soft-purple, #f8f6ff)',
    border: '1px solid var(--border, #ebebeb)',
    borderRadius: 99,
    cursor: 'default',
    userSelect: 'none',
  },
  dot: {
    position: 'relative',
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
    display: 'inline-block',
  },
  pulse: {
    position: 'absolute',
    inset: -3,
    borderRadius: '50%',
    background: 'rgba(34,197,94,0.35)',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text2, #555)',
  },
  tooltip: {
    position: 'absolute',
    top: 'calc(100% + 10px)',
    right: 0,
    background: 'var(--card-bg, #fff)',
    border: '1px solid var(--border, #ebebeb)',
    borderRadius: 12,
    padding: '12px 16px',
    minWidth: 200,
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  tooltipRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12,
    color: 'var(--muted, #888)',
  },
};


// ============================================================
//  HOW TO INTEGRATE — Add to your App.jsx or Layout.jsx
// ============================================================
//
//  STEP 1: Import the hook and components
//
//    import {
//      useScreenshotCapture,
//      ScreenshotPermissionPopup,
//    } from './useScreenshotCapture';
//    import { ScreenshotStatusBadge } from './ScreenshotStatusBadge';
//
//  STEP 2: Use the hook (pass the logged-in user's role)
//
//    function App() {
//      const user = /* your auth context */;
//
//      const {
//        showPopup,
//        isCapturing,
//        lastCaptured,
//        captureCount,
//        handleAllow,
//        handleDeny,
//      } = useScreenshotCapture(user?.role); // 'employee' triggers popup
//
//      return (
//        <>
//          {/* Popup shown once on first login for employees */}
//          {showPopup && (
//            <ScreenshotPermissionPopup
//              onAllow={handleAllow}
//              onDeny={handleDeny}
//            />
//          )}
//
//          {/* Badge shown in your navbar/topbar for employees */}
//          {user?.role === 'employee' && (
//            <ScreenshotStatusBadge
//              isCapturing={isCapturing}
//              lastCaptured={lastCaptured}
//              captureCount={captureCount}
//            />
//          )}
//
//          <YourRoutes />
//        </>
//      );
//    }
//
//  STEP 3: Add this CSS once globally (for popup animation + pulse)
//
//    @keyframes popIn {
//      from { opacity: 0; transform: scale(0.85); }
//      to   { opacity: 1; transform: scale(1); }
//    }
//    @keyframes pulse {
//      0%, 100% { opacity: 1; transform: scale(1); }
//      50%       { opacity: 0.4; transform: scale(1.6); }
//    }
//
//  STEP 4: Make sure your backend routes are mounted:
//
//    // In your Express server (app.js / server.js):
//    const screenshotRoutes = require('./routes/screenshotRoutes');
//    app.use('/api/screenshots', screenshotRoutes);
//
//  That's it! The hook handles everything automatically:
//  - Shows popup once (remembers choice in localStorage)
//  - Requests getDisplayMedia() screen permission
//  - Captures a frame every 5 minutes
//  - Uploads to ImageKit via /api/imagekit/auth
//  - Saves URL to your DB via POST /api/screenshots
// ============================================================
