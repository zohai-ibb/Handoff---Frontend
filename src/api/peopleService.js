import axiosClient from './axiosClient';

/**
 * Fetches scientists belonging to the authenticated user's directory
 */
export const getMyScientists = async () => {
  const response = await axiosClient.get('/scientist-list');
  return response.data;
};

/**
 * Adds a new scientist to the authenticated user's directory
 */
export const addScientistApi = async (scientistData) => {
  const response = await axiosClient.post('/scientist-list', scientistData);
  return response.data;
};