import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './QnaSet.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

/* ── Tiny helpers ─────────────────────────────────────────────────────────── */
const TypeIcon = ({ type }) => {
  const map = { pdf: 'PDF', docx: 'DOC', txt: 'TXT' };
  return <span className={`qna-type-badge ${type}`}>{map[type] || type.toUpperCase()}</span>;
};

/* ── Settings chips panel (reused from Chat aesthetic) ────────────────────── */
const SettingsChips = ({ settings, onChange }) => {
  const sizes   = [
    { v:'short',    label:'Short',     hint:'~50 words'  },
    { v:'medium',   label:'Medium',    hint:'~150 words' },
    { v:'long',     label:'Long',      hint:'~300 words' },
    { v:'detailed', label:'Detailed',  hint:'~500+ words' },
  ];
  const styles  = [{ v:'explanatory',label:'🔍 Explanatory' },{ v:'concise',label:'⚡ Concise' },{ v:'socratic',label:'❓ Socratic' },{ v:'stepbystep',label:'📋 Step-by-Step' },{ v:'bullet',label:'• Bullet' }];
  const tones   = [{ v:'simple',label:'🎓 Simple' },{ v:'professional',label:'💼 Professional' },{ v:'friendly',label:'😊 Friendly' },{ v:'academic',label:'📚 Academic' }];

  return (
    <div className="qna-settings-panel">
      {/* Size */}
      <div className="qna-setting-row">
        <span className="qna-setting-label">📏 Size</span>
        <div className="qna-chips">
          {sizes.map(({ v, label, hint }) => (
            <button
              type="button"
              key={v}
              className={`qna-chip${settings.size === v ? ' active' : ''}`}
              onClick={() => onChange('size', v)}
              title={hint}
            >
              {label}
              <span className="qna-chip-hint">{hint}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Style */}
      <div className="qna-setting-row">
        <span className="qna-setting-label">✍️ Style</span>
        <div className="qna-chips">
          {styles.map(({ v, label: l }) => (
            <button type="button" key={v} className={`qna-chip${settings.style === v ? ' active' : ''}`} onClick={() => onChange('style', v)}>{l}</button>
          ))}
        </div>
      </div>

      {/* Tone */}
      <div className="qna-setting-row">
        <span className="qna-setting-label">🎭 Tone</span>
        <div className="qna-chips">
          {tones.map(({ v, label: l }) => (
            <button type="button" key={v} className={`qna-chip${settings.tone === v ? ' active' : ''}`} onClick={() => onChange('tone', v)}>{l}</button>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── Resource picker accordion (mirrors Chat sidebar) ─────────────────────── */
const ResourcePicker = ({ subjects, selectedIds, onToggle }) => {
  const [openSub, setOpenSub] = useState(subjects[0]?._id || null);
  return (
    <div className="qna-resource-picker">
      {subjects.map(sub => {
        const count = (sub.resources || []).filter(r => selectedIds.has(r._id)).length;
        const open  = openSub === sub._id;
        return (
          <div key={sub._id} className={`qna-sub-block${open ? ' open' : ''}`}>
            <button type="button" className="qna-sub-toggle" onClick={() => setOpenSub(open ? null : sub._id)}>
              <span>🗂 {sub.name}</span>
              <span className="qna-sub-meta">
                {count > 0 && <span className="qna-badge">{count}</span>}
                <span className={`qna-chevron${open ? ' up' : ''}`}>›</span>
              </span>
            </button>
            {open && (
              <div className="qna-res-list">
                {(!sub.resources || sub.resources.length === 0) && <p className="qna-empty">No resources.</p>}
                {(sub.resources || []).map(res => {
                  const checked   = selectedIds.has(res._id);
                  const notReady  = !res.embeddingCreated;
                  return (
                    <label key={res._id} className={`qna-res-row${checked ? ' checked' : ''}${notReady ? ' dimmed' : ''}`}>
                      <input type="checkbox" checked={checked} disabled={notReady} onChange={() => !notReady && onToggle(res._id)} />
                      <span className={`qna-tick${checked ? ' on' : ''}`}>{checked ? '✓' : ''}</span>
                      <TypeIcon type={res.type} />
                      <span className="qna-res-name">{res.name}</span>
                      {notReady && <span title="Processing…">⏳</span>}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ── Markdown-aware answer formatter ──────────────────────────────────────── */

// Parse GFM alignment from separator cell (e.g. ":---:", "---:", ":---", "---")
const parseCellAlign = (cell) => {
  const c = cell.trim();
  if (c.startsWith(':') && c.endsWith(':')) return 'center';
  if (c.endsWith(':'))                       return 'right';
  if (c.startsWith(':'))                     return 'left';
  return 'left';
};

// Detect if a line is a table separator row (|---|---|)
const isTableSep = (line) => /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?$/.test(line.trim());

// Split a table row into cells (handles leading/trailing |)
const splitRow = (line) =>
  line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());

const FormatAnswer = ({ text }) => {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trim();

    // ── Fenced code block ```...``` ──────────────────────────────────────────
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <div key={i} className="qna-fmt-code-block">
          {lang && <span className="qna-fmt-code-lang">{lang}</span>}
          <pre><code>{codeLines.join('\n')}</code></pre>
        </div>
      );
      i++;
      continue;
    }

    // ── Heading # / ## / ### ────────────────────────────────────────────────
    if (/^#{1,3} /.test(trimmed)) {
      const level = trimmed.match(/^(#{1,3}) /)[1].length;
      const content = trimmed.replace(/^#{1,3} /, '');
      const Tag = `h${level + 2}`; // h3, h4, h5
      elements.push(<Tag key={i} className={`qna-fmt-h${level}`}>{inlineFormat(content)}</Tag>);
      i++;
      continue;
    }

    // ── Horizontal rule ──────────────────────────────────────────────────────
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      elements.push(<hr key={i} className="qna-fmt-hr" />);
      i++;
      continue;
    }

    // ── Bullet list item - / * / • ───────────────────────────────────────────
    if (/^[-*•] /.test(trimmed)) {
      const bullets = [];
      while (i < lines.length && /^[-*•] /.test(lines[i].trim())) {
        bullets.push(lines[i].trim().replace(/^[-*•] /, ''));
        i++;
      }
      elements.push(
        <ul key={i} className="qna-fmt-ul">
          {bullets.map((b, j) => <li key={j}>{inlineFormat(b)}</li>)}
        </ul>
      );
      continue;
    }

    // ── Numbered list item ───────────────────────────────────────────────────
    if (/^\d+[.)\s]/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^\d+[.)\s]/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+[.)\s]+/, ''));
        i++;
      }
      elements.push(
        <ol key={i} className="qna-fmt-ol">
          {items.map((b, j) => <li key={j}>{inlineFormat(b)}</li>)}
        </ol>
      );
      continue;
    }

    // ── Markdown table | col | col | ─────────────────────────────────────────
    if (trimmed.startsWith('|') || (trimmed.includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1]))) {
      // Collect all consecutive lines that look like table rows or separators
      const tableLines = [];
      while (i < lines.length && (lines[i].trim().startsWith('|') || (lines[i].includes('|') && (isTableSep(lines[i]) || tableLines.length > 0)))) {
        if (!lines[i].trim()) break;
        tableLines.push(lines[i].trim());
        i++;
      }

      // Need at least header + separator
      if (tableLines.length >= 2 && isTableSep(tableLines[1])) {
        const headers   = splitRow(tableLines[0]);
        const aligns    = splitRow(tableLines[1]).map(parseCellAlign);
        const bodyRows  = tableLines.slice(2).map(splitRow);

        elements.push(
          <div key={i} className="qna-fmt-table-wrap">
            <table className="qna-fmt-table">
              <thead>
                <tr>
                  {headers.map((h, j) => (
                    <th key={j} style={{ textAlign: aligns[j] || 'left' }}>
                      {inlineFormat(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} style={{ textAlign: aligns[ci] || 'left' }}>
                        {inlineFormat(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }

      // Fallback: couldn't parse as table → render lines as paragraphs
      tableLines.forEach((l, li) => {
        elements.push(<p key={`${i}-${li}`} className="qna-fmt-p">{inlineFormat(l)}</p>);
      });
      continue;
    }

    // ── Blockquote > ─────────────────────────────────────────────────────────
    if (trimmed.startsWith('> ')) {
      const qlines = [];
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        qlines.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <blockquote key={i} className="qna-fmt-blockquote">
          {qlines.map((l, j) => <p key={j}>{inlineFormat(l)}</p>)}
        </blockquote>
      );
      continue;
    }

    // ── Blank line → spacer ──────────────────────────────────────────────────
    if (!trimmed) {
      elements.push(<div key={i} className="qna-fmt-spacer" />);
      i++;
      continue;
    }

    // ── Normal paragraph ─────────────────────────────────────────────────────
    elements.push(<p key={i} className="qna-fmt-p">{inlineFormat(trimmed)}</p>);
    i++;
  }

  return <div className="qna-fmt-body">{elements}</div>;
};

// Inline: **bold**, *italic*, `code`, ~~strikethrough~~
const inlineFormat = (text) => {
  const parts = [];
  // Combined regex for inline tokens
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|~~(.+?)~~)/g;
  let last = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    if (match[2]) {
      // **bold**
      parts.push(<strong key={key++}>{match[2]}</strong>);
    } else if (match[3]) {
      // *italic*
      parts.push(<em key={key++}>{match[3]}</em>);
    } else if (match[4]) {
      // `code`
      parts.push(<code key={key++} className="qna-fmt-inline-code">{match[4]}</code>);
    } else if (match[5]) {
      // ~~strikethrough~~
      parts.push(<s key={key++}>{match[5]}</s>);
    }
    last = regex.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : text;
};

/* ── Question item card ────────────────────────────────────────────────────── */
const QuestionCard = ({ item, idx, setId, defaultSettings, onUpdated, onDelete }) => {
  const { fetchUser } = useAuth();
  const [loading, setLoading]       = useState(null); // 'answer'|null
  const [expanded, setExpanded]     = useState(false);
  const [localSettings, setLS]      = useState(null); // null = use default
  const [showSettings, setShowSett] = useState(false);

  const effectiveSettings = localSettings || defaultSettings;

  const act = async (endpoint, body = {}) => {
    const res = await fetch(`${API}/qna/${setId}/questions/${item._id}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth() },
      body: JSON.stringify({ settings: effectiveSettings, ...body }),
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Error');
    return res.json();
  };

  const handleAnswer = async () => {
    setLoading('answer');
    try {
      const data = await act('answer');
      onUpdated(data.item);
      setExpanded(true);
      if (fetchUser) fetchUser();
    } catch (e) { alert(e.message); }
    finally { setLoading(null); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this question?')) return;
    await fetch(`${API}/qna/${setId}/questions/${item._id}`, {
      method: 'DELETE', headers: auth()
    });
    onDelete(item._id);
  };

  const changeSetting = (k, v) => {
    setLS(prev => ({ ...(prev || effectiveSettings), [k]: v }));
  };

  return (
    <div className={`qna-card${item.isAnswered ? ' answered' : ''}${loading ? ' qna-card-loading' : ''}`}>
      {/* Answering overlay */}
      {loading === 'answer' && (
        <div className="qna-card-overlay">
          <span className="qna-spin large" />
          <p className="qna-overlay-label">Generating answer…</p>
        </div>
      )}

      {/* Header row */}
      <div className="qna-card-header">
        <span className="qna-q-num">Q{idx + 1}</span>
        <p className="qna-q-text">{item.question}</p>
        <div className="qna-card-actions">
          {item.isAnswered && <span className="qna-done-badge">✓ Answered</span>}
          <button type="button" className="qna-icon-btn" title="Settings" onClick={() => setShowSett(p => !p)}>⚙️</button>
          <button type="button" className="qna-icon-btn danger" title="Delete" onClick={handleDelete}>🗑</button>
        </div>
      </div>

      {/* Per-question settings override */}
      {showSettings && (
        <div className="qna-inline-settings">
          <p className="qna-inline-settings-label">Override settings for this question</p>
          <SettingsChips settings={effectiveSettings} onChange={changeSetting} />
          {localSettings && (
            <button type="button" className="qna-link-btn" onClick={() => setLS(null)}>↩ Reset to set defaults</button>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="qna-card-btns">
        <button
          type="button"
          className="qna-action-btn primary"
          onClick={handleAnswer}
          disabled={!!loading}
        >
          {loading === 'answer' ? <><span className="qna-spin" /> Answering…</> : (item.isAnswered ? '🔄 Re-Answer' : '✨ AI Answer')}
        </button>
        {item.answer && (
          <button type="button" className="qna-action-btn ghost" onClick={() => setExpanded(p => !p)}>
            {expanded ? '▲ Collapse' : '▼ View Answer'}
          </button>
        )}
      </div>

      {/* Answer display */}
      {expanded && item.answer && (
        <div className="qna-answers">
          <div className="qna-answer-block ai">
            <div className="qna-answer-header">
              <span className="qna-answer-tag ai-tag">🤖 AI Answer</span>
            </div>
            <FormatAnswer text={item.answer} />
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Detail view — editable resource panel ───────────────────────────────── */
const DetailResourcesPanel = ({ subjects, activeSet, onSaved }) => {
  // Build current selected set from activeSet.resources
  const initialIds = new Set((activeSet.resources || []).map(r => r._id || r));
  const [selectedIds, setSelected] = useState(initialIds);
  const [saving, setSaving]        = useState(false);

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await fetch(`${API}/qna/${activeSet._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...auth() },
        body: JSON.stringify({ resourceIds: Array.from(selectedIds) }),
      });
      const d = await r.json();
      if (r.ok) onSaved(d);
      else alert(d.message || 'Failed to save resources.');
    } catch { alert('Network error.'); }
    finally { setSaving(false); }
  };

  const changed = (() => {
    if (selectedIds.size !== initialIds.size) return true;
    for (const id of selectedIds) if (!initialIds.has(id)) return true;
    return false;
  })();

  return (
    <div className="qna-sidebar-panel">
      <h3 className="qna-sidebar-heading">Linked Resources</h3>
      <p className="qna-hint">Toggle resources to include or exclude from AI answers.</p>
      <ResourcePicker subjects={subjects} selectedIds={selectedIds} onToggle={toggle} />
      <button
        type="button"
        className={`qna-action-btn primary full${saving ? ' loading' : ''}`}
        onClick={handleSave}
        disabled={saving || !changed}
        style={{ marginTop: '0.75rem' }}
      >
        {saving ? <><span className="qna-spin" /> Saving…</> : (changed ? '💾 Save Resources' : '✓ Up to date')}
      </button>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════════ */
const QnaPage = () => {
  const { fetchUser } = useAuth();
  /* ── view state: 'list' | 'create' | 'detail' */
  const [view, setView]               = useState('list');
  const [sets, setSets]               = useState([]);
  const [activeSet, setActiveSet]     = useState(null);
  const [subjects, setSubjects]       = useState([]);
  const [loadingSets, setLoadingSets] = useState(true);
  const [loadingDetail, setLD]        = useState(false);

  /* ── create form state */
  const [createForm, setCF] = useState({
    title: '',
    description: '',
    tags: '',
    resourceIds: new Set(),
    defaultSettings: { size: 'medium', style: 'explanatory', tone: 'professional' },
    rawQuestions: '',
  });

  /* ── batch answer state */
  const [batchLoading, setBatch]  = useState(false);
  const [addQInput, setAddQInput] = useState('');
  const [addQLoading, setAQL]     = useState(false);

  /* ── Sidebar for detail view */
  const [detailSide, setDS] = useState('questions'); // 'questions'|'settings'|'resources'

  // Fetch subjects (for resource picker)
  useEffect(() => {
    fetch(`${API}/chat/resources`, { headers: auth() })
      .then(r => r.json())
      .then(d => setSubjects(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // Fetch QnA sets
  const fetchSets = useCallback(async () => {
    setLoadingSets(true);
    try {
      const r = await fetch(`${API}/qna`, { headers: auth() });
      const d = await r.json();
      setSets(Array.isArray(d) ? d : []);
    } catch { setSets([]); }
    finally { setLoadingSets(false); }
  }, []);

  useEffect(() => { fetchSets(); }, [fetchSets]);

  // Open detail
  const openSet = async (id) => {
    setLD(true);
    try {
      const r = await fetch(`${API}/qna/${id}`, { headers: auth() });
      const d = await r.json();
      setActiveSet(d);
      setView('detail');
    } catch (e) { alert('Failed to load QnA set.'); }
    finally { setLD(false); }
  };

  // Delete set
  const deleteSet = async (id) => {
    if (!window.confirm('Delete this QnA set?')) return;
    await fetch(`${API}/qna/${id}`, { method: 'DELETE', headers: auth() });
    setSets(prev => prev.filter(s => s._id !== id));
  };

  /* ── Create QnA set ──────────────────────────────────────────────────────── */
  const handleCreate = async () => {
    if (!createForm.title.trim()) return alert('Title is required.');
    const questions = createForm.rawQuestions
      .split('\n')
      .map(q => q.trim())
      .filter(q => q.length > 0);

    const body = {
      title: createForm.title.trim(),
      resourceIds: Array.from(createForm.resourceIds),
      metadata: {
        description: createForm.description,
        tags: createForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      },
      defaultSettings: createForm.defaultSettings,
      questions,
    };

    try {
      const r = await fetch(`${API}/qna`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth() },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) return alert(d.message || 'Error creating set.');
      await fetchSets();
      openSet(d._id);
      setCF({ title:'',description:'',tags:'',resourceIds:new Set(),
        defaultSettings:{size:'medium',style:'explanatory',tone:'professional',language:'english'},rawQuestions:'' });
    } catch { alert('Network error.'); }
  };

  const toggleCreateResource = (id) => {
    setCF(prev => {
      const next = new Set(prev.resourceIds);
      next.has(id) ? next.delete(id) : next.add(id);
      return { ...prev, resourceIds: next };
    });
  };

  const changeCreateSetting = (k, v) => {
    setCF(prev => ({ ...prev, defaultSettings: { ...prev.defaultSettings, [k]: v } }));
  };

  /* ── Detail: add questions ───────────────────────────────────────────────── */
  const handleAddQuestions = async () => {
    const qs = addQInput.split('\n').map(q => q.trim()).filter(Boolean);
    if (!qs.length) return;
    setAQL(true);
    try {
      const r = await fetch(`${API}/qna/${activeSet._id}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth() },
        body: JSON.stringify({ questions: qs }),
      });
      const d = await r.json();
      setActiveSet(d);
      setAddQInput('');
    } catch { alert('Failed to add questions.'); }
    finally { setAQL(false); }
  };

  /* ── Detail: batch answer ────────────────────────────────────────────────── */
  const handleAnswerAll = async (onlyUnanswered = true) => {
    setBatch(true);
    try {
      const r = await fetch(`${API}/qna/${activeSet._id}/answer-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth() },
        body: JSON.stringify({ onlyUnanswered }),
      });
      const d = await r.json();
      if (!r.ok) return alert(d.message || 'Error.');
      setActiveSet(d.qnaSet);
      if (fetchUser) fetchUser();
    } catch { alert('Network error.'); }
    finally { setBatch(false); }
  };

  /* ── Detail: single question update ─────────────────────────────────────── */
  const handleQUpdated = (updatedItem) => {
    setActiveSet(prev => ({
      ...prev,
      questions: prev.questions.map(q => q._id === updatedItem._id ? updatedItem : q),
    }));
  };

  const handleQDeleted = (id) => {
    setActiveSet(prev => ({ ...prev, questions: prev.questions.filter(q => q._id !== id) }));
  };

  /* ── Detail: update settings ─────────────────────────────────────────────── */
  const handleDetailSettingChange = async (k, v) => {
    const newSettings = { ...activeSet.defaultSettings, [k]: v };
    setActiveSet(prev => ({ ...prev, defaultSettings: newSettings }));
    await fetch(`${API}/qna/${activeSet._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...auth() },
      body: JSON.stringify({ defaultSettings: newSettings }),
    });
  };

  /* ── Detail: toggle public/private ───────────────────────────────────────── */
  const [publicSaving, setPublicSaving] = useState(false);
  const handleTogglePublic = async () => {
    const next = !activeSet.isPublic;
    setPublicSaving(true);
    try {
      const r = await fetch(`${API}/qna/${activeSet._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...auth() },
        body: JSON.stringify({ isPublic: next }),
      });
      if (r.ok) setActiveSet(prev => ({ ...prev, isPublic: next }));
    } catch { alert('Failed to update visibility.'); }
    finally { setPublicSaving(false); }
  };

  const answeredCount = activeSet?.questions?.filter(q => q.isAnswered).length || 0;
  const totalCount    = activeSet?.questions?.length || 0;

  /* ══════════════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="qna-page">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header className="qna-header">
        <div className="qna-header-left">
          <Link to="/subjects" className="qna-back">← Subjects</Link>
          <span className="qna-divider" />
          {view === 'list' && <h1 className="qna-page-title">📋 QnA Sets</h1>}
          {view === 'create' && (
            <>
              <button className="qna-link-btn" onClick={() => setView('list')}>← Back</button>
              <h1 className="qna-page-title">Create QnA Set</h1>
            </>
          )}
          {view === 'detail' && activeSet && (
            <>
              <button className="qna-link-btn" onClick={() => { setView('list'); fetchSets(); }}>← All Sets</button>
              <h1 className="qna-page-title">{activeSet.title}</h1>
            </>
          )}
        </div>
        <div className="qna-header-right">
          {view === 'list' && (
            <>
              <a href="/qna/discover" className="qna-discover-btn">🌐 Discover</a>
              <button className="qna-create-btn" onClick={() => setView('create')}>+ New QnA Set</button>
            </>
          )}
          {view === 'detail' && activeSet && (
            <div className="qna-detail-header-extras">
              <span className="qna-progress-pill">
                {answeredCount}/{totalCount} answered
              </span>
              <div className="qna-progress-bar-outer">
                <div className="qna-progress-bar-fill" style={{ width: totalCount ? `${(answeredCount/totalCount)*100}%` : '0%' }} />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ══ LIST VIEW ══════════════════════════════════════════════════════════ */}
      {view === 'list' && (
        <div className="qna-list-view">
          {loadingSets ? (
            <div className="qna-loading"><div className="qna-spin large" /><p>Loading QnA sets…</p></div>
          ) : sets.length === 0 ? (
            <div className="qna-empty-state">
              <div className="qna-empty-icon">📋</div>
              <h2>No QnA Sets Yet</h2>
              <p>Create your first QnA set from your study resources.</p>
              <button className="qna-create-btn" onClick={() => setView('create')}>+ Create QnA Set</button>
            </div>
          ) : (
            <div className="qna-grid">
              {sets.map(set => (
                <div key={set._id} className="qna-set-card" onClick={() => openSet(set._id)}>
                  <div className="qna-set-card-top">
                    <h3 className="qna-set-title">
                      {set.isPublic && <span className="qna-public-badge">🌐 Public</span>}
                      {set.title}
                    </h3>
                    <button className="qna-icon-btn danger mini" onClick={e => { e.stopPropagation(); deleteSet(set._id); }}>🗑</button>
                  </div>
                  {set.metadata?.description && (
                    <p className="qna-set-desc">{set.metadata.description}</p>
                  )}
                  <div className="qna-set-meta">
                    <span className="qna-meta-pill">📝 {set.totalQuestions} Q{set.totalQuestions !== 1 ? 's' : ''}</span>
                    <span className="qna-meta-pill">📂 {(set.resources || []).length} resource{(set.resources||[]).length !== 1 ? 's':''}
                    </span>
                    {(set.metadata?.tags||[]).map(t => <span key={t} className="qna-tag-pill">#{t}</span>)}
                  </div>
                  <div className="qna-set-res-chips">
                    {(set.resources || []).slice(0,3).map(r => (
                      <span key={r._id} className="qna-res-chip"><TypeIcon type={r.type}/> {r.name}</span>
                    ))}
                    {(set.resources||[]).length > 3 && <span className="qna-res-chip more">+{(set.resources||[]).length - 3}</span>}
                  </div>
                  <div className="qna-set-footer">
                    <span className="qna-ts">{new Date(set.updatedAt).toLocaleDateString()}</span>
                    <span className="qna-open-btn">Open →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ CREATE VIEW ════════════════════════════════════════════════════════ */}
      {view === 'create' && (
        <div className="qna-create-view">
          {/* Use div, NOT form — prevents accordion/chip buttons from accidentally submitting */}
          <div className="qna-create-form">
            {/* Left: details + questions */}
            <div className="qna-create-left">
              <section className="qna-section">
                <h2 className="qna-section-title">📋 Set Details</h2>
                <label className="qna-label">Title *</label>
                <input className="qna-input" placeholder="e.g. Chapter 3 - Cell Biology Q&A" value={createForm.title} onChange={e => setCF(p=>({...p,title:e.target.value}))} />
                <label className="qna-label">Description</label>
                <textarea className="qna-textarea" rows={2} placeholder="What is this set about?" value={createForm.description} onChange={e => setCF(p=>({...p,description:e.target.value}))} />
                <label className="qna-label">Tags (comma separated)</label>
                <input className="qna-input" placeholder="biology, chapter3, exam" value={createForm.tags} onChange={e => setCF(p=>({...p,tags:e.target.value}))} />
              </section>

              <section className="qna-section">
                <h2 className="qna-section-title">❓ Questions</h2>
                <p className="qna-hint">Enter one question per line. You can add more after creating.</p>
                <textarea
                  className="qna-textarea big"
                  rows={8}
                  placeholder={"What is mitosis?\nExplain the role of DNA in protein synthesis.\nWhat are the stages of meiosis?"}
                  value={createForm.rawQuestions}
                  onChange={e => setCF(p=>({...p,rawQuestions:e.target.value}))}
                />
                <p className="qna-hint">{createForm.rawQuestions.split('\n').filter(l=>l.trim()).length} question(s) entered</p>
              </section>

              <button type="button" className="qna-create-btn full" onClick={handleCreate}>✨ Create QnA Set</button>
            </div>

            {/* Right: resources + default settings */}
            <div className="qna-create-right">
              <section className="qna-section">
                <h2 className="qna-section-title">📂 Select Resources</h2>
                <p className="qna-hint">AI will draw from these resources to answer questions.</p>
                {subjects.length === 0
                  ? <p className="qna-empty">No resources found. Upload some first.</p>
                  : <ResourcePicker subjects={subjects} selectedIds={createForm.resourceIds} onToggle={toggleCreateResource} />
                }
                {createForm.resourceIds.size > 0 && (
                  <p className="qna-selected-count">{createForm.resourceIds.size} resource(s) selected</p>
                )}
              </section>

              <section className="qna-section">
                <h2 className="qna-section-title">⚙️ Default Answer Settings</h2>
                <p className="qna-hint">These apply to all questions by default. You can override per question.</p>
                <SettingsChips settings={createForm.defaultSettings} onChange={changeCreateSetting} />
              </section>
            </div>
          </div>
        </div>
      )}

      {/* ══ DETAIL VIEW ════════════════════════════════════════════════════════ */}
      {view === 'detail' && activeSet && (
        <div className="qna-detail-view">
          {/* Sidebar */}
          <aside className="qna-detail-sidebar">
            <div className="qna-detail-tabs">
              {['questions','settings','resources'].map(t => (
                <button key={t} className={`qna-detail-tab${detailSide===t?' active':''}`} onClick={() => setDS(t)}>
                  {t === 'questions' ? '❓' : t === 'settings' ? '⚙️' : '📂'} {t.charAt(0).toUpperCase()+t.slice(1)}
                </button>
              ))}
            </div>

            {/* Add Questions */}
            {detailSide === 'questions' && (
              <div className="qna-sidebar-panel">
                <h3 className="qna-sidebar-heading">Add Questions</h3>
                <textarea
                  className="qna-textarea"
                  rows={5}
                  placeholder="One question per line…"
                  value={addQInput}
                  onChange={e => setAddQInput(e.target.value)}
                />
                <button className="qna-action-btn primary full" onClick={handleAddQuestions} disabled={addQLoading || !addQInput.trim()}>
                  {addQLoading ? <span className="qna-spin" /> : '+ Add Questions'}
                </button>

                <div className="qna-sidebar-divider" />
                <h3 className="qna-sidebar-heading">Batch Answer</h3>
                <p className="qna-hint">Answer all questions in one shot using current settings.</p>
                <button className="qna-action-btn primary full" onClick={() => handleAnswerAll(true)} disabled={batchLoading}>
                  {batchLoading ? <span className="qna-spin" /> : `✨ Answer Unanswered (${totalCount - answeredCount})`}
                </button>
                <button className="qna-action-btn secondary full" onClick={() => handleAnswerAll(false)} disabled={batchLoading} style={{marginTop:'0.5rem'}}>
                  {batchLoading ? <span className="qna-spin" /> : '🔄 Re-Answer All'}
                </button>
              </div>
            )}

            {/* Settings */}
            {detailSide === 'settings' && (
              <div className="qna-sidebar-panel">
                {/* ── Visibility toggle */}
                <div className="qna-visibility-block">
                  <div className="qna-visibility-info">
                    <span className="qna-sidebar-heading">
                      {activeSet.isPublic ? '🌐 Public' : '🔒 Private'}
                    </span>
                    <p className="qna-hint">
                      {activeSet.isPublic
                        ? 'Anyone with the link can view this set (read-only).'
                        : 'Only you can see this set.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`qna-visibility-toggle${activeSet.isPublic ? ' public' : ''}`}
                    onClick={handleTogglePublic}
                    disabled={publicSaving}
                    title={activeSet.isPublic ? 'Make Private' : 'Make Public'}
                  >
                    {publicSaving ? <span className="qna-spin" /> : (activeSet.isPublic ? 'Make Private' : 'Make Public')}
                  </button>
                </div>

                {/* Shareable link */}
                {activeSet.isPublic && (
                  <div className="qna-share-row">
                    <span className="qna-share-label">Share link</span>
                    <div className="qna-share-input-row">
                      <input
                        className="qna-share-input"
                        readOnly
                        value={`${window.location.origin}/qna/public/${activeSet._id}`}
                      />
                      <button
                        type="button"
                        className="qna-copy-btn"
                        onClick={() => navigator.clipboard.writeText(`${window.location.origin}/qna/public/${activeSet._id}`)}
                      >
                        📋 Copy
                      </button>
                    </div>
                  </div>
                )}

                <div className="qna-sidebar-divider" />
                <h3 className="qna-sidebar-heading">Default Answer Settings</h3>
                <p className="qna-hint">Applies to all questions unless overridden per question.</p>
                <SettingsChips settings={activeSet.defaultSettings} onChange={handleDetailSettingChange} />
              </div>
            )}

            {/* Resources — edit mode */}
            {detailSide === 'resources' && (
              <DetailResourcesPanel
                subjects={subjects}
                activeSet={activeSet}
                onSaved={(updated) => setActiveSet(prev => ({ ...prev, resources: updated.resources }))}
              />
            )}
          </aside>

          {/* Main content */}
          <main className="qna-detail-main">
            {loadingDetail ? (
              <div className="qna-loading"><div className="qna-spin large" /></div>
            ) : activeSet.questions.length === 0 ? (
              <div className="qna-empty-state">
                <div className="qna-empty-icon">❓</div>
                <h2>No Questions Yet</h2>
                <p>Add questions from the sidebar to get started.</p>
              </div>
            ) : (
              <div className="qna-questions-list">
                {activeSet.questions.map((item, idx) => (
                  <QuestionCard
                    key={item._id}
                    item={item}
                    idx={idx}
                    setId={activeSet._id}
                    defaultSettings={activeSet.defaultSettings}
                    onUpdated={handleQUpdated}
                    onDelete={handleQDeleted}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
};

export default QnaPage;
