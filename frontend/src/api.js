import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
});

// Add a request interceptor to include the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Auth & User Profile
export const getMe = () => api.get('/auth/me');
export const updateProfile = (data) => api.put('/auth/profile', data);
export const uploadAvatar = (formData) => api.post('/auth/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
export const searchUsers = (q = '') => api.get(`/auth/users?q=${encodeURIComponent(q)}`);

// Projects
export const getProjects = () => api.get('/projects');
export const getProject = (id) => api.get(`/projects/${id}`);
export const createProject = (project) => api.post('/projects', project);
export const updateProject = (id, data) => api.put(`/projects/${id}`, data);
export const deleteProject = (id) => api.delete(`/projects/${id}`);
export const addProjectMember = (id, email, role = 'member') => api.post(`/projects/${id}/members`, { email, role });
export const updateMemberRole = (id, userId, role) => api.put(`/projects/${id}/members/${userId}`, { role });
export const removeProjectMember = (id, userId) => api.delete(`/projects/${id}/members/${userId}`);

// Tasks
export const addTask = (projectId, task) => api.post(`/projects/${projectId}/tasks`, task);
export const updateTask = (projectId, taskId, task) => api.put(`/projects/${projectId}/tasks/${taskId}`, task);
export const deleteTask = (projectId, taskId) => api.delete(`/projects/${projectId}/tasks/${taskId}`);

// Subtasks (Checklists)
export const getSubtasks = (projectId, taskId) => api.get(`/projects/${projectId}/tasks/${taskId}/subtasks`);
export const addSubtask = (projectId, taskId, title) => api.post(`/projects/${projectId}/tasks/${taskId}/subtasks`, { title });
export const updateSubtask = (projectId, taskId, subtaskId, data) => api.put(`/projects/${projectId}/tasks/${taskId}/subtasks/${subtaskId}`, data);
export const deleteSubtask = (projectId, taskId, subtaskId) => api.delete(`/projects/${projectId}/tasks/${taskId}/subtasks/${subtaskId}`);

// Comments
export const getComments = (projectId, taskId) => api.get(`/projects/${projectId}/tasks/${taskId}/comments`);
export const addComment = (projectId, taskId, content) => api.post(`/projects/${projectId}/tasks/${taskId}/comments`, { content });

// Attachments
export const getAttachments = (projectId) => api.get(`/projects/${projectId}/attachments`);
export const addAttachment = (projectId, attachment) => api.post(`/projects/${projectId}/attachments`, attachment);
export const deleteAttachment = (projectId, attachmentId) => api.delete(`/projects/${projectId}/attachments/${attachmentId}`);

// Upload File
export const uploadFile = (formData) => api.post('/projects/upload', formData, {
    headers: {
        'Content-Type': 'multipart/form-data'
    }
});

// Activity Stream & Export
export const getActivities = (projectId) => api.get(`/projects/${projectId}/activities`);
export const exportProject = (projectId) => api.get(`/projects/${projectId}/export`);
export const exportProjectCSV = (projectId) => `${API_URL}/projects/${projectId}/export/csv`;

// Public Project Sharing
export const toggleProjectShare = (projectId, is_public, share_token) => 
    api.put(`/projects/${projectId}/share`, { is_public, share_token });
export const getPublicProject = (shareToken) => api.get(`/projects/public/${shareToken}`);

// Project Documentation & Wiki (Notion/Linear style)
export const getProjectDocs = (projectId) => api.get(`/projects/${projectId}/docs`);
export const createProjectDoc = (projectId, data) => api.post(`/projects/${projectId}/docs`, data);
export const updateProjectDoc = (projectId, docId, data) => api.put(`/projects/${projectId}/docs/${docId}`, data);
export const deleteProjectDoc = (projectId, docId) => api.delete(`/projects/${projectId}/docs/${docId}`);

// Time Tracking
export const getTaskTimeLogs = (projectId, taskId) => api.get(`/projects/${projectId}/tasks/${taskId}/timelogs`);
export const addTaskTimeLog = (projectId, taskId, data) => api.post(`/projects/${projectId}/tasks/${taskId}/timelogs`, data);

// In-App Notifications
export const getNotifications = () => api.get('/auth/notifications');
export const markNotificationRead = (id) => api.put(`/auth/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.put('/auth/notifications/read-all');

// Automated Workflows
export const getProjectAutomations = (projectId) => api.get(`/projects/${projectId}/automations`);
export const createProjectAutomation = (projectId, data) => api.post(`/projects/${projectId}/automations`, data);
export const updateProjectAutomation = (projectId, autoId, data) => api.put(`/projects/${projectId}/automations/${autoId}`, data);
export const deleteProjectAutomation = (projectId, autoId) => api.delete(`/projects/${projectId}/automations/${autoId}`);

// Real-Time Project Team Chat
export const getProjectChat = (projectId) => api.get(`/projects/${projectId}/chat`);
export const sendProjectChatMessage = (projectId, message) => api.post(`/projects/${projectId}/chat`, { message });

// Audio Huddle
export const getProjectHuddle = (projectId) => api.get(`/projects/${projectId}/huddle`);
export const joinProjectHuddle = (projectId) => api.post(`/projects/${projectId}/huddle/join`);
export const leaveProjectHuddle = (projectId) => api.post(`/projects/${projectId}/huddle/leave`);

// Webhooks & Integrations
export const getProjectIntegrations = (projectId) => api.get(`/projects/${projectId}/integrations`);
export const createProjectIntegration = (projectId, data) => api.post(`/projects/${projectId}/integrations`, data);

// Workload & Team Utilization Heatmap
export const getProjectWorkload = (projectId) => api.get(`/projects/${projectId}/workload`);

// AI-Powered Assistant (Smart Breakdown, Risk Assessment, Command Parser)
export const aiBreakdownTask = (projectId, data) => api.post(`/projects/${projectId}/ai/breakdown-task`, data);
export const aiRiskAssessment = (projectId) => api.post(`/projects/${projectId}/ai/risk-assessment`);
export const aiParseCommand = (projectId, prompt) => api.post(`/projects/${projectId}/ai/parse-command`, { prompt });

export default api;


