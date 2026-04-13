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

export const getProjects = () => api.get('/projects');
export const getProject = (id) => api.get(`/projects/${id}`);
export const createProject = (project) => api.post('/projects', project);
export const updateProject = (id, data) => api.put(`/projects/${id}`, data);
export const deleteProject = (id) => api.delete(`/projects/${id}`);
export const addProjectMember = (id, email) => api.post(`/projects/${id}/members`, { email });

export const addTask = (projectId, task) => api.post(`/projects/${projectId}/tasks`, task);
export const updateTask = (projectId, taskId, task) => api.put(`/projects/${projectId}/tasks/${taskId}`, task);
export const deleteTask = (projectId, taskId) => api.delete(`/projects/${projectId}/tasks/${taskId}`);

// Comments
export const getComments = (projectId, taskId) => api.get(`/projects/${projectId}/tasks/${taskId}/comments`);
export const addComment = (projectId, taskId, content) => api.post(`/projects/${projectId}/tasks/${taskId}/comments`, { content });

// Attachments
export const getAttachments = (projectId) => api.get(`/projects/${projectId}/attachments`);
export const addAttachment = (projectId, attachment) => api.post(`/projects/${projectId}/attachments`, attachment);
export const deleteAttachment = (projectId, attachmentId) => api.delete(`/projects/${projectId}/attachments/${attachmentId}`);

export const uploadFile = (formData) => api.post('/projects/upload', formData, {
    headers: {
        'Content-Type': 'multipart/form-data'
    }
});

export default api;
