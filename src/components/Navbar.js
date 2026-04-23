import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LinearProgress from "@mui/material/LinearProgress";
import "./Navbar.css";

const MAX_CREDITS = 50000; 

const Navbar = ({ toggleTheme, theme }) => {
  const { user, logout, fetchUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const closeMenu = () => setMenuOpen(false);

  const handleRefreshCredits = async () => {
    if (fetchUser && !isRefreshing) {
      setIsRefreshing(true);
      await fetchUser();
      setTimeout(() => setIsRefreshing(false), 500); // Small visual delay
    }
  };

  const balance     = user?.credits?.balance ?? 0;
  const percentage  = Math.min((balance / MAX_CREDITS) * 100, 100);

  const getBarColor = () => {
    if (percentage > 50) return "#4caf50";
    if (percentage > 20) return "#ff9800";
    return "#f44336";
  };

  const formatCredits = (val) => {
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
    return val;
  };

  const isActive = (path) => location.pathname === path ? "active" : "";

  return (
    <>
      <nav className="navbar">
        <div className="navbar-logo">
          <Link to="/dashboard" onClick={closeMenu}>Study Assistant</Link>
        </div>

        {/* Desktop nav links */}
        <ul className="navbar-links navbar-links-desktop">
          <li><Link to="/dashboard" className={isActive("/dashboard")}>Dashboard</Link></li>
          <li><Link to="/subjects" className={isActive("/subjects")}>Subjects</Link></li>
          <li><Link to="/chat" className={isActive("/chat")}>💬 Chat</Link></li>
          <li><Link to="/qna" className={isActive("/qna")}>📋 QnA</Link></li>
          {user?.role === 'admin' && (
            <li><Link to="/admin" className={isActive("/admin")} style={{ color: 'var(--primary-color)' }}>⚙️ Admin</Link></li>
          )}
        </ul>

        <div className="navbar-actions">
          {user && (
            <div className="credits-widget" title={`${balance.toLocaleString()} credits remaining`}>
              <div className="credits-header">
                <span className="credits-label">
                  🪙 Credits
                  <button 
                    className={`refresh-credits-btn ${isRefreshing ? 'spinning' : ''}`}
                    onClick={handleRefreshCredits}
                    title="Refresh Credits"
                    aria-label="Refresh Credits"
                  >
                    🔄
                  </button>
                </span>
                <span className="credits-value" style={{ color: getBarColor() }}>
                  {formatCredits(balance)}
                  <span className="credits-max"> / {formatCredits(MAX_CREDITS)}</span>
                </span>
              </div>
              <LinearProgress
                variant="determinate"
                value={percentage}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: "rgba(128,128,128,0.2)",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: getBarColor(),
                    borderRadius: 3,
                  },
                }}
              />
              {balance < 5000 && (
                <Link to="/recharge" className="credits-low-warning" onClick={closeMenu}>
                  ⚠️ Low credits — Recharge
                </Link>
              )}
            </div>
          )}

          <span className="welcome-text">
            Welcome, {user?.name || user?.email}
          </span>

          <button onClick={toggleTheme} className="theme-toggle">
            {theme === "light" ? "🌙" : "☀️"}
          </button>

          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>

          {/* Hamburger — mobile only */}
          <button
            className={`hamburger ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Mobile menu — rendered OUTSIDE the navbar to avoid backdrop-filter issues */}
      {menuOpen && (
        <div className="mobile-menu-overlay" onClick={closeMenu}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <Link to="/dashboard" className={`mobile-menu-link ${isActive("/dashboard")}`} onClick={closeMenu}>
              📊 Dashboard
            </Link>
            <Link to="/subjects" className={`mobile-menu-link ${isActive("/subjects")}`} onClick={closeMenu}>
              📚 Subjects
            </Link>
            <Link to="/chat" className={`mobile-menu-link ${isActive("/chat")}`} onClick={closeMenu}>
              💬 Chat
            </Link>
            <Link to="/qna" className={`mobile-menu-link ${isActive("/qna")}`} onClick={closeMenu}>
              📋 QnA Sets
            </Link>
            {user?.role === 'admin' && (
              <Link to="/admin" className={`mobile-menu-link ${isActive("/admin")}`} onClick={closeMenu} style={{ color: 'var(--primary-color)' }}>
                ⚙️ Admin Panel
              </Link>
            )}

            <div className="mobile-menu-divider" />

            <button onClick={toggleTheme} className="mobile-menu-link mobile-theme-btn">
              {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
            </button>
            <button onClick={() => { handleLogout(); closeMenu(); }} className="mobile-menu-link mobile-logout-btn">
              🚪 Logout
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;