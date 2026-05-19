// ============================================================
//  mockData.js — Complete mock API layer for AttendX
//  Intercepts all API calls when REACT_APP_USE_MOCK=true
// ============================================================

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));

// ── Mock Users ───────────────────────────────────────────────
export const MOCK_USERS = [
  {
    id: 1,
    name: 'Arjun Sharma',
    email: 'admin@attendx.com',
    password: 'admin123',
    role: 'admin',
    designation: 'HR Manager',
    department: 'Human Resources',
    phone: '+91 98765 43210',
    avatar_initials: 'AS',
    avatar_color: '#7c3aed',
    join_date: '2022-01-10',
    forceReset: false,
  },
  {
    id: 2,
    name: 'Priya Nair',
    email: 'employee@attendx.com',
    password: 'emp123',
    role: 'employee',
    designation: 'Software Engineer',
    department: 'Engineering',
    phone: '+91 91234 56789',
    avatar_initials: 'PN',
    avatar_color: '#059669',
    join_date: '2023-03-15',
    forceReset: false,
  },
  {
    id: 3,
    name: 'Karan Mehta',
    email: 'ceo@attendx.com',
    password: 'ceo123',
    role: 'ceo',
    designation: 'Chief Executive Officer',
    department: 'Executive',
    phone: '+91 99887 76655',
    avatar_initials: 'KM',
    avatar_color: '#dc2626',
    join_date: '2021-06-01',
    forceReset: false,
  },
  {
    id: 4,
    name: 'Divya Reddy',
    email: 'divya@attendx.com',
    password: 'pass123',
    role: 'employee',
    designation: 'UI/UX Designer',
    department: 'Design',
    phone: '+91 90000 11122',
    avatar_initials: 'DR',
    avatar_color: '#d97706',
    join_date: '2023-07-20',
    forceReset: false,
  },
  {
    id: 5,
    name: 'Rohan Verma',
    email: 'rohan@attendx.com',
    password: 'pass123',
    role: 'employee',
    designation: 'Backend Developer',
    department: 'Engineering',
    phone: '+91 88001 22334',
    avatar_initials: 'RV',
    avatar_color: '#0891b2',
    join_date: '2022-11-05',
    forceReset: false,
  },
];

// ── In-memory state ──────────────────────────────────────────
let _currentUser = null; // eslint-disable-line no-unused-vars
let _token = null;

const today = new Date().toISOString().split('T')[0];

// Generate realistic attendance history for the past 30 days
function generateHistory(userId) {
  const records = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends

    const dateStr = d.toISOString().split('T')[0];
    const absent = Math.random() < 0.08; // 8% chance absent
    if (absent) continue;

    const checkInHour = 8 + Math.floor(Math.random() * 2);
    const checkInMin = Math.floor(Math.random() * 60);
    const checkOutHour = 17 + Math.floor(Math.random() * 2);
    const checkOutMin = Math.floor(Math.random() * 60);

    const checkIn = new Date(d);
    checkIn.setHours(checkInHour, checkInMin, 0);
    const checkOut = new Date(d);
    checkOut.setHours(checkOutHour, checkOutMin, 0);

    const workMinutes = (checkOutHour * 60 + checkOutMin) - (checkInHour * 60 + checkInMin);
    const late = checkInHour > 9 || (checkInHour === 9 && checkInMin > 15);

    records.push({
      id: `att-${userId}-${dateStr}`,
      user_id: userId,
      date: dateStr,
      check_in_time: checkIn.toISOString(),
      check_out_time: checkOut.toISOString(),
      work_minutes: workMinutes,
      overtime_minutes: Math.max(0, workMinutes - 480),
      status: late ? 'late' : 'present',
      note: late ? 'Arrived late' : null,
    });
  }
  return records;
}

const MOCK_HISTORY = {};
MOCK_USERS.forEach(u => { MOCK_HISTORY[u.id] = generateHistory(u.id); });

// Today's attendance state (mutable during session)
const MOCK_TODAY = {};
MOCK_USERS.forEach(u => { MOCK_TODAY[u.id] = null; });

// ── Mock Chat Messages ───────────────────────────────────────
const MOCK_MESSAGES = [
  { id: 1, user_id: 1, user_name: 'Arjun Sharma', avatar_initials: 'AS', avatar_color: '#7c3aed', text: 'Good morning team! Don\'t forget the standup at 10 AM.', created_at: new Date(Date.now() - 3600000 * 3).toISOString() },
  { id: 2, user_id: 5, user_name: 'Rohan Verma', avatar_initials: 'RV', avatar_color: '#0891b2', text: 'Morning! I\'ll be a few minutes late, just finishing up a PR.', created_at: new Date(Date.now() - 3600000 * 2.5).toISOString() },
  { id: 3, user_id: 4, user_name: 'Divya Reddy', avatar_initials: 'DR', avatar_color: '#d97706', text: 'Hey everyone, sharing the updated design mockups for the dashboard. Will send the Figma link shortly!', created_at: new Date(Date.now() - 3600000 * 2).toISOString() },
  { id: 4, user_id: 2, user_name: 'Priya Nair', avatar_initials: 'PN', avatar_color: '#059669', text: 'Thanks Divya! Looking forward to reviewing them.', created_at: new Date(Date.now() - 3600000 * 1.5).toISOString() },
  { id: 5, user_id: 1, user_name: 'Arjun Sharma', avatar_initials: 'AS', avatar_color: '#7c3aed', text: 'Reminder: Leave requests for next month need to be submitted by Friday EOD.', created_at: new Date(Date.now() - 3600000 * 1).toISOString() },
  { id: 6, user_id: 3, user_name: 'Karan Mehta', avatar_initials: 'KM', avatar_color: '#dc2626', text: 'Great work on Q1 everyone! 🎉 Numbers look solid. Let\'s keep this momentum going.', created_at: new Date(Date.now() - 3600000 * 0.5).toISOString() },
];
let _messages = [...MOCK_MESSAGES];
let _msgIdCounter = 100;

// ── Mock Leaves ──────────────────────────────────────────────
let _leaves = [
  { id: 1, user_id: 2, user_name: 'Priya Nair', type: 'sick', from_date: '2026-04-10', to_date: '2026-04-11', days: 2, reason: 'Fever and cold', status: 'approved', reviewed_by: 'Arjun Sharma', created_at: '2026-04-09T08:00:00Z' },
  { id: 2, user_id: 4, user_name: 'Divya Reddy', type: 'casual', from_date: '2026-04-18', to_date: '2026-04-18', days: 1, reason: 'Personal work', status: 'approved', reviewed_by: 'Arjun Sharma', created_at: '2026-04-17T09:00:00Z' },
  { id: 3, user_id: 5, user_name: 'Rohan Verma', type: 'earned', from_date: '2026-05-05', to_date: '2026-05-07', days: 3, reason: 'Family trip', status: 'pending', reviewed_by: null, created_at: '2026-04-22T10:00:00Z' },
  { id: 4, user_id: 2, user_name: 'Priya Nair', type: 'casual', from_date: '2026-05-15', to_date: '2026-05-15', days: 1, reason: 'Doctor appointment', status: 'pending', reviewed_by: null, created_at: '2026-04-23T11:00:00Z' },
];
let _leaveIdCounter = 10;

// ── Mock Notifications ───────────────────────────────────────
const makeNotifs = (userId) => [
  { id: 1, user_id: userId, type: 'leave_approved', title: 'Leave Approved', body: 'Your sick leave for Apr 10–11 has been approved.', is_read: true, created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 2, user_id: userId, type: 'attendance_reminder', title: 'Check-in Reminder', body: 'Don\'t forget to check in today!', is_read: false, created_at: new Date(Date.now() - 3600000 * 4).toISOString() },
  { id: 3, user_id: userId, type: 'leave_request', title: 'New Leave Request', body: 'Rohan Verma has requested 3 days of earned leave.', is_read: false, created_at: new Date(Date.now() - 3600000 * 1).toISOString() },
];
let _notifsByUser = {};
MOCK_USERS.forEach(u => { _notifsByUser[u.id] = makeNotifs(u.id); });

// ── Helper ───────────────────────────────────────────────────
function userToPublic(u) {
  const { password: _, ...pub } = u;
  return pub;
}

function getDashboardStats(userId, month) {
  const history = MOCK_HISTORY[userId] || [];
  const prefix = month || today.substring(0, 7);
  const monthRecords = history.filter(r => r.date.startsWith(prefix));

  const present = monthRecords.length;
  const totalWorkMinutes = monthRecords.reduce((s, r) => s + (r.work_minutes || 0), 0);
  const overtimeMinutes = monthRecords.reduce((s, r) => s + (r.overtime_minutes || 0), 0);
  const lateCount = monthRecords.filter(r => r.status === 'late').length;

  return {
    present_days: present,
    absent_days: Math.max(0, 22 - present),
    late_count: lateCount,
    total_work_hours: Math.round(totalWorkMinutes / 60 * 10) / 10,
    overtime_hours: Math.round(overtimeMinutes / 60 * 10) / 10,
    leave_balance: { casual: 8, sick: 5, earned: 12 },
    attendance_percent: Math.round((present / 22) * 100),
  };
}

// ── Mock API ─────────────────────────────────────────────────
export const mockApi = {

  // Auth
  auth: {
    login: async (email, password) => {
      await delay(600);
      const user = MOCK_USERS.find(u => u.email === email && u.password === password);
      if (!user) throw new Error('Invalid email or password. Please try again.');
      _currentUser = user;
      _token = `mock-token-${user.id}-${Date.now()}`;
      localStorage.setItem('attendx_token', _token);
      localStorage.setItem('attendx_mock_user_id', user.id);
      return {
        access_token: _token,
        refresh_token: `mock-refresh-${user.id}`,
        forceReset: user.forceReset,
        user: userToPublic(user),
      };
    },

    logout: async () => {
      await delay(200);
      _currentUser = null;
      _token = null;
      localStorage.removeItem('attendx_mock_user_id');
      return { success: true };
    },

    me: async () => {
      await delay(300);
      const uid = parseInt(localStorage.getItem('attendx_mock_user_id'));
      const user = MOCK_USERS.find(u => u.id === uid);
      if (!user) throw Object.assign(new Error('Unauthorized'), { status: 401 });
      _currentUser = user;
      return { user: userToPublic(user) };
    },

    resetPassword: async (new_password) => {
      await delay(400);
      const uid = parseInt(localStorage.getItem('attendx_mock_user_id'));
      const user = MOCK_USERS.find(u => u.id === uid);
      if (user) user.password = new_password;
      return { success: true };
    },
    refresh: async ({ refresh_token } = {}) => {
      await delay(300);
      const uid = parseInt(localStorage.getItem('attendx_mock_user_id'));
      const user = MOCK_USERS.find(u => u.id === uid);
      if (!user) {
        const err = Object.assign(new Error('Invalid token.'), { status: 401 });
        throw err;
      }
      // In mock, ignore provided refresh_token and return fresh tokens
      const newToken = `mock-token-${user.id}-${Date.now()}`;
      localStorage.setItem('attendx_token', newToken);
      return { access_token: newToken, refresh_token: `mock-refresh-${user.id}` };
    },
  },

  // Users
  users: {
    list: async () => {
      await delay(300);
      return { users: MOCK_USERS.map(userToPublic) };
    },
    create: async (payload) => {
      await delay(500);
      const newUser = {
        id: MOCK_USERS.length + 10,
        ...payload,
        password: 'Welcome@123',
        avatar_initials: payload.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'NA',
        avatar_color: '#6366f1',
        forceReset: true,
      };
      MOCK_USERS.push(newUser);
      MOCK_HISTORY[newUser.id] = [];
      MOCK_TODAY[newUser.id] = null;
      return { user: userToPublic(newUser) };
    },
    get: async (id) => {
      await delay(200);
      const user = MOCK_USERS.find(u => u.id === parseInt(id));
      if (!user) throw new Error('User not found');
      return { user: userToPublic(user) };
    },
    update: async (id, data) => {
      await delay(400);
      const user = MOCK_USERS.find(u => u.id === parseInt(id));
      if (!user) throw new Error('User not found');
      Object.assign(user, data);
      return { user: userToPublic(user) };
    },
    deactivate: async (id) => {
      await delay(300);
      return { success: true };
    },
  },

  // Attendance
  attendance: {
    checkIn: async (formData) => {
      await delay(700);
      const uid = parseInt(localStorage.getItem('attendx_mock_user_id'));
      const now = new Date();
      const record = {
        id: `att-${uid}-${today}`,
        user_id: uid,
        date: today,
        check_in_time: now.toISOString(),
        check_out_time: null,
        work_minutes: 0,
        overtime_minutes: 0,
        status: now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 15) ? 'late' : 'present',
        breaks: [],
      };
      MOCK_TODAY[uid] = record;
      return { attendance: record, message: 'Checked in successfully!' };
    },

    checkOut: async (formData) => {
      await delay(700);
      const uid = parseInt(localStorage.getItem('attendx_mock_user_id'));
      const record = MOCK_TODAY[uid];
      if (!record) throw new Error('No check-in found for today.');
      const now = new Date();
      const checkIn = new Date(record.check_in_time);
      const workMinutes = Math.round((now - checkIn) / 60000);
      record.check_out_time = now.toISOString();
      record.work_minutes = workMinutes;
      record.overtime_minutes = Math.max(0, workMinutes - 480);
      return { attendance: record, message: 'Checked out successfully!' };
    },

    startBreak: async () => {
      await delay(300);
      return { success: true, message: 'Break started.' };
    },

    endBreak: async () => {
      await delay(300);
      const uid = parseInt(localStorage.getItem('attendx_mock_user_id'));
      return { success: true, attendance: MOCK_TODAY[uid], message: 'Break ended.' };
    },

    getToday: async () => {
      await delay(300);
      const uid = parseInt(localStorage.getItem('attendx_mock_user_id'));
      return { attendance: MOCK_TODAY[uid] };
    },

    getSummary: async (month, userId) => {
      await delay(300);
      const uid = userId ? parseInt(userId) : parseInt(localStorage.getItem('attendx_mock_user_id'));
      return { summary: getDashboardStats(uid, month) };
    },

    getHistory: async (month) => {
      await delay(400);
      const uid = parseInt(localStorage.getItem('attendx_mock_user_id'));
      const history = MOCK_HISTORY[uid] || [];
      const prefix = month || today.substring(0, 7);
      const records = history.filter(r => r.date.startsWith(prefix));
      return { records };
    },

    getAllToday: async () => {
      await delay(400);
      const employees = MOCK_USERS.map(u => ({
        ...userToPublic(u),
        today: MOCK_TODAY[u.id],
      }));
      return { employees };
    },

    getReport: async (month, userId) => {
      await delay(400);
      const uid = userId ? parseInt(userId) : parseInt(localStorage.getItem('attendx_mock_user_id'));
      const history = MOCK_HISTORY[uid] || [];
      const prefix = month || today.substring(0, 7);
      const records = history.filter(r => r.date.startsWith(prefix));
      const user = MOCK_USERS.find(u => u.id === uid);
      return { report: { user: userToPublic(user), records, summary: getDashboardStats(uid, month) } };
    },

    override: async (id, data) => {
      await delay(400);
      return { success: true, attendance: { id, ...data } };
    },
  },

  // Dashboard
  dashboard: {
    me: async (month) => {
      await delay(400);
      const uid = parseInt(localStorage.getItem('attendx_mock_user_id'));
      const stats = getDashboardStats(uid, month);
      const user = MOCK_USERS.find(u => u.id === uid);
      return {
        ...stats,
        user: userToPublic(user),
        recent_records: (MOCK_HISTORY[uid] || []).slice(-5).reverse(),
        today: MOCK_TODAY[uid],
      };
    },

    overview: async (month) => {
      await delay(500);
      // eslint-disable-next-line no-unused-vars
      const prefix = month || today.substring(0, 7);
      const totalEmp = MOCK_USERS.filter(u => u.role === 'employee').length;
      const presentToday = MOCK_USERS.filter(u => MOCK_TODAY[u.id]?.check_in_time && !MOCK_TODAY[u.id]?.check_out_time).length;
      const checkedOut = MOCK_USERS.filter(u => MOCK_TODAY[u.id]?.check_out_time).length;
      const onLeave = _leaves.filter(l => l.from_date <= today && l.to_date >= today && l.status === 'approved').length;

      return {
        total_employees: totalEmp,
        present_today: presentToday,
        checked_out_today: checkedOut,
        on_leave_today: onLeave,
        absent_today: Math.max(0, totalEmp - presentToday - checkedOut - onLeave),
        pending_leaves: _leaves.filter(l => l.status === 'pending').length,
        month_attendance_rate: 87,
        department_summary: [
          { department: 'Engineering', total: 2, present: 1, absent: 1 },
          { department: 'Design', total: 1, present: 1, absent: 0 },
          { department: 'Human Resources', total: 1, present: 0, absent: 1 },
          { department: 'Executive', total: 1, present: 1, absent: 0 },
        ],
      };
    },
  },

  // Chat
  chat: {
    getMessages: async (page = 1, limit = 50) => {
      await delay(300);
      const start = (page - 1) * limit;
      return { messages: _messages.slice(start, start + limit), total: _messages.length };
    },

    sendMessage: async (text) => {
      await delay(200);
      const uid = parseInt(localStorage.getItem('attendx_mock_user_id'));
      const user = MOCK_USERS.find(u => u.id === uid);
      const msg = {
        id: ++_msgIdCounter,
        user_id: uid,
        user_name: user?.name || 'Unknown',
        avatar_initials: user?.avatar_initials || '?',
        avatar_color: user?.avatar_color || '#6366f1',
        text,
        created_at: new Date().toISOString(),
      };
      _messages.push(msg);
      return { message: msg };
    },

    deleteMessage: async (id) => {
      await delay(200);
      _messages = _messages.filter(m => m.id !== id);
      return { success: true };
    },
  },

  // Leaves
  leaves: {
    apply: async (payload) => {
      await delay(500);
      const uid = parseInt(localStorage.getItem('attendx_mock_user_id'));
      const user = MOCK_USERS.find(u => u.id === uid);
      const from = new Date(payload.from_date);
      const to = new Date(payload.to_date);
      const days = Math.ceil((to - from) / 86400000) + 1;
      const leave = {
        id: ++_leaveIdCounter,
        user_id: uid,
        user_name: user?.name,
        ...payload,
        days,
        status: 'pending',
        reviewed_by: null,
        created_at: new Date().toISOString(),
      };
      _leaves.push(leave);
      return { leave };
    },

    list: async (status) => {
      await delay(300);
      const uid = parseInt(localStorage.getItem('attendx_mock_user_id'));
      const user = MOCK_USERS.find(u => u.id === uid);
      const isAdmin = ['admin', 'ceo'].includes(user?.role);
      let leaves = isAdmin ? _leaves : _leaves.filter(l => l.user_id === uid);
      if (status) leaves = leaves.filter(l => l.status === status);
      return { leaves };
    },

    get: async (id) => {
      await delay(200);
      const leave = _leaves.find(l => l.id === parseInt(id));
      if (!leave) throw new Error('Leave not found');
      return { leave };
    },

    approve: async (id) => {
      await delay(400);
      const leave = _leaves.find(l => l.id === parseInt(id));
      if (!leave) throw new Error('Leave not found');
      leave.status = 'approved';
      leave.reviewed_by = 'Admin';
      return { leave };
    },

    reject: async (id) => {
      await delay(400);
      const leave = _leaves.find(l => l.id === parseInt(id));
      if (!leave) throw new Error('Leave not found');
      leave.status = 'rejected';
      leave.reviewed_by = 'Admin';
      return { leave };
    },

    cancel: async (id) => {
      await delay(300);
      _leaves = _leaves.filter(l => l.id !== parseInt(id));
      return { success: true };
    },
  },

  // Notifications
  notifications: {
    list: async () => {
      await delay(300);
      const uid = parseInt(localStorage.getItem('attendx_mock_user_id'));
      const notifs = _notifsByUser[uid] || [];
      const unread_count = notifs.filter(n => !n.is_read).length;
      return { notifications: notifs, unread_count };
    },

    markAllRead: async () => {
      await delay(200);
      const uid = parseInt(localStorage.getItem('attendx_mock_user_id'));
      if (_notifsByUser[uid]) {
        _notifsByUser[uid] = _notifsByUser[uid].map(n => ({ ...n, is_read: true }));
      }
      return { success: true };
    },

    markOneRead: async (id) => {
      await delay(200);
      const uid = parseInt(localStorage.getItem('attendx_mock_user_id'));
      if (_notifsByUser[uid]) {
        _notifsByUser[uid] = _notifsByUser[uid].map(n =>
          n.id === parseInt(id) ? { ...n, is_read: true } : n
        );
      }
      return { success: true };
    },
  },
};
