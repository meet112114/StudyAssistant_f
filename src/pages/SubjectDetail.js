import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './SubjectDetail.css';

const SubjectDetail = () => {
  const { id } = useParams();
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
    if (!selectedFile || !subject || isUploading) return;

    setIsUploading(true);
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
        setShowUploadModal(false);
      } else {
        alert(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading resource', error);
      alert('Network error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteResource = async (e, resourceId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm('Are you sure you want to delete this resource?')) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/resource/item/${resourceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        fetchSubject();
      } else {
        const data = await response.json();
        alert(data.message || 'Error deleting resource');
      }
    } catch (error) {
      console.error('Error deleting resource', error);
      alert('Network error');
    }
  };

  const handleRetryEmbedding = async (e, resourceId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/resource/item/${resourceId}/retry-embedding`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message || 'Embedding generation started');
        fetchSubject();
      } else {
        alert(data.message || 'Error retrying embedding');
      }
    } catch (error) {
      console.error('Error retrying embedding', error);
      alert('Network error');
    }
  };

  if (loading) return <div>Loading subject details...</div>;
  if (!subject) return <div>Subject not found.</div>;

  return (
    <div className="subject-detail-container">
      <div className="subject-detail-header">
        <Link to="/subjects" className="back-link">← Back to Subjects</Link>
        <div className="title-row">
          <h1>{subject.name}</h1>
          <button className="primary-btn add-btn" onClick={() => setShowUploadModal(true)}>
            + Add Resource
          </button>
        </div>
      </div>

      <div className="resources-panel">
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
                   <Link to={`/resources/${res._id}`} className="resource-link">
                     {res.name}
                   </Link>
                   <p>{(res.size / 1024).toFixed(2)} KB • {res.type.toUpperCase()}</p>
                 </div>
                 
                 <div className="res-actions" style={{display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto'}}>
                   {res.embeddingCreated ? (
                     <span style={{color: '#4caf50', fontSize: '12px', display: 'flex', alignItems: 'center'}} title="Embedding Created">
                       🟢 AI Ready
                     </span>
                   ) : (
                     <button 
                       className="primary-btn" 
                       style={{padding: '4px 8px', fontSize: '12px', backgroundColor: '#ff9800'}}
                       onClick={(e) => handleRetryEmbedding(e, res._id)}
                       title="Retry Embedding Generation"
                     >
                       Retry AI
                     </button>
                   )}
                   <button 
                     className="delete-btn" 
                     onClick={(e) => handleDeleteResource(e, res._id)}
                     title="Delete Resource"
                   >
                     🗑️
                   </button>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showUploadModal && (
        <div className="modal-overlay">
          <div className="upload-modal">
            <button className="close-modal-btn" onClick={() => {
                setShowUploadModal(false);
                setSelectedFile(null);
                setIsUploading(false);
            }}>&times;</button>
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
                   disabled={!selectedFile || isUploading}
                   className="upload-btn primary-btn"
                 >
                   {isUploading ? 'Uploading...' : 'Upload File'}
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectDetail;
