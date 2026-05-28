/**
 * Unit tests for mediaValidation utilities
 * 
 * Tests file type and size validation functions.
 * 
 * Requirements: 1.3, 1.4, 1.5, 1.6
 */

import { validateFileType, validateFileSize, getValidationError } from './mediaValidation';

describe('validateFileType', () => {
  describe('Valid image types', () => {
    test('should accept image/jpeg', () => {
      expect(validateFileType('image/jpeg')).toBe(true);
    });

    test('should accept image/png', () => {
      expect(validateFileType('image/png')).toBe(true);
    });

    test('should accept image/gif', () => {
      expect(validateFileType('image/gif')).toBe(true);
    });

    test('should accept image/webp', () => {
      expect(validateFileType('image/webp')).toBe(true);
    });

    test('should accept uppercase MIME types', () => {
      expect(validateFileType('IMAGE/JPEG')).toBe(true);
      expect(validateFileType('IMAGE/PNG')).toBe(true);
    });

    test('should accept mixed case MIME types', () => {
      expect(validateFileType('Image/Jpeg')).toBe(true);
      expect(validateFileType('Image/Png')).toBe(true);
    });
  });

  describe('Invalid file types', () => {
    test('should reject video types', () => {
      expect(validateFileType('video/mp4')).toBe(false);
      expect(validateFileType('video/quicktime')).toBe(false);
    });

    test('should reject document types', () => {
      expect(validateFileType('application/pdf')).toBe(false);
      expect(validateFileType('application/msword')).toBe(false);
    });

    test('should reject audio types', () => {
      expect(validateFileType('audio/mpeg')).toBe(false);
      expect(validateFileType('audio/wav')).toBe(false);
    });

    test('should reject text types', () => {
      expect(validateFileType('text/plain')).toBe(false);
      expect(validateFileType('text/html')).toBe(false);
    });

    test('should reject unsupported image types', () => {
      expect(validateFileType('image/bmp')).toBe(false);
      expect(validateFileType('image/tiff')).toBe(false);
      expect(validateFileType('image/svg+xml')).toBe(false);
    });

    test('should reject empty string', () => {
      expect(validateFileType('')).toBe(false);
    });

    test('should reject invalid format', () => {
      expect(validateFileType('notamimetype')).toBe(false);
      expect(validateFileType('image')).toBe(false);
    });
  });
});

describe('validateFileSize', () => {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  describe('Valid file sizes', () => {
    test('should accept 0 bytes', () => {
      expect(validateFileSize(0)).toBe(true);
    });

    test('should accept 1 byte', () => {
      expect(validateFileSize(1)).toBe(true);
    });

    test('should accept 1MB', () => {
      expect(validateFileSize(1 * 1024 * 1024)).toBe(true);
    });

    test('should accept 5MB', () => {
      expect(validateFileSize(5 * 1024 * 1024)).toBe(true);
    });

    test('should accept exactly 10MB', () => {
      expect(validateFileSize(MAX_SIZE)).toBe(true);
    });

    test('should accept 9.99MB', () => {
      expect(validateFileSize(MAX_SIZE - 1024)).toBe(true);
    });
  });

  describe('Invalid file sizes', () => {
    test('should reject 10MB + 1 byte', () => {
      expect(validateFileSize(MAX_SIZE + 1)).toBe(false);
    });

    test('should reject 11MB', () => {
      expect(validateFileSize(11 * 1024 * 1024)).toBe(false);
    });

    test('should reject 20MB', () => {
      expect(validateFileSize(20 * 1024 * 1024)).toBe(false);
    });

    test('should reject 100MB', () => {
      expect(validateFileSize(100 * 1024 * 1024)).toBe(false);
    });

    test('should reject very large files', () => {
      expect(validateFileSize(1000 * 1024 * 1024)).toBe(false);
    });
  });
});

describe('getValidationError', () => {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  describe('Valid files', () => {
    test('should return null for valid JPEG file', () => {
      const file = {
        uri: 'file:///path/to/image.jpg',
        mimeType: 'image/jpeg',
        size: 5 * 1024 * 1024, // 5MB
      };
      expect(getValidationError(file)).toBeNull();
    });

    test('should return null for valid PNG file', () => {
      const file = {
        uri: 'file:///path/to/image.png',
        mimeType: 'image/png',
        size: 2 * 1024 * 1024, // 2MB
      };
      expect(getValidationError(file)).toBeNull();
    });

    test('should return null for valid file at size limit', () => {
      const file = {
        uri: 'file:///path/to/image.jpg',
        mimeType: 'image/jpeg',
        size: MAX_SIZE,
      };
      expect(getValidationError(file)).toBeNull();
    });

    test('should return null for small valid file', () => {
      const file = {
        uri: 'file:///path/to/image.jpg',
        mimeType: 'image/jpeg',
        size: 1024, // 1KB
      };
      expect(getValidationError(file)).toBeNull();
    });
  });

  describe('Invalid file type errors', () => {
    test('should return error for missing mimeType', () => {
      const file = {
        uri: 'file:///path/to/file',
        size: 5 * 1024 * 1024,
      };
      expect(getValidationError(file)).toBe('Invalid file type - Only images are supported');
    });

    test('should return error for video file', () => {
      const file = {
        uri: 'file:///path/to/video.mp4',
        mimeType: 'video/mp4',
        size: 5 * 1024 * 1024,
      };
      expect(getValidationError(file)).toBe('Invalid file type - Only images are supported');
    });

    test('should return error for PDF file', () => {
      const file = {
        uri: 'file:///path/to/document.pdf',
        mimeType: 'application/pdf',
        size: 2 * 1024 * 1024,
      };
      expect(getValidationError(file)).toBe('Invalid file type - Only images are supported');
    });

    test('should return error for unsupported image type', () => {
      const file = {
        uri: 'file:///path/to/image.bmp',
        mimeType: 'image/bmp',
        size: 3 * 1024 * 1024,
      };
      expect(getValidationError(file)).toBe('Invalid file type - Only images are supported');
    });
  });

  describe('Invalid file size errors', () => {
    test('should return error for file over 10MB', () => {
      const file = {
        uri: 'file:///path/to/image.jpg',
        mimeType: 'image/jpeg',
        size: MAX_SIZE + 1,
      };
      expect(getValidationError(file)).toBe('File too large - Maximum size is 10MB');
    });

    test('should return error for 20MB file', () => {
      const file = {
        uri: 'file:///path/to/image.jpg',
        mimeType: 'image/jpeg',
        size: 20 * 1024 * 1024,
      };
      expect(getValidationError(file)).toBe('File too large - Maximum size is 10MB');
    });

    test('should return error for missing size', () => {
      const file = {
        uri: 'file:///path/to/image.jpg',
        mimeType: 'image/jpeg',
      };
      expect(getValidationError(file)).toBe('File size information is missing');
    });

    test('should return error for null size', () => {
      const file = {
        uri: 'file:///path/to/image.jpg',
        mimeType: 'image/jpeg',
        size: null as any,
      };
      expect(getValidationError(file)).toBe('File size information is missing');
    });
  });

  describe('Error priority', () => {
    test('should return type error before size error when both are invalid', () => {
      const file = {
        uri: 'file:///path/to/video.mp4',
        mimeType: 'video/mp4',
        size: 20 * 1024 * 1024, // Over limit
      };
      // Type validation happens first
      expect(getValidationError(file)).toBe('Invalid file type - Only images are supported');
    });

    test('should return type error when mimeType missing and size invalid', () => {
      const file = {
        uri: 'file:///path/to/file',
        size: 20 * 1024 * 1024,
      };
      expect(getValidationError(file)).toBe('Invalid file type - Only images are supported');
    });
  });

  describe('Edge cases', () => {
    test('should handle zero-size file', () => {
      const file = {
        uri: 'file:///path/to/image.jpg',
        mimeType: 'image/jpeg',
        size: 0,
      };
      expect(getValidationError(file)).toBeNull();
    });

    test('should handle file at exact boundary', () => {
      const file = {
        uri: 'file:///path/to/image.jpg',
        mimeType: 'image/jpeg',
        size: MAX_SIZE,
      };
      expect(getValidationError(file)).toBeNull();
    });

    test('should handle uppercase MIME type', () => {
      const file = {
        uri: 'file:///path/to/image.jpg',
        mimeType: 'IMAGE/JPEG',
        size: 5 * 1024 * 1024,
      };
      expect(getValidationError(file)).toBeNull();
    });
  });
});
