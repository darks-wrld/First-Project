import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Note: We will need to install 'jwt-decode' for this to work.
// We will do that in a subsequent step.

// --- Type Definitions ---

// This interface defines the shape of the user data we expect
// to be encoded in the JWT payload (in the 'sub' claim).
interface User {
    sub: string; // Subject, which we'll use for the username
    iat: number; // Issued At timestamp
    exp: number; // Expiration timestamp
}

// This defines the value that our AuthContext will provide.
interface AuthContextType {
    token: string | null;
    user: User | null;
    login: (token: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

// --- Context Creation ---

// We create the context with an 'undefined' default value.
// This helps us catch cases where we try to use the context
// outside of its provider.
const AuthContext = createContext<AuthContextType | undefined>(undefined);


// --- AuthProvider Component ---

interface AuthProviderProps {
    children: ReactNode;
}

/**
 * The AuthProvider component is responsible for managing the authentication state
 * and providing it to the rest of the application.
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);

    // On initial application load, this effect runs once to check for a
    // token in localStorage. This allows the session to persist across refreshes.
    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
            try {
                // We'll dynamically import jwt-decode when needed.
                import('jwt-decode').then(jwt_decode => {
                    const decodedUser: User = jwt_decode.default(storedToken);
                    // Check if the token is expired
                    if (decodedUser.exp * 1000 > Date.now()) {
                        setToken(storedToken);
                        setUser(decodedUser);
                    } else {
                        // If token is expired, remove it from storage.
                        localStorage.removeItem('authToken');
                    }
                });
            } catch (error) {
                console.error("Failed to decode token from localStorage:", error);
                localStorage.removeItem('authToken');
            }
        }
    }, []);

    const login = (newToken: string) => {
        try {
            import('jwt-decode').then(jwt_decode => {
                const decodedUser: User = jwt_decode.default(newToken);
                localStorage.setItem('authToken', newToken);
                setToken(newToken);
                setUser(decodedUser);
            });
        } catch (error) {
            console.error("Failed to decode new token on login:", error);
            // If the token is invalid, we don't want to store it.
        }
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
    };

    // A computed boolean to easily check if the user is authenticated.
    const isAuthenticated = !!token;

    return (
        <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
};

// --- Custom Hook ---

/**
 * A custom hook to easily access the AuthContext.
 * This abstracts away the useContext call and provides better type safety.
 * It also throws an error if used outside of an AuthProvider.
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
