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
  const [searchQuery, setSearchQuery] = useState("");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Filter subjects based on active tab and search query
  const filteredSubjects = subjects.filter((subject) => {
    const matchesSemester =
      selectedSemester === "All" ||
      !subject.semester ||
      subject.semester === selectedSemester;

    const matchesSearch =
      subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (subject.resources &&
        subject.resources.some((r) =>
          r.name.toLowerCase().includes(searchQuery.toLowerCase())
        ));

    return matchesSemester && matchesSearch;
  });

  return (
    <div className="guest-dashboard">
      {/* Hero Banner */}
      <div className="guest-hero">
        <div className="hero-badge">🎓 Guest Access Portal</div>
        <h1>MCA Study Hub</h1>
        <p>
          Browse subject resources, read PDF lecture notes, and view AI-generated summaries
          for MCA Semesters 1 to 4 without logging in.
        </p>
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
            <button
              className={`sem-tab ${selectedSemester === "All" ? "active" : ""}`}
              onClick={() => setSelectedSemester("All")}
            >
              All Semesters
            </button>
          </div>

          {/* Search Bar */}
          <div className="guest-search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search subjects or PDFs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search" onClick={() => setSearchQuery("")}>
                ✕
              </button>
            )}
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
              {searchQuery
                ? `No results match "${searchQuery}" in ${selectedSemester}.`
                : `No subjects currently added under ${selectedSemester}.`}
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
                                  <button
                                    className="btn-action view-summary-btn"
                                    onClick={() => handleOpenSummary(res)}
                                  >
                                    ✨ AI Summary
                                  </button>
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