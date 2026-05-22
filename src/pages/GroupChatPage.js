import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import './GroupChatPage.css';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const roleColor = {
  employee: '#7c3aed',
  admin:    '#2563eb',
  ceo:      '#d97706',
};

// ── Avatar ─────────────────────────────────────────────────────
// Handles profile photo OR initials fallback.
// Checks multiple possible field names from the Supabase join.
function Avatar({ user, size = 36 }) {
  const color  = roleColor[user?.role] || '#7c3aed';
  const photo  = user?.profile_photo_url || user?.photo_url || user?.avatar_url || null;
  const initials =
    user?.avatar_initials ||
    (user?.name ? user.name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?');

  if (photo) {
    return (
      <img
        src={photo}
        alt={user?.name || 'User'}
        style={{
          width: size, height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          border: '1.5px solid ' + color + '55',
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      background: color + '22',
      color,
      fontSize: size * 0.36,
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      userSelect: 'none',
      border: '1.5px solid ' + color + '44',
    }}>
      {initials}
    </div>
  );
}

// ── Context menu (right-click / long-press) ────────────────────
function ContextMenu({ x, y, isMe, onReact, onDelete, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const onKey   = (e) => { if (e.key === 'Escape') onClose(); };
    const t = setTimeout(() => {
      document.addEventListener('mousedown', onClick);
      document.addEventListener('keydown',   onKey);
    }, 30);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown',   onKey);
    };
  }, [onClose]);

  const safeX = Math.min(x, window.innerWidth  - 185);
  const safeY = Math.min(y, window.innerHeight - 170);

  return (
    <div ref={ref} role="menu" style={{
      position: 'fixed', top: safeY, left: safeX,
      background: 'var(--bg, #fff)',
      border: '0.5px solid rgba(0,0,0,0.14)',
      borderRadius: 10,
      boxShadow: '0 4px 20px rgba(0,0,0,0.13)',
      zIndex: 9999, minWidth: 175, overflow: 'hidden',
    }}>
      {/* Emoji strip */}
      <div style={{ display: 'flex', gap: 2, padding: '8px 10px' }}>
        {EMOJIS.map(em => (
          <span
            key={em}
            role="button"
            aria-label={'React ' + em}
            onClick={() => { onReact(em); onClose(); }}
            style={{ fontSize: 22, cursor: 'pointer', padding: '2px 5px', borderRadius: 6, lineHeight: 1.3 }}
          >
            {em}
          </span>
        ))}
      </div>
      <div style={{ height: '0.5px', background: 'rgba(0,0,0,0.08)' }} />

      {/* Delete — only own messages */}
      {isMe && (
        <button
          role="menuitem"
          onClick={onDelete}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', padding: '10px 16px',
            background: 'none', border: 'none',
            textAlign: 'left', fontSize: 13,
            cursor: 'pointer', color: '#ef4444',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/>
            <path d="M9 6V4h6v2"/>
          </svg>
          Delete message
        </button>
      )}
    </div>
  );
}

// ── Typing indicator ───────────────────────────────────────────
function TypingIndicator({ typingUsers }) {
  if (!typingUsers || typingUsers.length === 0) return null;
  const label = typingUsers.length === 1
    ? typingUsers[0].name + ' is typing…'
    : typingUsers.map(u => u.name).join(', ') + ' are typing…';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0 4px', alignSelf: 'flex-start' }}>
      <Avatar user={typingUsers[0]} size={28} />
      <div>
        <div style={{ fontSize: 11, color: roleColor[typingUsers[0]?.role] || '#7c3aed', fontWeight: 500, marginBottom: 3 }}>
          {label}
        </div>
        <div style={{
          background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)',
          borderRadius: '10px 10px 10px 2px',
          padding: '8px 14px', display: 'flex', gap: 4, alignItems: 'center',
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: '50%', background: '#aaa',
              animation: 'chatDot 1.2s ' + (i * 0.2) + 's infinite',
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Single message ─────────────────────────────────────────────
function ChatMessage({ msg, currentUser, onDelete, onReact }) {
  // msg.users is the joined sender row from Supabase
  const sender = msg.users || {};
  const isMe   = msg.user_id === currentUser?.id;
  const color  = roleColor[sender.role] || '#7c3aed';
  const time   = msg.sent_at
    ? new Date(msg.sent_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    : '';

  const [ctx,     setCtx]     = useState(null);
  const longRef               = useRef(null);

  const openMenu  = (x, y) => setCtx({ x, y });
  const closeMenu = useCallback(() => setCtx(null), []);

  const handleContextMenu = (e) => { e.preventDefault(); openMenu(e.clientX, e.clientY); };

  const handleTouchStart = (e) => {
    const t = e.touches[0];
    longRef.current = setTimeout(() => openMenu(t.clientX, t.clientY), 500);
  };
  const cancelLong = () => { if (longRef.current) { clearTimeout(longRef.current); longRef.current = null; } };

  const reactions = msg.reactions || {};

  return (
    <>
      {/* Outer row: me = right-aligned, them = left-aligned */}
      <div style={{
        display: 'flex',
        justifyContent: isMe ? 'flex-end' : 'flex-start',
        marginBottom: 4,
        width: '100%',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 6,
          flexDirection: isMe ? 'row-reverse' : 'row',
          maxWidth: '75%',
        }}>
          {/* Avatar — always shown for both sides */}
          <Avatar user={isMe ? currentUser : sender} size={30} />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>

            {/* Sender name + role — only for others */}
            {!isMe && (
              <span style={{ fontSize: 11, fontWeight: 500, color, marginBottom: 3 }}>
                {sender.name || 'Unknown'}
                {sender.role && sender.role !== 'employee' && (
                  <span style={{
                    marginLeft: 5, fontSize: 9,
                    background: color + '18', color,
                    padding: '1px 5px', borderRadius: 4,
                    fontWeight: 600, letterSpacing: '0.04em',
                  }}>
                    {sender.role.toUpperCase()}
                  </span>
                )}
              </span>
            )}

            {/* Bubble */}
            <div
              onContextMenu={handleContextMenu}
              onTouchStart={handleTouchStart}
              onTouchEnd={cancelLong}
              onTouchMove={cancelLong}
              style={{
                background: isMe ? '#dcf8c6' : '#fff',
                color: '#111',
                padding: '7px 10px 5px',
                borderRadius: isMe ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
                border: isMe ? '0.5px solid #b7f5c8' : '0.5px solid rgba(0,0,0,0.1)',
                cursor: 'pointer',
                userSelect: 'none',
                maxWidth: '100%',
              }}
            >
              <div style={{ fontSize: 13, lineHeight: 1.45, paddingRight: 28, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {msg.text}
              </div>
              <div style={{
                fontSize: 10, color: '#999',
                display: 'flex', alignItems: 'center',
                justifyContent: 'flex-end', gap: 3, marginTop: 2,
              }}>
                {time}
                {isMe && <span style={{ color: '#53bdeb' }}>✓✓</span>}
              </div>
            </div>

            {/* Reaction pills */}
            {Object.keys(reactions).length > 0 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 3 }}>
                {Object.entries(reactions).map(([emoji, users]) => (
                  <div
                    key={emoji}
                    onClick={() => onReact(msg.id, emoji)}
                    style={{
                      background: '#fff',
                      border: '0.5px solid rgba(0,0,0,0.12)',
                      borderRadius: 12,
                      padding: '1px 7px',
                      fontSize: 13, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 3,
                    }}
                  >
                    {emoji}
                    <span style={{ fontSize: 10, color: '#666' }}>{users.length}</span>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Context menu */}
      {ctx && (
        <ContextMenu
          x={ctx.x} y={ctx.y}
          isMe={isMe}
          onReact={(em) => onReact(msg.id, em)}
          onDelete={() => { onDelete(msg.id); closeMenu(); }}
          onClose={closeMenu}
        />
      )}
    </>
  );
}

// ── Main page ──────────────────────────────────────────────────
export default function GroupChatPage() {
  const { currentUser, messages, fetchMessages, sendMessage, deleteMessage } = useApp();

  const [text,           setText]           = useState('');
  const [sending,        setSending]        = useState(false);
  const [error,          setError]          = useState('');
  const [typingUsers]                       = useState([]);
  const [localReactions, setLocalReactions] = useState({});

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const pollRef   = useRef(null);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try { await fetchMessages(); } catch (_) {}
    }, 5000);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleInputChange = (e) => {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setError('');
    try {
      await sendMessage(trimmed);
      setText('');
      if (inputRef.current) { inputRef.current.style.height = 'auto'; inputRef.current.focus(); }
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
    try { await deleteMessage(id); }
    catch (err) { setError(err.message || 'Failed to delete message.'); }
  };

  // Local-first reactions — wire to backend when ready
  const handleReact = (msgId, emoji) => {
    const userId = currentUser?.id;
    if (!userId) return;
    setLocalReactions(prev => {
      const mr    = { ...(prev[msgId] || {}) };
      const users = [...(mr[emoji] || [])];
      const idx   = users.indexOf(userId);
      if (idx >= 0) users.splice(idx, 1); else users.push(userId);
      if (users.length === 0) delete mr[emoji]; else mr[emoji] = users;
      return { ...prev, [msgId]: mr };
    });
  };

  const mergedMessages = messages.map(m => ({
    ...m,
    reactions: { ...(m.reactions || {}), ...(localReactions[m.id] || {}) },
  }));

  const grouped = mergedMessages.reduce((acc, m) => {
    const d = m.sent_at ? m.sent_at.split('T')[0] : 'today';
    if (!acc[d]) acc[d] = [];
    acc[d].push(m);
    return acc;
  }, {});

  const formatDate = (dateStr) => {
    if (dateStr === 'today') return 'Today';
    const d    = new Date(dateStr);
    const now  = new Date();
    const yest = new Date(); yest.setDate(now.getDate() - 1);
    if (d.toDateString() === now.toDateString())  return 'Today';
    if (d.toDateString() === yest.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <>
      <style>{`@keyframes chatDot { 0%,60%,100%{opacity:.3} 30%{opacity:1} }`}</style>

      <div className="chat-layout">

        {/* Header */}
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
              <p className="chat-group-sub">
                {typingUsers.length > 0
                  ? typingUsers.map(u => u.name).join(', ') + (typingUsers.length === 1 ? ' is typing…' : ' are typing…')
                  : messages.length + ' messages · live'}
              </p>
            </div>
          </div>
        </div>

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

        {/* Messages */}
        <div className="chat-messages">
          {Object.entries(grouped).map(([date, msgs]) => (
            <div key={date}>
              <div className="chat-date-divider"><span>{formatDate(date)}</span></div>
              {msgs.map(msg => (
                <ChatMessage
                  key={msg.id}
                  msg={msg}
                  currentUser={currentUser}
                  onDelete={handleDelete}
                  onReact={handleReact}
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

          <TypingIndicator typingUsers={typingUsers} />
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="chat-input-bar">
          <div className="chat-input-wrap">
            <textarea
              ref={inputRef}
              className="chat-input"
              placeholder="Type a message… (Enter to send)"
              value={text}
              onChange={handleInputChange}
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

        <div className="chat-hint" aria-hidden="true">
          Right-click or hold a message to react or delete
        </div>

      </div>
    </>
  );
}
