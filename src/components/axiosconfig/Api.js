import axios from 'axios';

// Create an instance of axios with base configurations
const api = axios.create({
  baseURL: 'https://api.example.com',  // Replace with your API's base URL
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <your-token-here>',  // If you need token-based authentication
  },
  timeout: 10000, // 10 seconds timeout for requests
});

// Example GET request
export const fetchData = async (endpoint) => {
  try {
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

// Example POST request
export const postData = async (endpoint, data) => {
  try {
    const response = await api.post(endpoint, data);
    return response.data;
  } catch (error) {
    console.error('Error posting data:', error);
    throw error;
  }
};

// Example PUT request
export const updateData = async (endpoint, data) => {
  try {
    const response = await api.put(endpoint, data);
    return response.data;
  } catch (error) {
    console.error('Error updating data:', error);
    throw error;
  }
};

// Example DELETE request
export const deleteData = async (endpoint) => {
  try {
    const response = await api.delete(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error deleting data:', error);
    throw error;
  }
};

export default api;