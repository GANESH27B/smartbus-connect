"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

// User type matching your DB/API response
export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Check session on mount
    useEffect(() => {
        checkSession();
    }, []);

    const checkSession = async () => {
        try {
            const res = await fetch('/api/auth/me');
            const data = await res.json();
            if (data.success && data.user) {
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Session check failed", error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    const signInWithGoogle = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/auth/google/url');
            const data = await res.json();

            if (data.success && data.url) {
                window.location.href = data.url;
            } else {
                console.error("Failed to get Google OAuth URL");
                alert("Google Auth Configuration Invalid");
                setLoading(false);
            }
        } catch (error) {
            console.error("Google Sign In Error:", error);
            setLoading(false);
        }
    };

    const signInWithEmail = async (email: string, password: string): Promise<void> => {
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();
            if (!data.success) {
                throw new Error(data.error || 'Login failed');
            }

            setUser(data.data);
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            setLoading(false);
        }
    }

    const signUpWithEmail = async (name: string, email: string, password: string): Promise<void> => {
        setLoading(true);
        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();
            if (!data.success) {
                throw new Error(data.error || 'Signup failed');
            }

            setUser(data.data);
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            setLoading(false);
        }
    }

    const signOut = async () => {
        setLoading(true);
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            setUser(null);
        } catch (error) {
            console.error("Logout failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut, signInWithEmail, signUpWithEmail }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
