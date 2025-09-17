import React from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * A protected page that is only visible to authenticated users.
 * It displays a welcome message with the user's name and a logout button.
 */
const DashboardPage = () => {
    // The useAuth hook provides access to the current user and logout function.
    const { user, logout } = useAuth();

    return (
        <div style={{ padding: '2rem' }}>
            <h1>MRPT Dashboard</h1>
            {/* The user object's 'sub' claim holds the username. */}
            {user && <h2>Welcome, {user.sub}!</h2>}
            <p>This is your protected dashboard. More features will be added here soon.</p>
            <button onClick={logout} style={{ marginTop: '1rem' }}>
                Logout
            </button>
        </div>
    );
};

export default DashboardPage;
