import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../context/AuthContext';
import './ResourceDetail.css';

const ResourceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchUser } = useAuth();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);

  // AI states
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  // Modal states
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  useEffect(() => {
    fetchResource();
  }, [id]);

  const fetchResource = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/resource/item/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setResource(data);
        if (data.summaryData) setSummary(data.summaryData);
        if (data.quizData) setQuiz(data.quizData);
      } else {
        alert(data.message || 'Error fetching resource details');
      }
    } catch (error) {
      console.error('Error fetching resource details', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    setLoadingSummary(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/resource/item/${id}/summary`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setSummary(data.content);
        setShowSummaryModal(true);
        if (fetchUser) fetchUser();
      } else {
        alert(data.message || 'Error generating summary');
      }
    } catch (error) {
      console.error('Error generating summary', error);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleGenerateQuiz = async () => {
    setLoadingQuiz(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/resource/item/${id}/quiz`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setQuiz(data.questions);
        startQuiz();
        if (fetchUser) fetchUser();
      } else {
        alert(data.message || 'Error generating quiz');
      }
    } catch (error) {
      console.error('Error generating quiz', error);
    } finally {
      setLoadingQuiz(false);
    }
  };

  const startQuiz = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizFinished(false);
    setShowQuizModal(true);
  };

  const handleOptionSelect = (selectedOption) => {
    const isCorrect = selectedOption === quiz[currentQuestionIndex].correctAnswer;
    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    if (currentQuestionIndex < quiz.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const closeQuizModal = () => {
    setShowQuizModal(false);
    setQuizFinished(false);
    setCurrentQuestionIndex(0);
    setScore(0);
  };

  if (loading) return <div className="loading-state">Loading resource details...</div>;
  if (!resource) return <div className="loading-state">Resource not found.</div>;

  return (
    <div className="resource-detail-container">
      <div className="resource-detail-header">
        {resource.subject ? (
          <Link to={`/subjects/${resource.subject._id || resource.subject}`} className="back-link">← Back to Subject</Link>
        ) : (
          <Link to="/subjects" className="back-link">← Back to Subjects</Link>
        )}
        <h1>{resource.name}</h1>
        <p className="subtitle">
          Size: {(resource.size / 1024).toFixed(2)} KB • Type: {resource.type.toUpperCase()} •
          <a href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${resource.url}`} target="_blank" rel="noreferrer" className="view-original"> Open Original</a>
        </p>
      </div>

      <div className="split-view-container">

        {/* Left: AI Sidebar Column */}
        <div className="ai-actions-sidebar">
          <div className="action-buttons-list">
            {/* Summary Action */}
            <div className="action-card">
              <div className="action-info">
                <h3>📄 Document Summary</h3>
                <p>Extract the most important points instantly.</p>
              </div>
              {!summary ? (
                <button className="primary-btn ai-btn full-width-btn" onClick={handleGenerateSummary} disabled={loadingSummary}>
                  {loadingSummary ? 'Generating...' : 'Generate AI Summary'}
                </button>
              ) : (
                <button className="primary-btn ai-btn full-width-btn" onClick={() => setShowSummaryModal(true)}>
                  View AI Summary
                </button>
              )}
            </div>

            {/* Quiz Action */}
            <div className="action-card">
              <div className="action-info">
                <h3>📝 Knowledge Check Quiz</h3>
                <p>Test your retention with a 10-question MCQ.</p>
              </div>
              {!quiz ? (
                <button className="primary-btn ai-btn quiz-btn full-width-btn" onClick={handleGenerateQuiz} disabled={loadingQuiz}>
                  {loadingQuiz ? 'Generating...' : 'Generate AI Quiz'}
                </button>
              ) : (
                <button className="primary-btn ai-btn quiz-btn full-width-btn" onClick={startQuiz}>
                  Take Interactive Quiz
                </button>
              )}
            </div>

            {/* Chat Action */}
            <div className="action-card">
              <div className="action-info">
                <h3>💬 Chat with Document</h3>
                <p>Ask freeform questions directly to the text.</p>
              </div>
              <button className="primary-btn ai-btn chat-btn full-width-btn" onClick={() => navigate(`/chat?resource=${id}`)}>
                Start Chat
              </button>
            </div>
          </div>
        </div>

        {/* Right: Document Viewer Column */}
        <div className="document-viewer">
          {resource.type === 'pdf' ? (
            <iframe
              src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${resource.url}`}
              title={resource.name}
            />
          ) : (
            <div className="doc-placeholder">
              <div className="icon">📄</div>
              <p>Preview not available for {resource.type.toUpperCase()} files inline.</p>
              <a href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${resource.url}`} target="_blank" rel="noreferrer" className="primary-btn ai-btn">Download Original</a>
            </div>
          )}
        </div>

      </div>

      {/* Summary Modal */}
      {showSummaryModal && summary && (
        <div className="quiz-modal-overlay">
          <div className="quiz-modal summary-modal">
            <button className="close-modal-btn" onClick={() => setShowSummaryModal(false)}>&times;</button>
            <div className="quiz-modal-content">
              <h2 className="modal-heading">Document Summary</h2>
              <div className="summary-badge-container">
                <span className="badge">AI Generated</span>
              </div>
              <div className="summary-content-inner">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
              </div>
              <div className="quiz-actions" style={{ marginTop: '2rem' }}>
                <button className="primary-btn ai-btn secondary-btn" onClick={() => setShowSummaryModal(false)}>Close Summary</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {showQuizModal && quiz && (
        <div className="quiz-modal-overlay">
          <div className="quiz-modal">
            <button className="close-modal-btn" onClick={closeQuizModal}>&times;</button>

            <div className="live-score">
              Score: {score}
            </div>

            <div className="quiz-modal-content">
              {quizFinished ? (
                <div className="quiz-result-section">
                  <div className="completion-icon">🏆</div>
                  <h2 className="quiz-score-heading">Quiz Completed!</h2>
                  <div className="quiz-score-display">
                    Final Score: <span>{score}</span> / {quiz.length}
                  </div>
                  <div className="quiz-actions">
                    <button className="primary-btn ai-btn secondary-btn" onClick={closeQuizModal}>Close</button>
                    <button className="primary-btn ai-btn quiz-btn" onClick={startQuiz}>Play Again</button>
                  </div>
                </div>
              ) : (
                <div className="quiz-question-section">
                  <div className="quiz-progress">
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${((currentQuestionIndex) / quiz.length) * 100}%` }}></div>
                    </div>
                    <span>Question {currentQuestionIndex + 1} of {quiz.length}</span>
                  </div>
                  <h3 className="quiz-question-text">{quiz[currentQuestionIndex].question}</h3>
                  <div className="quiz-options">
                    {quiz[currentQuestionIndex].options.map((opt, idx) => (
                      <button
                        key={idx}
                        className="quiz-option-btn glass-btn"
                        onClick={() => handleOptionSelect(opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceDetail;
