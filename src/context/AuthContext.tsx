"use client";

import { createContext, useContext, useState, ReactNode } from "react";

// Mock User type since we removed Firebase
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
    signInWithEmail: (name: string, email: string) => Promise<void>; // Added for mock email login
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    // Mock user state
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false); // No initial loading needed for mock

    const signInWithGoogle = async () => {
        setLoading(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        setUser({
            uid: "mock-google-user-123",
            email: "demo.user@gmail.com",
            displayName: "Demo User",
            photoURL: "https://github.com/shadcn.png"
        });
        setLoading(false);
    };

    const signInWithEmail = async (name: string, email: string) => {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        setUser({
            uid: "mock-email-user-456",
            email: email,
            displayName: name || "User",
            photoURL: null
        });
        setLoading(false);
    }

    const signOut = async () => {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 400));
        setUser(null);
        setLoading(false);
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut, signInWithEmail }}>
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
