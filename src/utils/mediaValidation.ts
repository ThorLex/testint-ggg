/**
 * Media validation utilities for file upload
 * Validates file types and sizes according to requirements 1.3, 1.4, 1.5, 1.6
 */

const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

/**
 * Validates if the provided MIME type is a supported image format
 * @param mimeType - The MIME type to validate
 * @returns true if the MIME type is supported, false otherwise
 */
export function validateFileType(mimeType: string): boolean {
  return SUPPORTED_IMAGE_TYPES.includes(mimeType.toLowerCase());
}

/**
 * Validates if the file size is within the allowed limit
 * @param size - The file size in bytes
 * @returns true if the file size is within limit, false otherwise
 */
export function validateFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE;
}

/**
 * Gets a validation error message for a file, or null if valid
 * @param file - The file object with uri, mimeType, and size
 * @returns Error message string if validation fails, null if valid
 */
export function getValidationError(file: {
  uri: string;
  mimeType?: string;
  size?: number;
}): string | null {
  // Check if file has required properties
  if (!file.mimeType) {
    return 'Invalid file type - Only images are supported';
  }

  // Validate file type
  if (!validateFileType(file.mimeType)) {
    return 'Invalid file type - Only images are supported';
  }

  // Check if size is provided
  if (file.size === undefined || file.size === null) {
    return 'File size information is missing';
  }

  // Validate file size
  if (!validateFileSize(file.size)) {
    return 'File too large - Maximum size is 10MB';
  }

  return null;
}
