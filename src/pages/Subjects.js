import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Subjects.css';

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const user_active_mode = process.env.REACT_APP_USER_ACTIVE_MODE === "true";

  const fetchSubjects = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/subject`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setSubjects(data);
      }
    } catch (error) {
      console.error('Error fetching subjects', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.trim()) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/subject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name: newSubject })
      });
      const data = await response.json();
      if (response.ok) {
        setSubjects([...subjects, { ...data, resources: [] }]);
        setNewSubject('');
      } else {
        alert(data.message || 'Error adding subject');
      }
    } catch (error) {
      console.error('Error adding subject', error);
      alert('Network error');
    }
  };

  const handleDeleteSubject = async (e, subjectId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm('Are you sure you want to delete this subject and all its resources?')) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/subject/${subjectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        setSubjects(subjects.filter(s => s._id !== subjectId));
      } else {
        const data = await response.json();
        alert(data.message || 'Error deleting subject');
      }
    } catch (error) {
      console.error('Error deleting subject', error);
      alert('Network error');
    }
  };

  if (loading) return <div>Loading subjects...</div>;

  return (
    <div className="subjects-container">
      <div className="subjects-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <h1>Your Subjects</h1>
        <Link to="/resource-packs" style={{ padding: '10px 20px', backgroundColor: 'var(--primary-color)', color: 'white', borderRadius: '6px', textDecoration: 'none', fontWeight: '500' }}>
          Browse Resource Packs
        </Link>
      </div>

      {user_active_mode &&
      <div className="add-subject-section">
        <form onSubmit={handleAddSubject} className="add-subject-form">
          <input 
            type="text" 
            placeholder="New Subject Name" 
            value={newSubject} 
            onChange={(e) => setNewSubject(e.target.value)} 
          />
          <button type="submit">Add Subject</button>
        </form>
      </div> }
      

      <div className="subjects-list">
        {subjects.length === 0 ? (
          <p>No subjects found. Add one above!</p>
        ) : (
          subjects.map(subject => (
            <Link to={`/subjects/${subject._id}`} key={subject._id} className="subject-card">
              <div className="subject-card-content">
                <h3>{subject.name}</h3>
                <p>{subject.resources?.length || 0} Resources</p>
              </div>
              {user_active_mode && 
                <button 
                className="delete-btn" 
                onClick={(e) => handleDeleteSubject(e, subject._id)}
                title="Delete Subject"
              >
                🗑️
              </button>
              }
             
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default Subjects;
