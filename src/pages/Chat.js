import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import './Chat.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// ─── Settings Defaults ────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  answerLength: 'medium',
  language: 'english',
  tone: 'professional',
  style: 'explanatory',
  customInstructions: '',
};

// ─── Helper: type icon ────────────────────────────────────────────────────────
const TypeIcon = ({ type }) => {
  if (type === 'pdf') return <span className="res-type-icon pdf">PDF</span>;
  if (type === 'docx') return <span className="res-type-icon docx">DOC</span>;
  return <span className="res-type-icon txt">TXT</span>;
};

// ─── Settings Panel ────────────────────────────────────────────────────────────
const SettingsPanel = ({ settings, onChange }) => {
  const answerLengths = [
    { value: 'short',  label: 'Short',   desc: '1–3 sentences' },
    { value: 'medium', label: 'Medium',  desc: 'Balanced detail' },
    { value: 'long',   label: 'Detailed',desc: 'Full coverage' },
    { value: 'bullet', label: 'Bullets', desc: 'Bullet points' },
  ];

  const tones = [
    { value: 'simple',       label: '🎓 Simple',      desc: 'Easy to understand' },
    { value: 'professional', label: '💼 Professional', desc: 'Formal tone' },
    { value: 'friendly',     label: '😊 Friendly',    desc: 'Encouraging' },
    { value: 'academic',     label: '📚 Academic',    desc: 'Scholarly' },
  ];

  const styles = [
    { value: 'explanatory', label: '🔍 Explanatory', desc: 'Thorough reasoning' },
    { value: 'concise',     label: '⚡ Concise',     desc: 'Direct & brief' },
    { value: 'socratic',    label: '❓ Socratic',    desc: 'Guiding questions' },
    { value: 'stepbystep',  label: '📋 Step-by-Step', desc: 'Numbered steps' },
  ];

  const languages = ['english', 'hindi', 'spanish', 'french', 'german', 'chinese', 'arabic', 'japanese'];

  return (
    <div className="settings-panel">
      {/* Answer Length */}
      <div className="setting-group">
        <label className="setting-label">
          <span className="setting-icon">📏</span>
          Answer Length
        </label>
        <div className="chip-grid">
          {answerLengths.map(opt => (
            <button
              key={opt.value}
              className={`chip ${settings.answerLength === opt.value ? 'chip-active' : ''}`}
              onClick={() => onChange('answerLength', opt.value)}
              title={opt.desc}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tone */}
      <div className="setting-group">
        <label className="setting-label">
          <span className="setting-icon">🎭</span>
          Tone
        </label>
        <div className="chip-grid tone-grid">
          {tones.map(opt => (
            <button
              key={opt.value}
              className={`chip ${settings.tone === opt.value ? 'chip-active' : ''}`}
              onClick={() => onChange('tone', opt.value)}
              title={opt.desc}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Style */}
      <div className="setting-group">
        <label className="setting-label">
          <span className="setting-icon">✍️</span>
          Answer Style
        </label>
        <div className="chip-grid tone-grid">
          {styles.map(opt => (
            <button
              key={opt.value}
              className={`chip ${settings.style === opt.value ? 'chip-active' : ''}`}
              onClick={() => onChange('style', opt.value)}
              title={opt.desc}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="setting-group">
        <label className="setting-label">
          <span className="setting-icon">🌍</span>
          Response Language
        </label>
        <select
          className="setting-select"
          value={settings.language}
          onChange={e => onChange('language', e.target.value)}
        >
          {languages.map(lang => (
            <option key={lang} value={lang}>
              {lang.charAt(0).toUpperCase() + lang.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Custom Instructions */}
      <div className="setting-group">
        <label className="setting-label">
          <span className="setting-icon">📝</span>
          Custom Instructions
        </label>
        <textarea
          className="setting-textarea"
          placeholder="e.g. Always cite the chapter number. Avoid using jargon."
          value={settings.customInstructions}
          onChange={e => onChange('customInstructions', e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
};

// ─── Resource Selector ────────────────────────────────────────────────────────
const ResourceSelector = ({ subjects, selectedIds, onToggle }) => {
  const [openSubject, setOpenSubject] = useState(null);
  const totalSelected = selectedIds.size;

  useEffect(() => {
    // Auto-open first subject that has a selected resource
    if (subjects.length > 0) {
      for (const sub of subjects) {
        if (sub.resources?.some(r => selectedIds.has(r._id))) {
          setOpenSubject(sub._id);
          return;
        }
      }
      setOpenSubject(subjects[0]._id);
    }
  }, []); // eslint-disable-line

  return (
    <div className="resource-selector">
      <div className="selector-header">
        <h3>📂 Study Resources</h3>
        {totalSelected > 0 && (
          <span className="selected-badge">{totalSelected} selected</span>
        )}
      </div>

      {subjects.length === 0 && (
        <p className="no-resources-msg">No subjects found. Upload resources first.</p>
      )}

      <div className="subjects-accordion">
        {subjects.map(sub => {
          const subSelected = sub.resources?.filter(r => selectedIds.has(r._id)).length || 0;
          const isOpen = openSubject === sub._id;

          return (
            <div key={sub._id} className={`subject-item ${isOpen ? 'open' : ''}`}>
              <button
                className="subject-toggle"
                onClick={() => setOpenSubject(isOpen ? null : sub._id)}
              >
                <span className="subject-name">
                  <span className="subject-emoji">🗂</span>
                  {sub.name}
                </span>
                <span className="subject-meta">
                  {subSelected > 0 && <span className="sub-selected-count">{subSelected}</span>}
                  <span className={`chevron ${isOpen ? 'up' : ''}`}>›</span>
                </span>
              </button>

              {isOpen && (
                <div className="subject-resources">
                  {(!sub.resources || sub.resources.length === 0) ? (
                    <p className="empty-subject">No resources in this subject.</p>
                  ) : (
                    sub.resources.map(res => {
                      const checked = selectedIds.has(res._id);
                      const notReady = !res.embeddingCreated;
                      return (
                        <label
                          key={res._id}
                          className={`res-checkbox-row ${checked ? 'checked' : ''} ${notReady ? 'not-ready' : ''}`}
                          title={notReady ? 'Still processing embeddings...' : res.name}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={notReady}
                            onChange={() => !notReady && onToggle(res._id)}
                          />
                          <div className="res-tick-box">{checked ? '✓' : ''}</div>
                          <TypeIcon type={res.type} />
                          <span className="res-name">{res.name}</span>
                          {notReady && <span className="processing-dot" title="Processing...">⏳</span>}
                        </label>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Message Bubble ────────────────────────────────────────────────────────────
const MessageBubble = ({ msg }) => {
  const isUser = msg.role === 'user';
  const isError = msg.role === 'error';

  // Simple markdown-like: **bold**, bullet lines
  const formatContent = (content) => {
    return content.split('\n').map((line, i) => {
      // Bold
      const parts = line.split(/\*\*(.*?)\*\*/g);
      const formatted = parts.map((part, j) =>
        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
      );
      // Bullet
      if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().match(/^\d+\./)) {
        return <li key={i} className="msg-list-item">{formatted}</li>;
      }
      return <p key={i} className="msg-para">{formatted}</p>;
    });
  };

  return (
    <div className={`message-bubble ${isUser ? 'user-bubble' : isError ? 'error-bubble' : 'ai-bubble'}`}>
      {!isUser && (
        <div className="bubble-avatar">
          {isError ? '⚠️' : '🤖'}
        </div>
      )}
      <div className="bubble-body">
        <div className="bubble-content">{formatContent(msg.content)}</div>
        {msg.timestamp && (
          <span className="bubble-time">
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
      {isUser && <div className="bubble-avatar user-avatar">👤</div>}
    </div>
  );
};

// ─── Typing Indicator ─────────────────────────────────────────────────────────
const TypingIndicator = () => (
  <div className="message-bubble ai-bubble typing-bubble">
    <div className="bubble-avatar">🤖</div>
    <div className="bubble-body">
      <div className="typing-dots">
        <span /><span /><span />
      </div>
    </div>
  </div>
);

// ─── Main Chat Page ────────────────────────────────────────────────────────────
const Chat = () => {
  const [searchParams] = useSearchParams();
  const preloadedResourceId = searchParams.get('resource');

  const [subjects, setSubjects] = useState([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activePanel, setActivePanel] = useState('resources'); // 'resources' | 'settings'
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch all subjects + resources
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const res = await fetch(`${API}/chat/resources`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        if (res.ok) {
          setSubjects(data);
          // Pre-select resource from URL param
          if (preloadedResourceId) {
            setSelectedIds(new Set([preloadedResourceId]));
          }
        }
      } catch (e) {
        console.error('Failed to fetch resources', e);
      } finally {
        setLoadingResources(false);
      }
    };
    fetchResources();
  }, [preloadedResourceId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const toggleResource = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSettingChange = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSend = async () => {
    const content = inputValue.trim();
    if (!content || isLoading) return;

    if (selectedIds.size === 0) {
      setMessages(prev => [...prev, {
        role: 'error',
        content: '⚠️ Please select at least one resource from the sidebar before chatting.',
        timestamp: Date.now()
      }]);
      return;
    }

    const userMsg = { role: 'user', content, timestamp: Date.now() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          resourceIds: Array.from(selectedIds),
          messages: updatedMessages.filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({
            role: m.role,
            content: m.content
          })),
          settings
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.reply,
          timestamp: Date.now(),
          chunksFound: data.chunksFound
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'error',
          content: `⚠️ ${data.message || 'Something went wrong. Please try again.'}`,
          timestamp: Date.now()
        }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'error',
        content: '⚠️ Network error. Please check your connection and try again.',
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    if (messages.length === 0) return;
    if (window.confirm('Clear all messages?')) setMessages([]);
  };

  // Get list of selected resource names for the header
  const selectedResourceNames = subjects.flatMap(s => s.resources || [])
    .filter(r => selectedIds.has(r._id))
    .map(r => r.name);

  return (
    <div className="chat-page">
      {/* ── Sidebar ── */}
      <aside className={`chat-sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-top">
          <div className="sidebar-tabs">
            <button
              className={`sidebar-tab ${activePanel === 'resources' ? 'active' : ''}`}
              onClick={() => setActivePanel('resources')}
            >
              📂 Resources
            </button>
            <button
              className={`sidebar-tab ${activePanel === 'settings' ? 'active' : ''}`}
              onClick={() => setActivePanel('settings')}
            >
              ⚙️ Settings
            </button>
          </div>
        </div>

        <div className="sidebar-body">
          {activePanel === 'resources' ? (
            loadingResources ? (
              <div className="sidebar-loading">
                <div className="spinner" />
                <p>Loading resources…</p>
              </div>
            ) : (
              <ResourceSelector
                subjects={subjects}
                selectedIds={selectedIds}
                onToggle={toggleResource}
              />
            )
          ) : (
            <SettingsPanel settings={settings} onChange={handleSettingChange} />
          )}
        </div>
      </aside>

      {/* ── Sidebar Toggle (outside sidebar so overflow:hidden can't clip it) ── */}
      <button
        className={`sidebar-collapse-btn ${sidebarOpen ? '' : 'is-collapsed'}`}
        onClick={() => setSidebarOpen(prev => !prev)}
        title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {sidebarOpen ? '◀' : '▶'}
      </button>

      {/* ── Main Chat Area ── */}
      <main className="chat-main">
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-left">
            <Link to="/subjects" className="chat-back-link">← Subjects</Link>
            <div className="header-divider" />
            <div className="chat-title-block">
              <h1 className="chat-title">AI Study Chat</h1>
              {selectedResourceNames.length > 0 ? (
                <div className="active-resources-strip">
                  {selectedResourceNames.slice(0, 3).map((name, i) => (
                    <span key={i} className="active-res-chip">{name}</span>
                  ))}
                  {selectedResourceNames.length > 3 && (
                    <span className="active-res-chip more-chip">+{selectedResourceNames.length - 3} more</span>
                  )}
                </div>
              ) : (
                <p className="no-res-hint">← Select resources from the sidebar to get started</p>
              )}
            </div>
          </div>
          <div className="chat-header-actions">
            <div className="settings-summary">
              <span className="settings-pill">{settings.answerLength}</span>
              <span className="settings-pill">{settings.tone}</span>
              <span className="settings-pill">{settings.style}</span>
            </div>
            <button className="clear-btn" onClick={clearChat} title="Clear conversation" disabled={messages.length === 0}>
              🗑 Clear
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-welcome">
              <div className="welcome-icon">🤖</div>
              <h2>Ready to Study?</h2>
              <p>Select your resources from the sidebar, configure your preferences, and start asking questions!</p>
              <div className="welcome-suggestions">
                <p className="suggestions-label">Try asking:</p>
                <div className="suggestion-chips">
                  {[
                    "Summarize the key concepts",
                    "Explain this topic in simple terms",
                    "What are the main points?",
                    "Create a quick outline"
                  ].map((s, i) => (
                    <button
                      key={i}
                      className="suggestion-chip"
                      onClick={() => { setInputValue(s); inputRef.current?.focus(); }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} />
          ))}

          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="chat-input-area">
          <div className="input-wrapper">
            <textarea
              ref={inputRef}
              className="chat-textarea"
              placeholder={
                selectedIds.size === 0
                  ? "Select resources first, then ask your question..."
                  : "Ask anything about your selected resources... (Enter to send, Shift+Enter for new line)"
              }
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              disabled={isLoading}
            />
            <div className="input-footer">
              <span className="input-hint">
                {selectedIds.size === 0
                  ? '⚠️ No resources selected'
                  : `📎 ${selectedIds.size} resource${selectedIds.size > 1 ? 's' : ''} selected`}
              </span>
              <button
                className={`send-btn ${inputValue.trim() && !isLoading ? 'active' : ''}`}
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
              >
                {isLoading ? (
                  <span className="send-spinner" />
                ) : (
                  <>Send <span className="send-arrow">→</span></>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chat;
