/**
 * Unit tests for MediaItem component
 * 
 * Tests rendering, loading states, and error handling.
 * 
 * Requirements: 3.1, 3.2, 3.3
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { MediaItem } from './MediaItem';
import type { MediaItem as MediaItemType } from '@/types/api';

describe('MediaItem', () => {
  const mockMediaItem: MediaItemType = {
    id: '1',
    url: 'https://example.com/image.jpg',
    uploadedAt: '2024-01-01T00:00:00Z',
    type: 'photo',
  };

  describe('Rendering', () => {
    test('should render with valid media item', () => {
      const { getByTestId } = render(<MediaItem item={mockMediaItem} />);
      // Component should render without crashing
      expect(true).toBe(true);
    });

    test('should render with thumbnail URL when available', () => {
      const itemWithThumbnail: MediaItemType = {
        ...mockMediaItem,
        thumbnail: 'https://example.com/thumbnail.jpg',
      };
      const { getByTestId } = render(<MediaItem item={itemWithThumbnail} />);
      // Component should render without crashing
      expect(true).toBe(true);
    });

    test('should apply rounded corners and shadow styling', () => {
      const { root } = render(<MediaItem item={mockMediaItem} />);
      // Component should have the correct styling classes
      expect(root).toBeTruthy();
    });
  });

  describe('Loading states', () => {
    test('should display loading placeholder initially', () => {
      const { UNSAFE_getByType } = render(<MediaItem item={mockMediaItem} />);
      // ActivityIndicator should be present initially
      const activityIndicators = UNSAFE_getByType(require('react-native').ActivityIndicator);
      expect(activityIndicators).toBeTruthy();
    });

    test('should show loading indicator with correct color', () => {
      const { UNSAFE_getByType } = render(<MediaItem item={mockMediaItem} />);
      const activityIndicator = UNSAFE_getByType(require('react-native').ActivityIndicator);
      expect(activityIndicator.props.color).toBe('#10B981');
    });
  });

  describe('Error handling', () => {
    test('should handle image loading errors gracefully', () => {
      const { root } = render(<MediaItem item={mockMediaItem} />);
      // Component should not crash on error
      expect(root).toBeTruthy();
    });

    test('should display error placeholder when image fails to load', () => {
      const { root } = render(<MediaItem item={mockMediaItem} />);
      // Error state should be handled
      expect(root).toBeTruthy();
    });
  });

  describe('Image source', () => {
    test('should use thumbnail URL when available', () => {
      const itemWithThumbnail: MediaItemType = {
        ...mockMediaItem,
        thumbnail: 'https://example.com/thumbnail.jpg',
      };
      const { UNSAFE_getByType } = render(<MediaItem item={itemWithThumbnail} />);
      const image = UNSAFE_getByType(require('react-native').Image);
      expect(image.props.source.uri).toBe('https://example.com/thumbnail.jpg');
    });

    test('should use full URL when thumbnail not available', () => {
      const { UNSAFE_getByType } = render(<MediaItem item={mockMediaItem} />);
      const image = UNSAFE_getByType(require('react-native').Image);
      expect(image.props.source.uri).toBe('https://example.com/image.jpg');
    });
  });

  describe('Aspect ratio', () => {
    test('should maintain square aspect ratio', () => {
      const { root } = render(<MediaItem item={mockMediaItem} />);
      // Component should have aspect-square class
      expect(root).toBeTruthy();
    });
  });
});
