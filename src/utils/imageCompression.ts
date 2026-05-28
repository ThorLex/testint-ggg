import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Compresses an image if it exceeds the size threshold.
 * Images over 2MB are compressed to reduce upload time and bandwidth usage.
 * 
 * @param uri - The local URI of the image to compress
 * @param fileSizeBytes - The size of the image file in bytes (optional, used to determine if compression is needed)
 * @returns The URI of the compressed image, or the original URI if compression wasn't needed
 * 
 * @example
 * const compressedUri = await compressImage('file:///path/to/image.jpg', 3000000);
 */
export async function compressImage(
  uri: string,
  fileSizeBytes?: number
): Promise<string> {
  const SIZE_THRESHOLD = 2 * 1024 * 1024; // 2MB in bytes

  // If file size is provided and under threshold, skip compression
  if (fileSizeBytes !== undefined && fileSizeBytes <= SIZE_THRESHOLD) {
    return uri;
  }

  try {
    // Compress the image
    // - Resize to max width of 1920px (maintains aspect ratio)
    // - Apply JPEG compression at 70% quality
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1920 } }],
      { 
        compress: 0.7, 
        format: ImageManipulator.SaveFormat.JPEG 
      }
    );

    return manipResult.uri;
  } catch (error) {
    // If compression fails, return original URI
    // This ensures the upload can still proceed
    console.error('Image compression failed:', error);
    return uri;
  }
}
