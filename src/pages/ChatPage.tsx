import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { groupsApi } from '@/api/groups';
import { messagesApi } from '@/api/messages';
import { useGroupSocket } from '@/hooks/useSocket';
import type { Group, Message } from '@/types';

// ─── Logout Confirm Modal ─────────────────────────────────────────────────────

function LogoutModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 150ms ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '28px 24px',
          width: '100%',
          maxWidth: 360,
          margin: '0 16px',
          animation: 'slideUp 200ms cubic-bezier(0.4,0,0.2,1)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        }}
      >
        {/* Icon */}
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: 'rgba(255,110,180,0.1)',
          border: '1px solid rgba(255,110,180,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          marginBottom: 16,
        }}>
          ⏻
        </div>

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 20,
          color: 'var(--text-primary)',
          marginBottom: 8,
          letterSpacing: '-0.3px',
        }}>
          Sign out?
        </h2>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          color: 'var(--text-secondary)',
          marginBottom: 24,
          lineHeight: 1.6,
        }}>
          You'll need to sign in again to access your groups and messages.
        </p>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '10px',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all var(--transition)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--border-bright)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '10px',
              background: 'rgba(255,110,180,0.15)',
              border: '1px solid rgba(255,110,180,0.3)',
              borderRadius: 8,
              color: 'var(--accent-pink)',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all var(--transition)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,110,180,0.25)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,110,180,0.15)';
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ────────────────────────────────────────────────────────────────

function Sidebar({
  groups,
  activeGroupId,
  onSelect,
  onJoin,
  onLeave,
  onLogout,
  username,
  mobileOpen,
  onMobileClose,
}: {
  groups: Group[];
  activeGroupId: string | null;
  onSelect: (id: string) => void;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
  onLogout: () => void;
  username: string;
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const [joinInput, setJoinInput] = useState('');
  const [joining, setJoining] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // On mobile, sidebar is always "expanded" when open
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const isExpanded = isMobile ? true : sidebarOpen;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = joinInput.trim();
    if (!id) return;
    setJoining(true);
    try {
      await onJoin(id);
      setJoinInput('');
    } finally {
      setJoining(false);
    }
  };

  const handleSelectGroup = (id: string) => {
    onSelect(id);
    onMobileClose();
  };

  const sidebarContent = (
    <aside style={{
      width: isExpanded ? 260 : 64,
      minWidth: isExpanded ? 260 : 64,
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 250ms ease, min-width 250ms ease',
      overflow: 'hidden',
      height: '100%',
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 14px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
      }}>
        <div
          style={{
            width: 32,
            height: 32,
            flexShrink: 0,
            background: 'linear-gradient(135deg, var(--accent), var(--accent-pink))',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            cursor: 'pointer',
          }}
          onClick={() => {
            if (isMobile) onMobileClose();
            else setSidebarOpen(v => !v);
          }}
          title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          ◈
        </div>
        {isExpanded && (
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 16,
            letterSpacing: '-0.3px',
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
          }}>
            GroupChat
          </span>
        )}
      </div>

      {isExpanded && (
        <>
          {/* Join group form */}
          <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <p style={{
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              Join a Group
            </p>
            <form onSubmit={handleJoin} style={{ display: 'flex', gap: 6 }}>
              <input
                value={joinInput}
                onChange={e => setJoinInput(e.target.value)}
                placeholder="group-id"
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  outline: 'none',
                  minWidth: 0,
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
              />
              <button
                type="submit"
                disabled={joining || !joinInput.trim()}
                style={{
                  padding: '7px 10px',
                  background: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: joining ? 'not-allowed' : 'pointer',
                  fontSize: 13,
                  opacity: joining ? 0.7 : 1,
                  flexShrink: 0,
                }}
              >
                {joining ? '…' : '+'}
              </button>
            </form>
          </div>

          {/* Group list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
            <p style={{
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '4px 6px 8px',
            }}>
              My Groups ({groups.length})
            </p>

            {groups.length === 0 ? (
              <div style={{
                padding: '20px 8px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
              }}>
                No groups yet.<br />Join one above ↑
              </div>
            ) : (
              groups.map(g => (
                <GroupItem
                  key={g.id}
                  group={g}
                  active={g.id === activeGroupId}
                  onSelect={() => handleSelectGroup(g.id)}
                  onLeave={() => onLeave(g.id)}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* User info at bottom */}
      <div style={{
        padding: '12px 14px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
      }}>
        <div style={{
          width: 30,
          height: 30,
          flexShrink: 0,
          borderRadius: 8,
          background: 'var(--accent-dim)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: 'var(--text-accent)',
          fontWeight: 600,
        }}>
          {username.charAt(0).toUpperCase()}
        </div>
        {isExpanded && (
          <>
            <span style={{
              flex: 1,
              fontSize: 13,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {username}
            </span>
            <button
              onClick={() => setShowLogoutModal(true)}
              title="Logout"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontSize: 15,
                padding: 4,
                lineHeight: 1,
                flexShrink: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-pink)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              ⏻
            </button>
          </>
        )}
      </div>

      {showLogoutModal && (
        <LogoutModal
          onConfirm={() => { setShowLogoutModal(false); onLogout(); }}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
    </aside>
  );

  return sidebarContent;
}

function GroupItem({
  group,
  active,
  onSelect,
  onLeave,
}: {
  group: Group;
  active: boolean;
  onSelect: () => void;
  onLeave: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 8px',
        borderRadius: 8,
        cursor: 'pointer',
        background: active ? 'var(--accent-glow)' : hovered ? 'var(--bg-hover)' : 'transparent',
        border: active ? '1px solid rgba(124,106,247,0.2)' : '1px solid transparent',
        transition: 'all var(--transition)',
        marginBottom: 2,
      }}
    >
      <div style={{
        width: 30,
        height: 30,
        flexShrink: 0,
        borderRadius: 8,
        background: active ? 'var(--accent)' : 'var(--bg-elevated)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        transition: 'background var(--transition)',
      }}>
        #
      </div>
      <span style={{
        flex: 1,
        fontSize: 13,
        fontFamily: 'var(--font-mono)',
        color: active ? 'var(--text-accent)' : 'var(--text-secondary)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {group.id}
      </span>
      {hovered && !active && (
        <button
          onClick={e => { e.stopPropagation(); onLeave(); }}
          title="Leave group"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontSize: 14,
            padding: '2px 4px',
            lineHeight: 1,
            flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-pink)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          ×
        </button>
      )}
    </div>
  );
}

// ─── Mobile Top Bar ───────────────────────────────────────────────────────────

function MobileTopBar({
  groupId,
  onMenuOpen,
}: {
  groupId: string | null;
  onMenuOpen: () => void;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 16px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-surface)',
      flexShrink: 0,
    }}>
      <button
        onClick={onMenuOpen}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          fontSize: 20,
          padding: 4,
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        ☰
      </button>
      <div style={{
        width: 28,
        height: 28,
        background: 'linear-gradient(135deg, var(--accent), var(--accent-pink))',
        borderRadius: 7,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        flexShrink: 0,
      }}>
        ◈
      </div>
      <span style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        fontSize: 16,
        color: 'var(--text-primary)',
        flex: 1,
        letterSpacing: '-0.3px',
      }}>
        {groupId ? `#${groupId}` : 'GroupChat'}
      </span>
    </div>
  );
}

// ─── Chat area ───────────────────────────────────────────────────────────────

function ChatArea({
  groupId,
  username,
}: {
  groupId: string;
  username: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [loadingMore, setLoadingMore] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async (cursor?: string) => {
    try {
      const data = await messagesApi.getMessages(groupId, cursor, 30);
      if (cursor) {
        setMessages(prev => [...data.messages.slice().reverse(), ...prev]);
      } else {
        setMessages(data.messages.slice().reverse());
        setNextCursor(data.nextCursor);
        setTimeout(() => bottomRef.current?.scrollIntoView(), 50);
      }
      setNextCursor(data.nextCursor);
    } catch {
      // silently fail
    }
  }, [groupId]);

  useEffect(() => {
    setMessages([]);
    setNextCursor(undefined);
    loadMessages();
  }, [loadMessages]);

  useGroupSocket(groupId, (msg) => {
    const newMsg = msg as Message;
    setMessages(prev => {
      if (prev.find(m => m.id === newMsg.id)) return prev;
      return [...prev, newMsg];
    });
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;
    if (content.length > 255) { setError('Message too long (max 255 chars)'); return; }
    setError('');
    setSending(true);
    try {
      await messagesApi.send(groupId, content);
      setInput('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await messagesApi.getMessages(groupId, nextCursor, 30);
      setMessages(prev => [...data.messages.slice().reverse(), ...prev]);
      setNextCursor(data.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* Channel header - hidden on mobile (handled by MobileTopBar) */}
      <div className="desktop-header" style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
        background: 'var(--bg-surface)',
      }}>
        <span style={{ color: 'var(--text-accent)', fontSize: 18 }}>#</span>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 16,
          color: 'var(--text-primary)',
        }}>
          {groupId}
        </span>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}>
        {nextCursor && (
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '6px 16px',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                cursor: loadingMore ? 'not-allowed' : 'pointer',
              }}
            >
              {loadingMore ? 'Loading…' : '↑ Load older messages'}
            </button>
          </div>
        )}

        {messages.length === 0 && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            gap: 8,
          }}>
            <span style={{ fontSize: 32 }}>◈</span>
            <span>No messages yet. Say hello!</span>
          </div>
        )}

        {messages.map((msg, i) => {
          const isSelf = msg.sender.username === username;
          const prevMsg = messages[i - 1];
          const isSameSender = prevMsg && prevMsg.sender.id === msg.sender.id &&
            (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime()) < 60000;

          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isSelf={isSelf}
              isSameSender={!!isSameSender}
            />
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '10px 12px 12px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-surface)',
        flexShrink: 0,
      }}>
        {error && (
          <div style={{
            marginBottom: 8,
            padding: '6px 12px',
            background: 'rgba(255,110,180,0.08)',
            border: '1px solid rgba(255,110,180,0.2)',
            borderRadius: 6,
            fontSize: 12,
            color: 'var(--accent-pink)',
            fontFamily: 'var(--font-mono)',
          }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSend} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message #${groupId}…`}
              rows={1}
              disabled={sending}
              style={{
                width: '100%',
                padding: '10px 48px 10px 14px',
                background: 'var(--bg-base)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                resize: 'none',
                outline: 'none',
                transition: 'border-color var(--transition)',
                lineHeight: 1.5,
                maxHeight: 120,
                overflowY: 'auto',
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
              onInput={e => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 120) + 'px';
              }}
            />
            <span style={{
              position: 'absolute',
              right: 10,
              bottom: 8,
              fontSize: 10,
              color: input.length > 220 ? 'var(--accent-pink)' : 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              pointerEvents: 'none',
            }}>
              {input.length}/255
            </span>
          </div>
          <button
            type="submit"
            disabled={sending || !input.trim()}
            style={{
              width: 40,
              height: 40,
              flexShrink: 0,
              background: input.trim() ? 'var(--accent)' : 'var(--bg-elevated)',
              color: input.trim() ? '#fff' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 10,
              cursor: sending || !input.trim() ? 'not-allowed' : 'pointer',
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all var(--transition)',
            }}
          >
            {sending ? '…' : '↑'}
          </button>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  isSelf,
  isSameSender,
}: {
  message: Message;
  isSelf: boolean;
  isSameSender: boolean;
}) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className="animate-fadeUp"
      style={{
        display: 'flex',
        flexDirection: isSelf ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: 8,
        marginTop: isSameSender ? 2 : 12,
      }}
    >
      {!isSameSender ? (
        <div style={{
          width: 28,
          height: 28,
          flexShrink: 0,
          borderRadius: 8,
          background: isSelf ? 'var(--accent-dim)' : 'var(--bg-elevated)',
          border: isSelf ? '1px solid var(--accent)' : '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: isSelf ? 'var(--text-accent)' : 'var(--text-secondary)',
          fontWeight: 600,
          alignSelf: 'flex-start',
        }}>
          {message.sender.username.charAt(0).toUpperCase()}
        </div>
      ) : (
        <div style={{ width: 28, flexShrink: 0 }} />
      )}

      <div style={{ maxWidth: '75%' }}>
        {!isSameSender && (
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            marginBottom: 4,
            flexDirection: isSelf ? 'row-reverse' : 'row',
          }}>
            <span style={{
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              fontWeight: 500,
              color: isSelf ? 'var(--text-accent)' : 'var(--text-secondary)',
            }}>
              {isSelf ? 'you' : message.sender.username}
            </span>
            <span style={{
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
            }}>
              {time}
            </span>
          </div>
        )}

        <div style={{
          padding: '8px 12px',
          borderRadius: isSelf ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
          background: isSelf
            ? 'linear-gradient(135deg, var(--accent), #9b8cf7)'
            : 'var(--bg-elevated)',
          border: isSelf ? 'none' : '1px solid var(--border)',
          color: isSelf ? '#fff' : 'var(--text-primary)',
          fontSize: 14,
          fontFamily: 'var(--font-mono)',
          lineHeight: 1.5,
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
        }}>
          {message.content}
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      color: 'var(--text-muted)',
      fontFamily: 'var(--font-mono)',
      padding: 24,
    }}>
      <div style={{
        width: 72,
        height: 72,
        borderRadius: 20,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 32,
        color: 'var(--accent)',
      }}>
        ◈
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontSize: 16,
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: 8,
        }}>
          Select a group to start chatting
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
          Or join a group using the sidebar
        </p>
        {/* Mobile shortcut */}
        <button
          onClick={onOpenSidebar}
          className="mobile-only"
          style={{
            padding: '10px 20px',
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Open Groups →
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const { username, logout } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    groupsApi.getMyGroups().then(setGroups).catch(() => {});
  }, []);

  // Close mobile sidebar on resize to desktop
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 640) setMobileSidebarOpen(false);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const handleJoin = async (id: string) => {
    try {
      await groupsApi.join(id);
      const updated = await groupsApi.getMyGroups();
      setGroups(updated);
      setActiveGroupId(id);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to join group');
    }
  };

  const handleLeave = async (id: string) => {
    try {
      await groupsApi.leave(id);
      setGroups(prev => prev.filter(g => g.id !== id));
      if (activeGroupId === id) setActiveGroupId(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to leave group');
    }
  };

  const handleLogout = async () => {
    try { await logout(); } catch { /* ignore */ }
  };

  return (
    <>
      <style>{`
        @media (max-width: 639px) {
          .desktop-header { display: none !important; }
          .desktop-sidebar { display: none !important; }
          .mobile-topbar { display: flex !important; }
        }
        @media (min-width: 640px) {
          .mobile-topbar { display: none !important; }
          .mobile-sidebar-overlay { display: none !important; }
          .mobile-only { display: none !important; }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{
        display: 'flex',
        height: '100dvh',
        background: 'var(--bg-base)',
        overflow: 'hidden',
        flexDirection: 'column',
      }}>
        {/* Mobile top bar */}
        <div className="mobile-topbar" style={{ display: 'none' }}>
          <MobileTopBar
            groupId={activeGroupId}
            onMenuOpen={() => setMobileSidebarOpen(true)}
          />
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Desktop sidebar */}
          <div className="desktop-sidebar">
            <Sidebar
              groups={groups}
              activeGroupId={activeGroupId}
              onSelect={setActiveGroupId}
              onJoin={handleJoin}
              onLeave={handleLeave}
              onLogout={handleLogout}
              username={username ?? '?'}
              mobileOpen={false}
              onMobileClose={() => {}}
            />
          </div>

          {/* Mobile sidebar overlay */}
          {mobileSidebarOpen && (
            <div
              className="mobile-sidebar-overlay"
              onClick={() => setMobileSidebarOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 200,
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(2px)',
                animation: 'fadeIn 150ms ease',
              }}
            >
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  width: 280,
                  height: '100%',
                  animation: 'slideInLeft 220ms cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                <Sidebar
                  groups={groups}
                  activeGroupId={activeGroupId}
                  onSelect={setActiveGroupId}
                  onJoin={handleJoin}
                  onLeave={handleLeave}
                  onLogout={handleLogout}
                  username={username ?? '?'}
                  mobileOpen={mobileSidebarOpen}
                  onMobileClose={() => setMobileSidebarOpen(false)}
                />
              </div>
            </div>
          )}

          {/* Main area */}
          <main style={{
            flex: 1,
            display: 'flex',
            overflow: 'hidden',
            minWidth: 0,
          }}>
            {activeGroupId ? (
              <ChatArea key={activeGroupId} groupId={activeGroupId} username={username ?? ''} />
            ) : (
              <EmptyState onOpenSidebar={() => setMobileSidebarOpen(true)} />
            )}
          </main>
        </div>
      </div>
    </>
  );
}