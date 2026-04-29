import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Subjects from './pages/Subjects';
import SubjectDetail from './pages/SubjectDetail';
import ResourceDetail from './pages/ResourceDetail';
import Chat from './pages/Chat';
import QnaPage from './pages/QnaSet';
import { QnaPublicViewer, QnaDiscoverPage } from './pages/QnaPublic';
import AdminDashboard from './pages/AdminDashboard';
import ResourcePacks from './pages/ResourcePacks';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return user && user.role === 'admin' ? children : <Navigate to="/dashboard" />;
};

// Prevents admins from accessing student-only pages
const UserRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'admin') return <Navigate to="/admin" />;
  return children;
};

function AppContent() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    // Wake up backend on initial load
    fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/health`)
      .then(() => console.log('Backend wake-up initiated'))
      .catch(err => console.error('Failed to wake up backend:', err));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const { user } = useAuth();

  return (
    <Router>
      {user && <Navbar toggleTheme={toggleTheme} theme={theme} />}
      {!user && (
         <div className="guest-header">
           <h2>Study Assistant</h2>
           <button onClick={toggleTheme} className="theme-toggle">
            {theme === 'light' ? '🌙' : '☀️'}
           </button>
         </div>
      )}
      <Routes>
        <Route path="/" element={user ? (user.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} />
        <Route path="/login" element={<div className="main-content"><Login /></div>} />
        <Route path="/register" element={<div className="main-content"><Register /></div>} />
        <Route
          path="/dashboard"
          element={<UserRoute><div className="main-content"><Dashboard /></div></UserRoute>}
        />
        <Route
          path="/subjects"
          element={<UserRoute><div className="main-content"><Subjects /></div></UserRoute>}
        />
        <Route
          path="/resource-packs"
          element={<UserRoute><div className="main-content"><ResourcePacks /></div></UserRoute>}
        />
        <Route
          path="/subjects/:id"
          element={<ProtectedRoute><div className="main-content"><SubjectDetail /></div></ProtectedRoute>}
        />
        <Route
          path="/resources/:id"
          element={<ProtectedRoute><div className="main-content"><ResourceDetail /></div></ProtectedRoute>}
        />
        {/* Chat gets NO main-content wrapper — it manages its own full-bleed layout */}
        <Route
          path="/chat"
          element={<ProtectedRoute><Chat /></ProtectedRoute>}
        />
        <Route
          path="/qna"
          element={<ProtectedRoute><QnaPage /></ProtectedRoute>}
        />
        {/* Public QnA routes — no auth required */}
        <Route path="/qna/discover" element={<QnaDiscoverPage />} />
        <Route path="/qna/public/:id" element={<QnaPublicViewer />} />
        
        {/* Admin Route */}
        <Route
          path="/admin"
          element={<AdminRoute><div className="main-content"><AdminDashboard /></div></AdminRoute>}
        />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
