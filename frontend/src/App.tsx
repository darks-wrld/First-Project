import React from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
    Outlet,
    Link
} from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import './App.css'; // We can keep the basic styling for now

/**
 * A component to handle protected routes.
 * It checks for authentication using our custom hook.
 * If the user is authenticated, it renders the child routes (via the Outlet).
 * If not, it redirects them to the login page.
 */
const ProtectedRoute = () => {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        // The 'replace' prop is used to replace the current entry in the history stack,
        // so the user doesn't get stuck in a loop if they use the back button.
        return <Navigate to="/login" replace />;
    }

    // The Outlet component from react-router-dom renders the nested child route's element.
    return <Outlet />;
};

/**
 * A simple layout component to provide consistent navigation.
 */
const Layout = () => {
    const { isAuthenticated, logout } = useAuth();
    return (
        <>
            <nav style={{ padding: '1rem', background: '#eee', marginBottom: '1rem' }}>
                <Link to="/" style={{ marginRight: '1rem' }}>Home</Link>
                {isAuthenticated ? (
                    <>
                        <Link to="/dashboard" style={{ marginRight: '1rem' }}>Dashboard</Link>
                        <button onClick={logout}>Logout</button>
                    </>
                ) : (
                    <Link to="/login">Login</Link>
                )}
            </nav>
            <main>
                {/* The main content of the current route will be rendered here */}
                <Outlet />
            </main>
        </>
    );
};

/**
 * The main component that defines the application's routes.
 */
const AppRoutes = () => {
    return (
        <Routes>
            <Route element={<Layout />}>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    {/* More protected routes can be added here later */}
                </Route>

                {/* Fallback route for any path that doesn't match */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
        </Routes>
    );
};


/**
 * The root App component.
 * It wraps the entire application with the necessary providers.
 * 1. AuthProvider: Provides authentication state.
 * 2. Router: Provides routing capabilities.
 */
const App = () => {
    return (
        <AuthProvider>
            <Router>
                <AppRoutes />
            </Router>
        </AuthProvider>
    );
};

export default App;
