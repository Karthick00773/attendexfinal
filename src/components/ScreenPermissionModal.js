import React, { useEffect, useRef } from 'react';
import { useScreenMonitor } from './context/ScreenMonitorContext';
import './ScreenPermissionModal.css';

export default function ScreenPermissionModal() {
  const { showModal, startRecording, denyRecording } = useScreenMonitor();
  const overlayRef = useRef(null);

  /* Trap focus inside modal for a11y */
  useEffect(() => {
    if (showModal) {
      overlayRef.current?.querySelector('button')?.focus();
    }
  }, [showModal]);

  if (!showModal) return null;

  return (
    <div
      className="spm-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="spm-title"
      aria-describedby="spm-desc"
      ref={overlayRef}
    >
      <div className="spm-card">

        {/* Icon */}
        <div className="spm-icon-ring">
          <div className="spm-icon-inner">
            {/* Monitor + record dot */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="1.8"
                 strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <span className="spm-rec-dot" aria-hidden="true" />
        </div>

        {/* Heading */}
        <h2 className="spm-title" id="spm-title">Screen Monitoring Required</h2>

        <p className="spm-desc" id="spm-desc">
          To maintain workspace compliance, your screen must be shared while
          you're clocked in. A screenshot will be captured <strong>once every
          30–60 minutes</strong> and stored securely.
        </p>

        {/* What happens bullets */}
        <ul className="spm-bullets">
          <li>
            <span className="spm-bullet-icon spm-bullet-green">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2.5"
                   strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </span>
            Random screenshots taken every 30–60 min during check-in
          </li>
          <li>
            <span className="spm-bullet-icon spm-bullet-green">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2.5"
                   strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </span>
            Stored securely and accessible only to authorised managers
          </li>
          <li>
            <span className="spm-bullet-icon spm-bullet-green">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2.5"
                   strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </span>
            Recording stops automatically when you check out
          </li>
          <li>
            <span className="spm-bullet-icon spm-bullet-red">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2.5"
                   strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </span>
            Declining will <strong>disable Check-In</strong> for this session
          </li>
        </ul>

        {/* Privacy note */}
        <div className="spm-privacy-note">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Your browser will show a native sharing prompt — you must select your
          entire screen or a specific window.
        </div>

        {/* Actions */}
        <div className="spm-actions">
          <button
            className="spm-btn spm-btn-deny"
            onClick={denyRecording}
            aria-label="Decline screen sharing — check-in will be disabled"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            Decline
          </button>
          <button
            className="spm-btn spm-btn-allow"
            onClick={startRecording}
            aria-label="Allow screen sharing and enable check-in"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.07 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16v.92z"/>
            </svg>
            Allow &amp; Continue
          </button>
        </div>

      </div>
    </div>
  );
}
