import React, { createContext, useState, useContext, useEffect } from 'react';
import {
    getCurrentUser,
    isAuthenticated as checkAuth,
    login as loginService,
    register as registerService,
    logout as logoutService
} from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Vérifier la session au chargement
        const checkSession = () => {
            if (checkAuth()) {
                const currentUser = getCurrentUser();
                setUser(currentUser);
            }
            setLoading(false);
        };
        checkSession();
    }, []);

    const login = async (email, password) => {
        const data = await loginService(email, password);
        setUser(data.user);
        return data;
    };

    const register = async (email, name, password) => {
        const data = await registerService(email, name, password);
        setUser(data.user);
        return data;
    };

    const logout = async () => {
        await logoutService();
        setUser(null);
    };

    const isAuthenticated = !!user;

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            isAuthenticated,
            login,
            register,
            logout,
            setUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used in AuthProvider');
    }
    return context;
};
