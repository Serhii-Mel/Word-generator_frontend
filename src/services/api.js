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
    const response = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REGENERATE_SEGMENT}`, data);
    
    // Parse the response data if it's a string
    let result;
    if (typeof response.data === 'string') {
      result = JSON.parse(response.data);
    } else if (typeof response.data.content === 'string') {
      // If content is a string that looks like JSON, parse it
      try {
        result = JSON.parse(response.data.content);
      } catch (e) {
        result = response.data;
      }
    } else {
      result = response.data;
    }

    if (!result || !result.content) {
      throw new Error('Invalid response from server');
    }

    return result;
  } catch (error) {
    console.error('Regenerate segment error:', error);
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw error;
  }
}; 