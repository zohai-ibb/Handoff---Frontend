import axiosClient from './axiosClient';

/**
 * Authenticates a scientist using email & password
 * @param {Object} credentials - { email, password }
 */
export const loginUser = async (credentials) => {
  const response = await axiosClient.post('/auth/login', credentials);
  return response.data; // Returns { token, person }
};

/**
 * Registers a new scientist account
 * @param {Object} userData - { name, email, password, mobile, department }
 */
export const registerUser = async (userData) => {
  const response = await axiosClient.post('/auth/signup', userData);
  return response.data; // Returns { token, person }
};