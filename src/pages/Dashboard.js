import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.name || user?.email}!</p>
      </div>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon subjects-icon">📚</div>
          <div className="stat-info">
            <h3>Subjects</h3>
            <p className="stat-value subjects-val">{user?.subjectsCount || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon resources-icon">📄</div>
          <div className="stat-info">
            <h3>Resources</h3>
            <p className="stat-value resources-val">{user?.resourcesCount || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon credits-icon">🪙</div>
          <div className="stat-info">
            <h3>Credits Used</h3>
            <p className="stat-value credits-val">{user?.credits?.totalUsed?.toLocaleString() || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon tokens-icon">💵</div>
          <div className="stat-info">
            <h3>Est. Cost (Rs)</h3>
            <p className="stat-value cost-val">₹{((user?.credits?.totalUsed || 0) / 500).toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-actions">
        <h2 className="section-title">Quick Actions</h2>
        <div className="action-grid">
          <Link to="/subjects" className="action-card">
             <div className="action-icon">📖</div>
             <h3>Manage Subjects</h3>
             <p>Organize your study materials and view resources.</p>
          </Link>
          <Link to="/chat" className="action-card">
             <div className="action-icon">🤖</div>
             <h3>AI Chat Assistant</h3>
             <p>Ask questions and interact with your study materials.</p>
          </Link>
          <Link to="/qna" className="action-card">
             <div className="action-icon">📝</div>
             <h3>QnA Sets</h3>
             <p>Review and generate smart quizzes for learning.</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
