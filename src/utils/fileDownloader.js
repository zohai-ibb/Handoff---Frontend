import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

/**
 * Save a Blob or DataURL to device storage or web downloads
 * @param {Blob | string} fileData - Binary Blob or base64 data URL
 * @param {string} fileName - File name with extension (e.g. report.xlsx, QR_123.png)
 * @param {string} mimeType - File mime type
 */
export const downloadFileToDevice = async (fileData, fileName, mimeType = 'application/octet-stream') => {
  try {
    if (Capacitor.isNativePlatform()) {
      // --- NATIVE ANDROID DOWNLOAD (Capacitor Filesystem) ---
      let base64Data = '';

      if (typeof fileData === 'string' && fileData.startsWith('data:')) {
        base64Data = fileData.split(',')[1];
      } else if (fileData instanceof Blob) {
        base64Data = await blobToBase64(fileData);
      } else {
        throw new Error('Unsupported file format for native download.');
      }

      // Write file to device Documents or Download directory
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Documents, // Saves to device Documents directory
        recursive: true,
      });

      return { success: true, path: savedFile.uri, isNative: true };
    } else {
      // --- STANDARD BROWSER DOWNLOAD ---
      let blobUrl = '';
      if (typeof fileData === 'string' && fileData.startsWith('data:')) {
        blobUrl = fileData;
      } else {
        blobUrl = window.URL.createObjectURL(fileData);
      }

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (fileData instanceof Blob) {
        window.URL.revokeObjectURL(blobUrl);
      }

      return { success: true, isNative: false };
    }
  } catch (err) {
    console.error('File Download Error:', err);
    throw err;
  }
};

// Helper: Convert Blob to Base64
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const result = reader.result;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
};