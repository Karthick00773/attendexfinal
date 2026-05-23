import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import './HomePage.css';

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className="stat-card card" style={{ '--card-color': color }}>
      <div className="stat-icon" style={{ background:`${color}18`, color }}>{icon}</div>
      <div className="stat-body">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
        {sub && <span className="stat-sub">{sub}</span>}
      </div>
    </div>
  );
}

function AttendanceMiniCard({ emp }) {
  const status = !emp.today ? 'absent' : emp.today.check_out_time ? 'left' : 'present';
  const statusColor = { present:'badge-green', absent:'badge-red', left:'badge-blue' };
  const statusLabel = { present:'● Present', absent:'● Absent', left:'● Checked Out' };
  return (
    <div className="mini-attend-card card">
      <div className="avatar avatar-md">{emp.avatar_initials}</div>
      <div className="mini-attend-info">
        <span className="mini-attend-name">{emp.name}</span>
        <span className="mini-attend-role">{emp.designation}</span>
      </div>
      <span className={`badge ${statusColor[status]}`}>{statusLabel[status]}</span>
    </div>
  );
}

export default function HomePage() {
  const {
    currentUser,
    dashboardStats, fetchDashboard,
    adminOverview, fetchAdminOverview,
    notifList, unreadCount, fetchNotifications, markAllNotifRead,
    allEmployeesToday, fetchAllEmployeesToday,
  } = useApp();
  const navigate = useNavigate();

  const now     = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true });
  const dateStr = now.toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  // Use a ref to track if we've already fetched for this user
  // so the effect only fires once per login, not on every render.
  const fetchedForRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;
    // Only fetch if we haven't fetched for this user yet
    if (fetchedForRef.current === currentUser.id) return;
    fetchedForRef.current = currentUser.id;

    const isAdminOrCeo = ['admin', 'ceo'].includes(currentUser.role);
    fetchDashboard();
    fetchNotifications();
    if (isAdminOrCeo) {
      fetchAdminOverview();
      fetchAllEmployeesToday();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const summary = dashboardStats?.month_summary || {};
  const user    = dashboardStats?.user || currentUser;

  const totalLeaves  = user?.paid_leaves_total  ?? currentUser?.total_leaves ?? 0;
  const usedLeaves   = user?.paid_leaves_used   ?? currentUser?.used_leaves  ?? 0;
  const leaveBalance = user?.paid_leave_balance ?? (totalLeaves - usedLeaves);

  const isAdminOrCeo  = ['admin', 'ceo'].includes(currentUser?.role);
  const pendingLeaves = isAdminOrCeo
    ? (adminOverview?.pending_leaves || 0)
    : (dashboardStats?.pending_leaves || 0);

  const greet = () => {
    const h = now.getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="page animate-fadeup">
      <div className="home-topbar">
        <div>
          <h1 className="home-greeting">{greet()}, {currentUser?.name?.split(' ')[0]} 👋</h1>
          <p className="home-date">{dateStr}</p>
        </div>
        <div className="home-time-pill">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          {timeStr}
        </div>
      </div>

      {!isAdminOrCeo && (
        <div className="grid-4 home-stats">
          <StatCard label="Normal Hours" value={`${Number(summary.normal_hours || 0).toFixed(1)}h`} sub={`of ${summary.monthly_target || 180}h this month`} color="#7c3aed"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} />
          <StatCard label="Overtime" value={`${Number(summary.overtime_hours || 0).toFixed(1)}h`} sub="this month" color="#f59e0b"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>} />
          <StatCard label="Leave Balance" value={leaveBalance} sub={`of ${totalLeaves} paid days`} color="#10b981"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>} />
          <StatCard label="Pending Leaves" value={pendingLeaves} sub="awaiting approval" color="#ef4444"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>} />
        </div>
      )}

      <div className="home-grid">
        {!isAdminOrCeo && (
          <div className="card home-progress-card">
            <h3 className="card-title">Monthly Progress</h3>
            <div className="progress-rows">
              {[
                { label:'Normal Hours',   value: summary.normal_hours   || 0, max:180, color:'var(--accent)' },
                { label:'Overtime Hours', value: summary.overtime_hours || 0, max:40,  color:'var(--orange)' },
                { label:'Total Hours',    value: summary.total_hours    || 0, max:220, color:'var(--green)'  },
              ].map(item => (
                <div key={item.label} className="progress-row">
                  <div className="progress-row-header">
                    <span>{item.label}</span>
                    <span style={{ color:item.color, fontWeight:700 }}>{Number(item.value).toFixed(1)}h / {item.max}h</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width:`${Math.min((item.value/item.max)*100,100)}%`, background:item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isAdminOrCeo && adminOverview && (
          <div className="card home-progress-card">
            <h3 className="card-title">Today's Team Overview</h3>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
              <div className="attend-hour-chip"><span>Total Staff</span><strong>{adminOverview.today?.total_employees}</strong></div>
              <div className="attend-hour-chip" style={{ background:'var(--green-light)', color:'var(--green)' }}><span>Present</span><strong>{adminOverview.today?.present}</strong></div>
              <div className="attend-hour-chip" style={{ background:'#fef2f2', color:'#ef4444' }}><span>Absent</span><strong>{adminOverview.today?.absent}</strong></div>
              {adminOverview.pending_leaves > 0 && (
                <div className="attend-hour-chip" style={{ background:'#fffbeb', color:'#d97706' }}><span>Pending Leaves</span><strong>{adminOverview.pending_leaves}</strong></div>
              )}
            </div>
          </div>
        )}

        <div className="card home-notif-card">
          <div className="card-head">
            <h3 className="card-title">Notifications</h3>
            {unreadCount > 0 && <button className="btn btn-ghost btn-sm" onClick={markAllNotifRead}>Mark all read</button>}
          </div>
          <div className="notif-list">
            {notifList.length === 0 && <p className="empty-msg">No notifications</p>}
            {notifList.slice(0, 5).map(n => (
              <div key={n.id} className={`notif-item ${!n.is_read ? 'notif-unread' : ''}`}>
                <div className="notif-dot-icon" style={{
                  background: n.type === 'leave' || n.type === 'leave-update' ? 'var(--purple-100)' : n.type === 'task' ? '#fef3c7' : 'var(--green-light)',
                  color:      n.type === 'leave' || n.type === 'leave-update' ? 'var(--accent)'    : n.type === 'task' ? '#d97706'  : 'var(--green)',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                </div>
                <div className="notif-body">
                  <p className="notif-text">{n.text}</p>
                  <span className="notif-time">{new Date(n.created_at).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true })}</span>
                </div>
                {!n.is_read && <div className="notif-unread-dot" />}
              </div>
            ))}
          </div>
          {notifList.length > 0 && (
            <button className="btn btn-outline btn-sm" style={{ width:'100%', marginTop:12, justifyContent:'center' }} onClick={() => navigate('/leaves')}>
              View all leave requests
            </button>
          )}
        </div>

        {isAdminOrCeo && (
          <div className="card home-team-card">
            <div className="card-head">
              <h3 className="card-title">Today's Team Status</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/attendance/manage')}>View All</button>
            </div>
            <div className="team-attend-list">
              {allEmployeesToday.slice(0, 5).map(emp => <AttendanceMiniCard key={emp.id} emp={emp} />)}
              {allEmployeesToday.length === 0 && <p className="empty-msg">No employee data</p>}
            </div>
          </div>
        )}

        <div className="card home-quick-card">
          <h3 className="card-title">Quick Actions</h3>
          <div className="quick-actions">
            <button className="quick-action-btn" onClick={() => navigate(currentUser?.role === 'employee' ? '/attendance' : '/attendance/manage')}>
              <span className="quick-action-icon" style={{ background:'var(--lavender)', color:'var(--accent)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </span>
              <span>Attendance</span>
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/tasks')}>
              <span className="quick-action-icon" style={{ background:'#fef3c7', color:'#d97706' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              </span>
              <span>Tasks</span>
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/chat')}>
              <span className="quick-action-icon" style={{ background:'var(--blue-light)', color:'var(--blue)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </span>
              <span>Group Chat</span>
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/leaves')}>
              <span className="quick-action-icon" style={{ background:'var(--green-light)', color:'var(--green)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </span>
              <span>Leave Request</span>
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/profile')}>
              <span className="quick-action-icon" style={{ background:'var(--orange-light)', color:'var(--orange)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </span>
              <span>Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
