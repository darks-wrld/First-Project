import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { loginUser } from '../services/api';

/**
 * The login page component.
 * It provides a form for users to enter their credentials.
 * On successful login, it redirects the user to the dashboard.
 */
const LoginPage = () => {
    // State for managing form inputs
    const [username, setUsername] = useState('admin'); // Pre-filled for convenience
    const [password, setPassword] = useState('6thMarch1957'); // Pre-filled for convenience

    // State for handling errors and loading status
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Hooks for navigation and authentication context
    const navigate = useNavigate();
    const { login } = useAuth();

    /**
     * Handles the form submission event.
     */
    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // Call the API service to log the user in
            const data = await loginUser(username, password);
            // If successful, call the login function from our AuthContext
            login(data.access_token);
            // And navigate the user to the protected dashboard
            navigate('/dashboard');
        } catch (err) {
            // If an error occurs, display it to the user
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred.');
            }
        } finally {
            // Reset the loading state regardless of outcome
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '400px', margin: 'auto' }}>
            <h1>Login</h1>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="username" style={{ display: 'block', marginBottom: '0.5rem' }}>Username</label>
                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.5rem' }}
                    />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.5rem' }}
                    />
                </div>
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.75rem' }}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
                {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
            </form>
        </div>
    );
};

export default LoginPage;
