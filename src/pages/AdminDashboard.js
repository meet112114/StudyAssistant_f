import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [addCreditAmount, setAddCreditAmount] = useState({});

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [statsRes, usersRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/admin/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/admin/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
    } catch (err) {
      console.error("Error fetching admin data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredits = async (userId) => {
    const amountRs = addCreditAmount[userId];
    if (!amountRs || amountRs <= 0) return alert("Please enter a valid amount in Rs.");
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/admin/users/${userId}/add-credits`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amountRs: Number(amountRs) })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Successfully added ${data.creditsAdded} credits.`);
        setUsers(prev => prev.map(u => {
          if (u._id === userId) {
            return {
              ...u,
              credits: {
                ...u.credits,
                balance: data.newBalance,
                totalPurchased: data.totalPurchased
              }
            };
          }
          return u;
        }));
        setAddCreditAmount(prev => ({ ...prev, [userId]: '' }));
      } else {
        alert(data.message || "Failed to add credits");
      }
    } catch (err) {
      console.error("Error adding credits", err);
      alert("An error occurred");
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="admin-loading">Loading Admin Panel...</div>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Control Panel</h1>
        <p>Welcome back, {user?.name}</p>
      </div>

      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          Dashboard
        </button>
        <button className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          Users & Subs
        </button>
        <button className={`admin-tab ${activeTab === 'usage' ? 'active' : ''}`} onClick={() => setActiveTab('usage')}>
          AI & Credits Usage
        </button>
      </div>

      <div className="admin-content">
        {(activeTab === 'users' || activeTab === 'usage') && (
          <div className="admin-search-container">
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-search-input"
            />
          </div>
        )}

        {activeTab === 'overview' && stats && (
          <div className="admin-overview">
            <div className="stat-card">
              <h3>Total Users</h3>
              <p className="stat-value">{stats.totalUsers}</p>
            </div>
            <div className="stat-card">
              <h3>Total Subjects</h3>
              <p className="stat-value">{stats.totalSubjects}</p>
            </div>
            <div className="stat-card">
              <h3>Total Resources</h3>
              <p className="stat-value">{stats.totalResources}</p>
            </div>
            <div className="stat-card">
              <h3>Total Credits Consumed</h3>
              <p className="stat-value">{stats.totalCreditsUsed.toLocaleString()}</p>
            </div>
            <div className="stat-card">
              <h3>Total AI Tokens (In/Out)</h3>
              <p className="stat-value">{stats.totalInputTokens.toLocaleString()} / {stats.totalOutputTokens.toLocaleString()}</p>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="admin-users-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Subjects</th>
                  <th>Resources</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u._id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                    <td>{u.subjectsCount}</td>
                    <td>{u.resourcesCount}</td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'usage' && (
          <div className="admin-users-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Credits Used</th>
                  <th>Credits Balance</th>
                  <th>Money spent (Est Rs)</th>
                  <th>Input Tokens</th>
                  <th>Output Tokens</th>
                  <th>Add Credits (Rs)</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => {
                  const moneySpent = ((u.credits?.totalPurchased || 0) / 500).toFixed(2);
                  return (
                    <tr key={u._id}>
                      <td>
                        <div className="user-info">
                          <span className="user-name">{u.name}</span>
                          <span className="user-email">{u.email}</span>
                        </div>
                      </td>
                      <td className="highlight-val">{u.credits?.totalUsed?.toLocaleString() || 0}</td>
                      <td>{u.credits?.balance?.toLocaleString() || 0}</td>
                      <td>₹{moneySpent}</td>
                      <td>{u.aiUsage?.inputTokens?.toLocaleString() || 0}</td>
                      <td>{u.aiUsage?.outputTokens?.toLocaleString() || 0}</td>
                      <td>
                        <div className="add-credits-controls">
                          <input 
                            type="number" 
                            min="1"
                            placeholder="Rs." 
                            value={addCreditAmount[u._id] || ''}
                            onChange={(e) => setAddCreditAmount(prev => ({...prev, [u._id]: e.target.value}))}
                            className="add-credits-input"
                          />
                          <button onClick={() => handleAddCredits(u._id)} className="add-credits-btn">Add</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
