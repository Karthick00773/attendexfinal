import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import './GroupChatPage.css';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
const roleColor = { employee: '#7c3aed', admin: '#2563eb', ceo: '#d97706' };

// ── Avatar: shows profile photo, falls back to initials ───────
function Avatar({ user, size = 32 }) {
  const color    = roleColor[user?.role] || '#7c3aed';
  const photo    = user?.profile_photo_url || user?.photo_url || null;
  const initials = user?.avatar_initials
    || (user?.name
      ? user.name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
      : '?');

  if (photo) {
    return (
      <img
        src={photo}
        alt={user?.name || 'User'}
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover', flexShrink: 0,
          border: '2px solid ' + color + '55',
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color + '20', color, fontSize: size * 0.36,
      fontWeight: 600, display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexShrink: 0, userSelect: 'none',
      border: '2px solid ' + color + '40',
    }}>
      {initials}
    </div>
  );
}

// ── Context menu on right-click / long-press ──────────────────
function ContextMenu({ x, y, isMe, onReact, onDelete, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const click = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const key   = (e) => { if (e.key === 'Escape') onClose(); };
    const t = setTimeout(() => {
      document.addEventListener('mousedown', click);
      document.addEventListener('keydown', key);
    }, 30);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', click);
      document.removeEventListener('keydown', key);
    };
  }, [onClose]);

  const safeX = Math.min(x, window.innerWidth  - 200);
  const safeY = Math.min(y, window.innerHeight - 160);

  return (
    <div ref={ref} role="menu" style={{
      position: 'fixed', top: safeY, left: safeX,
      background: '#fff', border: '0.5px solid rgba(0,0,0,0.12)',
      borderRadius: 12, boxShadow: '0 6px 24px rgba(0,0,0,0.14)',
      zIndex: 9999, minWidth: 190, overflow: 'hidden',
    }}>
      <div style={{ padding: '8px 10px 6px', borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
        <div style={{ fontSize: 11, color: '#999', marginBottom: 6, paddingLeft: 4 }}>React</div>
        <div style={{ display: 'flex', gap: 2 }}>
          {EMOJIS.map(em => (
            <span
              key={em}
              onClick={() => { onReact(em); onClose(); }}
              style={{ fontSize: 22, cursor: 'pointer', padding: '2px 4px', borderRadius: 6, lineHeight: 1.3 }}
            >
              {em}
            </span>
          ))}
        </div>
      </div>
      {isMe && (
        <button onClick={onDelete} role="menuitem" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          width: '100%', padding: '10px 16px', background: 'none',
          border: 'none', textAlign: 'left', fontSize: 13,
          cursor: 'pointer', color: '#ef4444',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
          Delete message
        </button>
      )}
    </div>
  );
}

// ── Single message bubble ─────────────────────────────────────
function ChatMessage({ msg, currentUser, usersMap = {}, onDelete, onReact }) {
  const isMe = msg.user_id === currentUser?.id;

  // Resolve sender: prefer msg.users if it has a name, else fall back to usersMap
  const sender = (msg.users && msg.users.name)
    ? msg.users
    : (usersMap[msg.user_id] || {});

  const color = roleColor[sender.role] || '#7c3aed';
  const time  = msg.sent_at
    ? new Date(msg.sent_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    : '';

  const [ctx,  setCtx]  = useState(null);
  const longRef         = useRef(null);
  const closeMenu       = useCallback(() => setCtx(null), []);

  const handleContextMenu = (e) => { e.preventDefault(); setCtx({ x: e.clientX, y: e.clientY }); };
  const handleTouchStart  = (e) => {
    const t = e.touches[0];
    longRef.current = setTimeout(() => setCtx({ x: t.clientX, y: t.clientY }), 500);
  };
  const cancelLong = () => { clearTimeout(longRef.current); };

  const reactions = msg.reactions || {};

  return (
    <>
      <div style={{
        display: 'flex',
        justifyContent: isMe ? 'flex-end' : 'flex-start',
        width: '100%',
        marginBottom: 6,
        paddingLeft:  isMe ? 48 : 0,
        paddingRight: isMe ? 0  : 48,
      }}>
        <div style={{
          display: 'flex',
          flexDirection: isMe ? 'row-reverse' : 'row',
          alignItems: 'flex-end',
          gap: 8,
          maxWidth: '100%',
        }}>
          {/* Avatar — resolved from sender (which uses usersMap fallback) */}
          <div style={{ flexShrink: 0 }}>
            <Avatar user={isMe ? currentUser : sender} size={32} />
          </div>

          {/* Bubble + meta */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '100%' }}>

            {/* Sender name — only for others */}
            {!isMe && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color }}>
                  {sender.name || 'Unknown'}
                </span>
                {sender.role && sender.role !== 'employee' && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.05em',
                    background: color + '18', color,
                    padding: '1px 5px', borderRadius: 4,
                  }}>
                    {sender.role.toUpperCase()}
                  </span>
                )}
              </div>
            )}

            {/* Bubble */}
            <div
              onContextMenu={handleContextMenu}
              onTouchStart={handleTouchStart}
              onTouchEnd={cancelLong}
              onTouchMove={cancelLong}
              style={{
                background: isMe ? '#dcf8c6' : '#ffffff',
                color: '#111',
                padding: '8px 12px 6px',
                borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                border: isMe ? '0.5px solid #b2f2cb' : '0.5px solid rgba(0,0,0,0.09)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                cursor: 'pointer',
                userSelect: 'none',
                maxWidth: '100%',
                wordBreak: 'break-word',
              }}
            >
              <div style={{ fontSize: 13.5, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {msg.text}
              </div>
              <div style={{ fontSize: 10, color: '#999', textAlign: 'right', marginTop: 3, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
                {time}
                {isMe && <span style={{ color: '#53bdeb', fontSize: 12 }}>✓✓</span>}
              </div>
            </div>

            {/* Reaction pills */}
            {Object.keys(reactions).length > 0 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 3 }}>
                {Object.entries(reactions).map(([emoji, users]) => (
                  <div key={emoji} onClick={() => onReact(msg.id, emoji)} style={{
                    background: '#fff', border: '0.5px solid rgba(0,0,0,0.12)',
                    borderRadius: 12, padding: '2px 8px', fontSize: 13,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}>
                    {emoji}
                    <span style={{ fontSize: 10, color: '#666' }}>{users.length}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {ctx && (
        <ContextMenu
          x={ctx.x} y={ctx.y} isMe={isMe}
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
  const [localReactions, setLocalReactions] = useState({});

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const pollRef   = useRef(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchMessages(); }, []);

  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try { await fetchMessages(); } catch (_) {}
    }, 5000);
    return () => clearInterval(pollRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Build a map of user_id → richest user object seen across all messages.
  const usersMap = useMemo(() => {
    const map = {};
    messages.forEach(m => {
      if (m.user_id && m.users && m.users.name) {
        const existing = map[m.user_id];
        if (!existing || Object.keys(m.users).length > Object.keys(existing).length) {
          map[m.user_id] = m.users;
        }
      }
    });
    if (currentUser?.id) {
      map[currentUser.id] = currentUser;
    }
    return map;
  }, [messages, currentUser]);

  const handleInputChange = (e) => {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true); setError('');
    try {
      await sendMessage(trimmed);
      setText('');
      if (inputRef.current) { inputRef.current.style.height = 'auto'; inputRef.current.focus(); }
    } catch (err) { setError(err.message || 'Failed to send.'); }
    finally { setSending(false); }
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const handleDelete = async (id) => {
    try { await deleteMessage(id); }
    catch (err) { setError(err.message || 'Failed to delete.'); }
  };

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

  const chronologicalMessages = [...messages].reverse();

  const mergedMessages = chronologicalMessages.map(m => ({
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
    const d = new Date(dateStr), now = new Date(), yest = new Date();
    yest.setDate(now.getDate() - 1);
    if (d.toDateString() === now.toDateString())  return 'Today';
    if (d.toDateString() === yest.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <div className="chat-layout">

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

      <div className="chat-messages">
        {Object.entries(grouped).map(([date, msgs]) => (
          <div key={date}>
            <div className="chat-date-divider"><span>{formatDate(date)}</span></div>
            {msgs.map(msg => (
              <ChatMessage
                key={msg.id}
                msg={msg}
                currentUser={currentUser}
                usersMap={usersMap}
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
        <div ref={bottomRef} />
      </div>

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
        <button type="button" className="chat-send-btn" onClick={handleSend} disabled={!text.trim() || sending} aria-label="Send message">
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

      <div className="chat-hint" aria-hidden="true">Right-click or hold a message to react or delete</div>
    </div>
  );
}