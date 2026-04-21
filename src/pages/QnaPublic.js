import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './QnaPublic.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/* ── Tiny helpers ─────────────────────────────────────────────────────────── */
const TypeIcon = ({ type }) => {
  const map = { pdf: 'PDF', docx: 'DOC', txt: 'TXT' };
  return <span className={`qp-type-badge ${type}`}>{map[type] || type?.toUpperCase()}</span>;
};

const inlineFormat = (text) => {
  const parts = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|~~(.+?)~~)/g;
  let last = 0, match, key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[2])      parts.push(<strong key={key++}>{match[2]}</strong>);
    else if (match[3]) parts.push(<em key={key++}>{match[3]}</em>);
    else if (match[4]) parts.push(<code key={key++} className="qp-inline-code">{match[4]}</code>);
    else if (match[5]) parts.push(<s key={key++}>{match[5]}</s>);
    last = regex.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : text;
};

const FormatAnswer = ({ text }) => {
  if (!text) return null;
  return (
    <div className="qp-fmt-body">
      {text.split('\n').map((line, i) => {
        const t = line.trim();
        if (!t) return <div key={i} className="qp-fmt-spacer" />;
        if (/^[-*•] /.test(t)) return <ul key={i} className="qp-fmt-ul"><li>{inlineFormat(t.replace(/^[-*•] /, ''))}</li></ul>;
        if (/^\d+[.)\s]/.test(t)) return <ol key={i} className="qp-fmt-ol"><li>{inlineFormat(t.replace(/^\d+[.)\s]+/, ''))}</li></ol>;
        return <p key={i} className="qp-fmt-p">{inlineFormat(t)}</p>;
      })}
    </div>
  );
};


/* ══════════════════════════════════════════════════════════════════════════════
   PUBLIC VIEWER — /qna/public/:id
══════════════════════════════════════════════════════════════════════════════ */
export const QnaPublicViewer = () => {
  const { id } = useParams();
  const [set, setSet]       = useState(null);
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState('');
  const [expanded, setExp]  = useState({});
  const [downloading, setDownloading] = useState(false);
  const [expandAll, setExpandAll] = useState(false);

  useEffect(() => {
    fetch(`${API}/qna/public/${id}`)
      .then(r => r.ok ? r.json() : r.json().then(d => { throw new Error(d.message); }))
      .then(d => setSet(d))
      .catch(e => setError(e.message))
      .finally(() => setLoad(false));
  }, [id]);

  const toggleQ = (qId) => setExp(prev => ({ ...prev, [qId]: !prev[qId] }));

  const handleExpandAll = () => {
    if (!set) return;
    const newState = !expandAll;
    setExpandAll(newState);
    const newExp = {};
    set.questions.forEach(q => { if (q.isAnswered) newExp[q._id] = newState; });
    setExp(newExp);
  };

  const GeneratePDF = async () => {
    try {
      setDownloading(true);
      const res = await fetch(`${API}/qna/pdf/public/${id}`);
      if (!res.ok) throw new Error("PDF failed");
      const blob = await res.blob();
      const fileURL = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = fileURL;
      a.download = `${set?.title || 'QnaSet'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(fileURL);
    } catch (err) {
      console.log(err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return (
    <div className="qp-page">
      <div className="qp-loading">
        <div className="qp-spin-lg" />
        <p>Loading set…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="qp-page">
      <div className="qp-empty-state">
        <div className="qp-empty-icon">🔒</div>
        <h2>Set Not Found</h2>
        <p>{error}</p>
        <Link to="/qna/discover" className="qp-btn qp-btn-primary" style={{ textDecoration: 'none' }}>
          ← Back to Discover
        </Link>
      </div>
    </div>
  );

  const answered = set.questions.filter(q => q.isAnswered).length;
  const progress = set.questions.length ? Math.round((answered / set.questions.length) * 100) : 0;

  return (
    <div className="qp-page">
      {/* ── Hero Section ── */}
      <div className="qp-hero">
        <div className="qp-hero-glow" />
        <div className="qp-hero-content">
          <div className="qp-hero-top">
            <Link to="/qna/discover" className="qp-back-link">
              <span>←</span> Discover
            </Link>
            <span className="qp-public-badge">🌐 Public Set</span>
          </div>

          <h1 className="qp-hero-title">{set.title}</h1>

          {set.metadata?.description && (
            <p className="qp-hero-desc">{set.metadata.description}</p>
          )}

          <div className="qp-hero-meta">
            <span className="qp-meta-pill">👤 {set.user?.name || set.user?.email}</span>
            <span className="qp-meta-pill">📝 {set.questions.length} Questions</span>
            <span className="qp-meta-pill">✅ {answered} Answered</span>
            {(set.metadata?.tags || []).map(t => (
              <span key={t} className="qp-tag-pill">#{t}</span>
            ))}
          </div>

          {/* Progress bar */}
          <div className="qp-progress-row">
            <div className="qp-progress-track">
              <div className="qp-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="qp-progress-label">{progress}%</span>
          </div>

          {/* Action buttons */}
          <div className="qp-hero-actions">
            <button
              className="qp-btn qp-btn-primary"
              onClick={GeneratePDF}
              disabled={downloading}
            >
              {downloading ? <><span className="qp-spin-sm" /> Downloading…</> : '⬇ Download PDF'}
            </button>
            <button
              className="qp-btn qp-btn-ghost"
              onClick={handleExpandAll}
            >
              {expandAll ? '▲ Collapse All' : '▼ Expand All Answers'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Questions ── */}
      <div className="qp-body">
        <div className="qp-questions">
          {set.questions.map((q, idx) => (
            <div key={q._id} className={`qp-card${q.isAnswered ? ' answered' : ''}`}>
              <div className="qp-card-header">
                <span className="qp-q-num">Q{idx + 1}</span>
                <p className="qp-q-text">{q.question}</p>
                {q.isAnswered && (
                  <button
                    type="button"
                    className="qp-toggle-btn"
                    onClick={() => toggleQ(q._id)}
                  >
                    {expanded[q._id] ? '▲ Hide' : '▼ Answer'}
                  </button>
                )}
                {!q.isAnswered && (
                  <span className="qp-unanswered-badge">Unanswered</span>
                )}
              </div>

              {expanded[q._id] && q.answer && (
                <div className="qp-answer-block">
                  <div className="qp-answer-header">
                    <span className="qp-answer-tag">🤖 AI Answer</span>
                  </div>
                  <FormatAnswer text={q.answer} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   DISCOVER PAGE — /qna/discover
══════════════════════════════════════════════════════════════════════════════ */
export const QnaDiscoverPage = () => {
  const [sets, setSets]     = useState([]);
  const [loading, setLoad]  = useState(true);
  const [search, setSearch] = useState('');
  const [query, setQuery]   = useState('');

  useEffect(() => {
    setLoad(true);
    const url = `${API}/qna/public${query ? `?search=${encodeURIComponent(query)}` : ''}`;
    fetch(url)
      .then(r => r.json())
      .then(d => setSets(d.sets || []))
      .catch(() => setSets([]))
      .finally(() => setLoad(false));
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery(search);
  };

  return (
    <div className="qp-page">
      {/* ── Hero banner ── */}
      <div className="qp-discover-hero">
        <div className="qp-hero-glow" />
        <div className="qp-discover-hero-inner">
          <Link to="/qna" className="qp-back-link">← My Sets</Link>
          <h1 className="qp-discover-title">🌐 Discover Public Sets</h1>
          <p className="qp-discover-sub">Explore QnA sets shared by the community</p>

          <form className="qp-search-form" onSubmit={handleSearch}>
            <div className="qp-search-inner">
              <span className="qp-search-icon">🔍</span>
              <input
                className="qp-search-input"
                placeholder="Search by title, description or tag…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button type="submit" className="qp-btn qp-btn-primary qp-search-btn">
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="qp-body">
        {loading ? (
          <div className="qp-loading">
            <div className="qp-spin-lg" />
            <p>Loading public sets…</p>
          </div>
        ) : sets.length === 0 ? (
          <div className="qp-empty-state">
            <div className="qp-empty-icon">🌐</div>
            <h2>No Public Sets Found</h2>
            <p>Be the first to share your QnA set with the world.</p>
            <Link to="/qna" className="qp-btn qp-btn-primary" style={{ textDecoration: 'none' }}>
              ← My Sets
            </Link>
          </div>
        ) : (
          <div className="qp-grid">
            {sets.map(set => (
              <Link
                key={set._id}
                to={`/qna/public/${set._id}`}
                className="qp-set-card"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="qp-set-card-top">
                  <h3 className="qp-set-title">{set.title}</h3>
                  <span className="qp-public-badge">🌐</span>
                </div>
                {set.metadata?.description && (
                  <p className="qp-set-desc">{set.metadata.description}</p>
                )}
                <div className="qp-set-meta">
                  <span className="qp-meta-pill">👤 {set.user?.name || set.user?.email}</span>
                  <span className="qp-meta-pill">📝 {set.totalQuestions} Qs</span>
                  {(set.metadata?.tags || []).map(t => (
                    <span key={t} className="qp-tag-pill">#{t}</span>
                  ))}
                </div>
                <div className="qp-set-res-chips">
                  {(set.resources || []).slice(0, 3).map(r => (
                    <span key={r._id} className="qp-res-chip">
                      <TypeIcon type={r.type} /> {r.name}
                    </span>
                  ))}
                </div>
                <div className="qp-set-footer">
                  <span className="qp-ts">{new Date(set.updatedAt).toLocaleDateString()}</span>
                  <span className="qp-open-btn">View →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
