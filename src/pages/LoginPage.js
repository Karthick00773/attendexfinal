import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import './LoginPage.css';

export default function LoginPage() {
  const { login, resetPassword, forceReset } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const overlayRef = useRef(null);
  const cutLineRef = useRef(null);
  const riderRef   = useRef(null);

  const runScissors = (onDone) => {
    const ov   = overlayRef.current;
    const cut  = cutLineRef.current;
    const icon = riderRef.current;

    // Safety: if refs missing just navigate
    if (!ov || !cut || !icon) { onDone(); return; }

    // ── RESET everything ────────────────────────────────────────
    ov.style.cssText   = 'display:block; opacity:0;';
    cut.style.cssText  = 'opacity:0; transition:none;';
    icon.style.cssText = 'left:-70px; opacity:0; transition:none;';
    ov.classList.remove('sc-split');

    // ── Double rAF so browser paints the block+opacity:0 first ──
    requestAnimationFrame(() => requestAnimationFrame(() => {

      // 1 — Overlay fades in
      ov.style.transition = 'opacity 0.15s ease';
      ov.style.opacity    = '1';

      // 2 — Dashed cut-line appears
      setTimeout(() => {
        cut.style.transition = 'opacity 0.2s ease';
        cut.style.opacity    = '1';
      }, 150);

      // 3 — Scissors appear then slide across
      setTimeout(() => {
        icon.style.opacity    = '1';
        icon.style.transition = 'none';
        requestAnimationFrame(() => {
          icon.style.transition = 'left 0.85s cubic-bezier(0.6,0,0.4,1)';
          icon.style.left = (window.innerWidth + 80) + 'px';
        });
      }, 280);

      // 4 — SNIP: cut-line fades, page splits open
      setTimeout(() => {
        cut.style.transition = 'opacity 0.08s';
        cut.style.opacity    = '0';
        ov.classList.add('sc-split');
      }, 750);

      // 5 — Overlay fades out
      setTimeout(() => {
        ov.style.transition = 'opacity 0.4s ease';
        ov.style.opacity    = '0';
      }, 1550);

      // 6 — Navigate + full cleanup
      setTimeout(() => {
        onDone();
        ov.style.cssText = 'display:none; opacity:0;';
        ov.classList.remove('sc-split');
      }, 2000);

    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);        // validate first
      runScissors(() => {});               // then animate (AppContext handles redirect)
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try {
      await resetPassword(newPassword);
    } catch (err) {
      setError(err.message || 'Password reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotError(''); setForgotSuccess(''); setForgotLoading(true);
    try {
      if (!forgotEmail) { setForgotError('Please enter your email address.'); return; }
      setForgotSuccess('Password reset link sent to your email. Please check your inbox.');
      setForgotEmail('');
      setTimeout(() => setForgotSuccess(''), 5000);
    } catch (err) {
      setForgotError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  if (forceReset) {
    return (
      <div className="reset-page">
        <div className="reset-card">
          <div className="reset-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h2 className="reset-title">Set new password</h2>
          <p className="reset-subtitle">This is your first login. Please set a secure password to continue.</p>
          <form onSubmit={handleResetPassword} className="reset-form">
            <div className="form-group">
              <label>New password</label>
              <input type="password" placeholder="Minimum 8 characters"
                value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8}/>
            </div>
            <div className="form-group">
              <label>Confirm password</label>
              <input type="password" placeholder="Re-enter your password"
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required/>
            </div>
            {error && <div className="login-error">{error}</div>}
            <button type="submit" className="reset-submit" disabled={loading}>
              {loading ? 'Saving…' : 'Set password & continue'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    // ── login-page is the root ──────────────────────────────────
    <div className="login-page">

      {/*
        ✅ OVERLAY IS HERE — direct child of .login-page
           NOT inside .login-container (which has overflow:hidden)
           position:fixed so it covers the full screen
      */}
      <div className="sc-overlay" ref={overlayRef}>
        <div className="sc-half sc-top"><div className="sc-fill" /></div>
        <div className="sc-half sc-bot"><div className="sc-fill" /></div>
        <div className="sc-cutline" ref={cutLineRef} />
        <div className="sc-rider"   ref={riderRef}>✂️</div>
      </div>

      <div className={`login-container${isActive ? ' active' : ''}`}>

        <div className="form-container sign-up">
          <form onSubmit={handleForgotPassword}>
            <h1>Forgot Password?</h1>
            <p style={{ fontSize:13, color:'var(--muted)', marginBottom:16 }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <input type="email" placeholder="Enter your email"
              value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required />
            {forgotSuccess && (
              <div className="login-success" style={{ width:'100%', marginTop:6, background:'#dcfce7', borderColor:'#86efac', color:'#16a34a' }}>
                {forgotSuccess}
              </div>
            )}
            {forgotError && <div className="login-error" style={{ width:'100%', marginTop:6 }}>{forgotError}</div>}
            <button type="submit" disabled={forgotLoading}>{forgotLoading ? 'Sending...' : 'Send Reset Link'}</button>
          </form>
        </div>

        <div className="form-container sign-in">
          <form onSubmit={handleLogin}>
            <h1>Sign In</h1>
            <span>Use your email &amp; password to sign in</span>
            <input type="email" placeholder="Email"
              value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            <div className="input-icon-wrap" style={{ width:'100%' }}>
              <input
                type={showPw ? 'text' : 'password'}
                className="input-with-toggle"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ width:'100%', background:'#eef5fb', border:'none', margin:'8px 0', padding:'10px 44px 10px 15px', fontSize:13, borderRadius:8, outline:'none', color:'#2a5a8c' }}
              />
              <button
                type="button"
                className="pw-toggle"
                onMouseDown={e => e.preventDefault()}
                onClick={() => setShowPw(s => !s)}
              >
                {showPw
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            <button type="button" className="link-btn" onClick={() => setIsActive(true)}>Forget Your Password?</button>
            {error && <div className="login-error" style={{ width:'100%', marginTop:6 }}>{error}</div>}
            <button type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</button>
          </form>
        </div>

        <div className="toggle-container">
          <div className="toggle">
            <div className="toggle-panel toggle-left">
              <h1>Remember Your Password?</h1>
              <p>Go back to sign in with your credentials</p>
              <button className="hidden" onClick={() => setIsActive(false)}>Sign In</button>
            </div>
            <div className="toggle-panel toggle-right">
              <h1>Forgot Your Password?</h1>
              <p>Get help resetting your password in just a few steps</p>
              <button className="hidden" onClick={() => setIsActive(true)}>Forgot Password</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
