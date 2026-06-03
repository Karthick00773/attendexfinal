import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import './Sidebar.css';

const icons = {
  home:       (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>),
  attendance: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>),
  tasks:      (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>),
  chat:       (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>),
  leave:      (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>),
  profile:    (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>),
  bell:       (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>),
  menu:       (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>),
  x:          (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>),
};

const pageTitles = {
  '/':                  'Home',
  '/attendance':        'Attendance',
  '/attendance/manage': 'Team Attendance',
  '/tasks':             'Tasks',
  '/chat':              'Group Chat',
  '/leaves':            'Leave Requests',
  '/profile':           'Profile',
};

export default function Sidebar() {
  const { currentUser, unreadCount, taskList } = useApp();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen] = useState(false);

  if (!currentUser) return null;

  const pendingExtCount = (taskList || []).filter(t => t.ext_status === 'pending').length;

  const employeeNav = [
    { to: '/',           label: 'Home',          icon: 'home'       },
    { to: '/attendance', label: 'Attendance',     icon: 'attendance' },
    { to: '/tasks',      label: 'Tasks',          icon: 'tasks'      },
    { to: '/chat',       label: 'Group Chat',     icon: 'chat'       },
    { to: '/leaves',     label: 'Leave Requests', icon: 'leave'      },
    { to: '/profile',    label: 'Profile',        icon: 'profile'    },
  ];

  const adminNav = [
    { to: '/',                  label: 'Home',            icon: 'home'       },
    { to: '/attendance/manage', label: 'Team Attendance', icon: 'attendance' },
    { to: '/leaves',            label: 'Leave Requests',  icon: 'leave'      },
    { to: '/tasks',             label: 'Tasks',           icon: 'tasks', badge: pendingExtCount > 0 ? pendingExtCount : null },
    { to: '/chat',              label: 'Group Chat',      icon: 'chat'       },
    { to: '/profile',           label: 'Profile',         icon: 'profile'    },
  ];

  const ceoNav = adminNav;

  const navItems = currentUser.role === 'employee' ? employeeNav
    : currentUser.role === 'admin' ? adminNav : ceoNav;

  const roleColor = { employee: '#a855f7', admin: '#3b82f6', ceo: '#f59e0b' };

  const pageTitle = pageTitles[location.pathname] || 'AttendX';

  return (
    <>
      <div className="mobile-topbar">
        <button className="topbar-menu-btn" onClick={() => setOpen(o => !o)} aria-label="Open menu">
          {open ? icons.x : icons.menu}
        </button>
        <span className="topbar-title">{pageTitle}</span>
        <button className="topbar-notif-btn" onClick={() => { navigate('/'); setOpen(false); }}>
          {icons.bell}
          {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
        </button>
      </div>

      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}

      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">A</div>
          <div>
            <span className="logo-text">AttendX</span>
            <span className="logo-sub">Smart Attendance</span>
          </div>
        </div>

        <div className="divider" style={{ margin: '0 16px 16px' }} />

        <div className="sidebar-user">
          <div className="avatar avatar-md" style={{ background: 'var(--lavender)', color: 'var(--accent)', fontSize: '1rem', fontWeight: 700 }}>
            {currentUser.profile_photo_url
              ? <img src={currentUser.profile_photo_url} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              : currentUser.avatar_initials}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-username">{currentUser.name}</span>
            <span className="sidebar-role" style={{ color: roleColor[currentUser.role] || '#7c3aed' }}>
              {currentUser.role?.toUpperCase()}
            </span>
          </div>
          <button className="notif-btn desktop-only" onClick={() => { navigate('/'); setOpen(false); }}>
            {icons.bell}
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>
        </div>

        <div className="divider" style={{ margin: '16px 16px' }} />

        <nav className="sidebar-nav">
          <p className="nav-section-label">Menu</p>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <span className="nav-icon">{icons[item.icon]}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span style={{ background: '#f59e0b', color: 'white', borderRadius: 12, fontSize: '0.7rem', padding: '1px 6px', fontWeight: 700 }}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div style={{ flex: 1 }} />

      </aside>
    </>
  );
}