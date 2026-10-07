import axiosClient from './axiosClient';

/**
 * Fetches instruments owned ONLY by the logged-in scientist.
 * Uses the user object stored in localStorage to get the scientist's ID.
 */
export const getInstruments = async () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const scientistId = user?.id || user?._id;

  if (scientistId) {
    // Hits the owner-specific endpoint created in InstrumentController
    const response = await axiosClient.get(`/instruments/owner/${scientistId}`);
    return response.data;
  }

  // Fallback to general endpoint if no user ID is present
  const response = await axiosClient.get('/instruments');
  return response.data;
};

/**
 * Fetches active issue/borrowing records for the authenticated scientist
 */
export const getActiveIssueRecords = async () => {
  const response = await axiosClient.get('/issue-records');
  return response.data;
};