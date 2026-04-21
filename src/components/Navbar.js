import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LinearProgress from "@mui/material/LinearProgress";
import "./Navbar.css";

const MAX_CREDITS = 50000; 

const Navbar = ({ toggleTheme, theme }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const balance     = user?.credits?.balance ?? 0;
  const percentage  = Math.min((balance / MAX_CREDITS) * 100, 100);

  // Color based on balance health
  const getBarColor = () => {
    if (percentage > 50) return "#4caf50";   // green
    if (percentage > 20) return "#ff9800";   // orange
    return "#f44336";                         // red
  };

  const formatCredits = (val) => {
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
    return val;
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/dashboard">Study Assistant</Link>
      </div>

      <ul className="navbar-links">
        <li><Link to="/dashboard">Dashboard</Link></li>
        <li><Link to="/subjects">Subjects</Link></li>
        <li><Link to="/chat">💬 Chat</Link></li>
        <li><Link to="/qna">📋 QnA Sets</Link></li>
      </ul>

      <div className="navbar-actions">

        {/* Credits Bar */}
        {user?.credits != null && (
          <div className="credits-widget" title={`${balance.toLocaleString()} credits remaining`}>
            <div className="credits-header">
              <span className="credits-label">🪙 Credits</span>
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
              <Link to="/recharge" className="credits-low-warning">
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
      </div>
    </nav>
  );
};

export default Navbar;