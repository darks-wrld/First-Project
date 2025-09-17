import axios from 'axios';

/**
 * Create a new axios instance with a predefined configuration.
 * This instance can be used throughout the application to make API requests.
 */
const apiClient = axios.create({
    baseURL: 'http://localhost:8000', // Base URL for the FastAPI backend
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- Authentication Service Functions ---

/**
 * Interface for the expected data in the login response.
 */
export interface LoginResponse {
    access_token: string;
    token_type: string;
}

/**
 * Logs in a user by sending their credentials to the backend's /token endpoint.
 *
 * @param username The user's username.
 * @param password The user's password.
 * @returns A promise that resolves with the login response data (access token).
 */
export const loginUser = async (username, password) => {
    // The FastAPI OAuth2PasswordRequestForm expects data to be sent as a form.
    // We use URLSearchParams to correctly format the request body.
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    try {
        // We make a POST request to the /token endpoint.
        // We must override the default Content-Type header for this specific request.
        const response = await apiClient.post<LoginResponse>('/token', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return response.data;
    } catch (error) {
        // Axios provides detailed error objects. We check if it's an Axios error
        // to provide more specific feedback to the caller (e.g., the UI component).
        if (axios.isAxiosError(error) && error.response) {
            // Re-throw the error with a more specific message from the API if available.
            throw new Error(error.response.data.detail || 'Login failed due to a server error.');
        }
        // If it's not a standard API error, throw a generic message.
        throw new Error('An unexpected error occurred. Please check your network connection.');
    }
};

/**
 * We can add other API service functions here in the future.
 * For example, a function to fetch the user's profile.
 *
 * export const fetchUserProfile = async (token: string) => {
 *     const response = await apiClient.get('/users/me', {
 *         headers: { Authorization: `Bearer ${token}` }
 *     });
 *     return response.data;
 * };
 */

export default apiClient;
