import React from 'react';
import { Link } from 'react-router-dom';

/**
 * The main landing page for the application.
 * It provides a welcome message and a link to the login page.
 */
const HomePage = () => {
    return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h1>Welcome to the MRPT</h1>
            <h2>Mapping and Risk Prediction Tool</h2>
            <p>
                This tool is designed to help detect, map, and predict illegal mining activities.
            </p>
            <p>
                <Link to="/login">Please Login</Link> to access the dashboard and other features.
            </p>
        </div>
    );
};

export default HomePage;
