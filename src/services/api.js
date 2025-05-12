import axios from 'axios';
import API_CONFIG from '../config/api';

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMessage = error.response?.data?.detail || error.message || 'An error occurred';
    return Promise.reject(new Error(errorMessage));
  }
);

export const generateScript = async (data) => {
  try {
    const response = await api.post(API_CONFIG.ENDPOINTS.GENERATE_SCRIPT, data);
    console.log(response.data);
    return response.data;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const regenerateParagraph = async (data) => {
  try {
    const response = await api.post(API_CONFIG.ENDPOINTS.REGENERATE_PARAGRAPH, data);
    return response.data;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const regenerateSegment = async (data) => {
  try {
    console.log('Sending regenerate segment request:', data); // Debug log
    const response = await axios.post(`${API_CONFIG.BASE_URL}/regenerate-segment`, data);
    console.log('Regenerate segment response:', response.data); // Debug log
    return response.data;
  } catch (error) {
    console.error('Error in regenerateSegment:', error.response || error); // Enhanced error logging
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw new Error(error.message || 'Failed to regenerate segment');
  }
};

console.log(typeof wordCount, wordCount); // Should log: 'number', 1500 (or whatever value) 