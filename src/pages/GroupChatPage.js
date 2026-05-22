import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import './GroupChatPage.css';

const roleColor = { employee: '#a855f7', admin: '#3b82f6', ceo: '#f59e0b' };

// ── Avatar (photo or initials) ────────────────────────────────
function Avatar({ user, size = 36 }) {
  const role     = user?.role || 'employee';
  const color    = roleColor[role] || '#a855f7';
  const initials = user?.avatar_initials || '?';

  if (user?.profile_photo_url) {
    return (
      <img
        src={user.profile_photo_url}
        alt={user?.name || 'User'}
        className="chat-avatar-pill"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="chat-avatar-pill chat-avatar-initials"
      style={{ width: size, height: size, background: `${color}22`, color, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}

// ── Delete menu (shows above bubble on long-press) ────────────
function DeleteMenu({ onDelete, onClose, isMe }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 50);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler); };
  }, [onClose]);

  return (
    <div
      className={`msg-menu ${isMe ? 'msg-menu--right' : 'msg-menu--left'}`}
      ref={ref}
      role="menu"
    >
      <button className="msg-menu-item msg-menu-item--danger" onClick={onDelete} role="menuitem">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6"/><path d="M14 11v6"/>
          <path d="M9 6V4h6v2"/>
        </svg>
        Delete message
      </button>
      <button className="msg-menu-item" onClick={onClose} role="menuitem">
        Cancel
      </button>
    </div>
  );
}

// ── Single message ────────────────────────────────────────────
function ChatMessage({ msg, currentUser, onDelete }) {
  const sender  = msg.users || {};
  const isMe    = msg.user_id === currentUser?.id;
  const role    = sender.role || 'employee';
  const color   = roleColor[role] || '#a855f7';
  const name    = sender.name || 'Unknown';
  const timeStr = msg.sent_at
    ? new Date(msg.sent_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    : '';

  const [menuOpen,  setMenuOpen]  = useState(false);
  const [longTimer, setLongTimer] = useState(null);
  const [pressing,  setPressing]  = useState(false);

  // Long-press — only for MY messages
  const startPress = () => {
    if (!isMe) return;
    setPressing(true);
    const t = setTimeout(() => {
      setMenuOpen(true);
      setPressing(false);
    }, 500);
    setLongTimer(t);
  };

  const cancelPress = () => {
    setPressing(false);
    if (longTimer) clearTimeout(longTimer);
  };

  // Right-click on desktop — own messages only
  const handleContextMenu = (e) => {
    if (!isMe) return;
    e.preventDefault();
    setMenuOpen(true);
  };

  const handleDelete = () => {
    setMenuOpen(false);
    onDelete(msg.id);
  };

  return (
    <div className={`chat-msg-wrap ${isMe ? 'chat-msg-me' : 'chat-msg-them'}`}>

      {/* Avatar on the LEFT — only for other people */}
      {!isMe && <Avatar user={sender} size={36} />}

      <div className="chat-msg-body">

        {/* Name + role badge — only for others */}
        {!isMe && (
          <span className="chat-msg-name" style={{ color }}>
            {name}
            {role !== 'employee' && (
              <span className="role-badge" style={{ background: `${color}18`, color }}>
                {role.toUpperCase()}
              </span>
            )}
          </span>
        )}

        {/* Bubble */}
        <div
          className={`chat-bubble ${isMe ? 'chat-bubble-me' : 'chat-bubble-them'} ${pressing ? 'chat-bubble--pressing' : ''}`}
          onMouseDown={startPress}
          onMouseUp={cancelPress}
          onMouseLeave={cancelPress}
          onTouchStart={startPress}
          onTouchEnd={cancelPress}
          onTouchCancel={cancelPress}
          onContextMenu={handleContextMenu}
        >
          <span className="chat-bubble-text">{msg.text}</span>

          {menuOpen && (
            <DeleteMenu
              onDelete={handleDelete}
              onClose={() => setMenuOpen(false)}
              isMe={isMe}
            />
          )}
        </div>

        <span className="chat-time">{timeStr}</span>
      </div>

      {/* NO avatar on the right for my messages */}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function GroupChatPage() {
  const { currentUser, messages, fetchMessages, sendMessage, deleteMessage } = useApp();
  const [text,    setText]    = useState('');
  const [sending, setSending] = useState(false);
  const [error,   setError]   = useState('');
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const pollRef   = useRef(null);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  // Group messages by date
  const grouped = messages.reduce((acc, msg) => {
    const d = msg.sent_at ? new Date(msg.sent_at).toISOString().split('T')[0] : 'today';
    if (!acc[d]) acc[d] = [];
    acc[d].push(msg);
    return acc;
  }, {});

  const formatDate = (dateStr) => {
    if (dateStr === 'today') return 'Today';
    const d         = new Date(dateStr);
    const today     = new Date();
    const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString())     return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <div className="chat-layout">

      {/* ── Header — group info only, no user avatar ── */}
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="chat-group-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div>
            <h3 className="chat-group-name">Company Group</h3>
            <p className="chat-group-sub">{messages.length} messages · live</p>
          </div>
        </div>
        {/* header-right removed */}
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="chat-error" role="alert">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {/* ── Messages ── */}
      <div className="chat-messages">
        {Object.entries(grouped).map(([date, msgs]) => (
          <div key={date}>
            <div className="chat-date-divider">
              <span>{formatDate(date)}</span>
            </div>
            {msgs.map(msg => (
              <ChatMessage
                key={msg.id}
                msg={msg}
                currentUser={currentUser}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ))}

        {messages.length === 0 && (
          <div className="chat-empty">
            <div className="chat-empty-icon">💬</div>
            <p>No messages yet. Say hello!</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input bar — no avatar, just textarea + send ── */}
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
        </div>
        <button
          type="button"
          className="chat-send-btn"
          onClick={handleSend}
          disabled={!text.trim() || sending}
          aria-label="Send message"
        >
          {sending ? (
            <svg className="spin-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          )}
        </button>
      </div>

      {/* Long-press hint */}
      <div className="chat-hint" aria-hidden="true">
        Hold your message to delete it
      </div>

    </div>
  );
}
