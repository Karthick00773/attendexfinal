import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import * as api from '../utils/api';
import './AttendancePage.css';
import './AdminAttendancePage.css';

function formatHrs(h) { return h != null ? Number(h).toFixed(1) + 'h' : '—'; }

export default function AdminAttendancePage() {
  const { allEmployeesToday, fetchAllEmployeesToday, currentUser } = useApp();
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [empHistory, setEmpHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [overrideModal, setOverrideModal] = useState(null);
  const [overrideForm, setOverrideForm] = useState({});
  const [overrideSaving, setOverrideSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [addEmpModal, setAddEmpModal] = useState(false);
  const [addEmpForm, setAddEmpForm] = useState({
    name: '', email: '', designation: '', department: '', phone: '', role: 'employee'
  });
  const [addEmpSaving, setAddEmpSaving] = useState(false);

  useEffect(() => { fetchAllEmployeesToday(); }, [fetchAllEmployeesToday]);

  const loadEmpHistory = async (empId, m) => {
    setHistoryLoading(true);
    try {
      const data = await api.attendance.getReport(m, empId);
      setEmpHistory(data.records || []);
    } catch (err) {
      setError(err.message || 'Failed to load history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSelectEmp = (emp) => {
    if (selectedEmp?.id === emp.id) {
      setSelectedEmp(null);
      setEmpHistory([]);
    } else {
      setSelectedEmp(emp);
      loadEmpHistory(emp.id, month);
    }
  };

  const handleMonthChange = (e) => {
    setMonth(e.target.value);
    if (selectedEmp) loadEmpHistory(selectedEmp.id, e.target.value);
  };

  const openOverride = (record) => {
    setOverrideModal(record);
    setOverrideForm({
      status: record.status,
      check_in_time: record.check_in_time ? new Date(record.check_in_time).toISOString().slice(0, 16) : '',
      check_out_time: record.check_out_time ? new Date(record.check_out_time).toISOString().slice(0, 16) : '',
    });
  };

  const handleOverrideSave = async () => {
    setOverrideSaving(true);
    setError('');
    try {
      const payload = {};
      if (overrideForm.status)         payload.status = overrideForm.status;
      if (overrideForm.check_in_time)  payload.check_in_time  = new Date(overrideForm.check_in_time).toISOString();
      if (overrideForm.check_out_time) payload.check_out_time = new Date(overrideForm.check_out_time).toISOString();
      await api.attendance.override(overrideModal.id, payload);
      setSuccessMsg('Record updated successfully.');
      setOverrideModal(null);
      if (selectedEmp) loadEmpHistory(selectedEmp.id, month);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Override failed.');
    } finally {
      setOverrideSaving(false);
    }
  };

  const handleAddEmployee = async () => {
    setAddEmpSaving(true);
    setError('');
    try {
      await api.users.create(addEmpForm);
      setSuccessMsg('Employee added successfully. They will receive login credentials via email.');
      setAddEmpModal(false);
      setAddEmpForm({ name: '', email: '', designation: '', department: '', phone: '', role: 'employee' });
      fetchAllEmployeesToday(); // Refresh the list
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to add employee.');
    } finally {
      setAddEmpSaving(false);
    }
  };

  const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }) : '—';

  return (
    <div className="page animate-fadeup">
      <div className="page-header">
        <div>
          <h2 className="page-title">Team Attendance</h2>
          <p className="page-sub">Monitor all employees' attendance records</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {['admin', 'ceo'].includes(currentUser?.role) && (
            <button className="btn btn-primary" onClick={() => setAddEmpModal(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <line x1="19" y1="8" x2="19" y2="14"/>
                <line x1="22" y1="11" x2="16" y2="11"/>
              </svg>
              Add Employee
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label className="label" style={{ margin: 0 }}>Month:</label>
            <input type="month" className="input" style={{ width: 160 }} value={month} onChange={handleMonthChange} />
          </div>
        </div>
      </div>

      {error && <div className="leave-success" style={{ marginBottom: 16, background: '#fef2f2', borderColor: '#fca5a5', color: '#dc2626' }}>{error}</div>}
      {successMsg && <div className="leave-success" style={{ marginBottom: 16 }}>{successMsg}</div>}

      {/* Employee cards */}
      <div className="admin-emp-grid">
        {allEmployeesToday.map(emp => {
          const today = emp.today;
          const status = !today ? 'absent'
            : today.check_out_time ? 'left'
            : 'present';
          const statusMeta = {
            absent:  { label: 'Absent',       color: 'badge-red'    },
            left:    { label: 'Checked Out',  color: 'badge-blue'   },
            present: { label: 'Present',      color: 'badge-green'  },
          };

          return (
            <div
              key={emp.id}
              className={`card admin-emp-card ${selectedEmp?.id === emp.id ? 'admin-emp-card-active' : ''}`}
              onClick={() => handleSelectEmp(emp)}
            >
              <div className="admin-emp-head">
                <div className="avatar avatar-md">{emp.avatar_initials}</div>
                <div className="admin-emp-info">
                  <span className="admin-emp-name">{emp.name}</span>
                  <span className="admin-emp-role">{emp.designation}</span>
                </div>
                <span className={`badge ${statusMeta[status].color}`}>● {statusMeta[status].label}</span>
              </div>
              <div className="admin-emp-times">
                <div className="admin-emp-time-item">
                  <span>Check-In</span>
                  <strong>{fmtTime(today?.check_in_time)}</strong>
                </div>
                <div className="admin-emp-time-item">
                  <span>Check-Out</span>
                  <strong>{fmtTime(today?.check_out_time)}</strong>
                </div>
                <div className="admin-emp-time-item">
                  <span>Normal Hrs</span>
                  <strong style={{ color: 'var(--accent)' }}>{formatHrs(today?.normal_hours)}</strong>
                </div>
                <div className="admin-emp-time-item">
                  <span>Overtime</span>
                  <strong style={{ color: 'var(--orange)' }}>{formatHrs(today?.overtime_hours)}</strong>
                </div>
              </div>
              <div className="admin-emp-monthly">
                <div className="admin-emp-monthly-item">
                  <span>Click to view {month} history</span>
                </div>
              </div>
            </div>
          );
        })}
        {allEmployeesToday.length === 0 && (
          <div className="card" style={{ padding: 32, textAlign: 'center', gridColumn: '1/-1' }}>
            <p className="empty-msg">No employee data available.</p>
          </div>
        )}
      </div>

      {/* Detailed history */}
      {selectedEmp && (
        <div className="card admin-detail-card">
          <div className="card-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="avatar avatar-md">{selectedEmp.avatar_initials}</div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>{selectedEmp.name} — {month} History</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{selectedEmp.designation} · {selectedEmp.department}</p>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedEmp(null); setEmpHistory([]); }}>✕ Close</button>
          </div>

          {historyLoading ? (
            <p className="empty-msg">Loading records…</p>
          ) : empHistory.length === 0 ? (
            <p className="empty-msg">No records for this month.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Day</th>
                    <th>Check-In</th>
                    <th>Check-Out</th>
                    <th>Normal</th>
                    <th>Overtime</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {empHistory.map((r) => (
                    <tr key={r.id}>
                      <td>{new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                      <td>{new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short' })}</td>
                      <td>
                        <div className="table-time-cell">
                          {fmtTime(r.check_in_time)}
                          {r.check_in_photo_url && <a href={r.check_in_photo_url} target="_blank" rel="noreferrer" className="table-photo-badge" title="View photo">📷</a>}
                        </div>
                      </td>
                      <td>
                        <div className="table-time-cell">
                          {fmtTime(r.check_out_time)}
                          {r.check_out_photo_url && <a href={r.check_out_photo_url} target="_blank" rel="noreferrer" className="table-photo-badge" title="View photo">📷</a>}
                        </div>
                      </td>
                      <td><span style={{ color: 'var(--accent)', fontWeight: 700 }}>{formatHrs(r.normal_hours)}</span></td>
                      <td><span style={{ color: 'var(--orange)', fontWeight: 700 }}>{formatHrs(r.overtime_hours)}</span></td>
                      <td><span className={`badge ${r.status === 'present' ? 'badge-green' : r.status === 'on_leave' ? 'badge-orange' : 'badge-red'}`}>{r.status}</span></td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => openOverride(r)} title="Override record">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Override modal */}
      {overrideModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="card" style={{ width: '100%', maxWidth: 480, padding: 24 }}>
            <h3 className="card-title">Override Record — {new Date(overrideModal.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
              <div className="form-group">
                <label className="label">Status</label>
                <select className="input" value={overrideForm.status} onChange={e => setOverrideForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="on_leave">On Leave</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Check-In Time</label>
                <input type="datetime-local" className="input" value={overrideForm.check_in_time}
                  onChange={e => setOverrideForm(f => ({ ...f, check_in_time: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="label">Check-Out Time</label>
                <input type="datetime-local" className="input" value={overrideForm.check_out_time}
                  onChange={e => setOverrideForm(f => ({ ...f, check_out_time: e.target.value }))} />
              </div>
              {error && <p style={{ color: 'var(--red)', fontSize: '0.85rem' }}>{error}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={handleOverrideSave} disabled={overrideSaving}>
                  {overrideSaving ? 'Saving...' : 'Save Override'}
                </button>
                <button className="btn btn-outline" onClick={() => setOverrideModal(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {addEmpModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="card" style={{ width: '100%', maxWidth: 480, padding: 24 }}>
            <h3 className="card-title">Add New Employee</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
              <div className="form-group">
                <label className="label">Full Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="John Doe"
                  value={addEmpForm.name}
                  onChange={e => setAddEmpForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">Email Address</label>
                <input
                  type="email"
                  className="input"
                  placeholder="john.doe@company.com"
                  value={addEmpForm.email}
                  onChange={e => setAddEmpForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">Designation</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Software Engineer"
                  value={addEmpForm.designation}
                  onChange={e => setAddEmpForm(f => ({ ...f, designation: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">Department</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Engineering"
                  value={addEmpForm.department}
                  onChange={e => setAddEmpForm(f => ({ ...f, department: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">Phone Number</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="+91 98765 43210"
                  value={addEmpForm.phone}
                  onChange={e => setAddEmpForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="label">Role</label>
                <select
                  className="input"
                  value={addEmpForm.role}
                  onChange={e => setAddEmpForm(f => ({ ...f, role: e.target.value }))}
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                  <option value="ceo">CEO</option>
                </select>
              </div>
              {error && <p style={{ color: 'var(--red)', fontSize: '0.85rem' }}>{error}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={handleAddEmployee} disabled={addEmpSaving}>
                  {addEmpSaving ? 'Adding...' : 'Add Employee'}
                </button>
                <button className="btn btn-outline" onClick={() => setAddEmpModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
