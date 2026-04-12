import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './SubjectDetail.css';

const SubjectDetail = () => {
  const { id } = useParams();
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchSubject = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/subject/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setSubject(data);
      } else {
        alert(data.message || 'Error fetching subject details');
      }
    } catch (error) {
      console.error('Error fetching subject details', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubject();
  }, [id]);

  const handleUploadResource = async () => {
    if (!selectedFile || !subject) return;

    const formData = new FormData();
    formData.append('subjectId', subject._id);
    formData.append('subjectName', subject.name);
    formData.append('resourceFile', selectedFile);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/resource`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      const data = await response.json();
      if (response.ok) {
        fetchSubject();
        setSelectedFile(null);
        // Clear input file naturally using native dom event if possible, but state clearing is usually enough
      } else {
        alert(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading resource', error);
      alert('Network error');
    }
  };

  if (loading) return <div>Loading subject details...</div>;
  if (!subject) return <div>Subject not found.</div>;

  return (
    <div className="subject-detail-container">
      <div className="subject-detail-header">
        <Link to="/subjects" className="back-link">← Back to Subjects</Link>
        <h1>{subject.name}</h1>
      </div>

      <div className="detail-layout">
        <div className="resources-panel">
          <h2>Resources</h2>
          {(!subject.resources || subject.resources.length === 0) ? (
            <p className="no-resources">No resources attached to this subject yet.</p>
          ) : (
            <div className="resources-grid">
              {subject.resources.map(res => (
                <div key={res._id} className="resource-card">
                   <div className="res-icon">
                     {res.type === 'pdf' ? '📖' : res.type === 'docx' ? '📝' : '📄'}
                   </div>
                   <div className="res-info">
                     <a href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${res.url}`} target="_blank" rel="noreferrer">
                       {res.name}
                     </a>
                     <p>{(res.size / 1024).toFixed(2)} KB • {res.type.toUpperCase()}</p>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="upload-panel">
          <h2>Add Resource</h2>
          <p>Upload a PDF, Word Document(.docx), or Text File.</p>
          <div className="upload-box">
             <input 
                type="file" 
                accept=".pdf,.docx,.txt"
                onChange={(e) => setSelectedFile(e.target.files[0])}
             />
             <button 
               onClick={handleUploadResource}
               disabled={!selectedFile}
               className="upload-btn"
             >
               Upload File
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectDetail;
