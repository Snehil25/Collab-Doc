import React, { useState } from 'react';
import { useAuth } from '../pages/AuthContext';

function ShareModal({ documentId, onClose }) {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const { authHeader } = useAuth();

    const handleShare = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        try {
            const res = await fetch(`/api/documents/${documentId}/share`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader(),
                },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || 'Failed to share');
            setMessage(data.msg);
            setEmail('');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>Share Document</h2>
                <p>Enter the email of the user you want to collaborate with.</p>
                <form onSubmit={handleShare}>
                    <input
                        type="email"
                        placeholder="collaborator@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <button type="submit" className="auth-button">Share</button>
                </form>
                {error && <p className="error-message">{error}</p>}
                {message && <p className="success-message">{message}</p>}
                <button onClick={onClose} className="close-button">Close</button>
            </div>
        </div>
    );
}

export default ShareModal;