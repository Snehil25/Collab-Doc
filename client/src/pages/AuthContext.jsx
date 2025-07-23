import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(null); 
    const navigate = useNavigate();

    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
            const decoded = jwtDecode(token); 
            setUser(decoded.user); 
        } else {
            localStorage.removeItem('token');
            setUser(null);
        }
    }, [token]);

    const login = (newToken) => {
        setToken(newToken);
        navigate('/');
    };

    const logout = () => {
        setToken(null);
        navigate('/login');
    };

    const authHeader = () => {
        return token ? { 'x-auth-token': token } : {};
    };

    return (
        <AuthContext.Provider value={{ token, user, login, logout, authHeader }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);