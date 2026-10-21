// src/api/config.js

// 1. Single source of truth for host IP address
export const SERVER_BASE_URL = 'http://192.168.31.126:8080'; // Change IP only HERE!
export const API_BASE_URL = `${SERVER_BASE_URL}/api`;

/**
 * Utility to format image/photo URLs dynamically
 * Converts relative paths like "/uploads/profiles/pic.jpg" to full HTTP URLs.
 */
export const getFullPhotoUrl = (photoPath) => {
  if (!photoPath) return null;
  if (photoPath.startsWith('http') || photoPath.startsWith('data:')) {
    return photoPath;
  }
  const formattedPath = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
  return `${SERVER_BASE_URL}${formattedPath}`;
};