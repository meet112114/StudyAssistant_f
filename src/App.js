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
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

function AppContent() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

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
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
        <Route path="/login" element={<div className="main-content"><Login /></div>} />
        <Route path="/register" element={<div className="main-content"><Register /></div>} />
        <Route
          path="/dashboard"
          element={<ProtectedRoute><div className="main-content"><Dashboard /></div></ProtectedRoute>}
        />
        <Route
          path="/subjects"
          element={<ProtectedRoute><div className="main-content"><Subjects /></div></ProtectedRoute>}
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
