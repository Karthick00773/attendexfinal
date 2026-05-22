import React, {
  createContext, useContext, useRef,
  useState, useEffect, useCallback,
} from 'react';

/* ─────────────────────────────────────────────
   CONFIG — swap in your real ImageKit values
───────────────────────────────────────────── */
const IMAGEKIT_URL_ENDPOINT  = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT  || 'https://ik.imagekit.io/YOUR_ID';
const IMAGEKIT_PUBLIC_KEY    = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY    || 'public_xxxxxxxxxxxx';
const IMAGEKIT_AUTH_ENDPOINT = import.meta.env.VITE_IMAGEKIT_AUTH_ENDPOINT || '/api/imagekit-auth'; // your backend route
const SCREENSHOT_FOLDER      = '/screenshots';

/* Screenshot interval: random between 30 – 60 minutes (in ms) */
const rand30to60 = () => (Math.floor(Math.random() * 31) + 30) * 60 * 1000;

/* ─────────────────────────────────────────────
   Context
───────────────────────────────────────────── */
const ScreenMonitorContext = createContext(null);

export function useScreenMonitor() {
  const ctx = useContext(ScreenMonitorContext);
  if (!ctx) throw new Error('useScreenMonitor must be used inside ScreenMonitorProvider');
  return ctx;
}

/* ─────────────────────────────────────────────
   Provider
───────────────────────────────────────────── */
export function ScreenMonitorProvider({ children, currentUser, onSaveScreenshot }) {
  /* permission states:
     'idle'     — modal not yet shown
     'pending'  — modal is open, waiting for user choice
     'granted'  — user accepted, stream active
     'denied'   — user rejected
     'stopped'  — stream ended (tab hidden / manual stop)
  */
  const [permissionState, setPermissionState] = useState('idle');
  const [showModal, setShowModal]             = useState(false);
  const [isRecording, setIsRecording]         = useState(false);
  const [screenshots, setScreenshots]         = useState([]);   // { url, takenAt }
  const [statusMsg, setStatusMsg]             = useState('');

  const streamRef       = useRef(null);
  const videoRef        = useRef(document.createElement('video'));
  const intervalRef     = useRef(null);
  const nextShotTimeout = useRef(null);

  /* ── Trigger modal on login ─────────────────── */
  useEffect(() => {
    if (currentUser && permissionState === 'idle') {
      setShowModal(true);
      setPermissionState('pending');
    }
  }, [currentUser]);

  /* ── Clean up on unmount ────────────────────── */
  useEffect(() => {
    return () => stopEverything();
  }, []);

  /* ── Stop if stream track ends externally ───── */
  const onTrackEnded = useCallback(() => {
    setIsRecording(false);
    setPermissionState('stopped');
    setStatusMsg('Screen recording stopped. Check-in is disabled.');
    clearNextShot();
  }, []);

  /* ── Start display capture ──────────────────── */
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false,
        preferCurrentTab: false,   // let user pick entire screen
      });

      streamRef.current = stream;
      stream.getVideoTracks()[0].addEventListener('ended', onTrackEnded);

      const video = videoRef.current;
      video.srcObject = stream;
      video.muted     = true;
      await video.play();

      setIsRecording(true);
      setPermissionState('granted');
      setShowModal(false);
      setStatusMsg('Screen is being monitored.');
      scheduleNextShot();
    } catch (err) {
      console.error('getDisplayMedia failed:', err);
      // User cancelled the browser picker — treat as denied
      setPermissionState('denied');
      setShowModal(false);
      setStatusMsg('Screen recording permission denied. Check-in unavailable.');
    }
  }, []);

  /* ── Stop everything ────────────────────────── */
  function stopEverything() {
    clearNextShot();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    const video = videoRef.current;
    video.pause();
    video.srcObject = null;
    setIsRecording(false);
  }

  /* ── Schedule screenshot ────────────────────── */
  function scheduleNextShot() {
    clearNextShot();
    const delay = rand30to60();
    console.log(`[ScreenMonitor] Next screenshot in ${Math.round(delay / 60000)} min`);
    nextShotTimeout.current = setTimeout(async () => {
      await captureAndUpload();
      scheduleNextShot(); // reschedule after each shot
    }, delay);
  }

  function clearNextShot() {
    if (nextShotTimeout.current) {
      clearTimeout(nextShotTimeout.current);
      nextShotTimeout.current = null;
    }
  }

  /* ── Capture frame → ImageKit ───────────────── */
  const captureAndUpload = useCallback(async () => {
    if (!streamRef.current || !videoRef.current) return;
    try {
      const video  = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width  = video.videoWidth  || 1920;
      canvas.height = video.videoHeight || 1080;
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.75));
      const url  = await uploadToImageKit(blob);

      const record = {
        url,
        takenAt:    new Date().toISOString(),
        employeeId: currentUser?.id,
        employeeName: currentUser?.name,
      };

      setScreenshots(prev => [record, ...prev]);
      if (typeof onSaveScreenshot === 'function') onSaveScreenshot(record);
      console.log('[ScreenMonitor] Screenshot saved:', url);
    } catch (err) {
      console.error('[ScreenMonitor] Capture/upload failed:', err);
    }
  }, [currentUser, onSaveScreenshot]);

  /* ── ImageKit upload ────────────────────────── */
  async function uploadToImageKit(blob) {
    // 1. Get auth params from your backend
    const authRes  = await fetch(IMAGEKIT_AUTH_ENDPOINT);
    const authData = await authRes.json(); // { token, expire, signature }

    // 2. Build the form
    const fileName = `screenshot_${currentUser?.id}_${Date.now()}.jpg`;
    const form     = new FormData();
    form.append('file',           blob, fileName);
    form.append('fileName',       fileName);
    form.append('folder',         SCREENSHOT_FOLDER);
    form.append('publicKey',      IMAGEKIT_PUBLIC_KEY);
    form.append('signature',      authData.signature);
    form.append('expire',         authData.expire);
    form.append('token',          authData.token);

    // 3. POST to ImageKit
    const res  = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      body:   form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'ImageKit upload failed');
    return data.url; // the CDN URL
  }

  /* ── Exposed value ──────────────────────────── */
  const value = {
    permissionState,   // 'idle' | 'pending' | 'granted' | 'denied' | 'stopped'
    showModal,
    isRecording,
    screenshots,
    statusMsg,
    canCheckIn: permissionState === 'granted' && isRecording,
    startRecording,    // call this when user clicks "Allow"
    denyRecording: () => {
      setPermissionState('denied');
      setShowModal(false);
      setStatusMsg('Screen recording was declined. Check-in is disabled.');
    },
    stopRecording: () => {
      stopEverything();
      setPermissionState('stopped');
    },
    captureNow: captureAndUpload, // for manual/debug triggers
  };

  return (
    <ScreenMonitorContext.Provider value={value}>
      {children}
    </ScreenMonitorContext.Provider>
  );
}
