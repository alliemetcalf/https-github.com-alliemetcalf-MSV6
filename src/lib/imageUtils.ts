// Maximum file size in bytes (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed image MIME types
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif'
];

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const fileType = file.type.toLowerCase();
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  // Special handling for HEIC files which might not have proper MIME type
  const isHeicFile = fileExtension === 'heic' || fileExtension === 'heif' || fileType.includes('heic') || fileType.includes('heif');
  
  if (!ALLOWED_IMAGE_TYPES.includes(fileType) && !isHeicFile) {
    return {
      valid: false,
      error: `${file.name} is not a supported image type. Please use JPG, PNG, GIF, WebP, or HEIC.`
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `${file.name} is too large. Maximum file size is 10MB.`
    };
  }

  return { valid: true };
}

export function generateSafeFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  
  // Remove any potentially unsafe characters from the extension
  const safeExtension = extension.replace(/[^a-z0-9]/g, '');
  
  return `${timestamp}-${random}.${safeExtension}`;
}
