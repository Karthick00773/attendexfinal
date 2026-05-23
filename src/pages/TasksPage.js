import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import * as api from '../utils/api';

const PRIORITIES = ['Low', 'Medium', 'High'];
// const STATUSES   = ['pending', 'completed']; // reserved for future filter UI

const priorityColor = { High:'#ef4444', Medium:'#f59e0b', Low:'#10b981' };
const extColor      = { pending:'badge-orange', approved:'badge-green', rejected:'badge-red', none:'' };

function TaskCard({ task, currentUser, onComplete, onDelete, onUpdate, onExtend, onReviewExt, allUsers }) {
  const isAdminOrCeo = ['admin','ceo'].includes(currentUser?.role);
  const isOwn        = task.assigned_to === currentUser?.id;
  const overdue      = task.status !== 'completed' && new Date(task.deadline) < new Date();
  const [showExtForm, setShowExtForm] = useState(false);
  const [extForm, setExtForm]         = useState({ ext_reason:'', requested_deadline:'' });
  const [submitting, setSubmitting]   = useState(false);

  const handleExtend = async () => {
    setSubmitting(true);
    try { await onExtend(task.id, extForm); setShowExtForm(false); }
    catch (e) { alert(e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="card" style={{ padding:20, marginBottom:12, borderLeft:`4px solid ${priorityColor[task.priority]||'#7c3aed'}` }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <h4 style={{ fontSize:'0.95rem', fontWeight:700, color:'var(--text)', margin:0 }}>{task.title}</h4>
            <span className={`badge ${task.status === 'completed' ? 'badge-green' : overdue ? 'badge-red' : 'badge-orange'}`}>
              {task.status === 'completed' ? 'Completed' : overdue ? 'Overdue' : 'Pending'}
            </span>
            <span style={{ fontSize:'0.75rem', fontWeight:600, padding:'2px 8px', borderRadius:20, background:`${priorityColor[task.priority]}18`, color:priorityColor[task.priority] }}>
              {task.priority}
            </span>
            {task.ext_status && task.ext_status !== 'none' && (
              <span className={`badge ${extColor[task.ext_status]}`}>Ext: {task.ext_status}</span>
            )}
          </div>
          {task.description && <p style={{ fontSize:'0.85rem', color:'var(--muted)', marginTop:6 }}>{task.description}</p>}
          <div style={{ marginTop:8, fontSize:'0.8rem', color:'var(--muted)', display:'flex', gap:16, flexWrap:'wrap' }}>
            <span>📅 Deadline: <strong style={{ color: overdue ? '#ef4444' : 'var(--text)' }}>{new Date(task.deadline).toLocaleString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:true })}</strong></span>
            {task.assignee && <span>👤 Assigned: <strong>{task.assignee.name}</strong></span>}
            {task.creator  && <span>✍️ By: <strong>{task.creator.name}</strong></span>}
            {task.completed_at && <span>✅ Done: {new Date(task.completed_at).toLocaleDateString('en-IN')}</span>}
          </div>
          {task.ext_reason && (
            <p style={{ fontSize:'0.8rem', color:'var(--muted)', marginTop:4 }}>
              Ext reason: {task.ext_reason}
              {task.requested_deadline && ` | Requested: ${new Date(task.requested_deadline).toLocaleDateString('en-IN')}`}
            </p>
          )}
        </div>
        <div style={{ display:'flex', gap:6, flexShrink:0 }}>
          {/* Employee: mark complete */}
          {!isAdminOrCeo && isOwn && task.status !== 'completed' && (
            <button className="btn btn-success btn-sm" onClick={() => onComplete(task.id)}>✓ Done</button>
          )}
          {/* Employee: request extension */}
          {!isAdminOrCeo && isOwn && task.status !== 'completed' && task.ext_status !== 'pending' && (
            <button className="btn btn-outline btn-sm" onClick={() => setShowExtForm(v => !v)}>Extend</button>
          )}
          {/* Admin/CEO: review extension */}
          {isAdminOrCeo && task.ext_status === 'pending' && (
            <>
              <button className="btn btn-success btn-sm" onClick={() => onReviewExt(task.id, 'approved')}>✓ Approve Ext</button>
              <button className="btn btn-danger btn-sm"  onClick={() => onReviewExt(task.id, 'rejected')}>✕ Reject Ext</button>
            </>
          )}
          {/* Delete */}
          {(isAdminOrCeo || (isOwn && task.created_by === currentUser?.id)) && (
            <button className="btn btn-ghost btn-sm" style={{ color:'var(--red)' }} onClick={() => { if(window.confirm('Delete task?')) onDelete(task.id); }}>🗑</button>
          )}
        </div>
      </div>

      {/* Extension form */}
      {showExtForm && (
        <div style={{ marginTop:12, padding:12, background:'var(--bg)', borderRadius:8, display:'flex', flexDirection:'column', gap:8 }}>
          <div className="form-group" style={{ margin:0 }}>
            <label className="label">Reason for extension</label>
            <textarea className="input" rows={2} value={extForm.ext_reason} onChange={e => setExtForm(f=>({...f, ext_reason:e.target.value}))} placeholder="Why do you need more time?" />
          </div>
          <div className="form-group" style={{ margin:0 }}>
            <label className="label">Requested new deadline</label>
            <input type="datetime-local" className="input" value={extForm.requested_deadline} onChange={e => setExtForm(f=>({...f, requested_deadline:e.target.value}))} />
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-primary btn-sm" onClick={handleExtend} disabled={submitting || !extForm.ext_reason || !extForm.requested_deadline}>
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => setShowExtForm(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TasksPage() {
  const { currentUser, taskList, fetchTasks, createTask, updateTask, deleteTask, completeTask, requestExtension, reviewExtension } = useApp();
  const isAdminOrCeo = ['admin','ceo'].includes(currentUser?.role);

  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [filterStatus, setFilter] = useState('');
  const [allUsers, setAllUsers]   = useState([]);

  const [form, setForm] = useState({ title:'', description:'', deadline:'', priority:'Medium', assigned_to:'' });

  useEffect(() => {
    setLoading(true);
    fetchTasks().catch(e => setError(e.message)).finally(() => setLoading(false));

    if (isAdminOrCeo) {
      api.users.list().then(d => setAllUsers(d.users || [])).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...form };
      if (!isAdminOrCeo) delete payload.assigned_to;
      await createTask(payload);
      setSuccess('Task created!');
      setShowForm(false);
      setForm({ title:'', description:'', deadline:'', priority:'Medium', assigned_to:'' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.message); }
  };

  const handleComplete = async (id) => {
    setError('');
    try { await completeTask(id); setSuccess('Task completed!'); setTimeout(() => setSuccess(''), 3000); }
    catch (e) { setError(e.message); }
  };

  const handleDelete = async (id) => {
    setError('');
    try { await deleteTask(id); } catch (e) { setError(e.message); }
  };

  const handleExtend = async (id, data) => {
    await requestExtension(id, data);
    setSuccess('Extension requested!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleReviewExt = async (id, ext_status) => {
    setError('');
    try {
      await reviewExtension(id, { ext_status });
      setSuccess(`Extension ${ext_status}!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) { setError(e.message); }
  };

  const filtered = filterStatus ? taskList.filter(t => t.status === filterStatus) : taskList;
  const pendingExt = taskList.filter(t => t.ext_status === 'pending').length;

  const minDeadline = new Date();
  minDeadline.setMinutes(minDeadline.getMinutes() + 5);
  const minDeadlineStr = minDeadline.toISOString().slice(0,16);

  return (
    <div className="page animate-fadeup">
      <div className="page-header">
        <div>
          <h2 className="page-title">Tasks</h2>
          <p className="page-sub">{isAdminOrCeo ? `Assign and manage team tasks${pendingExt > 0 ? ` · ${pendingExt} extension request${pendingExt>1?'s':''} pending` : ''}` : 'Your assigned tasks'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
          {showForm ? '✕ Cancel' : '+ New Task'}
        </button>
      </div>

      {success && <div className="leave-success" style={{ marginBottom:16 }}>{success}</div>}
      {error   && <div className="leave-success" style={{ marginBottom:16, background:'#fef2f2', borderColor:'#fca5a5', color:'#dc2626' }}>{error}</div>}

      {/* Create form */}
      {showForm && (
        <div className="card animate-fadeup" style={{ padding:24, marginBottom:20 }}>
          <h3 className="card-title">Create New Task</h3>
          <form onSubmit={handleCreate} style={{ display:'flex', flexDirection:'column', gap:12, marginTop:12 }}>
            <div className="form-group">
              <label className="label">Title *</label>
              <input className="input" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required placeholder="Task title" />
            </div>
            <div className="form-group">
              <label className="label">Description</label>
              <textarea className="input" rows={2} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Optional details" />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div className="form-group">
                <label className="label">Deadline *</label>
                <input type="datetime-local" className="input" min={minDeadlineStr} value={form.deadline} onChange={e=>setForm(f=>({...f,deadline:e.target.value}))} required />
              </div>
              <div className="form-group">
                <label className="label">Priority</label>
                <select className="input" value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))}>
                  {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            {isAdminOrCeo && (
              <div className="form-group">
                <label className="label">Assign To *</label>
                <select className="input" value={form.assigned_to} onChange={e=>setForm(f=>({...f,assigned_to:e.target.value}))} required>
                  <option value="">— Select Employee —</option>
                  {allUsers.filter(u => u.role === 'employee').map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.designation})</option>
                  ))}
                </select>
              </div>
            )}
            <div style={{ display:'flex', gap:8 }}>
              <button type="submit" className="btn btn-primary">Create Task</button>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      <div className="leave-filter-tabs" style={{ marginBottom:16 }}>
        {[['', 'All'], ['pending', 'Pending'], ['completed', 'Completed']].map(([val, label]) => (
          <button key={val} className={`leave-filter-tab ${filterStatus === val ? 'active' : ''}`} onClick={() => setFilter(val)}>{label}</button>
        ))}
      </div>

      {loading ? (
        <p className="empty-msg">Loading tasks…</p>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding:32, textAlign:'center' }}>
          <p className="empty-msg">No tasks found.</p>
        </div>
      ) : (
        filtered.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            currentUser={currentUser}
            allUsers={allUsers}
            onComplete={handleComplete}
            onDelete={handleDelete}
            onUpdate={updateTask}
            onExtend={handleExtend}
            onReviewExt={handleReviewExt}
          />
        ))
      )}
    </div>
  );
}