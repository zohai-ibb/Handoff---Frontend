import axiosClient from './axiosClient';

/**
 * Fetch instruments owned by the calling scientist
 */
export const getMyInstruments = async () => {
  const response = await axiosClient.get('/instruments/my-inventory');
  return response.data;
};

/**
 * Fetch scientist contacts from directory
 */
export const getMyScientists = async () => {
  const response = await axiosClient.get('/scientist-list');
  return response.data;
};

/**
 * Fetch saved staff members belonging to the authenticated scientist
 */
export const getMyStaffMembers = async () => {
  const response = await axiosClient.get('/staff-members');
  return response.data;
};

/**
 * Scan QR Code string (assetId)
 */
export const scanInstrumentByAssetId = async (assetId) => {
  const response = await axiosClient.get(`/instruments/scan/${encodeURIComponent(assetId)}`);
  return response.data;
};

/**
 * Submit checkout (Always posts as multipart/form-data to /issue-records/owner-issue)
 */
export const issueInstrumentApi = async (payload, photoDataUrl) => {
  const formData = new FormData();

  formData.append('instrumentId', payload.instrumentId);
  if (payload.scientistListId) formData.append('scientistListId', payload.scientistListId);
  if (payload.borrowerScientistId) formData.append('borrowerScientistId', payload.borrowerScientistId);

  // Quantity field support
  formData.append('quantity', payload.quantity || 1);

  if (payload.staffName) formData.append('staffName', payload.staffName);
  if (payload.staffEmail) formData.append('staffEmail', payload.staffEmail);
  if (payload.dueDate) formData.append('dueDate', payload.dueDate);
  if (payload.purpose) formData.append('purpose', payload.purpose);
  if (payload.conditionOut) formData.append('conditionOut', payload.conditionOut);

  // Convert Base64 data URL to binary blob/file if photo exists
  if (photoDataUrl) {
    const res = await fetch(photoDataUrl);
    const blob = await res.blob();
    const photoFile = new File([blob], 'condition_out.jpg', { type: 'image/jpeg' });
    formData.append('photo', photoFile);
  }

  // Send request to the correct endpoint matched in Spring Boot Controller
  const response = await axiosClient.post('/issue-records/owner-issue', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
};