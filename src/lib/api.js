import axios from 'axios';

const BACKEND_BASE_URL = '/api/proxy';

const api = axios.create({
    baseURL: BACKEND_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getCampusData = async () => {
    try {
        const response = await api.get('/api/campus-data'); // Example endpoint
        return response.data;
    } catch (error) {
        console.error('Error fetching campus data:', error);
        throw error;
    }
};

export const reportUserAuth = async (uid, email, action) => {
    try {
        const response = await api.post('/api/auth-report', {
            uid,
            email,
            action, // 'login' or 'signup'
            timestamp: new Date().toISOString()
        });
        return response.data;
    } catch (error) {
        console.error('Error reporting user auth:', error);
        // Don't throw as this is a secondary background report
    }
};

export const updateCampusSettings = async (data) => {
    try {
        const response = await api.post('/api/settings', data);
        return response.data;
    } catch (error) {
        console.error('Error updating campus settings:', error);
        throw error;
    }
};

export default api;
import { db } from './firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Firestore User Profile Sync
export const createUserProfile = async (userData) => {
    try {
        // Primary: Use local Next.js API route
        const response = await axios.post('/api/users/create', userData);
        return response.data;
    } catch (error) {
        console.warn('Backend user creation failed, attempting client-side fallback:', error);

        // Secondary: Client-side fallback to ensure data persistence "at any cost"
        try {
            const { uid, name, email, role, campusId } = userData;
            const userRef = doc(db, 'users', uid);
            await setDoc(userRef, {
                uid,
                name,
                email: email.toLowerCase(),
                role: role || 'student',
                campusId: campusId || 'main-campus',
                createdAt: serverTimestamp()
            });
            console.log('Client-side profile sync successful');
            return { message: 'User profile created via client-side fallback', uid };
        } catch (fallbackError) {
            console.error('Critical failure: Client-side fallback also failed', fallbackError);
            throw fallbackError;
        }
    }
};

export const getUserProfile = async (uid) => {
    try {
        const response = await api.get(`/users/${uid}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
    }
};

// Campus APIs
export const getCampuses = async () => {
    try {
        const response = await axios.get('/api/campuses');
        return response.data;
    } catch (error) {
        console.error('Error fetching campuses:', error);
        throw error;
    }
};

export const getCampusById = async (id) => {
    try {
        // Cache busting to prevent Vercel from serving stale 404s
        const response = await axios.get(`/api/campuses/${id}?t=${Date.now()}`);
        if (response.data && response.data.error) {
            throw new Error(response.data.error);
        }
        return response.data;
    } catch (error) {
        console.error(`[API] Fetch failed for ${id}:`, error.message);
        throw error;
    }
};

export const createCampus = async (campusData) => {
    try {
        const response = await axios.post('/api/campuses/create', campusData);
        return response.data;
    } catch (error) {
        console.error('Error creating campus:', error);
        throw error;
    }
};
export const getHealthStatus = async (campusId) => {
    try {
        const response = await axios.get(`/api/health?campusId=${campusId}`);
        return response.data;
    } catch (error) {
        console.warn('Health API unavailable, using fallback status');
        return {
            status: 'Unknown',
            color: '#94a3b8',
            indicator: '○',
            uptime: 'N/A',
            lastChecked: new Date().toISOString()
        };
    }
};

export const createIssue = async (issueData) => {
    try {
        const response = await axios.post('/api/issues/create', issueData);
        return response.data;
    } catch (error) {
        console.error('Error creating issue:', error);
        throw error;
    }
};

export const getIssues = async (campusId = null) => {
    try {
        const url = campusId ? `/api/issues?campusId=${campusId}` : '/api/issues';
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching issues:', error);
        return { issues: [] };
    }
};

export const resolveIssue = async (issueId, actorInfo = {}) => {
    try {
        const headers = {};
        if (actorInfo.userId) headers['x-user-id'] = actorInfo.userId;
        if (actorInfo.role) headers['x-user-role'] = actorInfo.role;

        const response = await axios.patch(`/api/issues/${issueId}/resolve`, {}, { headers });
        return response.data;
    } catch (error) {
        console.error('Error resolving issue:', error);
        throw error;
    }
};

export const updateIssueStatus = async (issueId, status, message, actorInfo = {}) => {
    try {
        const headers = {};
        if (actorInfo.userId) headers['x-user-id'] = actorInfo.userId;
        if (actorInfo.role) headers['x-user-role'] = actorInfo.role;

        const response = await axios.patch(`/api/issues/${issueId}/status`, { status, message }, { headers });
        return response.data;
    } catch (error) {
        console.error('Error updating issue status:', error);
        throw error;
    }
};
