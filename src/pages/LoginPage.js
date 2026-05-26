import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import './LoginPage.css';

export default function LoginPage() {
  const { login, resetPassword, forceReset } = useApp();

  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error,           setError]           = useState('');
  const [loading,         setLoading]         = useState(false);
  const [showPw,          setShowPw]          = useState(false);
  const [showForgot,      setShowForgot]      = useState(false);
  const [forgotEmail,     setForgotEmail]     = useState('');
  const [forgotError,     setForgotError]     = useState('');
  const [forgotSuccess,   setForgotSuccess]   = useState('');
  const [forgotLoading,   setForgotLoading]   = useState(false);

  const overlayRef = useRef(null);
  const cutTopRef  = useRef(null);
  const cutBotRef  = useRef(null);
  const scissorRef = useRef(null);

  /* ── scissors + cut animation ── */
  const runScissors = (onDone) => {
    const ov  = overlayRef.current;
    const top = cutTopRef.current;
    const bot = cutBotRef.current;
    const sc  = scissorRef.current;
    if (!ov || !top || !bot || !sc) { onDone(); return; }

    // reset
    ov.style.cssText  = 'display:flex; opacity:0; visibility:visible;';
    top.style.cssText = 'transform:translateY(0); transition:none;';
    bot.style.cssText = 'transform:translateY(0); transition:none;';
    sc.style.cssText  = 'opacity:0; left:-80px; transition:none;';

    requestAnimationFrame(() => requestAnimationFrame(() => {

      // 1 — overlay fades in (navy halves cover screen)
      ov.style.transition  = 'opacity 0.2s ease';
      ov.style.opacity     = '1';

      // 2 — scissor appears and slides across
      setTimeout(() => {
        sc.style.transition = 'opacity 0.15s ease';
        sc.style.opacity    = '1';
        requestAnimationFrame(() => {
          sc.style.transition = 'left 0.85s cubic-bezier(0.55,0,0.35,1), opacity 0.15s ease';
          sc.style.left = (window.innerWidth + 100) + 'px';
        });
      }, 200);

      // 3 — scissor reaches middle → blades open via CSS class
      setTimeout(() => {
        sc.classList.add('sc-open');
      }, 550);

      // 4 — cut: panels fly apart
      setTimeout(() => {
        top.style.transition = 'transform 0.6s cubic-bezier(0.76,0,0.24,1)';
        bot.style.transition = 'transform 0.6s cubic-bezier(0.76,0,0.24,1)';
        top.style.transform  = 'translateY(-100%)';
        bot.style.transform  = 'translateY(100%)';
      }, 820);

      // 5 — cleanup + navigate
      setTimeout(() => {
        onDone();
        ov.style.display    = 'none';
        ov.style.opacity    = '0';
        ov.style.visibility = 'hidden';
        top.style.transform = '';
        bot.style.transform = '';
        sc.classList.remove('sc-open');
      }, 1550);
    }));
  };

  /* ── handlers ── */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      runScissors(() => {});
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8)            { setError('Password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword)   { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try   { await resetPassword(newPassword); }
    catch (err) { setError(err.message || 'Password reset failed. Please try again.'); }
    finally     { setLoading(false); }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotError(''); setForgotSuccess(''); setForgotLoading(true);
    try {
      if (!forgotEmail) { setForgotError('Please enter your email address.'); return; }
      setForgotSuccess('Password reset link sent! Please check your inbox.');
      setForgotEmail('');
      setTimeout(() => setForgotSuccess(''), 5000);
    } catch (err) {
      setForgotError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  /* ── force-reset screen ── */
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

  /* ── main login page ── */
  return (
    <div className="lf-page">

      {/* ── Scissors + cut overlay ──
          position:fixed in CSS so it escapes every clipping ancestor */}
      <div className="sc-overlay" ref={overlayRef} style={{ display:'none' }}>
        <div className="sc-top" ref={cutTopRef}><div className="sc-seam sc-seam-bot" /></div>
        <div className="sc-bot" ref={cutBotRef}><div className="sc-seam sc-seam-top" /></div>
        <div className="sc-rider" ref={scissorRef}>
          <svg className="sc-blade-top" viewBox="0 0 60 18" width="60" height="18">
            <ellipse cx="42" cy="9" rx="16" ry="5" fill="#c8dff0" stroke="#3f79af" strokeWidth="1.5"/>
            <circle cx="12" cy="9" r="5" fill="#fff" stroke="#3f79af" strokeWidth="1.5"/>
            <circle cx="12" cy="9" r="2" fill="#3f79af"/>
            <path d="M16,7 Q28,2 42,4" fill="none" stroke="#3f79af" strokeWidth="1"/>
          </svg>
          <svg className="sc-blade-bot" viewBox="0 0 60 18" width="60" height="18">
            <ellipse cx="42" cy="9" rx="16" ry="5" fill="#c8dff0" stroke="#3f79af" strokeWidth="1.5"/>
            <circle cx="12" cy="9" r="5" fill="#fff" stroke="#3f79af" strokeWidth="1.5"/>
            <circle cx="12" cy="9" r="2" fill="#3f79af"/>
            <path d="M16,11 Q28,16 42,14" fill="none" stroke="#3f79af" strokeWidth="1"/>
          </svg>
        </div>
      </div>

      {/* ── floating badges ── */}
      <div className="lf-fbadge" style={{ top:'9%',  left:'1.5%', '--r':'-3deg',  animationDuration:'6s'   }}><span className="lf-badge-dot"/>GPS geo-fencing</div>
      <div className="lf-fbadge" style={{ top:'24%', left:'1.5%', '--r':'2.5deg', animationDuration:'7.5s', animationDelay:'.5s' }}><span className="lf-badge-dot"/>AI anomaly detection</div>
      <div className="lf-fbadge" style={{ top:'48%', left:'1.5%', '--r':'-2deg',  animationDuration:'8s',   animationDelay:'.3s' }}><span className="lf-badge-dot"/>ISO 27001 certified</div>
      <div className="lf-fbadge" style={{ top:'10%', right:'1.5%','--r':'3deg',   animationDuration:'7s',   animationDelay:'.9s' }}><span className="lf-badge-dot"/>Real-time insights</div>
      <div className="lf-fbadge" style={{ top:'58%', right:'1.5%','--r':'-3deg',  animationDuration:'8.5s', animationDelay:'.6s' }}><span className="lf-badge-dot"/>Mobile first · iOS &amp; Android</div>

      <div className="lf-center">

        {/* ── logo ── */}
        <div className="lf-logo-wrap">
          <div className="lf-logo">AttendX</div>
          <div className="lf-logo-line">
            <div className="lf-logo-rule"/>
            <div className="lf-logo-sub">Attendance Management System</div>
            <div className="lf-logo-rule"/>
          </div>
          <div className="lf-est">
            <div className="lf-est-line"/>Trusted by 500+ companies<div className="lf-est-line"/>
          </div>
        </div>

        {/* ── card ── */}
        <div className="lf-card">
          <div className="lf-card-leather"/>
          <svg className="lf-stitch-svg" viewBox="0 0 400 500" preserveAspectRatio="none">
            <rect className="lf-stitch-path" x="8" y="8" width="384" height="484" rx="3"/>
          </svg>
          <div className="rivet rv-tl"><div className="rivet-shine"/></div>
          <div className="rivet rv-tr"><div className="rivet-shine"/></div>
          <div className="rivet rv-bl"><div className="rivet-shine"/></div>
          <div className="rivet rv-br"><div className="rivet-shine"/></div>

          <div className="lf-inner">

            {!showForgot ? (
              /* ── sign-in form ── */
              <>
                <div className="lf-heading" style={{ animationDelay:'.3s' }}>Welcome<br/><span>Back.</span></div>
                <p className="lf-sub" style={{ animationDelay:'.4s' }}>Sign in to your AttendX portal</p>

                <form onSubmit={handleLogin}>
                  {/* email */}
                  <div className="lf-field" style={{ animationDelay:'.5s', marginBottom:'1rem' }}>
                    <label className="lf-label">Employee ID / Email</label>
                    <div className="lf-input-wrap">
                      <span className="lf-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                      </span>
                      <input className="lf-inp" type="email" placeholder="employee@company.com"
                        value={email} onChange={e => setEmail(e.target.value)}
                        required autoComplete="email"/>
                    </div>
                  </div>

                  {/* password */}
                  <div className="lf-field" style={{ animationDelay:'.6s', marginBottom:'.4rem' }}>
                    <div className="lf-row">
                      <label className="lf-label" style={{ margin:0 }}>Password</label>
                      <button type="button" className="lf-link"
                        onClick={() => { setShowForgot(true); setError(''); }}>
                        Forgot password?
                      </button>
                    </div>
                    <div className="lf-input-wrap">
                      <span className="lf-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      </span>
                      <input className="lf-inp" type={showPw ? 'text' : 'password'}
                        placeholder="Enter your passphrase"
                        value={password} onChange={e => setPassword(e.target.value)}
                        required autoComplete="current-password"
                        style={{ paddingRight:34 }}/>
                      <button type="button" className="lf-eye"
                        aria-label={showPw ? 'Hide password' : 'Show password'}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => setShowPw(s => !s)}>
                        {showPw
                          ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        }
                      </button>
                    </div>
                  </div>

                  {error && <div className="login-error">{error}</div>}

                  <div className="lf-btn-wrap" style={{ animationDelay:'.7s' }}>
                    <div className="lf-btn-ring" style={{ right:22, top:'50%', marginTop:-6 }}/>
                    <button className="lf-btn" type="submit" disabled={loading}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                      </svg>
                      {loading ? 'Signing in…' : 'Sign In to AttendX'}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                      <div className="lf-btn-sheen"/>
                    </button>
                  </div>
                </form>

                <p className="lf-footer">
                  New employee?{' '}
                  <button type="button">Contact your HR admin</button>
                </p>
              </>
            ) : (
              /* ── forgot password form ── */
              <>
                <div className="lf-heading" style={{ animationDelay:'.2s' }}>Reset<br/><span>Password.</span></div>
                <p className="lf-sub" style={{ animationDelay:'.3s' }}>Enter your email — we'll send a reset link.</p>

                <form onSubmit={handleForgotPassword}>
                  <div className="lf-field" style={{ animationDelay:'.4s', marginBottom:'1rem' }}>
                    <label className="lf-label">Email address</label>
                    <div className="lf-input-wrap">
                      <span className="lf-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                        </svg>
                      </span>
                      <input className="lf-inp" type="email" placeholder="employee@company.com"
                        value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required/>
                    </div>
                  </div>

                  {forgotSuccess && <div className="login-success">{forgotSuccess}</div>}
                  {forgotError   && <div className="login-error">{forgotError}</div>}

                  <div className="lf-btn-wrap" style={{ animationDelay:'.5s' }}>
                    <button className="lf-btn" type="submit" disabled={forgotLoading}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                      {forgotLoading ? 'Sending…' : 'Send Reset Link'}
                      <div className="lf-btn-sheen"/>
                    </button>
                  </div>
                </form>

                <p className="lf-footer">
                  Remember your password?{' '}
                  <button type="button"
                    onClick={() => { setShowForgot(false); setForgotError(''); setForgotSuccess(''); }}>
                    Back to sign in
                  </button>
                </p>
              </>
            )}

          </div>
        </div>

        {/* ── stats bar ── */}
        <div className="lf-stats">
          <div><div className="lf-sn">500+</div><div className="lf-sl">Companies</div></div>
          <div><div className="lf-sn">120K</div><div className="lf-sl">Employees</div></div>
          <div><div className="lf-sn">99.9%</div><div className="lf-sl">Uptime</div></div>
          <div><div className="lf-sn">98%</div><div className="lf-sl">Accuracy</div></div>
        </div>
        <p className="lf-copy">© 2026 AttendX Inc. · Smart Attendance for Modern Teams · Privacy · Terms</p>

      </div>
    </div>
  );
}
