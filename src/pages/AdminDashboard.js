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
  const [packs, setPacks] = useState([]);
  const [adminSubjects, setAdminSubjects] = useState([]);
  const [newPackName, setNewPackName] = useState('');
  const [newPackDesc, setNewPackDesc] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [editingPackId, setEditingPackId] = useState(null);
  
  const [newSubjectName, setNewSubjectName] = useState('');
  const [uploadSubjectId, setUploadSubjectId] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [packSubTab, setPackSubTab] = useState('subjects');
  const [expandedSubject, setExpandedSubject] = useState(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [statsRes, usersRes, packsRes, subsRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/admin/dashboard`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/resource-packs`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/subject`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (packsRes.ok) setPacks(await packsRes.json());
      if (subsRes.ok) setAdminSubjects(await subsRes.json());
    } catch (err) {
      console.error("Error fetching admin data", err);
    } finally {
      setLoading(false);
    }
  };

  // Silent refresh — updates subjects & packs without showing the loading screen.
  // Used by all CRUD operations so the page never "reloads" visually.
  const refreshSubjectsAndPacks = async () => {
    try {
      const token = localStorage.getItem('token');
      const [packsRes, subsRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/resource-packs`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/subject`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (packsRes.ok) setPacks(await packsRes.json());
      if (subsRes.ok) setAdminSubjects(await subsRes.json());
    } catch (err) {
      console.error("Silent refresh failed", err);
    }
  };

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/subject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ name: newSubjectName })
      });
      if (res.ok) {
        setNewSubjectName('');
        refreshSubjectsAndPacks();
      } else alert('Error adding subject');
    } catch (err) { console.error(err); }
  };

  const handleDeleteSubject = async (subId) => {
    if (!window.confirm('Delete this subject and all its resources?')) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/subject/${subId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        // Also collapse the subject if it was expanded
        setExpandedSubject(prev => prev === subId ? null : prev);
        refreshSubjectsAndPacks();
      } else alert('Error deleting subject');
    } catch (err) { console.error(err); }
  };

  const handleUploadResource = async (sub) => {
    if (!uploadFile || uploadSubjectId !== sub._id || isUploading) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('subjectId', sub._id);
    formData.append('subjectName', sub.name);
    formData.append('resourceFile', uploadFile);

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/resource`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      if (res.ok) {
        setUploadFile(null);
        setUploadSubjectId(null);
        // Silent refresh — keeps expanded subject open, no loading flash
        refreshSubjectsAndPacks();
      } else alert('Upload failed');
    } catch (err) { console.error(err); }
    finally { setIsUploading(false); }
  };

  const handleDeleteResource = async (resId) => {
    if (!window.confirm('Delete this resource?')) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/resource/item/${resId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) refreshSubjectsAndPacks();
      else alert('Error deleting resource');
    } catch (err) { console.error(err); }
  };

  const handleRetryEmbedding = async (resId) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/resource/item/${resId}/retry-embedding`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Embedding generation started');
        refreshSubjectsAndPacks();
      } else {
        alert(data.message || 'Error retrying embedding');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
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

  const handleToggleBlock = async (userId, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'unblock' : 'block'} this user?`)) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/admin/users/${userId}/toggle-block`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, isBlocked: data.isBlocked } : u));
      } else {
        const data = await res.json();
        alert(data.message || 'Error toggling block status');
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('CRITICAL: This will permanently delete the user AND all their subjects, resources, and data. Proceed?')) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u._id !== userId));
      } else {
        const data = await res.json();
        alert(data.message || 'Error deleting user');
      }
    } catch (err) { console.error(err); }
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
        <button className={`admin-tab ${activeTab === 'packs' ? 'active' : ''}`} onClick={() => setActiveTab('packs')}>
          Resource Packs
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
                  <th>Status</th>
                  <th>Subjects</th>
                  <th>Resources</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u._id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                    <td>
                      {u.isBlocked ? <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Blocked</span> : <span style={{ color: '#10b981' }}>Active</span>}
                    </td>
                    <td>{u.subjectsCount}</td>
                    <td>{u.resourcesCount}</td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      {u.role !== 'admin' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            className="rp-btn-sm" 
                            style={{ background: u.isBlocked ? '#10b981' : '#f59e0b', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer' }}
                            onClick={() => handleToggleBlock(u._id, u.isBlocked)}
                          >
                            {u.isBlocked ? 'Unblock' : 'Block'}
                          </button>
                          <button 
                            className="rp-btn-sm" 
                            style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer' }}
                            onClick={() => handleDeleteUser(u._id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
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
                  const moneySpent = (u.moneySpent || 0).toFixed(2);
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

        {activeTab === 'packs' && (
          <div className="rp-container">
            {/* Sub-tab navigation */}
            <div className="rp-subtabs">
              <button className={`rp-subtab ${packSubTab === 'subjects' ? 'active' : ''}`} onClick={() => setPackSubTab('subjects')}>
                📚 Subjects & Resources
              </button>
              <button className={`rp-subtab ${packSubTab === 'create' ? 'active' : ''}`} onClick={() => setPackSubTab('create')}>
                {editingPackId ? '✏️ Edit Pack' : '➕ Create Pack'}
              </button>
              <button className={`rp-subtab ${packSubTab === 'published' ? 'active' : ''}`} onClick={() => setPackSubTab('published')}>
                📦 Published Packs <span className="rp-badge">{packs.length}</span>
              </button>
            </div>

            {/* ─── SUB-TAB 1: Subjects & Resources ─── */}
            {packSubTab === 'subjects' && (
              <div className="rp-section">
                <div className="rp-section-header">
                  <div>
                    <h2>Subjects & Resources</h2>
                    <p>Create subjects and upload resource files. These will be available to bundle into packs.</p>
                  </div>
                </div>

                <div className="rp-add-subject-row">
                  <input 
                    type="text" 
                    placeholder="Enter new subject name…" 
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                    className="rp-input"
                  />
                  <button onClick={handleAddSubject} className="rp-btn-primary" disabled={!newSubjectName.trim()}>
                    + Add Subject
                  </button>
                </div>

                {adminSubjects.length === 0 ? (
                  <div className="rp-empty-state">
                    <span className="rp-empty-icon">📂</span>
                    <p>No subjects yet. Create your first subject above.</p>
                  </div>
                ) : (
                  <div className="rp-subjects-grid">
                    {adminSubjects.map(sub => (
                      <div key={sub._id} className={`rp-subject-card ${expandedSubject === sub._id ? 'expanded' : ''}`}>
                        <div className="rp-subject-header" onClick={() => setExpandedSubject(expandedSubject === sub._id ? null : sub._id)}>
                          <div className="rp-subject-title">
                            <span className="rp-subject-icon">📘</span>
                            <div>
                              <h3>{sub.name}</h3>
                              <span className="rp-subject-meta">{sub.resources?.length || 0} resources</span>
                            </div>
                          </div>
                          <div className="rp-subject-actions">
                            <button className="rp-btn-icon rp-btn-danger" onClick={(e) => { e.stopPropagation(); handleDeleteSubject(sub._id); }} title="Delete Subject">
                              🗑️
                            </button>
                            <span className="rp-chevron">{expandedSubject === sub._id ? '▲' : '▼'}</span>
                          </div>
                        </div>

                        {expandedSubject === sub._id && (
                          <div className="rp-subject-body">
                            {sub.resources && sub.resources.length > 0 ? (
                              <div className="rp-resource-list">
                                {sub.resources.map(res => (
                                  <div key={res._id} className="rp-resource-item">
                                    <div className="rp-resource-info">
                                      <span className="rp-resource-icon">{res.type === 'pdf' ? '📕' : res.type === 'docx' ? '📝' : '📄'}</span>
                                      <div>
                                        <span className="rp-resource-name">{res.name}</span>
                                        <span className="rp-resource-meta">{(res.size / 1024).toFixed(1)} KB • {res.type.toUpperCase()}</span>
                                      </div>
                                    </div>
                                    <div className="rp-resource-actions">
                                      {res.embeddingCreated ? (
                                        <span className="rp-status-badge rp-status-success" title="Embedding Created">🟢 AI Ready</span>
                                      ) : (
                                        <button className="rp-btn-sm rp-btn-warning" onClick={() => handleRetryEmbedding(res._id)} title="Retry Embedding">
                                          ⚡ Retry AI
                                        </button>
                                      )}
                                      <button className="rp-btn-icon rp-btn-danger" onClick={() => handleDeleteResource(res._id)} title="Delete Resource">
                                        🗑️
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="rp-no-resources">No resources uploaded yet.</p>
                            )}

                            <div className="rp-upload-row">
                              <label className="rp-file-label">
                                <input 
                                  type="file" 
                                  accept=".pdf,.docx,.txt"
                                  onChange={(e) => {
                                    setUploadSubjectId(sub._id);
                                    setUploadFile(e.target.files[0]);
                                  }}
                                  className="rp-file-input"
                                />
                                <span className="rp-file-btn">📎 Choose File</span>
                                <span className="rp-file-name">
                                  {uploadSubjectId === sub._id && uploadFile ? uploadFile.name : 'No file selected'}
                                </span>
                              </label>
                              <button 
                                onClick={() => handleUploadResource(sub)} 
                                className="rp-btn-primary rp-btn-sm"
                                disabled={uploadSubjectId !== sub._id || !uploadFile || isUploading}
                              >
                                {isUploading && uploadSubjectId === sub._id ? '⏳ Uploading…' : '⬆️ Upload'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─── SUB-TAB 2: Create / Edit Pack ─── */}
            {packSubTab === 'create' && (
              <div className="rp-section">
                <div className="rp-section-header">
                  <div>
                    <h2>{editingPackId ? '✏️ Editing Pack' : '➕ Create New Pack'}</h2>
                    <p>{editingPackId ? 'Modify the pack details and re-select subjects.' : 'Bundle your subjects and resources into a shareable pack for students.'}</p>
                  </div>
                  {editingPackId && (
                    <button className="rp-btn-ghost" onClick={() => { setEditingPackId(null); setNewPackName(''); setNewPackDesc(''); setSelectedSubjects([]); }}>
                      ✕ Cancel Editing
                    </button>
                  )}
                </div>

                <div className="rp-form">
                  <div className="rp-form-group">
                    <label className="rp-label">Pack Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. MCA Semester 1 Bundle" 
                      value={newPackName}
                      onChange={e => setNewPackName(e.target.value)}
                      className="rp-input"
                    />
                  </div>
                  <div className="rp-form-group">
                    <label className="rp-label">Description</label>
                    <input 
                      type="text" 
                      placeholder="Brief description of what this pack contains" 
                      value={newPackDesc}
                      onChange={e => setNewPackDesc(e.target.value)}
                      className="rp-input"
                    />
                  </div>
                  
                  <div className="rp-form-group">
                    <label className="rp-label">Select Subjects to Bundle</label>
                    {adminSubjects.length === 0 ? (
                      <div className="rp-empty-state rp-empty-sm">
                        <p>No subjects available. Go to the "Subjects & Resources" tab to create some first.</p>
                      </div>
                    ) : (
                      <div className="rp-select-grid">
                        {adminSubjects.map(sub => (
                          <label key={sub._id} className={`rp-select-card ${selectedSubjects.includes(sub._id) ? 'selected' : ''}`}>
                            <input 
                              type="checkbox"
                              checked={selectedSubjects.includes(sub._id)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedSubjects([...selectedSubjects, sub._id]);
                                else setSelectedSubjects(selectedSubjects.filter(id => id !== sub._id));
                              }}
                            />
                            <div className="rp-select-info">
                              <span className="rp-select-name">{sub.name}</span>
                              <span className="rp-select-count">{sub.resources?.length || 0} files</span>
                            </div>
                            <span className="rp-select-check">{selectedSubjects.includes(sub._id) ? '✅' : ''}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rp-form-actions">
                    <button 
                      className="rp-btn-primary rp-btn-lg"
                      disabled={!newPackName || selectedSubjects.length === 0}
                      onClick={async () => {
                        if (!newPackName || selectedSubjects.length === 0) return alert('Name and at least one subject required');
                        try {
                          const url = editingPackId 
                              ? `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/resource-packs/${editingPackId}`
                              : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/resource-packs`;
                          const method = editingPackId ? 'PUT' : 'POST';
                          
                          const res = await fetch(url, {
                            method,
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name: newPackName, description: newPackDesc, subjectIds: selectedSubjects })
                          });
                          if (res.ok) {
                            alert(editingPackId ? 'Pack updated!' : 'Pack created!');
                            setNewPackName(''); setNewPackDesc(''); setSelectedSubjects([]); setEditingPackId(null);
                            fetchAdminData();
                            setPackSubTab('published');
                          } else { alert((await res.json()).message); }
                        } catch(err) { console.error(err); }
                      }}
                    >
                      {editingPackId ? '💾 Save Changes' : '🚀 Publish Pack'}
                    </button>
                    {editingPackId && (
                      <button className="rp-btn-ghost" onClick={() => { setEditingPackId(null); setNewPackName(''); setNewPackDesc(''); setSelectedSubjects([]); }}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ─── SUB-TAB 3: Published Packs ─── */}
            {packSubTab === 'published' && (
              <div className="rp-section">
                <div className="rp-section-header">
                  <div>
                    <h2>Published Packs</h2>
                    <p>Manage your published resource packs. Toggle visibility, edit, or delete.</p>
                  </div>
                  <button className="rp-btn-primary" onClick={() => setPackSubTab('create')}>
                    + New Pack
                  </button>
                </div>

                {packs.length === 0 ? (
                  <div className="rp-empty-state">
                    <span className="rp-empty-icon">📦</span>
                    <p>No packs published yet. Create one from the "Create Pack" tab.</p>
                  </div>
                ) : (
                  <div className="rp-packs-grid">
                    {packs.map(p => (
                      <div key={p._id} className="rp-pack-card">
                        <div className="rp-pack-header">
                          <h3>{p.name}</h3>
                          <span className={`rp-visibility-badge ${p.isVisible ? 'visible' : 'hidden'}`}>
                            {p.isVisible ? '🟢 Visible' : '🔴 Hidden'}
                          </span>
                        </div>
                        {p.description && <p className="rp-pack-desc">{p.description}</p>}
                        <div className="rp-pack-stats">
                          <span>📚 {p.subjects?.length || 0} subjects</span>
                          <span>📄 {p.subjects?.reduce((acc, s) => acc + (s.resources?.length || 0), 0) || 0} resources</span>
                        </div>
                        <div className="rp-pack-actions">
                          <button 
                            className="rp-btn-outline"
                            onClick={() => {
                              setEditingPackId(p._id);
                              setNewPackName(p.name);
                              setNewPackDesc(p.description || '');
                              const mappedIds = p.subjects.map(ps => {
                                if (ps.originalSubjectId) return ps.originalSubjectId;
                                const matched = adminSubjects.find(as => as.name === ps.name);
                                return matched ? matched._id : null;
                              }).filter(Boolean);
                              setSelectedSubjects(mappedIds);
                              setPackSubTab('create');
                            }}
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            className={`rp-btn-outline ${p.isVisible ? 'rp-btn-outline-danger' : 'rp-btn-outline-success'}`}
                            onClick={async () => {
                              await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/resource-packs/${p._id}/toggle-visibility`, {
                                method: 'PUT', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                              });
                              fetchAdminData();
                            }}
                          >
                            {p.isVisible ? '👁️ Hide' : '👁️ Show'}
                          </button>
                          <button 
                            className="rp-btn-outline rp-btn-outline-danger"
                            onClick={async () => {
                              if(!window.confirm('Delete this pack permanently?')) return;
                              await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/resource-packs/${p._id}`, {
                                method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                              });
                              fetchAdminData();
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
