import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ResourcePacks.css';

const ResourcePacks = () => {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cloningId, setCloningId] = useState(null);
  const navigate = useNavigate();

  const fetchPacks = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/resource-packs`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setPacks(data);
      }
    } catch (error) {
      console.error('Error fetching resource packs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPacks();
  }, []);

  const handleClonePack = async (packId) => {
    if (!window.confirm('Add all subjects and resources from this pack to your account?')) return;
    
    setCloningId(packId);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/resource-packs/${packId}/clone`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        alert('Resource pack successfully added to your account! Background AI processing has started.');
        navigate('/subjects');
      } else {
        alert(data.message || 'Error adding resource pack');
      }
    } catch (error) {
      console.error('Error adding resource pack', error);
      alert('Network error');
    } finally {
      setCloningId(null);
    }
  };

  if (loading) return <div className="subjects-container"><div style={{padding: '20px'}}>Loading resource packs...</div></div>;

  return (
    <div className="subjects-container">
      <div className="subjects-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Available Resource Packs</h1>
        <button onClick={() => navigate('/subjects')} className="back-btn">Back to Subjects</button>
      </div>

      <div className="subjects-list">
        {packs.length === 0 ? (
          <p>No resource packs available at the moment.</p>
        ) : (
          packs.map(pack => (
            <div key={pack._id} className="subject-card pack-card">
              <div className="subject-card-content">
                <h3>{pack.name}</h3>
                <p>{pack.description}</p>
                <div className="pack-details">
                    <span>{pack.subjects?.length || 0} Subjects included</span>
                </div>
              </div>
              <button 
                className="add-pack-btn"
                onClick={() => handleClonePack(pack._id)}
                disabled={cloningId === pack._id}
              >
                {cloningId === pack._id ? 'Adding...' : 'Add Pack'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ResourcePacks;
