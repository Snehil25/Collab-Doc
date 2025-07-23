import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

function Editor() {
  const { documentId } = useParams();
  const [socket, setSocket] = useState(null);
  const [content, setContent] = useState('');
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState("Connecting...");
  const { token } = useAuth(); 

  useEffect(() => {
    if (!token) return; 
    const s = io({ auth: { token } });
    setSocket(s);

    s.on('connect', () => setStatus("Connected"));
    s.on('disconnect', () => setStatus("Disconnected"));
    s.on('auth-error', (error) => {
        setStatus(`Auth Error: ${error.message}`);
        console.error(error.message);
    });

    return () => s.disconnect();
  }, [token]);

  useEffect(() => {
    if (socket == null || documentId == null) return;

    socket.once("load-document", (doc) => {
      setContent(doc.content);
      setHistory(doc.history || []);
      setStatus(`Editing Document`);
    });

    socket.emit("get-document", documentId);
  }, [socket, documentId]);

  useEffect(() => {
    if (socket == null) return;
    const handler = (newContent) => setContent(newContent);
    socket.on("receive-changes", handler);
    return () => socket.off("receive-changes", handler);
  }, [socket]);
  
  useEffect(() => {
    if (socket == null) return;
    const historyUpdateHandler = ({ history: newHistory }) => setHistory(newHistory);
    socket.on("document-saved", historyUpdateHandler);
    return () => socket.off("document-saved", historyUpdateHandler);
  }, [socket]);

  const handleChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    socket.emit("send-changes", { documentId, content: newContent });
  };
  
  const handleSave = () => {
    if (socket) {
        setStatus("Saving...");
        socket.emit("save-document", { documentId, content });
        setTimeout(() => setStatus(`Editing Document`), 1000);
    }
  };

  const revertToVersion = (versionContent) => {
      setContent(versionContent);
      socket.emit("send-changes", { documentId, content: versionContent });
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <Link to="/" className="back-link">&larr; Dashboard</Link>
        <div className="status-bar">
          <span>{status}</span>
          <button onClick={handleSave} className="save-button">Save Version</button>
        </div>
      </header>
      <div className="main-content">
        <textarea className="editor-textarea" value={content} onChange={handleChange} />
        <aside className="sidebar">
            <h2>Version History</h2>
            {history && history.length > 0 ? (
                <ul className="history-list">
                    {history.map((item, index) => (
                        <li key={index} className="history-item">
                            <span className="version-label">Version {history.length - index}</span>
                            <button onClick={() => revertToVersion(item)} className="revert-button">
                                Revert
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No versions saved yet.</p>
            )}
        </aside>
      </div>
    </div>
  );
}

export default Editor;