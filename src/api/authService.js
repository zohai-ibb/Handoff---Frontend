import axiosClient from './axiosClient';

/**
 * Authenticates a scientist using email & password
 * @param {Object} credentials - { email, password }
 */
export const loginUser = async (credentials) => {
  // Corrected endpoint path matching AuthController @PostMapping("/login")
  const response = await axiosClient.post('/auth/login', credentials);
  return response.data; // Returns { token, person }
};

/**
 * Registers a new scientist account
 * @param {Object} userData - { name, email, password, mobile, department }
 */
export const registerUser = async (userData) => {
  // Corrected endpoint path matching AuthController @PostMapping("/signup")
  const response = await axiosClient.post('/auth/signup', userData);
  return response.data; // Returns { token, person }
};