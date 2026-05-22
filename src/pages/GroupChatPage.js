import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import './GroupChatPage.css';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const roleColor = {
  employee: '#7c3aed',
  admin:    '#2563eb',
  ceo:      '#d97706',
};

// ── Avatar ────────────────────────────────────────────────────
function Avatar({ user, size = 36 }) {
  const color    = roleColor[user?.role] || '#7c3aed';
  const initials = user?.avatar_initials || '?';
  if (user?.profile_photo_url) {
    return (
      <img
        src={user.profile_photo_url}
        alt={user?.name || 'User'}
        style={{
          width: size, height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
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
    }}>
      {initials}
    </div>
  );
}

// ── Context menu (right-click) ────────────────────────────────
function ContextMenu({ x, y, isMe, onReact, onDelete, onClose }) {
  const ref = useRef(null);

  // Close on outside click or Escape
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    const t = setTimeout(() => {
      document.addEventListener('mousedown', handler);
      document.addEventListener('keydown', onKey);
    }, 30);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  // Keep menu inside viewport
  const safeX = Math.min(x, window.innerWidth  - 180);
  const safeY = Math.min(y, window.innerHeight - 160);

  return (
    <div
      ref={ref}
      role="menu"
      style={{
        position: 'fixed',
        top: safeY,
        left: safeX,
        background: 'var(--surface, #fff)',
        border: '0.5px solid rgba(0,0,0,0.12)',
        borderRadius: 10,
        boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
        zIndex: 9999,
        minWidth: 170,
        overflow: 'hidden',
      }}
    >
      {/* Emoji strip */}
      <div style={{ display: 'flex', gap: 6, padding: '8px 12px', flexWrap: 'wrap' }}>
        {EMOJIS.map(em => (
          <span
            key={em}
            role="button"
            aria-label={`React with ${em}`}
            onClick={() => { onReact(em); onClose(); }}
            style={{
              fontSize: 20,
              cursor: 'pointer',
              padding: '2px 4px',
              borderRadius: 6,
              lineHeight: 1.3,
            }}
          >
            {em}
          </span>
        ))}
      </div>
      <div style={{ height: '0.5px', background: 'rgba(0,0,0,0.08)' }} />

      {/* React option (always visible) */}
      <button
        role="menuitem"
        onClick={() => {}} // emoji strip above handles it
        style={menuItemStyle}
      >
        😊 React with emoji
      </button>

      {/* Delete — only own messages */}
      {isMe && (
        <button
          role="menuitem"
          onClick={onDelete}
          style={{ ...menuItemStyle, color: '#ef4444' }}
        >
          🗑 Delete message
        </button>
      )}
    </div>
  );
}

const menuItemStyle = {
  display: 'block',
  width: '100%',
  padding: '9px 16px',
  background: 'none',
  border: 'none',
  textAlign: 'left',
  fontSize: 13,
  cursor: 'pointer',
  color: 'inherit',
};

// ── Typing indicator ──────────────────────────────────────────
function TypingIndicator({ typingUsers }) {
  if (!typingUsers || typingUsers.length === 0) return null;

  const names = typingUsers.map(u => u.name).join(', ');
  const label = typingUsers.length === 1
    ? `${names} is typing…`
    : `${names} are typing…`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0 4px', alignSelf: 'flex-start' }}>
      {typingUsers.slice(0, 1).map(u => <Avatar key={u.id} user={u} size={28} />)}
      <div>
        <div style={{ fontSize: 11, color: roleColor[typingUsers[0]?.role] || '#7c3aed', fontWeight: 500, marginBottom: 3 }}>
          {label}
        </div>
        <div style={{
          background: 'var(--surface, #fff)',
          border: '0.5px solid rgba(0,0,0,0.1)',
          borderRadius: '10px 10px 10px 2px',
          padding: '8px 12px',
          display: 'flex',
          gap: 4,
          alignItems: 'center',
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 6, height: 6,
              borderRadius: '50%',
              background: '#aaa',
              animation: `chatDot 1.2s ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Single message ────────────────────────────────────────────
function ChatMessage({ msg, currentUser, onDelete, onReact }) {
  const sender = msg.users || {};
  const isMe   = msg.user_id === currentUser?.id;
  const color  = roleColor[sender.role] || '#7c3aed';
  const name   = sender.name || 'Unknown';
  const time   = msg.sent_at
    ? new Date(msg.sent_at).toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true,
      })
    : '';

  const [ctx,      setCtx]      = useState(null); // { x, y }
  const longRef                 = useRef(null);

  const openMenu = (x, y) => setCtx({ x, y });
  const closeMenu = useCallback(() => setCtx(null), []);

  const handleContextMenu = (e) => {
    e.preventDefault();
    openMenu(e.clientX, e.clientY);
  };

  // Long press for mobile
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    longRef.current = setTimeout(() => {
      openMenu(touch.clientX, touch.clientY);
    }, 500);
  };
  const cancelLong = () => {
    if (longRef.current) { clearTimeout(longRef.current); longRef.current = null; }
  };

  const reactions = msg.reactions || {};

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isMe ? 'flex-end' : 'flex-start',
      marginBottom: 2,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 6,
        flexDirection: isMe ? 'row-reverse' : 'row',
        maxWidth: '75%',
      }}>
        <Avatar user={sender} size={28} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
          {/* Sender name — only for others */}
          {!isMe && (
            <span style={{ fontSize: 11, fontWeight: 500, color, marginBottom: 3 }}>
              {name}
              {sender.role && sender.role !== 'employee' && (
                <span style={{
                  marginLeft: 5,
                  fontSize: 9,
                  background: color + '18',
                  color,
                  padding: '1px 5px',
                  borderRadius: 4,
                  fontWeight: 600,
                  letterSpacing: '0.03em',
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
              background: isMe ? '#dcf8c6' : 'var(--surface, #fff)',
              color: '#111',
              padding: '7px 10px 5px',
              borderRadius: isMe
                ? '10px 10px 2px 10px'
                : '10px 10px 10px 2px',
              border: isMe ? 'none' : '0.5px solid rgba(0,0,0,0.1)',
              cursor: 'pointer',
              userSelect: 'none',
              position: 'relative',
              maxWidth: '100%',
            }}
          >
            <div style={{ fontSize: 13, lineHeight: 1.45, paddingRight: 36, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {msg.text}
            </div>
            <div style={{
              fontSize: 10,
              color: '#999',
              textAlign: 'right',
              marginTop: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 3,
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
                    background: 'var(--surface, #fff)',
                    border: '0.5px solid rgba(0,0,0,0.12)',
                    borderRadius: 12,
                    padding: '1px 7px',
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
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

      {/* Context menu */}
      {ctx && (
        <ContextMenu
          x={ctx.x}
          y={ctx.y}
          isMe={isMe}
          onReact={(em) => onReact(msg.id, em)}
          onDelete={() => { onDelete(msg.id); closeMenu(); }}
          onClose={closeMenu}
        />
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function GroupChatPage() {
  const { currentUser, messages, fetchMessages, sendMessage, deleteMessage } = useApp();

  const [text,        setText]        = useState('');
  const [sending,     setSending]     = useState(false);
  const [error,       setError]       = useState('');
  // typingUsers: [{ id, name, role, avatar_initials, profile_photo_url }]
  const [typingUsers, setTypingUsers] = useState([]);
  // localReactions: { [msgId]: { [emoji]: string[] } }
  const [localReactions, setLocalReactions] = useState({});

  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const pollRef    = useRef(null);
  const typingRef  = useRef(null); // your own typing emit timer

  // ── Fetch on mount + poll ──────────────────────────────────
  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try { await fetchMessages(); } catch (_) {}
    }, 5000);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // ── Typing indicator ───────────────────────────────────────
  // Call your backend's typing endpoint if you have one.
  // If not, this is a placeholder — wire to your WebSocket/polling.
  const emitTyping = useCallback(() => {
    // Example: api.chat.sendTyping()
    // For now this is a no-op; replace with your real endpoint.
  }, []);

  const handleInputChange = (e) => {
    setText(e.target.value);
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
    // Emit typing
    emitTyping();
    clearTimeout(typingRef.current);
  };

  // ── Send ───────────────────────────────────────────────────
  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setError('');
    try {
      await sendMessage(trimmed);
      setText('');
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
        inputRef.current.focus();
      }
    } catch (err) {
      setError(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── Delete ─────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await deleteMessage(id);
    } catch (err) {
      setError(err.message || 'Failed to delete message.');
    }
  };

  // ── Reactions (local-first, wire to backend as needed) ─────
  const handleReact = (msgId, emoji) => {
    const userId = currentUser?.id;
    if (!userId) return;
    setLocalReactions(prev => {
      const msgReactions = { ...(prev[msgId] || {}) };
      const users = [...(msgReactions[emoji] || [])];
      const idx   = users.indexOf(userId);
      if (idx >= 0) users.splice(idx, 1);
      else           users.push(userId);
      if (users.length === 0) delete msgReactions[emoji];
      else msgReactions[emoji] = users;
      return { ...prev, [msgId]: msgReactions };
    });
    // TODO: call api.chat.reactMessage(msgId, emoji) when backend supports it
  };

  // Merge server messages with local reactions
  const mergedMessages = messages.map(m => ({
    ...m,
    reactions: {
      ...(m.reactions || {}),
      ...(localReactions[m.id] || {}),
    },
  }));

  // ── Group by date ──────────────────────────────────────────
  const grouped = mergedMessages.reduce((acc, m) => {
    const d = m.sent_at ? m.sent_at.split('T')[0] : 'today';
    if (!acc[d]) acc[d] = [];
    acc[d].push(m);
    return acc;
  }, {});

  const formatDate = (dateStr) => {
    if (dateStr === 'today') return 'Today';
    const d   = new Date(dateStr);
    const now = new Date();
    const yest = new Date(); yest.setDate(now.getDate() - 1);
    if (d.toDateString() === now.toDateString())   return 'Today';
    if (d.toDateString() === yest.toDateString())  return 'Yesterday';
    return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <>
      {/* Typing dot keyframe — injected once */}
      <style>{`
        @keyframes chatDot {
          0%, 60%, 100% { opacity: 0.3; }
          30%            { opacity: 1;   }
        }
      `}</style>

      <div className="chat-layout">

        {/* ── Header ── */}
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
                  ? `${typingUsers.map(u => u.name).join(', ')} ${typingUsers.length === 1 ? 'is' : 'are'} typing…`
                  : `${messages.length} messages · live`
                }
              </p>
            </div>
          </div>
        </div>

        {/* ── Error ── */}
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

          {/* Typing indicator at the bottom */}
          <TypingIndicator typingUsers={typingUsers} />

          <div ref={bottomRef} />
        </div>

        {/* ── Input bar ── */}
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
          Right-click or long-press a message to react or delete
        </div>

      </div>
    </>
  );
}
