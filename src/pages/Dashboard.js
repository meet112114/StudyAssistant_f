import React from 'react';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.name || user?.email}!</p>
      </div>
      
      <div className="dashboard-widgets">
        <div className="widget">
           <h3>Overview</h3>
           <p>This is a minimal dashboard. Navigate to Subjects to manage your study subjects.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
