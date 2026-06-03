import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as api from '../utils/api';
import { uploadPhotoToImageKit } from '../utils/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState({
    id: 1,
    name: 'Admin Demo',
    email: 'admin@demo.com',
    role: 'admin',
    avatar_initials: 'AD'
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [forceReset, setForceReset] = useState(false);

  const [todayRecord, setTodayRecord] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [allEmployeesToday, setAllEmployeesToday] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [adminOverview, setAdminOverview] = useState(null);
  const [messages, setMessages] = useState([]);
  const [leaveList, setLeaveList] = useState([]);
  const [notifList, setNotifList] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [taskList, setTaskList] = useState([]);

  // Ref so callbacks can always read the latest currentUser
  // without needing it as a useCallback dependency (which would cause re-renders).
  const currentUserRef = useRef(currentUser);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  // ── Bootstrap data after login ────────────────────────────────
  const bootstrapUserData = useCallback(async (user) => {
    if (!user) return;
    const isAdminOrCeo = ['admin', 'ceo'].includes(user.role);
    const promises = [
      api.dashboard.me().then(data => setDashboardStats(data)).catch(() => { }),
      api.notifications.list().then(data => {
        setNotifList(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }).catch(() => { }),
    ];
    if (isAdminOrCeo) {
      promises.push(
        api.dashboard.overview().then(data => setAdminOverview(data)).catch(() => { }),
        api.attendance.getAllToday().then(data => setAllEmployeesToday(data.employees || [])).catch(() => { }),
      );
    }
    await Promise.all(promises);
  }, []); // stable — no deps

  // ── Restore session on mount ──────────────────────────────────
  useEffect(() => {
    // Demo mode: keeping the hardcoded dummy admin user
    // No backend auth needed for demo
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auth ──────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const data = await api.auth.login(email, password);
    localStorage.setItem('attendx_token', data.access_token);
    if (data.refresh_token) localStorage.setItem('attendx_refresh', data.refresh_token);
    if (data.forceReset) {
      setCurrentUser(data.user);
      setForceReset(true);
      return { success: true, forceReset: true };
    }
    setCurrentUser(data.user);
    setForceReset(false);
    bootstrapUserData(data.user);
    return { success: true };
  }, [bootstrapUserData]);

  const logout = useCallback(async () => {
    try { await api.auth.logout(); } catch (_) { }
    localStorage.removeItem('attendx_token');
    localStorage.removeItem('attendx_refresh');
    setCurrentUser(null);
    setTodayRecord(null);
    setAttendanceHistory([]);
    setMonthlySummary(null);
    setMessages([]);
    setLeaveList([]);
    setNotifList([]);
    setDashboardStats(null);
    setAdminOverview(null);
    setForceReset(false);
    setTaskList([]);
  }, []);

  const resetPassword = useCallback(async (newPassword) => {
    await api.auth.resetPassword(newPassword);
    const data = await api.auth.me();
    setCurrentUser(data.user);
    setForceReset(false);
  }, []);

  const fetchTodayAttendance = useCallback(async () => {
    const data = await api.attendance.getToday();
    setTodayRecord(data.attendance);
    return data.attendance;
  }, []);

  const fetchAttendanceHistory = useCallback(async (month) => {
    const data = await api.attendance.getHistory(month);
    setAttendanceHistory(data.records || []);
    return data;
  }, []);

  const fetchMonthlySummary = useCallback(async (month, userId) => {
    const data = await api.attendance.getSummary(month, userId);
    setMonthlySummary(data.summary);
    return data.summary;
  }, []);

  const fetchAllEmployeesToday = useCallback(async () => {
    const data = await api.attendance.getAllToday();
    setAllEmployeesToday(data.employees || []);
    return data.employees;
  }, []);

  const checkIn = useCallback(async (photoFile) => {
    const coords = await getCoords();
    const lat = coords?.latitude ?? null;
    const lng = coords?.longitude ?? null;
    if (!lat || !lng) throw new Error('GPS coordinates are required. Please allow location access.');
    let photo_url = null;
    if (photoFile) photo_url = await uploadPhotoToImageKit(photoFile, 'checkin');
    if (!photo_url) throw new Error('A check-in photo is required. Please take a photo.');
    const data = await api.attendance.checkIn(lat, lng, photo_url);
    setTodayRecord(data.attendance);
    return data;
  }, []);

  const checkOut = useCallback(async (photoFile) => {
    const coords = await getCoords();
    const lat = coords?.latitude ?? null;
    const lng = coords?.longitude ?? null;
    if (!lat || !lng) throw new Error('GPS coordinates are required. Please allow location access.');
    let photo_url = null;
    if (photoFile) photo_url = await uploadPhotoToImageKit(photoFile, 'checkout');
    if (!photo_url) throw new Error('A check-out photo is required. Please take a photo.');
    const data = await api.attendance.checkOut(lat, lng, photo_url);
    setTodayRecord(data.attendance);
    return data;
  }, []);

  const startBreak = useCallback(async () => {
    const data = await api.attendance.startBreak();
    if (data.attendance) setTodayRecord(data.attendance);
    return data;
  }, []);

  const endBreak = useCallback(async () => {
    const data = await api.attendance.endBreak();
    if (data.attendance) setTodayRecord(data.attendance);
    return data;
  }, []);

  const overrideAttendance = useCallback(async (id, payload) => api.attendance.override(id, payload), []);

  const fetchDashboard = useCallback(async (month) => {
    const data = await api.dashboard.me(month);
    setDashboardStats(data);
    return data;
  }, []);

  const fetchAdminOverview = useCallback(async (month) => {
    const data = await api.dashboard.overview(month);
    setAdminOverview(data);
    return data;
  }, []);

  const fetchMessages = useCallback(async (page = 1) => {
    const data = await api.chat.getMessages(page, 100);
    setMessages(data.messages || []);
    return data;
  }, []);

  const sendMessage = useCallback(async (text) => {
    const data = await api.chat.sendMessage(text);
    setMessages(prev => [...prev, data.message]);
    return data;
  }, []);

  const deleteMessage = useCallback(async (id) => {
    await api.chat.deleteMessage(id);
    setMessages(prev => prev.filter(m => m.id !== id));
  }, []);

  const fetchLeaves = useCallback(async (status) => {
    const data = await api.leaves.list(status);
    setLeaveList(data.leaves || []);
    return data.leaves;
  }, []);

  const applyLeave = useCallback(async (payload) => {
    const data = await api.leaves.apply(payload);
    setLeaveList(prev => [data.leave, ...prev]);
    return data;
  }, []);

  const approveLeave = useCallback(async (id) => {
    const data = await api.leaves.approve(id);
    setLeaveList(prev => prev.map(l => l.id === id ? data.leave : l));
    return data;
  }, []);

  const rejectLeave = useCallback(async (id) => {
    const data = await api.leaves.reject(id);
    setLeaveList(prev => prev.map(l => l.id === id ? data.leave : l));
    return data;
  }, []);

  const cancelLeave = useCallback(async (id) => {
    await api.leaves.cancel(id);
    setLeaveList(prev => prev.filter(l => l.id !== id));
  }, []);

  const fetchNotifications = useCallback(async () => {
    const data = await api.notifications.list();
    setNotifList(data.notifications || []);
    setUnreadCount(data.unread_count || 0);
    return data;
  }, []);

  const markAllNotifRead = useCallback(async () => {
    await api.notifications.markAllRead();
    setNotifList(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, []);

  const markNotifRead = useCallback(async (id) => {
    await api.notifications.markOneRead(id);
    setNotifList(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const createUser = useCallback(async (payload) => api.users.create(payload), []);

  // Uses ref so it doesn't need currentUser as a dependency
  const updateUser = useCallback(async (id, payload) => {
    const data = await api.users.update(id, payload);
    if (currentUserRef.current && id === currentUserRef.current.id) {
      setCurrentUser(data.user);
    }
    return data;
  }, []);

  const uploadProfilePhoto = useCallback(async (photoFile) => {
    const url = await uploadPhotoToImageKit(photoFile, 'profile');
    const data = await api.users.uploadProfilePhoto(url);
    if (data.user) setCurrentUser(prev => ({ ...prev, ...data.user }));
    return data;
  }, []);

  const fetchTasks = useCallback(async (filters) => {
    const data = await api.tasks.list(filters);
    setTaskList(data.tasks || []);
    return data.tasks;
  }, []);

  const createTask = useCallback(async (payload) => {
    const data = await api.tasks.create(payload);
    setTaskList(prev => [data.task, ...prev]);
    return data;
  }, []);

  const updateTask = useCallback(async (id, payload) => {
    const data = await api.tasks.update(id, payload);
    setTaskList(prev => prev.map(t => t.id === id ? data.task : t));
    return data;
  }, []);

  const deleteTask = useCallback(async (id) => {
    await api.tasks.delete(id);
    setTaskList(prev => prev.filter(t => t.id !== id));
  }, []);

  const completeTask = useCallback(async (id) => {
    const data = await api.tasks.complete(id);
    setTaskList(prev => prev.map(t => t.id === id ? data.task : t));
    return data;
  }, []);

  const requestExtension = useCallback(async (id, payload) => {
    const data = await api.tasks.requestExtension(id, payload);
    setTaskList(prev => prev.map(t => t.id === id ? data.task : t));
    return data;
  }, []);

  const reviewExtension = useCallback(async (id, payload) => {
    const data = await api.tasks.reviewExtension(id, payload);
    setTaskList(prev => prev.map(t => t.id === id ? data.task : t));
    return data;
  }, []);

  // ── THE KEY FIX: useMemo on the context value ─────────────────
  // Without this, a NEW object is passed to every consumer on EVERY render,
  // causing all consumers to re-render, triggering fetches, causing more
  // state updates — the infinite loop. With useMemo, the object only
  // changes when the actual state values change.
  const value = useMemo(() => ({
    currentUser, authLoading, forceReset,
    login, logout, resetPassword,
    todayRecord, attendanceHistory, monthlySummary,
    fetchTodayAttendance, fetchAttendanceHistory, fetchMonthlySummary,
    checkIn, checkOut, startBreak, endBreak, overrideAttendance,
    allEmployeesToday, fetchAllEmployeesToday,
    dashboardStats, adminOverview, fetchDashboard, fetchAdminOverview,
    messages, fetchMessages, sendMessage, deleteMessage,
    leaveList, fetchLeaves, applyLeave, approveLeave, rejectLeave, cancelLeave,
    notifList, unreadCount, fetchNotifications, markAllNotifRead, markNotifRead,
    createUser, updateUser, uploadProfilePhoto,
    taskList, fetchTasks, createTask, updateTask, deleteTask,
    completeTask, requestExtension, reviewExtension,
  }), [ // eslint-disable-line react-hooks/exhaustive-deps
    // Only state values here — all the useCallback functions are stable
    currentUser, authLoading, forceReset,
    todayRecord, attendanceHistory, monthlySummary,
    allEmployeesToday, dashboardStats, adminOverview,
    messages, leaveList, notifList, unreadCount, taskList,
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);

function getCoords() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      pos => resolve(pos.coords),
      () => resolve(null),
      { timeout: 8000, enableHighAccuracy: true }
    );
  });
}

