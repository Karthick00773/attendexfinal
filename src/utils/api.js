// ============================================================
//  api.js — Centralized API client for AttendX backend
//  Wired to real Supabase/Express backend
//  Set REACT_APP_USE_MOCK=true to use mock data (no backend)
// ============================================================

import { mockApi } from './mockData';

const USE_MOCK = process.env.REACT_APP_USE_MOCK === 'true';
const BASE     = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const IK_PUBLIC_KEY = process.env.REACT_APP_IMAGEKIT_PUBLIC_KEY || '';

export function getToken() {
  return localStorage.getItem('attendx_token');
}

async function request(method, path, body) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);

  let res, data;
  try {
    res = await fetch(`${BASE}${path}`, opts);
    data = await res.json().catch(() => ({}));
  } catch (err) {
    // Catch network errors (e.g. backend offline) gracefully and return empty data
    return {};
  }

  // ── 401 — token expired or unauthorized ──────────────────
  if (res.status === 401) {
    if (data && data.expired) {
      try {
        const refreshToken = localStorage.getItem('attendx_refresh');
        if (refreshToken) {
          const refreshRes = await fetch(`${BASE}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });
          const refreshData = await refreshRes.json().catch(() => ({}));
          if (refreshRes.ok && refreshData.access_token) {
            localStorage.setItem('attendx_token', refreshData.access_token);
            if (refreshData.refresh_token) {
              localStorage.setItem('attendx_refresh', refreshData.refresh_token);
            }
            // Retry original request with new token
            const retryHeaders = { 'Content-Type': 'application/json' };
            retryHeaders['Authorization'] = `Bearer ${refreshData.access_token}`;
            const retryOpts = { method, headers: retryHeaders };
            if (body !== undefined) retryOpts.body = JSON.stringify(body);
            const retryRes  = await fetch(`${BASE}${path}`, retryOpts);
            const retryData = await retryRes.json().catch(() => ({}));
            if (!retryRes.ok) {
              const err = new Error(retryData.error || `HTTP ${retryRes.status}`);
              err.status = retryRes.status;
              err.data   = retryData;
              throw err;
            }
            return retryData;
          }
        }
      } catch (e) {
        // fallthrough to final 401 handling
      }
    }
    localStorage.removeItem('attendx_token');
    localStorage.removeItem('attendx_refresh');
    try { window.location.href = '/login'; } catch (_) {}
    const err = new Error(data.error || 'Unauthorized');
    err.status = 401;
    err.data   = data;
    throw err;
  }

  // ── 409 Conflict — already on break / already resumed ────
  // Instead of throwing, return a structured conflict object.
  // The caller checks result.conflict === true and resyncs.
  if (res.status === 409) {
    const err = new Error(data.error || data.message || 'Conflict — state already matches.');
    err.status  = 409;
    err.data    = data;
    err.conflict = true;
    throw err;
  }

  // ── All other non-OK responses ────────────────────────────
  if (!res.ok) {
    const err = new Error(data.error || data.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data   = data;
    throw err;
  }

  return data;
}

export async function getImageKitAuth() {
  return request('GET', '/api/imagekit/auth');
}

export async function uploadPhotoToImageKit(file, folder = 'attendance') {
  if (!file) return null;
  const auth     = await getImageKitAuth();
  const formData = new FormData();
  formData.append('file',      file);
  formData.append('fileName',  `${folder}_${Date.now()}_${file.name}`);
  formData.append('folder',    `/${folder}`);
  formData.append('publicKey', IK_PUBLIC_KEY);
  formData.append('signature', auth.signature);
  formData.append('expire',    String(auth.expire));
  formData.append('token',     auth.token);
  const res  = await fetch('https://upload.imagekit.io/api/v1/files/upload', { method: 'POST', body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'ImageKit upload failed.');
  return data.url;
}

// ── Auth ──────────────────────────────────────────────────────
export const auth = USE_MOCK ? mockApi.auth : {
  login:         (email, password) => request('POST',  '/api/auth/login',         { email, password }),
  logout:        ()                => request('POST',  '/api/auth/logout'),
  me:            ()                => request('GET',   '/api/auth/me'),
  resetPassword: (new_password)    => request('PATCH', '/api/auth/reset-password', { new_password }),
  refresh:       (refresh_token)   => request('POST',  '/api/auth/refresh',        { refresh_token }),
};

// ── Users ─────────────────────────────────────────────────────
export const users = USE_MOCK ? mockApi.users : {
  list:               ()           => request('GET',    '/api/users'),
  create:             (payload)    => request('POST',   '/api/users',                   payload),
  get:                (id)         => request('GET',    `/api/users/${id}`),
  update:             (id, data)   => request('PUT',    `/api/users/${id}`,             data),
  deactivate:         (id)         => request('DELETE', `/api/users/${id}`),
  uploadProfilePhoto: (photo_url)  => request('PATCH',  '/api/users/me/profile-photo', { photo_url }),
};

// ── Attendance ────────────────────────────────────────────────
// Backend expects JSON body: { lat, lng, photo_url }
// photo_url must be an ImageKit CDN URL — upload photo first!
export const attendance = USE_MOCK ? mockApi.attendance : {
  checkIn:    (lat, lng, photo_url) => request('POST', '/api/attendance/checkin',     { lat, lng, photo_url }),
  checkOut:   (lat, lng, photo_url) => request('POST', '/api/attendance/checkout',    { lat, lng, photo_url }),

  // startBreak / endBreak — 409 means state already matches on server.
  // The error has err.conflict = true so the component can silently resync
  // via fetchTodayAttendance() instead of showing a confusing error message.
  startBreak: () => request('POST', '/api/attendance/break/start'),
  endBreak:   () => request('POST', '/api/attendance/break/end'),

  getToday:   () => request('GET',  '/api/attendance/today'),
  getSummary: (month, userId) => {
    const qs = new URLSearchParams();
    if (month)  qs.set('month',   month);
    if (userId) qs.set('user_id', userId);
    return request('GET', `/api/attendance/summary?${qs}`);
  },
  getHistory: (month, page = 1, limit = 31) => {
    const qs = new URLSearchParams({ page, limit });
    if (month) qs.set('month', month);
    return request('GET', `/api/attendance/history?${qs}`);
  },
  getAllToday: () => request('GET', '/api/attendance/all'),
  getReport:  (month, userId) => {
    const qs = new URLSearchParams();
    if (month)  qs.set('month',   month);
    if (userId) qs.set('user_id', userId);
    return request('GET', `/api/attendance/report?${qs}`);
  },
  override: (id, data) => request('PATCH', `/api/attendance/${id}`, data),
};

// ── Leaves ────────────────────────────────────────────────────
export const leaves = USE_MOCK ? mockApi.leaves : {
  apply:   (payload) => request('POST',   '/api/leaves',                            payload),
  list:    (status)  => request('GET',    `/api/leaves${status ? `?status=${status}` : ''}`),
  get:     (id)      => request('GET',    `/api/leaves/${id}`),
  approve: (id)      => request('PATCH',  `/api/leaves/${id}/approve`),
  reject:  (id)      => request('PATCH',  `/api/leaves/${id}/reject`),
  cancel:  (id)      => request('DELETE', `/api/leaves/${id}`),
};

// ── Chat ──────────────────────────────────────────────────────
export const chat = USE_MOCK ? mockApi.chat : {
  getMessages:   (page = 1, limit = 50) => request('GET',    `/api/chat/messages?page=${page}&limit=${limit}`),
  sendMessage:   (text) => request('POST',   '/api/chat/messages',      { text }),
  deleteMessage: (id)   => request('DELETE', `/api/chat/messages/${id}`),
};

// ── Notifications ─────────────────────────────────────────────
export const notifications = USE_MOCK ? mockApi.notifications : {
  list:        ()   => request('GET',   '/api/notifications'),
  markAllRead: ()   => request('PATCH', '/api/notifications/read-all'),
  markOneRead: (id) => request('PATCH', `/api/notifications/${id}/read`),
};

// ── Dashboard ─────────────────────────────────────────────────
export const dashboard = USE_MOCK ? mockApi.dashboard : {
  me:       (month) => request('GET', `/api/dashboard/me${month       ? `?month=${month}` : ''}`),
  overview: (month) => request('GET', `/api/dashboard/overview${month ? `?month=${month}` : ''}`),
};

// ── Tasks ─────────────────────────────────────────────────────
export const tasks = {
  list: (filters = {}) => {
    const qs = new URLSearchParams();
    if (filters.status)   qs.set('status',   filters.status);
    if (filters.priority) qs.set('priority', filters.priority);
    return request('GET', `/api/tasks?${qs}`);
  },
  get:              (id)       => request('GET',    `/api/tasks/${id}`),
  create:           (payload)  => request('POST',   '/api/tasks',                          payload),
  update:           (id, data) => request('PATCH',  `/api/tasks/${id}`,                    data),
  delete:           (id)       => request('DELETE', `/api/tasks/${id}`),
  complete:         (id)       => request('PATCH',  `/api/tasks/${id}/complete`),
  requestExtension: (id, data) => request('POST',   `/api/tasks/${id}/extend`,             data),
  reviewExtension:  (id, data) => request('PATCH',  `/api/tasks/${id}/extension-approval`, data),
};