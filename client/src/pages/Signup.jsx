import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Signup() {
    const [formData, setFormData] = useState({ email: '', password: '', password2: '' });
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const { email, password, password2 } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
    
    const API_BASE = process.env.REACT_APP_API_URL;
    const onSubmit = async e => {
        e.preventDefault();
        if (password !== password2) {
            setError('Passwords do not match');
            return;
        }
        try {
            const res = await fetch(`${API_BASE}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || 'Failed to sign up');
            setMessage('Registration successful! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="auth-container">
            <h1>Sign Up</h1>
            <p>Create your account</p>
            {error && <p className="error-message">{error}</p>}
            {message && <p className="success-message">{message}</p>}
            <form onSubmit={onSubmit}>
                <input type="email" placeholder="Email Address" name="email" value={email} onChange={onChange} required />
                <input type="password" placeholder="Password" name="password" value={password} minLength="6" onChange={onChange} required />
                <input type="password" placeholder="Confirm Password" name="password2" value={password2} minLength="6" onChange={onChange} required />
                <button type="submit" className="auth-button">Register</button>
            </form>
            <p>
                Already have an account? <Link to="/login">Sign In</Link>
            </p>
        </div>
    );
}

export default Signup;