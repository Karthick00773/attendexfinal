import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import './ProfilePage.css';

const roleColor = { employee:'#a855f7', admin:'#3b82f6', ceo:'#f59e0b' };
const roleGrad  = {
  employee:'linear-gradient(135deg, #7c3aed, #a855f7)',
  admin:   'linear-gradient(135deg, #1d4ed8, #3b82f6)',
  ceo:     'linear-gradient(135deg, #b45309, #f59e0b)',
};

function InfoRow({ label, value, icon }) {
  return (
    <div className="info-row">
      <span className="info-icon">{icon}</span>
      <div className="info-body">
        <span className="info-label">{label}</span>
        <span className="info-value">{value || '—'}</span>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const {
    currentUser, updateUser, uploadProfilePhoto,
    monthlySummary, fetchMonthlySummary,
    attendanceHistory, fetchAttendanceHistory,
  } = useApp();

  const [tab, setTab]           = useState('overview');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ phone:'', designation:'' });
  const [saving, setSaving]     = useState(false);
  const [saveMsg, setSaveMsg]   = useState('');
  const [saveError, setSaveError] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    fetchMonthlySummary();
    fetchAttendanceHistory();
  }, [fetchMonthlySummary, fetchAttendanceHistory]);

  useEffect(() => {
    if (currentUser) setEditForm({ phone: currentUser.phone||'', designation: currentUser.designation||'' });
  }, [currentUser]);

  const summary     = monthlySummary || {};
  const presentDays = summary.present_days || 0;

  const totalLeaves = currentUser?.paid_leaves_total ?? currentUser?.total_leaves ?? 0;
  const usedLeaves  = currentUser?.paid_leaves_used  ?? currentUser?.used_leaves  ?? 0;

  const showEmployeeDetails = Boolean(
    currentUser?.role && !['admin', 'ceo'].includes(currentUser.role)
  );

  const joinDate = currentUser?.join_date ? new Date(currentUser.join_date) : null;
  const now      = new Date();

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true); setSaveError(''); setSaveMsg('');
    try {
      await updateUser(currentUser.id, editForm);
      setSaveMsg('Profile updated successfully.');
      setEditMode(false);
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) { setSaveError(err.message || 'Failed to update profile.'); }
    finally { setSaving(false); }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoUploading(true); setSaveError('');
    try {
      await uploadProfilePhoto(file);
      setSaveMsg('Profile photo updated!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) { setSaveError(err.message || 'Photo upload failed.'); }
    finally { setPhotoUploading(false); }
  };

  const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:false }) : '—';

  return (
    <div className="page animate-fadeup">
      {/* Hero banner */}
      <div className="profile-hero" style={{ background: roleGrad[currentUser?.role] || roleGrad.employee }}>
        <div className="profile-hero-bg" />
        <div className="profile-hero-content">
          <div className="profile-avatar-ring" style={{ position:'relative' }}>
            {currentUser?.profile_photo_url ? (
              <img src={currentUser.profile_photo_url} alt="profile" style={{ width:72, height:72, borderRadius:'50%', objectFit:'cover', border:'3px solid rgba(255,255,255,0.6)' }} />
            ) : (
              <div className="avatar avatar-xl profile-avatar">{currentUser?.avatar_initials}</div>
            )}
            <button
              style={{ position:'absolute', bottom:0, right:0, width:24, height:24, borderRadius:'50%', background:'white', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem' }}
              onClick={() => fileRef.current?.click()}
              title="Upload profile photo"
              disabled={photoUploading}
            >
              {photoUploading ? '…' : '📷'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handlePhotoChange} />
          </div>
          <div className="profile-hero-info">
            <h1 className="profile-name">{currentUser?.name}</h1>
            <p className="profile-designation">{currentUser?.designation}</p>
            <div className="profile-badges">
              <span className="profile-role-badge">{currentUser?.role?.toUpperCase()}</span>
              <span className="profile-dept-badge">{currentUser?.department}</span>
            </div>
          </div>
          {showEmployeeDetails && (
            <div className="profile-hero-stats">
              <div className="profile-hero-stat"><span className="phs-val">{presentDays}</span><span className="phs-label">Days Present</span></div>
              <div className="phs-divider" />
              <div className="profile-hero-stat"><span className="phs-val">{Number(summary.total_hours||0).toFixed(0)}h</span><span className="phs-label">Total Hours</span></div>
              <div className="phs-divider" />
              <div className="profile-hero-stat"><span className="phs-val">{totalLeaves - usedLeaves}</span><span className="phs-label">Leaves Left</span></div>
              <div className="phs-divider" />
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        {(showEmployeeDetails ? ['overview','stats','payroll'] : ['overview']).map(t => (
          <button key={t} className={`profile-tab ${tab===t?'profile-tab-active':''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {saveMsg   && <div className="leave-success" style={{ margin:'0 0 16px' }}>{saveMsg}</div>}
      {saveError && <div className="leave-success" style={{ margin:'0 0 16px', background:'#fef2f2', borderColor:'#fca5a5', color:'#dc2626' }}>{saveError}</div>}

      {tab === 'overview' && (
        <div className="profile-grid animate-fadein">
          <div className="card profile-card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h3 className="card-title" style={{ margin:0 }}>Personal Information</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditMode(e => !e)}>
                {editMode ? 'Cancel' : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit</>}
              </button>
            </div>
            {editMode ? (
              <form onSubmit={handleSaveProfile} style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div className="form-group"><label className="label">Phone</label><input className="input" value={editForm.phone} onChange={e=>setEditForm(f=>({...f,phone:e.target.value}))} placeholder="+91 00000 00000" /></div>
                <div className="form-group"><label className="label">Designation</label><input className="input" value={editForm.designation} onChange={e=>setEditForm(f=>({...f,designation:e.target.value}))} placeholder="Your role title" /></div>
                <div style={{ display:'flex', gap:8 }}>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditMode(false)}>Cancel</button>
                </div>
              </form>
            ) : (
              <div className="info-list">
                <InfoRow label="Full Name"   value={currentUser?.name} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} />
                <InfoRow label="Email"        value={currentUser?.email} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>} />
                <InfoRow label="Phone"        value={currentUser?.phone} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.35 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>} />
                <InfoRow label="Department"   value={currentUser?.department} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>} />
                <InfoRow label="Designation"  value={currentUser?.designation} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>} />
                <InfoRow label="Join Date"    value={joinDate ? joinDate.toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' }) : '—'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>} />
                <InfoRow label="Role"         value={currentUser?.role?.toUpperCase()} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>} />
              </div>
            )}
          </div>

          {/* Leave Summary — employees only */}
          {showEmployeeDetails && (
            <div className="card profile-card">
              <h3 className="card-title">Leave Summary</h3>
              <div className="leave-summary">
                <div className="leave-circle" style={{ '--role-color': roleColor[currentUser?.role]||'#7c3aed' }}>
                  <svg viewBox="0 0 100 100" className="leave-ring-svg">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" strokeWidth="8"/>
                    <circle cx="50" cy="50" r="40" fill="none" stroke={roleColor[currentUser?.role]||'#7c3aed'} strokeWidth="8"
                      strokeDasharray={`${2*Math.PI*40}`}
                      strokeDashoffset={`${totalLeaves > 0 ? 2*Math.PI*40*(1 - usedLeaves/totalLeaves) : 2*Math.PI*40}`}
                      strokeLinecap="round" transform="rotate(-90 50 50)" />
                  </svg>
                  <div className="leave-circle-inner">
                    <span className="leave-circle-val">{totalLeaves - usedLeaves}</span>
                    <span className="leave-circle-sub">Remaining</span>
                  </div>
                </div>
                <div className="leave-breakdown">
                  <div className="leave-item"><span className="leave-dot" style={{ background:roleColor[currentUser?.role]||'#7c3aed' }} /><span>Total Paid Leaves</span><strong>{totalLeaves}</strong></div>
                  <div className="leave-item"><span className="leave-dot" style={{ background:'var(--orange)' }} /><span>Used</span><strong>{usedLeaves}</strong></div>
                  <div className="leave-item"><span className="leave-dot" style={{ background:'var(--green)' }} /><span>Remaining</span><strong>{totalLeaves - usedLeaves}</strong></div>
                </div>
              </div>
            </div>
          )}

          {showEmployeeDetails && (
            <div className="card profile-card profile-card-wide">
              <h3 className="card-title">This Month — Hours Breakdown</h3>
              <div className="month-hours-grid">
                {[
                  { label:'Normal Hours',  val:Number(summary.normal_hours  ||0), max:180, color:'var(--accent)', unit:'h' },
                  { label:'Overtime Hours',val:Number(summary.overtime_hours||0), max:40,  color:'var(--orange)', unit:'h' },
                  { label:'Total Hours',   val:Number(summary.total_hours   ||0), max:220, color:'var(--green)',  unit:'h' },
                  { label:'Days Worked',   val:presentDays, max:26, color:'var(--blue)', unit:'d' },
                ].map(item => (
                  <div key={item.label} className="month-hour-block">
                    <div className="month-hour-header">
                      <span>{item.label}</span>
                      <strong style={{ color:item.color }}>{typeof item.val==='number' ? item.val.toFixed(item.unit==='d'?0:1) : item.val}{item.unit}</strong>
                    </div>
                    <div className="progress-bar" style={{ height:10 }}>
                      <div className="progress-fill" style={{ width:`${Math.min((item.val/item.max)*100,100)}%`, background:item.color }} />
                    </div>
                    <span className="month-hour-max">of {item.max}{item.unit==='d'?' days':'h'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'stats' && showEmployeeDetails && (
        <div className="animate-fadein">
          <div className="card" style={{ padding:24, marginBottom:20 }}>
            <h3 className="card-title">Attendance Records</h3>
            {attendanceHistory.length === 0 ? (
              <p className="empty-msg">No records available</p>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table className="admin-table" style={{ width:'100%' }}>
                  <thead>
                    <tr><th>Date</th><th>Day</th><th>Check-In</th><th>Check-Out</th><th>Normal</th><th>Overtime</th><th>Total</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {attendanceHistory.map(r => (
                      <tr key={r.id}>
                        <td>{new Date(r.date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</td>
                        <td>{new Date(r.date).toLocaleDateString('en-IN', { weekday:'long' })}</td>
                        <td><strong>{fmtTime(r.check_in_time)}</strong></td>
                        <td><strong>{fmtTime(r.check_out_time)}</strong></td>
                        <td><span style={{ color:'var(--accent)', fontWeight:700 }}>{Number(r.normal_hours||0).toFixed(1)}h</span></td>
                        <td><span style={{ color:'var(--orange)', fontWeight:700 }}>{Number(r.overtime_hours||0).toFixed(1)}h</span></td>
                        <td><span style={{ color:'var(--green)', fontWeight:700 }}>{Number(r.total_hours||0).toFixed(1)}h</span></td>
                        <td><span className={`badge ${r.status==='present'?'badge-green':r.status==='on_leave'?'badge-orange':'badge-red'}`}>{r.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'payroll' && showEmployeeDetails && (
        <div className="animate-fadein">
          <div className="card" style={{ padding:28 }}>
            <h3 className="card-title">Payroll Information</h3>
            {currentUser?.monthly_salary ? (
              <div className="payroll-grid">
                <div className="payroll-block payroll-main">
                  <span className="payroll-label">Monthly CTC</span>
                  <span className="payroll-amount">₹{Number(currentUser.monthly_salary).toLocaleString('en-IN')}</span>
                  <span className="payroll-note">Gross monthly salary</span>
                </div>
                <div className="payroll-block">
                  <span className="payroll-label">Daily Rate</span>
                  <span className="payroll-amount payroll-amount-sm">₹{Math.round(currentUser.monthly_salary/26).toLocaleString('en-IN')}</span>
                  <span className="payroll-note">Per working day (26d/mo)</span>
                </div>
                <div className="payroll-block">
                  <span className="payroll-label">Hourly Rate</span>
                  <span className="payroll-amount payroll-amount-sm">₹{Math.round(currentUser.monthly_salary/180).toLocaleString('en-IN')}</span>
                  <span className="payroll-note">Based on 180h/month</span>
                </div>
                <div className="payroll-block">
                  <span className="payroll-label">OT Rate</span>
                  <span className="payroll-amount payroll-amount-sm" style={{ color:'var(--orange)' }}>
                    ₹{Math.round((currentUser.monthly_salary/180)*1.5).toLocaleString('en-IN')}
                  </span>
                  <span className="payroll-note">Per OT hour (1.5×)</span>
                </div>
                <div className="payroll-block payroll-earned" style={{ gridColumn:'1 / -1' }}>
                  <div>
                    <span className="payroll-label">This Month Earned (Estimate)</span>
                    <span className="payroll-amount" style={{ color:'var(--green)' }}>
                      ₹{Math.round(
                        (Number(summary.normal_hours||0)*(currentUser.monthly_salary/180)) +
                        (Number(summary.overtime_hours||0)*(currentUser.monthly_salary/180)*1.5)
                      ).toLocaleString('en-IN')}
                    </span>
                    <span className="payroll-note">
                      Normal: ₹{Math.round(Number(summary.normal_hours||0)*(currentUser.monthly_salary/180)).toLocaleString('en-IN')} +
                      OT: ₹{Math.round(Number(summary.overtime_hours||0)*(currentUser.monthly_salary/180)*1.5).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="empty-msg">Payroll information is not available for your account.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
