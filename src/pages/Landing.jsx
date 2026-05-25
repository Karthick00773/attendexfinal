import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

  *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
  :root{
    --teal:#3fd4af;
    --teal-dark:#38b496;
    --teal-glow:rgba(63,212,175,0.18);
    --teal-line:rgba(63,212,175,0.35);
    --indigo:#6366f1;
    --indigo-glow:rgba(99,102,241,0.15);
    --white:#ffffff;
    --off:#f8fafb;
    --dark:#0b0f1a;
    --dark2:#111827;
    --muted:#6b7280;
    --border:#e5e7eb;
    --font:'Plus Jakarta Sans',sans-serif;
  }
  html{scroll-behavior:smooth;}
  body{font-family:var(--font);background:#fff;color:#111827;overflow-x:hidden;cursor:none;}

  #cur,#cur2{position:fixed;pointer-events:none;z-index:9999;border-radius:50%;transform:translate(-50%,-50%);}
  #cur{width:8px;height:8px;background:var(--teal);transition:width .2s,height .2s,background .2s;}
  #cur2{width:36px;height:36px;border:1.5px solid var(--teal-line);transition:left .08s ease,top .08s ease,width .3s,height .3s;}
  .cursor-hover #cur{width:4px;height:4px;}
  .cursor-hover #cur2{width:56px;height:56px;border-color:var(--teal);}

  .nexus-nav{
    position:fixed;top:0;left:0;right:0;z-index:500;
    padding:0 48px;height:72px;
    display:flex;align-items:center;justify-content:space-between;
    background:rgba(255,255,255,0.85);
    backdrop-filter:blur(20px);
    border-bottom:1px solid rgba(229,231,235,0.6);
    transition:transform .4s ease;
  }
  .nexus-nav.hidden{transform:translateY(-100%);}
  .nav-logo{
    font-size:18px;font-weight:700;letter-spacing:-0.03em;
    background:linear-gradient(135deg,var(--teal),var(--indigo));
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;
    cursor:pointer;
  }
  .nav-links{display:flex;gap:36px;list-style:none;}
  .nav-links a{font-size:13px;font-weight:500;color:var(--muted);text-decoration:none;transition:color .2s;letter-spacing:0.01em;}
  .nav-links a:hover{color:#111827;}
  .nav-cta{
    background:var(--teal);color:#fff;border:none;
    border-radius:10px;padding:10px 22px;
    font-size:13px;font-weight:600;cursor:pointer;
    transition:transform .2s,box-shadow .2s;
    font-family:var(--font);
  }
  .nav-cta:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(63,212,175,.35);}

  .hero{
    min-height:100vh;
    display:flex;flex-direction:column;
    align-items:center;justify-content:center;
    padding:120px 24px 80px;
    position:relative;overflow:hidden;
    background:#fff;
  }
  .hero-bg{
    position:absolute;inset:0;
    background:
      radial-gradient(ellipse 70% 50% at 20% 30%, rgba(63,212,175,0.1) 0%, transparent 70%),
      radial-gradient(ellipse 50% 60% at 80% 70%, rgba(99,102,241,0.08) 0%, transparent 70%),
      radial-gradient(ellipse 40% 40% at 60% 20%, rgba(63,212,175,0.06) 0%, transparent 60%);
  }
  .hero-grid{
    position:absolute;inset:0;
    background-image:
      linear-gradient(rgba(63,212,175,0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(63,212,175,0.06) 1px, transparent 1px);
    background-size:60px 60px;
    mask-image:radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
  }
  #heroCanvas{position:absolute;inset:0;width:100%;height:100%;}
  .hero-inner{position:relative;z-index:10;text-align:center;max-width:780px;}

  .hero-badge{
    display:inline-flex;align-items:center;gap:8px;
    background:rgba(63,212,175,0.08);
    border:1px solid rgba(63,212,175,0.25);
    border-radius:100px;padding:7px 16px;
    font-size:12px;font-weight:500;color:var(--teal-dark);
    margin-bottom:32px;letter-spacing:0.04em;
    opacity:0;animation:riseIn .7s .1s ease forwards;
  }
  .badge-dot{
    width:6px;height:6px;border-radius:50%;background:var(--teal);
    animation:dotPulse 2s ease-in-out infinite;
  }
  @keyframes dotPulse{0%,100%{transform:scale(1);opacity:1;}50%{transform:scale(.6);opacity:.5;}}

  .hero-h1{font-size:clamp(44px,7vw,88px);font-weight:700;line-height:1.0;letter-spacing:-0.04em;color:#0b0f1a;margin-bottom:24px;}
  .hero-h1 .line{display:block;overflow:hidden;}
  .hero-h1 .line span{display:block;opacity:0;transform:translateY(100%);animation:slideUp .9s cubic-bezier(.16,1,.3,1) forwards;}
  .hero-h1 .line:nth-child(1) span{animation-delay:.2s;}
  .hero-h1 .line:nth-child(2) span{animation-delay:.35s;}
  .hero-h1 .line:nth-child(3) span{animation-delay:.5s;}

  .grad-text{background:linear-gradient(135deg,var(--teal) 0%,var(--indigo) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}

  .hero-sub{font-size:17px;line-height:1.7;color:var(--muted);max-width:520px;margin:0 auto 40px;opacity:0;animation:riseIn .8s .7s ease forwards;}
  .hero-btns{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;opacity:0;animation:riseIn .8s .85s ease forwards;}

  .btn-primary{
    display:flex;align-items:center;gap:8px;
    background:linear-gradient(135deg,var(--teal),var(--teal-dark));
    color:#fff;border:none;border-radius:12px;
    padding:15px 32px;font-size:14px;font-weight:600;
    cursor:pointer;font-family:var(--font);
    transition:transform .2s,box-shadow .2s;
    box-shadow:0 4px 20px rgba(63,212,175,.3);
  }
  .btn-primary:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(63,212,175,.4);}
  .btn-secondary{
    display:flex;align-items:center;gap:8px;
    background:transparent;color:#374151;
    border:1.5px solid var(--border);border-radius:12px;
    padding:15px 32px;font-size:14px;font-weight:500;
    cursor:pointer;font-family:var(--font);
    transition:border-color .2s,background .2s,transform .2s;
  }
  .btn-secondary:hover{border-color:var(--teal);background:rgba(63,212,175,.04);transform:translateY(-2px);}

  .marquee-section{padding:28px 0;background:linear-gradient(135deg,var(--teal),var(--indigo));overflow:hidden;position:relative;}
  .marquee-track{display:flex;gap:0;animation:marquee 18s linear infinite;width:max-content;}
  .marquee-item{
    padding:0 40px;font-size:13px;font-weight:600;
    color:rgba(255,255,255,0.7);letter-spacing:.08em;
    text-transform:uppercase;white-space:nowrap;
    display:flex;align-items:center;gap:16px;
  }
  .marquee-item::after{content:'✦';opacity:.5;}
  @keyframes marquee{from{transform:translateX(0);}to{transform:translateX(-50%);}}

  .features{padding:120px 48px;background:#fff;position:relative;}
  .section-label{font-size:12px;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:var(--teal-dark);margin-bottom:16px;display:block;}
  .section-title{font-size:clamp(32px,4vw,52px);font-weight:700;letter-spacing:-0.03em;line-height:1.1;color:#0b0f1a;max-width:560px;margin-bottom:72px;}
  .features-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;max-width:1100px;margin:0 auto;}

  .feat-card{
    background:#fff;border:1px solid var(--border);
    border-radius:20px;padding:32px;
    position:relative;overflow:hidden;
    opacity:0;transform:translateY(40px);
    transition:transform .6s cubic-bezier(.16,1,.3,1),box-shadow .6s,border-color .3s,opacity .6s;
  }
  .feat-card.visible{opacity:1;transform:translateY(0);}
  .feat-card:hover{transform:translateY(-6px);box-shadow:0 24px 60px rgba(63,212,175,.12);border-color:rgba(63,212,175,.35);}
  .feat-card::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 60% 60% at 50% 0%, rgba(63,212,175,0.06) 0%,transparent 100%);opacity:0;transition:opacity .35s;}
  .feat-card:hover::before{opacity:1;}
  .feat-icon{width:48px;height:48px;border-radius:14px;background:rgba(63,212,175,.1);display:flex;align-items:center;justify-content:center;margin-bottom:20px;color:var(--teal);}
  .feat-title{font-size:17px;font-weight:700;color:#0b0f1a;margin-bottom:10px;letter-spacing:-.02em;}
  .feat-desc{font-size:14px;line-height:1.65;color:var(--muted);}

  .stats-section{padding:100px 48px;background:linear-gradient(135deg,#0b0f1a 0%,#111827 100%);position:relative;overflow:hidden;}
  .stats-section::before{
    content:'';position:absolute;inset:0;
    background:radial-gradient(ellipse 60% 80% at 20% 50%, rgba(63,212,175,.08) 0%, transparent 70%),
               radial-gradient(ellipse 50% 60% at 80% 30%, rgba(99,102,241,.06) 0%, transparent 70%);
  }
  .stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:48px;max-width:900px;margin:0 auto;position:relative;}
  .stat-card{text-align:center;}
  .stat-num{
    font-size:clamp(48px,6vw,72px);font-weight:700;
    letter-spacing:-0.04em;line-height:1;
    background:linear-gradient(135deg,var(--teal),#fff);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;
    margin-bottom:8px;
  }
  .stat-label{font-size:13px;font-weight:500;color:rgba(255,255,255,.4);letter-spacing:.06em;text-transform:uppercase;}

  .reveal-section{padding:120px 48px;background:#f8fafb;position:relative;overflow:hidden;}
  .reveal-row{display:flex;align-items:center;gap:80px;max-width:1100px;margin:0 auto;}
  .reveal-row.rev{flex-direction:row-reverse;}
  .reveal-text{flex:1;}
  .reveal-visual{
    flex:1;border-radius:24px;overflow:hidden;
    box-shadow:0 32px 80px rgba(0,0,0,.1);
    opacity:0;transform:translateX(60px);
    transition:opacity .9s cubic-bezier(.16,1,.3,1),transform .9s cubic-bezier(.16,1,.3,1);
  }
  .reveal-row.rev .reveal-visual{transform:translateX(-60px);}
  .reveal-visual.visible{opacity:1;transform:translateX(0)!important;}
  .reveal-visual-inner{background:linear-gradient(135deg,#0b0f1a,#1a2035);aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;}

  .mock-card{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:20px 24px;width:80%;backdrop-filter:blur(10px);}
  .mock-bar{height:8px;border-radius:4px;background:rgba(255,255,255,.08);margin-bottom:10px;}
  .mock-bar.teal{background:linear-gradient(90deg,var(--teal),transparent);width:70%;}
  .mock-bar.short{width:45%;}
  .mock-bar.med{width:60%;}
  .mock-dots{display:flex;gap:6px;margin-bottom:16px;}
  .mock-dot{width:8px;height:8px;border-radius:50%;}
  .mock-pulse{width:100%;height:40px;background:rgba(63,212,175,.08);border-radius:8px;position:relative;overflow:hidden;}
  .mock-pulse::after{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(63,212,175,.3),transparent);animation:shimmer 2s ease-in-out infinite;}
  @keyframes shimmer{to{left:100%;}}

  .bar-chart{display:flex;align-items:flex-end;gap:5px;height:50px;margin-bottom:12px;}
  .bar-chart > div{flex:1;border-radius:3px 3px 0 0;}

  .reveal-text-inner{opacity:0;transform:translateY(30px);transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1);}
  .reveal-text-inner.visible{opacity:1;transform:translateY(0);}
  .reveal-title{font-size:clamp(28px,3.5vw,44px);font-weight:700;letter-spacing:-.03em;line-height:1.15;color:#0b0f1a;margin-bottom:16px;}
  .reveal-desc{font-size:15px;line-height:1.7;color:var(--muted);margin-bottom:28px;}
  .tag-row{display:flex;gap:8px;flex-wrap:wrap;}
  .tag{background:rgba(63,212,175,.08);color:var(--teal-dark);border:1px solid rgba(63,212,175,.2);border-radius:100px;padding:5px 14px;font-size:12px;font-weight:500;}

  .testimonials{padding:120px 48px;background:#fff;}
  .testi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;max-width:1100px;margin:40px auto 0;}
  .testi-card{background:#f8fafb;border:1px solid var(--border);border-radius:20px;padding:28px;opacity:0;transform:translateY(30px);transition:opacity .7s ease,transform .7s ease;}
  .testi-card.visible{opacity:1;transform:translateY(0);}
  .testi-stars{color:var(--teal);font-size:14px;margin-bottom:14px;letter-spacing:2px;}
  .testi-quote{font-size:14px;line-height:1.7;color:#374151;margin-bottom:18px;font-style:italic;}
  .testi-author{display:flex;align-items:center;gap:10px;}
  .testi-avatar{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;flex-shrink:0;}
  .testi-name{font-size:13px;font-weight:600;color:#111827;}
  .testi-role{font-size:11px;color:var(--muted);}

  .cta-section{padding:140px 48px;text-align:center;background:linear-gradient(135deg,#0b0f1a,#111827);position:relative;overflow:hidden;}
  .cta-section::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 70% 60% at 50% 50%,rgba(63,212,175,.1) 0%,transparent 70%);animation:breathe 5s ease-in-out infinite;}
  @keyframes breathe{0%,100%{transform:scale(1);}50%{transform:scale(1.1);}}
  .cta-label{color:rgba(63,212,175,.7);}
  .cta-title{font-size:clamp(36px,5vw,64px);font-weight:700;letter-spacing:-.04em;line-height:1.05;color:#fff;margin-bottom:20px;position:relative;}
  .cta-sub{font-size:16px;color:rgba(255,255,255,.45);margin-bottom:48px;max-width:420px;margin-left:auto;margin-right:auto;line-height:1.65;}
  .cta-btn{
    display:inline-flex;align-items:center;gap:10px;
    background:linear-gradient(135deg,var(--teal),var(--teal-dark));
    color:#fff;border:none;border-radius:14px;
    padding:18px 44px;font-size:15px;font-weight:600;
    cursor:pointer;font-family:var(--font);
    box-shadow:0 8px 40px rgba(63,212,175,.35);
    transition:transform .2s,box-shadow .2s;position:relative;
  }
  .cta-btn:hover{transform:translateY(-3px);box-shadow:0 20px 60px rgba(63,212,175,.5);}

  .nexus-footer{padding:48px;background:#0b0f1a;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;border-top:1px solid rgba(255,255,255,.06);}
  .foot-logo{font-size:16px;font-weight:700;letter-spacing:-.03em;background:linear-gradient(135deg,var(--teal),var(--indigo));-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
  .foot-copy{font-size:12px;color:rgba(255,255,255,.25);}
  .foot-links{display:flex;gap:24px;}
  .foot-links a{font-size:12px;color:rgba(255,255,255,.3);text-decoration:none;transition:color .2s;}
  .foot-links a:hover{color:var(--teal);}

  .floating-shape{position:absolute;border-radius:50%;background:radial-gradient(circle,var(--teal-glow),transparent);pointer-events:none;animation:floatAnim 8s ease-in-out infinite;}
  @keyframes floatAnim{0%,100%{transform:translateY(0) scale(1);}50%{transform:translateY(-20px) scale(1.05);}}

  @keyframes riseIn{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
  @keyframes slideUp{from{opacity:0;transform:translateY(100%);}to{opacity:1;transform:translateY(0);}}

  @media(max-width:768px){
    .nexus-nav{padding:0 24px;}
    .nav-links,.nav-cta{display:none;}
    .features,.stats-section,.reveal-section,.testimonials,.cta-section{padding:80px 24px;}
    .reveal-row,.reveal-row.rev{flex-direction:column;gap:40px;}
    .nexus-footer{padding:32px 24px;}
    .foot-links{display:none;}
  }
`;

const MARQUEE_ITEMS = [
  'Attendance Tracking','Leave Management','Team Chat','Task Manager',
  'Admin Dashboard','Role-based Access','Real-time Updates','Employee Profiles',
  'Screenshot Monitoring','Analytics'
];

const FEATURES = [
  {
    icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    title: 'Attendance Management',
    desc: 'Track clock-ins, clock-outs, and work hours in real time. GPS and screenshot verification built in.'
  },
  {
    icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    title: 'Leave Requests',
    desc: 'Apply for leaves, track approval status, and manage leave balances — all in one streamlined workflow.'
  },
  {
    icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    title: 'Group Chat',
    desc: 'Real-time messaging for your entire team. Share updates, files, and stay connected from anywhere.'
  },
  {
    icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
    title: 'Task Manager',
    desc: 'Assign, track, and complete tasks with priority labels and deadlines. Keep every project on schedule.'
  },
  {
    icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    title: 'Role-based Access',
    desc: 'Admin, CEO, and Employee roles with fine-grained permissions. Everyone sees exactly what they need.'
  },
  {
    icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
    title: 'Screen Monitoring',
    desc: 'Periodic encrypted screenshots during work hours, visible only to admins. Transparent and secure.'
  }
];

const STATS = [
  { target: 99.9, suffix: '%', label: 'Uptime SLA', isFloat: true },
  { target: 5,    suffix: 'min', label: 'Capture Interval', isFloat: false },
  { target: 3,    suffix: ' Roles', label: 'Access Levels', isFloat: false },
  { target: 24,   suffix: '/7', label: 'Availability', isFloat: false },
];

const TESTIMONIALS = [
  {
    quote: '"AttendX replaced our entire spreadsheet system. Attendance, leaves, tasks — one place, zero chaos."',
    initials: 'AK', name: 'Arjun Kumar', role: 'CTO, StackFlow',
    avatarStyle: { background: 'linear-gradient(135deg,var(--teal),var(--teal-dark))' }
  },
  {
    quote: '"The role-based access is exactly what we needed. Admins see everything, employees see theirs."',
    initials: 'SR', name: 'Sofia Reyes', role: 'HR Lead, Notion-alt',
    avatarStyle: { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }
  },
  {
    quote: '"Group chat + task manager in the same app as attendance? Our team productivity doubled."',
    initials: 'MJ', name: 'Marcus Jin', role: 'Founder, DataPulse',
    avatarStyle: { background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }
  }
];

function useIntersection(ref, options = {}) {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsVisible(true); observer.unobserve(el); }
    }, { threshold: 0.15, ...options });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return isVisible;
}

function AnimatedCounter({ target, suffix, isFloat }) {
  const [value, setValue] = useState('0');
  const ref = useRef(null);
  const visible = useIntersection(ref);
  useEffect(() => {
    if (!visible) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1600, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      const v = ease * target;
      setValue((isFloat ? v.toFixed(1) : Math.floor(v)) + suffix);
      if (p < 1) requestAnimationFrame(step);
      else setValue((isFloat ? target.toFixed(1) : target) + suffix);
    };
    requestAnimationFrame(step);
  }, [visible, target, suffix, isFloat]);
  return <div ref={ref} className="stat-num">{value}</div>;
}

function FeatCard({ icon, title, desc, delay }) {
  const ref = useRef(null);
  const visible = useIntersection(ref);
  return (
    <div ref={ref} className={`feat-card${visible ? ' visible' : ''}`} style={{ transitionDelay: `${delay}ms` }}>
      <div className="feat-icon">{icon}</div>
      <div className="feat-title">{title}</div>
      <div className="feat-desc">{desc}</div>
    </div>
  );
}

function RevealVisual({ children, reverse }) {
  const ref = useRef(null);
  const visible = useIntersection(ref);
  return (
    <div
      ref={ref}
      className={`reveal-visual${visible ? ' visible' : ''}`}
      style={!visible ? { transform: reverse ? 'translateX(-60px)' : 'translateX(60px)' } : {}}
    >
      {children}
    </div>
  );
}

function RevealText({ children }) {
  const ref = useRef(null);
  const visible = useIntersection(ref);
  return (
    <div ref={ref} className={`reveal-text-inner${visible ? ' visible' : ''}`}>
      {children}
    </div>
  );
}

function TestiCard({ data, delay }) {
  const ref = useRef(null);
  const visible = useIntersection(ref);
  return (
    <div ref={ref} className={`testi-card${visible ? ' visible' : ''}`} style={{ transitionDelay: `${delay}ms` }}>
      <div className="testi-stars">★★★★★</div>
      <p className="testi-quote">{data.quote}</p>
      <div className="testi-author">
        <div className="testi-avatar" style={data.avatarStyle}>{data.initials}</div>
        <div>
          <div className="testi-name">{data.name}</div>
          <div className="testi-role">{data.role}</div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const curRef = useRef(null);
  const cur2Ref = useRef(null);
  const navRef = useRef(null);

  // Custom cursor
  useEffect(() => {
    const cur = curRef.current;
    const cur2 = cur2Ref.current;
    if (!cur || !cur2) return;
    let mx = 0, my = 0, rx = 0, ry = 0;
    const onMove = (e) => {
      mx = e.clientX; my = e.clientY;
      cur.style.left = mx + 'px';
      cur.style.top = my + 'px';
    };
    document.addEventListener('mousemove', onMove);
    let raf;
    const animCur = () => {
      rx += (mx - rx) * 0.1;
      ry += (my - ry) * 0.1;
      cur2.style.left = rx + 'px';
      cur2.style.top = ry + 'px';
      raf = requestAnimationFrame(animCur);
    };
    animCur();
    return () => {
      document.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Navbar hide on scroll
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    let lastY = 0;
    const onScroll = () => {
      const y = window.scrollY;
      if (y > lastY && y > 100) nav.classList.add('hidden');
      else nav.classList.remove('hidden');
      lastY = y;
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Hero canvas
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    let W, H;
    const resize = () => { W = c.width = c.offsetWidth; H = c.height = c.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    const mouse = { x: W / 2, y: H / 2 };
    const onMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    document.addEventListener('mousemove', onMove);
    const pts = Array.from({ length: 70 }, () => ({
      x: Math.random() * (W || 800), y: Math.random() * (H || 600),
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      life: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.01 + 0.005
    }));
    let tick = 0, raf;
    const draw = () => {
      tick += 0.005;
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < 4; i++) {
        const phase = (tick - i * 0.3) % 1;
        const r = phase * Math.min(W, H) * 0.55;
        const a = (1 - phase) * 0.06;
        ctx.beginPath(); ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(63,212,175,${a})`; ctx.lineWidth = 0.5; ctx.stroke();
      }
      pts.forEach((p, i) => {
        p.life += p.speed;
        const dx = mouse.x - p.x, dy = mouse.y - p.y, dist = Math.hypot(dx, dy);
        if (dist < 180) { const f = (180 - dist) / 180; p.vx -= dx / dist * f * 0.4; p.vy -= dy / dist * f * 0.4; }
        p.vx *= 0.97; p.vy *= 0.97;
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        if (dist < 160) {
          ctx.beginPath(); ctx.moveTo(mouse.x, mouse.y); ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = `rgba(63,212,175,${(1 - dist / 160) * 0.2})`; ctx.lineWidth = 0.5; ctx.stroke();
        }
        for (let j = i + 1; j < pts.length; j++) {
          const d = Math.hypot(p.x - pts[j].x, p.y - pts[j].y);
          if (d < 90) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(99,102,241,${(1 - d / 90) * 0.1})`; ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
        const pulse = (Math.sin(p.life) + 1) / 2;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r + pulse * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(63,212,175,${0.3 + pulse * 0.4})`; ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const marqueeItems = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS];

  return (
    <>
      <style>{styles}</style>

      {/* Custom cursor */}
      <div id="cur" ref={curRef} />
      <div id="cur2" ref={cur2Ref} />

      {/* NAV */}
      <nav className="nexus-nav" ref={navRef}>
        <div className="nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          AttendX
        </div>
        <ul className="nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#platform">Platform</a></li>
          <li><a href="#testimonials">Reviews</a></li>
        </ul>
        <button className="nav-cta" onClick={() => navigate('/login')}>
          Sign in →
        </button>
      </nav>

      {/* HERO */}
      <section className="hero" id="hero">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <canvas ref={canvasRef} id="heroCanvas" />
        <div className="floating-shape" style={{ width: 400, height: 400, top: -100, right: -100, animationDelay: '-2s', opacity: 0.6 }} />
        <div className="floating-shape" style={{ width: 300, height: 300, bottom: -80, left: -80, animationDelay: '-5s', opacity: 0.4 }} />

        <div className="hero-inner">
          <div className="hero-badge">
            <span className="badge-dot" />
            Now live — Built for modern teams
          </div>
          <h1 className="hero-h1">
            <span className="line"><span>The Workforce</span></span>
            <span className="line"><span>Platform for <em className="grad-text" style={{ fontStyle: 'normal' }}>Modern</em></span></span>
            <span className="line"><span>Teams</span></span>
          </h1>
          <p className="hero-sub">
            Attendance, leaves, tasks, and team chat — all in one place.
            Built for teams that move fast and need clarity without the chaos.
          </p>
          <div className="hero-btns">
            <button className="btn-primary" onClick={() => navigate('/login')}>
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M5 3l14 9-14 9V3z"/></svg>
              Get started free
            </button>
            <button className="btn-secondary" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              See features
            </button>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee-section">
        <div className="marquee-track">
          {marqueeItems.map((item, i) => (
            <span key={i} className="marquee-item">{item}</span>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section className="features" id="features">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <span className="section-label">Core capabilities</span>
          <h2 className="section-title">Everything your team needs in one app</h2>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <FeatCard key={i} icon={f.icon} title={f.title} desc={f.desc} delay={[0,100,200,0,100,200][i]} />
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats-section">
        <div className="stats-grid">
          {STATS.map((s, i) => (
            <div key={i} className="stat-card">
              <AnimatedCounter target={s.target} suffix={s.suffix} isFloat={s.isFloat} />
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* REVEAL ROW 1 */}
      <section className="reveal-section" id="platform">
        <div className="reveal-row">
          <div className="reveal-text">
            <RevealText>
              <span className="section-label">Attendance & Leaves</span>
              <h2 className="reveal-title">Track time, manage leaves — effortlessly</h2>
              <p className="reveal-desc">
                Employees clock in and out with one tap. Admins get a real-time dashboard
                of who's in, who's out, and who's on leave.
              </p>
              <div className="tag-row">
                <span className="tag">Clock in/out</span>
                <span className="tag">Leave approval</span>
                <span className="tag">Admin dashboard</span>
              </div>
            </RevealText>
          </div>
          <RevealVisual reverse={false}>
            <div className="reveal-visual-inner">
              <div className="mock-card">
                <div className="mock-dots">
                  <div className="mock-dot" style={{ background: '#ff5f56' }} />
                  <div className="mock-dot" style={{ background: '#febc2e' }} />
                  <div className="mock-dot" style={{ background: 'var(--teal)' }} />
                </div>
                <div className="mock-bar teal" />
                <div className="mock-bar short" />
                <div className="mock-bar med" />
                <div style={{ height: 12 }} />
                <div className="mock-pulse" />
                <div style={{ height: 10 }} />
                <div className="mock-bar" style={{ width: '80%', height: 6, background: 'rgba(99,102,241,.3)' }} />
                <div style={{ height: 6 }} />
                <div className="mock-bar short" style={{ height: 6, background: 'rgba(99,102,241,.2)' }} />
              </div>
            </div>
          </RevealVisual>
        </div>
      </section>

      {/* REVEAL ROW 2 */}
      <section className="reveal-section" style={{ background: '#fff', paddingTop: 0 }}>
        <div className="reveal-row rev">
          <div className="reveal-text">
            <RevealText>
              <span className="section-label">Tasks & Communication</span>
              <h2 className="reveal-title">Assign tasks, chat in real time</h2>
              <p className="reveal-desc">
                Keep your team aligned with built-in task management and group chat.
                No need for Slack + Trello + another tool — it's all here.
              </p>
              <div className="tag-row">
                <span className="tag">Task assignment</span>
                <span className="tag">Priority labels</span>
                <span className="tag">Group messaging</span>
              </div>
            </RevealText>
          </div>
          <RevealVisual reverse={true}>
            <div className="reveal-visual-inner">
              <div className="mock-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', letterSpacing: '.06em', textTransform: 'uppercase' }}>Task completion</div>
                  <div style={{ fontSize: 11, color: 'var(--teal)' }}>▲ 24%</div>
                </div>
                <div className="bar-chart">
                  {[
                    { h: '40%', o: 0.2 }, { h: '65%', o: 0.3 }, { h: '50%', o: 0.4 },
                    { h: '80%', o: 0.6 }, { h: '70%', o: 0.5 }, { h: '90%', o: 1 }, { h: '75%', o: 0.7 }
                  ].map((b, i) => (
                    <div key={i} style={{ flex: 1, height: b.h, background: `rgba(63,212,175,${b.o})`, borderRadius: '3px 3px 0 0' }} />
                  ))}
                </div>
                <div className="mock-pulse" />
              </div>
            </div>
          </RevealVisual>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="testimonials" id="testimonials">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <span className="section-label">What teams say</span>
          <h2 className="section-title">Teams love working with AttendX</h2>
          <div className="testi-grid">
            {TESTIMONIALS.map((t, i) => (
              <TestiCard key={i} data={t} delay={i * 150} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span className="section-label cta-label" style={{ display: 'block', marginBottom: 16 }}>Get started today</span>
          <h2 className="cta-title">
            Ready to bring your team <span className="grad-text">together?</span>
          </h2>
          <p className="cta-sub">Sign in with your credentials and get your team productive from day one.</p>
          <button className="cta-btn" onClick={() => navigate('/login')}>
            Go to login
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="nexus-footer">
        <div className="foot-logo">AttendX</div>
        <div className="foot-copy">© 2025 AttendX. All rights reserved.</div>
        <div className="foot-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Status</a>
          <a href="#">Support</a>
        </div>
      </footer>
    </>
  );
}
