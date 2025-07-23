import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import ShareModal from '../components/ShareModal';

const API_URL = process.env.REACT_APP_API_URL;

function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const navigate = useNavigate();
  const { authHeader, logout, user } = useAuth();

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch(`${API_URL}/api/documents`, {
          headers: authHeader()
        });
        if (!response.ok) {
            if (response.status === 401) logout();
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setDocuments(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocuments();
  }, [authHeader, logout]);

  const handleShareClick = (docId) => {
      setSelectedDocId(docId);
      setShowShareModal(true);
  };

  const createNewDocument = async () => {
    try {
        const response = await fetch(`${API_URL}/api/documents`, {
            method: 'POST',
            headers: authHeader()
        });
        if (!response.ok) throw new Error('Failed to create document');
        const data = await response.json();
        navigate(`/documents/${data.id}`);
    } catch (err) {
        setError(err.message);
    }
  };

  if (isLoading) return <div className="centered-message">Loading documents...</div>;
  if (error) return <div className="centered-message error">Error: {error}</div>;

  return (
    <>
      {showShareModal && <ShareModal documentId={selectedDocId} onClose={() => setShowShareModal(false)} />}
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1>My Documents</h1>
          <div>
            <button onClick={createNewDocument} className="create-button">
              + New Document
            </button>
            <button onClick={logout} className="logout-button">Logout</button>
          </div>
        </header>
        <main className="document-list">
          {documents.length > 0 ? (
            documents.map((doc) => {
              const isOwner = doc.owner_email === user.email;
              return (
                <div key={doc.id} className="document-card-container">
                    <Link to={`/documents/${doc.id}`} className="document-card">
                        <div className="document-icon">📄</div>
                        <div className="document-info">
                            <span className="document-id">ID: {doc.id}</span>
                            <span className="document-date">
                            Last updated: {new Date(doc.updated_at).toLocaleString()}
                            </span>
                            {!isOwner && <span className="shared-badge">Shared by {doc.owner_email}</span>}
                        </div>
                    </Link>
                    {isOwner && (
                        <button onClick={() => handleShareClick(doc.id)} className="share-button">
                            Share
                        </button>
                    )}
                </div>
              )
            })
          ) : (
            <div className="centered-message">
              <p>No documents found. Create one to get started!</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

export default Dashboard;