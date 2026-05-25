import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";



const EMPLOYEES = [
  { initials: "AR", name: "Arjun Ramesh", role: "Senior Developer", time: "9:02 AM", status: "present", bg: "linear-gradient(135deg,#3f79af,#2a5a8c)" },
  { initials: "PS", name: "Priya Sharma", role: "Product Manager", time: "9:18 AM", status: "present", bg: "linear-gradient(135deg,#5ba3d9,#3f79af)" },
  { initials: "KM", name: "Karthik Murugan", role: "UI Designer", time: "9:47 AM", status: "late", bg: "linear-gradient(135deg,#f59e0b,#d97706)" },
  { initials: "RV", name: "Rekha Venkat", role: "Data Analyst", time: "Remote", status: "wfh", bg: "linear-gradient(135deg,#3f79af,#5ba3d9)" },
  { initials: "SM", name: "Suresh Mohan", role: "Backend Dev", time: "—", status: "absent", bg: "linear-gradient(135deg,#ef4444,#dc2626)" },
];

const STATUS_STYLES = {
  present: { bg: "rgba(34,197,94,.1)", color: "#16a34a", label: "Present" },
  late:    { bg: "rgba(245,158,11,.1)", color: "#d97706", label: "Late" },
  absent:  { bg: "rgba(239,68,68,.1)", color: "#dc2626", label: "Absent" },
  wfh:     { bg: "rgba(63,121,175,.1)", color: "#3f79af", label: "WFH" },
};

const FEATURES = [
  { icon: "📍", title: "GPS & Geo-fencing", desc: "Check-in only works when employees are actually at the office. No faking. No proxies.", span: 2 },
  { icon: "📊", title: "One-click reports", desc: "Monthly payroll, leave summaries, department breakdowns — exported in seconds.", span: 2 },
  { icon: "📱", title: "Mobile first", desc: "iOS & Android apps. Check in with one tap. Works offline too.", span: 2 },
  { icon: "🔗", title: "HRMS & Payroll sync", desc: "Connects with SAP, Zoho, Darwinbox, and more. Zero double-entry.", span: 2 },
];

function useCountUp(target, suffix, duration, delay = 500) {
  const [val, setVal] = useState("0" + suffix);
  useEffect(() => {
    const t = setTimeout(() => {
      let v = 0;
      const step = target / (duration / 16);
      const id = setInterval(() => {
        v += step;
        if (v >= target) { setVal(target + suffix); clearInterval(id); }
        else setVal(Math.floor(v) + suffix);
      }, 16);
      return () => clearInterval(id);
    }, delay);
    return () => clearTimeout(t);
  }, [target, suffix, duration, delay]);
  return val;
}

function Canvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    let W, H, animId;
    const mouse = { x: -9999, y: -9999 };

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", e => { mouse.x = e.clientX; mouse.y = e.clientY; });

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * W; this.y = Math.random() * H;
        this.r = Math.random() * 2 + .5;
        this.vx = (Math.random() - .5) * .4; this.vy = (Math.random() - .5) * .4;
        this.opacity = Math.random() * .4 + .1;
        this.hue = Math.random() < .6 ? 210 : 190;
      }
      update() {
        this.x += this.vx; this.y += this.vy;
        const dx = this.x - mouse.x, dy = this.y - mouse.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 150) { this.x += dx / d * 1.5; this.y += dy / d * 1.5; }
        if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
      }
      draw() {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue},70%,60%,${this.opacity})`; ctx.fill();
      }
    }

    class Meteor {
      constructor() { this.reset(true); }
      reset(init) {
        this.x = init ? Math.random() * W : -80;
        this.y = init ? Math.random() * H * 0.5 : -80;
        this.len = Math.random() * 120 + 60;
        this.speed = Math.random() * 6 + 3;
        this.angle = Math.PI / 4 + Math.random() * .2;
        this.w = Math.random() * 1.5 + .3;
        this.op = Math.random() * .5 + .2;
        this.color = Math.random() < .5 ? "#3f79af" : "#5ba3d9";
      }
      update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        if (this.y > H + 50 || this.x > W + 50) this.reset(false);
      }
      draw() {
        const tx = this.x - Math.cos(this.angle) * this.len, ty = this.y - Math.sin(this.angle) * this.len;
        const g = ctx.createLinearGradient(tx, ty, this.x, this.y);
        g.addColorStop(0, "transparent"); g.addColorStop(1, this.color);
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = g; ctx.lineWidth = this.w; ctx.globalAlpha = this.op; ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.w * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = this.color; ctx.globalAlpha = this.op * .7; ctx.fill(); ctx.globalAlpha = 1;
      }
    }

    class FloatOrb {
      constructor() {
        this.x = Math.random() * W; this.y = Math.random() * H;
        this.r = Math.random() * 100 + 40;
        this.vx = (Math.random() - .5) * .3; this.vy = (Math.random() - .5) * .3;
        this.phase = Math.random() * Math.PI * 2;
      }
      update(t) {
        this.x += this.vx + Math.sin(t + this.phase) * .4;
        this.y += this.vy + Math.cos(t * .8 + this.phase) * .3;
        if (this.x < -120) this.x = W + 120; if (this.x > W + 120) this.x = -120;
        if (this.y < -120) this.y = H + 120; if (this.y > H + 120) this.y = -120;
      }
      draw() {
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
        g.addColorStop(0, "rgba(63,121,175,0.07)"); g.addColorStop(1, "transparent");
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
      }
    }

    class Explosion {
      constructor(x, y) {
        const colors = ["#3f79af", "#5ba3d9", "#2a5a8c", "#7ec8f0", "#ffffff"];
        this.particles = Array.from({ length: 25 }, () => {
          const a = Math.random() * Math.PI * 2, s = Math.random() * 4 + 1;
          return { x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: Math.random() * 3 + 1, life: 1, decay: Math.random() * .04 + .015, color: colors[Math.floor(Math.random() * colors.length)] };
        });
      }
      update() { this.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .04; p.life -= p.decay; p.vx *= .97; p.vy *= .97; }); }
      draw() { this.particles.forEach(p => { if (p.life <= 0) return; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2); ctx.fillStyle = p.color; ctx.globalAlpha = p.life * .7; ctx.fill(); ctx.globalAlpha = 1; }); }
      done() { return this.particles.every(p => p.life <= 0); }
    }

    function drawConnections(pts) {
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 100) {
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(63,121,175,${0.06 * (1 - d / 100)})`; ctx.lineWidth = .5; ctx.stroke();
          }
        }
      }
    }

    const particles = Array.from({ length: 120 }, () => new Particle());
    const meteors = Array.from({ length: 10 }, () => new Meteor());
    const orbs = Array.from({ length: 8 }, () => new FloatOrb());
    let explosions = [], t = 0;

    

    const intId = setInterval(() => {
      explosions.push(new Explosion(Math.random() * W, Math.random() * H * .7));
    }, 2500);

    const clickHandler = e => {
      for (let i = 0; i < 3; i++)
        explosions.push(new Explosion(e.clientX + (Math.random() - .5) * 50, e.clientY + (Math.random() - .5) * 50));
    };
    document.addEventListener("click", clickHandler);
    
    function loop() {
      ctx.clearRect(0, 0, W, H); t += .006;
      orbs.forEach(o => { o.update(t); o.draw(); });
      drawConnections(particles);
      particles.forEach(p => { p.update(); p.draw(); });
      meteors.forEach(m => { m.update(); m.draw(); });
      explosions = explosions.filter(e => !e.done());
      explosions.forEach(e => { e.update(); e.draw(); });
      animId = requestAnimationFrame(loop);
    }
    loop();

    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("click", clickHandler);
      clearInterval(intId);
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={ref} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }} />;
}



function BentoCard({ icon, title, desc, span = 2, big, bigText, children, style = {} }) {
  const ref = useRef(null);
  const handleMove = e => {
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    ref.current.style.transform = `translateY(-8px) rotateX(${-y * 10}deg) rotateY(${x * 10}deg) scale(1.02)`;
    ref.current.style.boxShadow = `${-x * 15}px ${-y * 15}px 50px rgba(63,121,175,.2)`;
    ref.current.style.transition = "box-shadow .15s,border-color .3s";
  };
  const handleLeave = () => {
    ref.current.style.transform = "";
    ref.current.style.boxShadow = "";
    ref.current.style.transition = "all .5s cubic-bezier(.2,1,.3,1)";
  };

  const navigate = useNavigate();

  return (
    <div ref={ref} onMouseMove={handleMove} onMouseLeave={handleLeave}
      style={{
        gridColumn: `span ${span}`, background: style.background || "rgba(255,255,255,0.9)",
        border: "1px solid rgba(63,121,175,0.1)", borderRadius: 24, padding: "2rem",
        transition: "all .4s cubic-bezier(.2,1,.3,1)", cursor: "default", position: "relative",
        overflow: "hidden", backdropFilter: "blur(10px)", ...style,
      }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(63,121,175,.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", marginBottom: "1.2rem" }}>{icon}</div>
      {big && <div style={{ fontSize: "3.5rem", fontWeight: 900, background: "linear-gradient(135deg,#3f79af,#5ba3d9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1, marginBottom: ".4rem" }}>{bigText}</div>}
      <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#1a3d61", marginBottom: ".5rem" }}>{title}</h3>
      <p style={{ fontSize: ".85rem", color: "#7a9bb8", lineHeight: 1.7 }}>{desc}</p>
      {children}
    </div>
  );
}

export default function AttendX() {
  const s1 = useCountUp(50, "+", 1800);
  const s2 = useCountUp(100, "+", 2200);
  const s3 = useCountUp(180, "+", 2000);
  const s4 = useCountUp(99.9, "%", 1600);

  const MARQUEE_ITEMS = ["GPS Check-in", "Face Recognition", "AI Chatbot Support", "Leave Management", "Shift Planning", "Mobile App", "HRMS Integration"];
  const navigate = useNavigate();
  return (
    <div style={{ background: "#f0f6fc", overflowX: "hidden", fontFamily: "'Segoe UI', sans-serif", color: "#1a3d61" }}>
      <style>{`
        @keyframes gradShift{0%{background-position:0%}100%{background-position:300%}}
        @keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.5);opacity:.5}}
        @keyframes crashIn{from{opacity:0;transform:translateY(-100px) scale(1.2)}to{opacity:1;transform:none}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(35px)}to{opacity:1;transform:none}}
        @keyframes floatBadge{0%{transform:translateY(0) rotate(var(--r))}50%{transform:translateY(-16px) rotate(var(--r))}100%{transform:translateY(0) rotate(var(--r))}}
        @keyframes scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes fillBar{from{width:0}to{width:89%}}
        .fbadge{position:absolute;background:rgba(255,255,255,0.85);border:1px solid rgba(63,121,175,0.2);backdrop-filter:blur(10px);border-radius:16px;padding:.65rem 1.3rem;font-size:.78rem;color:#2a5a8c;white-space:nowrap;animation:floatBadge linear infinite;box-shadow:0 4px 20px rgba(63,121,175,0.1);font-weight:500}
        .emp-row:hover{background:rgba(63,121,175,.05)}
        .nav-btn:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(63,121,175,.5)!important}
        .btn-primary:hover{transform:scale(1.05);box-shadow:0 12px 50px rgba(63,121,175,.6)!important}
        .btn-secondary:hover{background:#3f79af!important;color:#fff!important}
        .nav-link:hover{color:#1a3d61!important}
      `}</style>

      <Canvas />

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 999, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 2.5rem", background: "rgba(255,255,255,0.75)", backdropFilter: "blur(30px)", borderBottom: "1px solid rgba(63,121,175,0.15)", boxShadow: "0 2px 30px rgba(63,121,175,0.08)" }}>
        <div style={{ fontSize: "1.6rem", fontWeight: 900, letterSpacing: -1, background: "linear-gradient(90deg,#3f79af,#2a5a8c,#5ba3d9,#3f79af)", backgroundSize: "300%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "gradShift 4s linear infinite" }}>AttendX</div>
        
        <button 
  onClick={() => navigate("/login")} 
  className="nav-btn" 
  style={{ 
    border: "none", 
    background: "linear-gradient(135deg,#3f79af,#2a5a8c)", 
    color: "#fff", 
    padding: ".55rem 1.4rem", 
    borderRadius: 100, 
    fontSize: ".88rem", 
    cursor: "pointer", 
    fontWeight: 600, 
    transition: "all .3s", 
    boxShadow: "0 4px 20px rgba(63,121,175,0.35)" 
  }}
>
  LOGIN →
</button>
      </nav>

      {/* HERO */}
      <section style={{ position: "relative", zIndex: 10, minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "7rem 1rem 3rem", overflow: "hidden" }}>
        {/* Glow blobs */}
        <div style={{ position: "absolute", width: 600, height: 600, background: "rgba(63,121,175,.12)", top: -100, left: -150, borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none", zIndex: 1 }} />
        <div style={{ position: "absolute", width: 500, height: 500, background: "rgba(91,163,217,.1)", bottom: 0, right: -100, borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none", zIndex: 1 }} />

        {/* Floating badges */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
          {[
            { label: "📍 GPS Verified Check-in", top: "20%", left: "6%", r: "-4deg", dur: "6s" },
            { label: "⚡ Real-time Dashboard", top: "28%", right: "5%", r: "3deg", dur: "7s", delay: ".6s" },
            { label: "🔒 GDPR Compliant", top: "62%", left: "4%", r: "-3deg", dur: "8s", delay: ".3s" },
            { label: "📊 AI Chatbot Support", top: "68%", right: "5%", r: "4deg", dur: "6.5s", delay: ".9s" },
            { label: "✅ Face Recognition", top: "78%", left: "18%", r: "-2deg", dur: "9s", delay: ".5s" },
            { label: "🌍 Multi-office Support", top: "80%", right: "16%", r: "3deg", dur: "7.5s", delay: "1s" },
          ].map((b, i) => (
            <div key={i} className="fbadge" style={{ top: b.top, left: b.left, right: b.right, "--r": b.r, animationDuration: b.dur, animationDelay: b.delay || "0s" }}>{b.label}</div>
          ))}
        </div>

        {/* Badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: ".6rem", background: "rgba(63,121,175,0.1)", border: "1px solid rgba(63,121,175,0.25)", color: "#3f79af", fontSize: ".75rem", letterSpacing: "1.5px", textTransform: "uppercase", padding: ".45rem 1.1rem", borderRadius: 100, marginBottom: "2rem", animation: "fadeUp .7s both" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#3f79af", animation: "pulse 2s infinite" }} />
          Now trusted by 10+ companies worldwide
        </div>

        {/* Title */}
        <div style={{ fontSize: "clamp(3rem,8vw,6.5rem)", fontWeight: 900, lineHeight: .95, letterSpacing: -3, position: "relative", zIndex: 2, maxWidth: 900 }}>
          <span style={{ display: "block", color: "#1a3d61", animation: "crashIn .7s cubic-bezier(.2,1.4,.4,1) both" }}>ATTENDANCE</span>
          <span style={{ display: "block", background: "linear-gradient(135deg,#3f79af,#5ba3d9,#2a5a8c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "crashIn .7s .12s cubic-bezier(.2,1.4,.4,1) both" }}>REINVENTED</span>
          <span style={{ display: "block", color: "#1a3d61", animation: "crashIn .7s .24s cubic-bezier(.2,1.4,.4,1) both" }}>FOR TEAMS.</span>
        </div>

        <p style={{ fontSize: "1.1rem", color: "#5a7fa0", maxWidth: 520, lineHeight: 1.75, marginTop: "1.8rem", animation: "fadeUp .8s .4s both" }}>
          AttendX replaces spreadsheets and manual logs with AI-powered tracking, real-time insights, and zero-friction check-ins your team will actually love.
        </p>

        <div style={{ display: "flex", gap: "1rem", marginTop: "2.5rem", animation: "fadeUp .8s .5s both", flexWrap: "wrap", justifyContent: "center" }}>
          <button onClick={() => navigate("/login")}  className="btn-primary" style={{ position: "relative", padding: ".95rem 2.4rem", borderRadius: 100, border: "none", fontSize: "1rem", fontWeight: 700, cursor: "pointer", background: "linear-gradient(135deg,#3f79af,#2a5a8c)", color: "#fff", transition: "transform .2s", boxShadow: "0 8px 40px rgba(63,121,175,.45)" }}>🚀 Experience once you Login</button>
          <button className="btn-secondary" style={{ padding: ".95rem 2.4rem", borderRadius: 100, border: "2px solid #3f79af", background: "transparent", color: "#3f79af", fontSize: "1rem", fontWeight: 600, cursor: "pointer", transition: "all .3s" }}>▶ PTE Worker Tracker</button>
        </div>

        <div style={{ display: "flex", gap: "3rem", marginTop: "4rem", animation: "fadeUp .8s .7s both", flexWrap: "wrap", justifyContent: "center" }}>
          {[{ n: s1, l: "Companies" }, { n: s2, l: "Employees tracked" }, { n: s3, l: "Hours saved / month" }, { n: s4, l: "Uptime" }].map(({ n, l }) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2.6rem", fontWeight: 900, background: "linear-gradient(135deg,#3f79af,#2a5a8c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{n}</div>
              <div style={{ fontSize: ".7rem", letterSpacing: 2, textTransform: "uppercase", color: "#8aabca", marginTop: ".25rem" }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* MARQUEE */}
      <div style={{ position: "relative", zIndex: 10, padding: "1.5rem 0", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(10px)", borderTop: "1px solid rgba(63,121,175,.1)", borderBottom: "1px solid rgba(63,121,175,.1)", overflow: "hidden" }}>
        <div style={{ display: "flex", animation: "scroll 28s linear infinite" }}>
          {[...Array(2)].map((_, di) => (
            <div key={di} style={{ display: "flex", alignItems: "center", whiteSpace: "nowrap" }}>
              {MARQUEE_ITEMS.map((item, i) => (
                <span key={i} style={{ display: "flex", alignItems: "center", gap: "1.5rem", padding: "0 1.5rem", fontSize: ".73rem", letterSpacing: 2, textTransform: "uppercase", color: "#8aabca" }}>
                  <b style={{ color: "#3f79af", fontWeight: 600 }}>{item}</b>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#c5d9ec", display: "inline-block" }} />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* MOCKUP */}
      <div style={{ position: "relative", zIndex: 10, padding: "2rem 1.5rem 5rem", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: ".72rem", letterSpacing: "2.5px", textTransform: "uppercase", color: "#3f79af", fontWeight: 600, marginBottom: ".8rem" }}>Live Preview</div>
          <div style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: -1.5, color: "#1a3d61" }}> sample dashboard, today.</div>
        </div>
        <div style={{ background: "rgba(255,255,255,.95)", border: "1px solid rgba(63,121,175,.15)", borderRadius: 28, padding: "2rem", boxShadow: "0 30px 80px rgba(63,121,175,.15)", animation: "fadeUp .8s both" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", paddingBottom: "1.2rem", borderBottom: "1px solid rgba(63,121,175,.1)" }}>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1a3d61" }}>📋 Today's Attendance — Engineering Dept.</div>
            <div style={{ fontSize: ".8rem", color: "#8aabca", background: "rgba(63,121,175,.08)", padding: ".35rem .8rem", borderRadius: 100 }}>Mon, 26 May 2026</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
            {[{ n: 24, l: "Present", c: "#16a34a" }, { n: 3, l: "Late", c: "#d97706" }, { n: 2, l: "Absent", c: "#dc2626" }, { n: 5, l: "WFH", c: "#3f79af" }].map(({ n, l, c }) => (
              <div key={l} style={{ background: "rgba(63,121,175,.05)", borderRadius: 14, padding: "1rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: c }}>{n}</div>
                <div style={{ fontSize: ".7rem", color: "#8aabca", textTransform: "uppercase", letterSpacing: 1, marginTop: ".2rem" }}>{l}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: ".75rem", color: "#8aabca", letterSpacing: 1, textTransform: "uppercase", marginBottom: ".6rem" }}>Attendance Rate</div>
          <div style={{ height: 6, background: "rgba(63,121,175,.1)", borderRadius: 100, overflow: "hidden" }}>
            <div style={{ height: "100%", background: "linear-gradient(90deg,#3f79af,#5ba3d9)", borderRadius: 100, animation: "fillBar 1.5s ease both" }} />
          </div>
          <div style={{ fontSize: ".8rem", color: "#3f79af", fontWeight: 600, marginTop: ".4rem" }}>89% — Above target ✅</div>

          <div style={{ marginTop: "1.8rem", fontSize: ".75rem", color: "#8aabca", letterSpacing: 1, textTransform: "uppercase", marginBottom: ".8rem" }}>Recent Check-ins</div>
          {EMPLOYEES.map(emp => {
            const s = STATUS_STYLES[emp.status];
            return (
              <div key={emp.initials} className="emp-row" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: ".9rem 1rem", borderRadius: 14, marginBottom: ".5rem", transition: "background .2s", cursor: "pointer" }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: emp.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".8rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>{emp.initials}</div>
                <div>
                  <div style={{ fontSize: ".9rem", fontWeight: 600, color: "#1a3d61" }}>{emp.name}</div>
                  <div style={{ fontSize: ".75rem", color: "#8aabca" }}>{emp.role}</div>
                </div>
                <div style={{ fontSize: ".8rem", color: "#5a7fa0", marginLeft: "auto" }}>{emp.time}</div>
                <div style={{ padding: ".28rem .75rem", borderRadius: 100, fontSize: ".7rem", fontWeight: 600, letterSpacing: .5, background: s.bg, color: s.color }}>{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FEATURES */}
      <div style={{ position: "relative", zIndex: 10, padding: "5rem 1.5rem", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ fontSize: ".72rem", letterSpacing: "2.5px", textTransform: "uppercase", color: "#3f79af", fontWeight: 600, marginBottom: ".8rem", textAlign: "center" }}>Why AttendX</div>
        <div style={{ fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, letterSpacing: -1.5, color: "#1a3d61", textAlign: "center", marginBottom: ".5rem" }}>Everything HR needs.</div>
        <div style={{ textAlign: "center", color: "#7a9bb8", fontSize: "1rem", maxWidth: 480, margin: ".8rem auto 3rem", lineHeight: 1.7 }}>Built for modern offices. No more Excel, no more guessing.</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: "1rem" }}>
          {/* Big AI card */}
          <BentoCard span={4} icon="🧠" big bigText="AI" title="Smart anomaly detection"
            desc="AttendX flags unusual patterns — buddy punching, frequent lates, suspicious check-ins — before they become HR problems. Your data stays clean automatically."
            style={{ background: "linear-gradient(135deg,rgba(63,121,175,.08),rgba(91,163,217,.05))" }} />
          {FEATURES.map(f => <BentoCard key={f.title} {...f} />)}
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ position: "relative", zIndex: 10, background: "rgba(255,255,255,.7)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(63,121,175,.1)", padding: "2.5rem", textAlign: "center", color: "#8aabca", fontSize: ".82rem" }}>
        <div style={{ fontSize: "1.2rem", fontWeight: 900, background: "linear-gradient(135deg,#3f79af,#2a5a8c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: ".5rem" }}>AttendX</div>
        <p>© 2026 AttendX Inc. — Smart Attendance for Modern Teams</p>
        <p style={{ marginTop: ".5rem" }}>Privacy Policy · Terms · Support</p>
      </footer>
    </div>
  );
}
