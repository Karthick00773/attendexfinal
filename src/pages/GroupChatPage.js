import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import './GroupChatPage.css';

const roleColor = { employee:'#a855f7', admin:'#3b82f6', ceo:'#f59e0b' };

export default function GroupChatPage() {
  const { currentUser, messages, fetchMessages, sendMessage, deleteMessage } = useApp();
  const [text, setText]       = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState('');
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const pollRef   = useRef(null);

  // Initial load
  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages]);

  // Polling every 5 seconds for real-time feel (backend uses Supabase Realtime on its side)
  const poll = useCallback(async () => {
    try { await fetchMessages(); } catch (_) {}
  }, [fetchMessages]);

  useEffect(() => {
    pollRef.current = setInterval(poll, 5000);
    return () => clearInterval(pollRef.current);
  }, [poll]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setError('');
    try {
      await sendMessage(trimmed);
      setText('');
      inputRef.current?.focus();
    } catch (err) {
      setError(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleDelete = async (id) => {
    try { await deleteMessage(id); } catch (err) { setError(err.message || 'Failed to delete.'); }
  };

  const isAdminOrCeo = ['admin','ceo'].includes(currentUser?.role);

  // Group messages by date
  const grouped = messages.reduce((acc, msg) => {
    const d = msg.sent_at ? new Date(msg.sent_at).toISOString().split('T')[0] : 'today';
    if (!acc[d]) acc[d] = [];
    acc[d].push(msg);
    return acc;
  }, {});

  return (
    <div className="chat-layout">
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="chat-group-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div>
            <h3 className="chat-group-name">Company Group</h3>
            <p className="chat-group-sub">All members · {messages.length} messages · auto-refreshes every 5s</p>
          </div>
        </div>
      </div>

      {error && <div style={{ padding:'8px 16px', background:'#fef2f2', color:'#dc2626', fontSize:'0.85rem' }}>{error}</div>}

      <div className="chat-messages">
        {Object.entries(grouped).map(([date, msgs]) => (
          <div key={date}>
            <div className="chat-date-divider">
              <span>
                {date === 'today'
                  ? 'Today'
                  : new Date(date).toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })}
              </span>
            </div>
            {msgs.map(msg => {
              // Real backend: msg.users is the joined user object (Supabase select join)
              const sender    = msg.users || {};
              const isMe      = msg.user_id === currentUser?.id;
              const canDelete = isMe || isAdminOrCeo;
              const avatar    = sender.avatar_initials || '?';
              const name      = sender.name  || 'Unknown';
              const role      = sender.role  || 'employee';
              const timeStr   = msg.sent_at
                ? new Date(msg.sent_at).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:false })
                : '';

              return (
                <div key={msg.id} className={`chat-msg-wrap ${isMe ? 'chat-msg-me' : 'chat-msg-them'}`}>
                  {!isMe && (
                    <div className="avatar avatar-sm chat-msg-avatar"
                      style={{ background:`${roleColor[role]}20`, color:roleColor[role] }}>
                      {sender.profile_photo_url
                        ? <img src={sender.profile_photo_url} alt={name} style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }} />
                        : avatar}
                    </div>
                  )}
                  <div className="chat-msg-body">
                    {!isMe && (
                      <span className="chat-msg-name" style={{ color:roleColor[role] }}>
                        {name}
                        {role !== 'employee' && (
                          <span style={{ fontSize:'0.7rem', marginLeft:4, background:`${roleColor[role]}18`, padding:'1px 5px', borderRadius:8 }}>
                            {role.toUpperCase()}
                          </span>
                        )}
                      </span>
                    )}
                    <div className={`chat-bubble ${isMe ? 'chat-bubble-me' : 'chat-bubble-them'}`}>
                      <span>{msg.text}</span>
                      {canDelete && (
                        <button className="chat-delete-btn" onClick={() => handleDelete(msg.id)} title="Delete">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      )}
                    </div>
                    <span className="chat-time">{timeStr}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        {messages.length === 0 && (
          <p className="empty-msg" style={{ textAlign:'center', padding:32 }}>No messages yet. Say hello! 👋</p>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-bar">
        <div className="chat-input-wrap">
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder="Type a message… (Enter to send)"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
          />
          <button type="button" className="btn btn-primary chat-send-btn" onClick={handleSend} disabled={!text.trim() || sending}>
            {sending ? (
              <svg className="spin-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
            ) : (
              <>
                <span>Send</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
