import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const statsAPI = {
  // Overview
  getOverview: () => api.get('/stats/overview/'),

  // Users
  getTopUsers: (limit = 10) => api.get(`/stats/top-users/?limit=${limit}`),

  // Words
  getWordFrequency: (limit = 20) =>
    api.get(`/stats/word-frequency/?limit=${limit}`),

  // Time-based
  getMessagesPerDay: (days = 30) =>
    api.get(`/stats/messages-per-day/?days=${days}`),
  getMessagesPerHour: () => api.get('/stats/messages-per-hour/'),

  // Media
  getMediaDistribution: () => api.get('/stats/media-distribution/'),

  // Topics & Sentiment
  getTopTopics: (limit = 10) => api.get(`/stats/top-topics/?limit=${limit}`),
  getSentimentOverall: () => api.get('/stats/sentiment-overall/'),

  // Reply
  getReplyChainStats: () => api.get('/stats/reply-chain/'),

  // User profile
  getUserProfile: (userId) => api.get(`/stats/user/${userId}/`),

  // Messages
  getMessages: (params = {}) => api.get('/messages/', { params }),
  getRecentMessages: () => api.get('/messages/recent/'),
};

export default api;
