import { storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { compressImage, fileToBase64 } from './fileUtils';

/**
 * Uploads a file to Firebase Storage if available, with a bulletproof fallback to Base64 encoding.
 * This guarantees image and file sharing work even if Storage isn't enabled on the project yet.
 */
export async function uploadFile(
  file: File | Blob,
  fileName: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  // Try to use Firebase Storage if initialized
  if (storage) {
    try {
      const storageRef = ref(storage, `chats/${Date.now()}_${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            if (onProgress) onProgress(progress);
          },
          (error) => {
            console.warn('Firebase Storage upload error, falling back to Base64:', error);
            // Fallback to Base64
            fallbackToBase64(file).then((b64) => {
              if (onProgress) onProgress(100);
              resolve(b64);
            }).catch(reject);
          },
          async () => {
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              if (onProgress) onProgress(100);
              resolve(downloadUrl);
            } catch (err) {
              console.warn('Failed to retrieve download URL, falling back to Base64:', err);
              const b64 = await fallbackToBase64(file);
              if (onProgress) onProgress(100);
              resolve(b64);
            }
          }
        );
      });
    } catch (e) {
      console.warn('Storage operation failed directly, falling back to Base64:', e);
      return runBase64Upload(file, onProgress);
    }
  } else {
    return runBase64Upload(file, onProgress);
  }
}

async function runBase64Upload(file: File | Blob, onProgress?: (progress: number) => void): Promise<string> {
  if (onProgress) {
    onProgress(10);
    await new Promise(r => setTimeout(r, 100));
    onProgress(50);
    await new Promise(r => setTimeout(r, 100));
    onProgress(90);
  }
  const result = await fallbackToBase64(file);
  if (onProgress) onProgress(100);
  return result;
}

async function fallbackToBase64(file: File | Blob): Promise<string> {
  if (file instanceof File && file.type.startsWith('image/')) {
    try {
      const compressed = await compressImage(file, 600, 600, 0.7);
      if (typeof compressed === 'string') {
        return compressed;
      }
    } catch (err) {
      console.error('Image compression failed, using direct base64', err);
    }
  }
  return fileToBase64(file);
}
