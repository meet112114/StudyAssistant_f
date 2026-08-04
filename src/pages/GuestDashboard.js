import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./GuestDashboard.css";

const SEMESTERS = ["MCA Sem 1", "MCA Sem 2", "MCA Sem 3", "MCA Sem 4"];

export default function GuestDashboard() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState("MCA Sem 1");
  const [expandedSubjectId, setExpandedSubjectId] = useState(null);

  // Modals state
  const [activePdfResource, setActivePdfResource] = useState(null);
  const [summaryResource, setSummaryResource] = useState(null);
  const [summaryContent, setSummaryContent] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/subject/public`);
      const data = await response.json();
      if (response.ok) {
        setSubjects(data);
        if (data.length > 0) {
          setExpandedSubjectId(data[0]._id);
        }
      } else {
        console.error("Error fetching public subjects:", data.message);
      }
    } catch (error) {
      console.error("Error fetching public subjects", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleOpenSummary = async (resource) => {
    setSummaryResource(resource);
    setSummaryContent(null);
    setLoadingSummary(true);

    try {
      const res = await fetch(`${API_BASE}/resource/public/item/${resource._id}/summary`);
      const data = await res.json();
      if (res.ok) {
        setSummaryContent(data.content || "No summary available for this document yet.");
      } else {
        setSummaryContent(data.message || "Failed to load summary.");
      }
    } catch (err) {
      console.error("Error loading summary:", err);
      setSummaryContent("Network error loading summary.");
    } finally {
      setLoadingSummary(false);
    }
  };

  // Filter subjects based on active tab
  const filteredSubjects = subjects.filter((subject) => {
    return !subject.semester || subject.semester === selectedSemester;
  });

  return (
    <div className="guest-dashboard">
      {/* Hero Banner */}
      <div className="guest-hero">
        <div className="hero-badge">🎓 Guest Access Portal</div>
        <h1>MCA Study Hub</h1>
        <div className="hero-cta-buttons">
          <Link to="/login" className="btn-primary">
            Sign In
          </Link>
          <Link to="/register" className="btn-secondary">
            Create Free Account
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="guest-main-container">
        {/* Navigation & Controls Header */}
        <div className="guest-controls">
          {/* Semester Tabs */}
          <div className="semester-tabs">
            {SEMESTERS.map((sem) => (
              <button
                key={sem}
                className={`sem-tab ${selectedSemester === sem ? "active" : ""}`}
                onClick={() => setSelectedSemester(sem)}
              >
                {sem}
              </button>
            ))}
          </div>
        </div>

        {/* Subjects List & Resources */}
        {loading ? (
          <div className="guest-loading">
            <div className="spinner"></div>
            <p>Loading MCA subjects...</p>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="no-subjects-card">
            <div className="empty-icon">📚</div>
            <h3>No subjects found</h3>
            <p>
              No subjects currently added under {selectedSemester}.
            </p>
            <div className="quick-links-row">
              <Link to="/qna/discover" className="btn-link">
                Explore Public Q&A →
              </Link>
              <Link to="/resource-packs" className="btn-link">
                Browse Resource Packs →
              </Link>
            </div>
          </div>
        ) : (
          <div className="subjects-grid">
            {filteredSubjects.map((subject) => {
              const isExpanded = expandedSubjectId === subject._id;
              const resourceCount = subject.resources ? subject.resources.length : 0;

              return (
                <div
                  key={subject._id}
                  className={`guest-subject-card ${isExpanded ? "expanded" : ""}`}
                >
                  <div
                    className="subject-card-header"
                    onClick={() =>
                      setExpandedSubjectId(isExpanded ? null : subject._id)
                    }
                  >
                    <div className="subject-header-info">
                      <span className="sem-badge">
                        {subject.semester || "MCA Sem 1"}
                      </span>
                      <h2>{subject.name}</h2>
                      <span className="resource-count">
                        📖 {resourceCount} {resourceCount === 1 ? "Resource" : "Resources"}
                      </span>
                    </div>
                    <button className="expand-toggle-btn">
                      {isExpanded ? "▲ Hide" : "▼ View Files"}
                    </button>
                  </div>

                  {/* Expanded Resources List */}
                  {isExpanded && (
                    <div className="subject-resources-container">
                      {resourceCount === 0 ? (
                        <p className="empty-resources-msg">
                          No PDF or study material attached to this subject yet.
                        </p>
                      ) : (
                        <div className="guest-resource-list">
                          {subject.resources.map((res) => {
                            const fileUrl = res.url.startsWith("http")
                              ? res.url
                              : `${API_BASE}${res.url}`;

                            return (
                              <div key={res._id} className="guest-resource-item">
                                <div className="res-file-details">
                                  <span className="res-type-icon">
                                    {res.type === "pdf" ? "📕" : res.type === "docx" ? "📘" : "📄"}
                                  </span>
                                  <div className="res-name-block">
                                    <span className="res-filename">{res.name}</span>
                                    <span className="res-meta">
                                      {(res.size / 1024).toFixed(1)} KB • {res.type.toUpperCase()}
                                    </span>
                                  </div>
                                </div>

                                <div className="res-action-buttons">
                                  {/* View PDF Button */}
                                  <button
                                    className="btn-action view-pdf-btn"
                                    onClick={() => setActivePdfResource({ ...res, fullUrl: fileUrl })}
                                  >
                                    📖 View Document
                                  </button>

                                  {/* AI Summary Button */}
                                  {res.hasSummary ? (
                                    <button
                                      className="btn-action view-summary-btn"
                                      onClick={() => handleOpenSummary(res)}
                                    >
                                      ✨ AI Summary
                                    </button>
                                  ) : (
                                    <button
                                      className="btn-action view-summary-btn"
                                      disabled
                                      title="Summary not generated by admin yet"
                                    >
                                      🔒 Summary Locked
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Developer Portfolio Section */}
        <div className="developer-portfolio-section">
          <div className="developer-card">
            <div className="developer-info">
              <div className="dev-text">
                <h3>Meet Sanwadkar</h3>
                <p>Developer & Creator of MCA Study Hub</p>
              </div>
            </div>
            <div className="developer-actions">
              <a
                href="https://portfolio.mslab.cc"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-dev portfolio-btn"
              >
                <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 17.93c-3.955-.496-7-3.854-7-7.93 0-.62.07-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                </svg>
                Portfolio
              </a>
              <a
                href="https://www.linkedin.com/in/meet-sanwadkar"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-dev linkedin-btn"
              >
                <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
                LinkedIn
              </a>
              <a
                href="https://github.com/meet112114"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-dev github-btn"
              >
                <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Document Viewer Modal */}
      {activePdfResource && (
        <div className="guest-modal-overlay" onClick={() => setActivePdfResource(null)}>
          <div
            className="guest-modal pdf-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title-box">
                <span className="modal-icon">📕</span>
                <h3>{activePdfResource.name}</h3>
              </div>
              <div className="modal-header-actions">
                <a
                  href={activePdfResource.fullUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-modal-link"
                >
                  🔗 Open External
                </a>
                <button
                  className="modal-close-btn"
                  onClick={() => setActivePdfResource(null)}
                >
                  &times;
                </button>
              </div>
            </div>

            <div className="modal-body pdf-body">
              {activePdfResource.type === "pdf" ? (
                <iframe
                  src={activePdfResource.fullUrl}
                  title={activePdfResource.name}
                  className="pdf-iframe"
                />
              ) : (
                <div className="unsupported-preview">
                  <span className="large-icon">📄</span>
                  <p>Inline preview is unavailable for {activePdfResource.type.toUpperCase()} files.</p>
                  <a
                    href={activePdfResource.fullUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary"
                  >
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Summary Viewer Modal */}
      {summaryResource && (
        <div className="guest-modal-overlay" onClick={() => setSummaryResource(null)}>
          <div
            className="guest-modal summary-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title-box">
                <span className="modal-icon">✨</span>
                <h3>AI Summary - {summaryResource.name}</h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setSummaryResource(null)}
              >
                &times;
              </button>
            </div>

            <div className="modal-body summary-body">
              {loadingSummary ? (
                <div className="summary-loading">
                  <div className="spinner"></div>
                  <p>Generating/fetching AI summary for this document...</p>
                </div>
              ) : (
                <div className="markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {summaryContent}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <span className="guest-note">
                💡 Want interactive AI Quizzes & AI Chat with this document?
              </span>
              <Link to="/login" className="btn-primary btn-sm">
                Sign In to Unlock All AI Tools
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}