import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import './LeavePage.css';

const leaveTypes = ['Paid Leave', 'Sick Leave', 'Casual Leave', 'Emergency Leave'];

function LeaveCard({ leave, onApprove, onReject, isCeo, currentUserId }) {
  const isOwn = leave.user_id === currentUserId;
  const statusMeta = {
    pending:  { label: 'Pending',  color: 'badge-orange' },
    approved: { label: 'Approved', color: 'badge-green'  },
    rejected: { label: 'Rejected', color: 'badge-red'    },
  };
  const s = statusMeta[leave.status] || { label: leave.status, color: 'badge-orange' };
  const user = leave.users || {};
  const displayName = user.name || (isOwn ? 'You' : 'Unknown');
  const displayAvatar = user.avatar_initials || displayName.slice(0, 2).toUpperCase();

  return (
    <div className={`leave-card card ${leave.status}`}>
      <div className="leave-card-header">
        <div className="leave-card-user">
          <div className="avatar avatar-sm">{displayAvatar}</div>
          <div>
            <span className="leave-card-name">{displayName}</span>
            <span className="leave-card-applied">Applied: {new Date(leave.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
        <div className="leave-card-right">
          <span className={`badge ${s.color}`}>{s.label}</span>
          {leave.status === 'pending' && isCeo && (
            <div className="leave-actions">
              <button className="btn btn-success btn-sm" onClick={() => onApprove(leave.id)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Approve
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => onReject(leave.id)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Reject
              </button>
            </div>
          )}
          {leave.status === 'pending' && isOwn && !isCeo && (
            <div className="leave-actions">
              <button className="btn btn-outline btn-sm" style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
                onClick={() => onApprove(leave.id, 'cancel')}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="leave-card-body">
        <div className="leave-detail"><span className="leave-detail-label">Type</span><span className="leave-detail-val leave-type-pill">{leave.type}</span></div>
        <div className="leave-detail"><span className="leave-detail-label">From</span><span className="leave-detail-val">{new Date(leave.from_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
        <div className="leave-detail"><span className="leave-detail-label">To</span><span className="leave-detail-val">{new Date(leave.to_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
        <div className="leave-detail"><span className="leave-detail-label">Days</span><span className="leave-detail-val" style={{ color: 'var(--accent)', fontWeight: 700 }}>{leave.days} day{leave.days > 1 ? 's' : ''}</span></div>
      </div>
      {leave.reason && (
        <div className="leave-reason">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {leave.reason}
        </div>
      )}
    </div>
  );
}

export default function LeavePage() {
  const { currentUser, leaveList, fetchLeaves, applyLeave, approveLeave, rejectLeave, cancelLeave } = useApp();
  const isCeo = currentUser?.role === 'ceo';
  const isEmployee = currentUser?.role === 'employee';

  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ type: 'Paid Leave', from_date: '', to_date: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [, setActionLoading] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  const myLeaves = isEmployee ? leaveList.filter(l => l.user_id === currentUser.id) : leaveList;
  const filteredLeaves = filter === 'all' ? myLeaves : myLeaves.filter(l => l.status === filter);
  const pendingCount = leaveList.filter(l => l.status === 'pending').length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.from_date || !form.to_date || !form.reason) return;
    setSubmitting(true);
    setError('');
    try {
      await applyLeave(form);
      setSuccess('Leave request submitted! CEO will review your request.');
      setShowForm(false);
      setForm({ type: 'Paid Leave', from_date: '', to_date: '', reason: '' });
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to submit leave request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id, action) => {
    setActionLoading(id);
    setError('');
    try {
      if (action === 'cancel') {
        await cancelLeave(id);
      } else {
        await approveLeave(id);
      }
    } catch (err) {
      setError(err.message || 'Action failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    setActionLoading(id);
    setError('');
    try {
      await rejectLeave(id);
    } catch (err) {
      setError(err.message || 'Action failed.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="page animate-fadeup">
      <div className="page-header">
        <div>
          <h2 className="page-title">{isCeo ? 'Leave Approvals' : isEmployee ? 'My Leaves' : 'Leave Management'}</h2>
          <p className="page-sub">
            {isCeo ? `${pendingCount} request${pendingCount !== 1 ? 's' : ''} awaiting your approval`
              : isEmployee ? 'Apply and track your leave requests'
              : 'Monitor employee leave requests'}
          </p>
        </div>
        {isEmployee && (
          <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
            {showForm ? (
              <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Cancel</>
            ) : (
              <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Apply for Leave</>
            )}
          </button>
        )}
      </div>

      {success && (
        <div className="leave-success">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          {success}
        </div>
      )}
      {error && (
        <div className="leave-success" style={{ background: '#fef2f2', borderColor: '#fca5a5', color: '#dc2626' }}>
          {error}
        </div>
      )}

      {isCeo && pendingCount > 0 && (
        <div className="leave-ceo-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <div><strong>{pendingCount} pending leave request{pendingCount !== 1 ? 's' : ''}</strong> require{pendingCount === 1 ? 's' : ''} your approval.</div>
        </div>
      )}

      {showForm && isEmployee && (
        <div className="card leave-form-card animate-fadeup">
          <h3 className="card-title">Apply for Leave</h3>
          <form onSubmit={handleSubmit} className="leave-form">
            <div className="leave-form-row">
              <div className="form-group">
                <label className="label">Leave Type</label>
                <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {leaveTypes.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">From Date</label>
                <input type="date" className="input" value={form.from_date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setForm(f => ({ ...f, from_date: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="label">To Date</label>
                <input type="date" className="input" value={form.to_date}
                  min={form.from_date || new Date().toISOString().split('T')[0]}
                  onChange={e => setForm(f => ({ ...f, to_date: e.target.value }))} required />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Reason</label>
              <textarea className="input" rows={3} placeholder="Briefly explain the reason..."
                value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} required />
            </div>
            <div className="leave-form-actions">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filter tabs */}
      <div className="leave-filter-tabs">
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button key={f} className={`leave-filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'pending' && pendingCount > 0 && (
              <span className="leave-filter-count">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      <div className="leave-list">
        {filteredLeaves.length === 0 ? (
          <div className="card" style={{ padding: 32, textAlign: 'center' }}>
            <p className="empty-msg">No {filter !== 'all' ? filter : ''} leave requests found.</p>
          </div>
        ) : (
          filteredLeaves.map(leave => (
            <LeaveCard
              key={leave.id}
              leave={leave}
              onApprove={handleApprove}
              onReject={handleReject}
              isCeo={isCeo}
              currentUserId={currentUser?.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
