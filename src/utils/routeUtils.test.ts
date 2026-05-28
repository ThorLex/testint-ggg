/**
 * Unit tests for route utility functions - Edge Cases
 * 
 * Tests specific edge cases not covered by property tests.
 * 
 * Feature: map-routes-and-notifications
 * Requirements: 8.2, 8.5
 */

import { sortRouteCoordinates, isValidCoordinate, validateRouteCoordinates } from './routeUtils';
import type { RouteCoordinate } from '@/types';

describe('Feature: map-routes-and-notifications - Edge Cases', () => {
    describe('sortRouteCoordinates - Edge Cases', () => {
        /**
         * Requirement 8.2: If coordinate points lack an order field,
         * then the system shall use the array index as the order
         */
        test('should use array index as fallback when order field is missing', () => {
            const coordinates: RouteCoordinate[] = [
                { lat: 10, lng: 20, order: undefined as any },
                { lat: 30, lng: 40, order: undefined as any },
                { lat: 50, lng: 60, order: undefined as any },
            ];

            const sorted = sortRouteCoordinates(coordinates);

            // Should maintain original order when all order fields are undefined
            expect(sorted).toEqual(coordinates);
            expect(sorted[0]).toEqual({ lat: 10, lng: 20, order: undefined });
            expect(sorted[1]).toEqual({ lat: 30, lng: 40, order: undefined });
            expect(sorted[2]).toEqual({ lat: 50, lng: 60, order: undefined });
        });

        test('should use array index for coordinates without order field mixed with ordered coordinates', () => {
            const coordinates: RouteCoordinate[] = [
                { lat: 10, lng: 20, order: 2 },
                { lat: 30, lng: 40, order: undefined as any }, // Should use index 1
                { lat: 50, lng: 60, order: 0 },
            ];

            const sorted = sortRouteCoordinates(coordinates);

            // Expected order: index 2 (order=0), index 1 (order=undefined, uses index 1), index 0 (order=2)
            expect(sorted[0]).toEqual({ lat: 50, lng: 60, order: 0 });
            expect(sorted[1]).toEqual({ lat: 30, lng: 40, order: undefined });
            expect(sorted[2]).toEqual({ lat: 10, lng: 20, order: 2 });
        });

        /**
         * Requirement 8.5: If duplicate order values exist,
         * then the system shall maintain the original array order for those points
         */
        test('should maintain original order for duplicate order values', () => {
            const coordinates: RouteCoordinate[] = [
                { lat: 10, lng: 20, order: 1 },
                { lat: 30, lng: 40, order: 1 }, // Duplicate order
                { lat: 50, lng: 60, order: 1 }, // Duplicate order
                { lat: 70, lng: 80, order: 2 },
            ];

            const sorted = sortRouteCoordinates(coordinates);

            // All coordinates with order=1 should maintain their original relative order
            expect(sorted[0]).toEqual({ lat: 10, lng: 20, order: 1 });
            expect(sorted[1]).toEqual({ lat: 30, lng: 40, order: 1 });
            expect(sorted[2]).toEqual({ lat: 50, lng: 60, order: 1 });
            expect(sorted[3]).toEqual({ lat: 70, lng: 80, order: 2 });
        });

        test('should maintain original order for all duplicate order values', () => {
            const coordinates: RouteCoordinate[] = [
                { lat: 10, lng: 20, order: 5 },
                { lat: 30, lng: 40, order: 5 },
                { lat: 50, lng: 60, order: 5 },
            ];

            const sorted = sortRouteCoordinates(coordinates);

            // All have the same order, should maintain original order
            expect(sorted).toEqual(coordinates);
        });

        test('should handle multiple groups of duplicate order values', () => {
            const coordinates: RouteCoordinate[] = [
                { lat: 10, lng: 20, order: 1 },
                { lat: 30, lng: 40, order: 1 }, // Duplicate group 1
                { lat: 50, lng: 60, order: 2 },
                { lat: 70, lng: 80, order: 2 }, // Duplicate group 2
                { lat: 90, lng: 100, order: 3 },
            ];

            const sorted = sortRouteCoordinates(coordinates);

            // Each group should maintain original order
            expect(sorted[0]).toEqual({ lat: 10, lng: 20, order: 1 });
            expect(sorted[1]).toEqual({ lat: 30, lng: 40, order: 1 });
            expect(sorted[2]).toEqual({ lat: 50, lng: 60, order: 2 });
            expect(sorted[3]).toEqual({ lat: 70, lng: 80, order: 2 });
            expect(sorted[4]).toEqual({ lat: 90, lng: 100, order: 3 });
        });
    });

    describe('validateRouteCoordinates - Edge Cases', () => {
        /**
         * Test empty coordinate arrays
         */
        test('should return empty array for empty input', () => {
            const coordinates: RouteCoordinate[] = [];
            const result = validateRouteCoordinates(coordinates);

            expect(result).toEqual([]);
        });

        test('should return empty array when only one valid coordinate exists', () => {
            const coordinates: RouteCoordinate[] = [
                { lat: 10, lng: 20, order: 0 },
            ];

            const result = validateRouteCoordinates(coordinates);

            // Need at least 2 coordinates for a valid route
            expect(result).toEqual([]);
        });

        test('should return empty array when all coordinates are invalid', () => {
            const coordinates: RouteCoordinate[] = [
                { lat: 100, lng: 20, order: 0 }, // Invalid lat
                { lat: 10, lng: 200, order: 1 }, // Invalid lng
                { lat: NaN, lng: 20, order: 2 }, // NaN lat
            ];

            const result = validateRouteCoordinates(coordinates);

            expect(result).toEqual([]);
        });

        test('should filter out invalid coordinates and keep valid ones', () => {
            const coordinates: RouteCoordinate[] = [
                { lat: 10, lng: 20, order: 0 }, // Valid
                { lat: 100, lng: 30, order: 1 }, // Invalid lat
                { lat: 30, lng: 40, order: 2 }, // Valid
                { lat: 40, lng: 200, order: 3 }, // Invalid lng
                { lat: 50, lng: 60, order: 4 }, // Valid
            ];

            const result = validateRouteCoordinates(coordinates);

            // Should have 3 valid coordinates, sorted by order
            expect(result.length).toBe(3);
            expect(result[0]).toEqual({ lat: 10, lng: 20, order: 0 });
            expect(result[1]).toEqual({ lat: 30, lng: 40, order: 2 });
            expect(result[2]).toEqual({ lat: 50, lng: 60, order: 4 });
        });

        test('should return empty array when only one coordinate is valid after filtering', () => {
            const coordinates: RouteCoordinate[] = [
                { lat: 10, lng: 20, order: 0 }, // Valid
                { lat: 100, lng: 30, order: 1 }, // Invalid
                { lat: 200, lng: 40, order: 2 }, // Invalid
            ];

            const result = validateRouteCoordinates(coordinates);

            // Only 1 valid coordinate, need at least 2
            expect(result).toEqual([]);
        });
    });

    describe('isValidCoordinate - Edge Cases', () => {
        /**
         * Test invalid coordinates (out of range lat/lng)
         */
        test('should reject latitude exactly at 90.00001', () => {
            const coord: RouteCoordinate = { lat: 90.00001, lng: 0, order: 0 };
            expect(isValidCoordinate(coord)).toBe(false);
        });

        test('should reject latitude exactly at -90.00001', () => {
            const coord: RouteCoordinate = { lat: -90.00001, lng: 0, order: 0 };
            expect(isValidCoordinate(coord)).toBe(false);
        });

        test('should reject longitude exactly at 180.00001', () => {
            const coord: RouteCoordinate = { lat: 0, lng: 180.00001, order: 0 };
            expect(isValidCoordinate(coord)).toBe(false);
        });

        test('should reject longitude exactly at -180.00001', () => {
            const coord: RouteCoordinate = { lat: 0, lng: -180.00001, order: 0 };
            expect(isValidCoordinate(coord)).toBe(false);
        });

        test('should reject coordinates with extremely large latitude', () => {
            const coord: RouteCoordinate = { lat: 1000, lng: 0, order: 0 };
            expect(isValidCoordinate(coord)).toBe(false);
        });

        test('should reject coordinates with extremely large longitude', () => {
            const coord: RouteCoordinate = { lat: 0, lng: 1000, order: 0 };
            expect(isValidCoordinate(coord)).toBe(false);
        });

        test('should reject coordinates with extremely small latitude', () => {
            const coord: RouteCoordinate = { lat: -1000, lng: 0, order: 0 };
            expect(isValidCoordinate(coord)).toBe(false);
        });

        test('should reject coordinates with extremely small longitude', () => {
            const coord: RouteCoordinate = { lat: 0, lng: -1000, order: 0 };
            expect(isValidCoordinate(coord)).toBe(false);
        });

        test('should reject coordinates with both lat and lng as NaN', () => {
            const coord: RouteCoordinate = { lat: NaN, lng: NaN, order: 0 };
            expect(isValidCoordinate(coord)).toBe(false);
        });

        test('should reject coordinates with Infinity latitude', () => {
            const coord: RouteCoordinate = { lat: Infinity, lng: 0, order: 0 };
            expect(isValidCoordinate(coord)).toBe(false);
        });

        test('should reject coordinates with -Infinity latitude', () => {
            const coord: RouteCoordinate = { lat: -Infinity, lng: 0, order: 0 };
            expect(isValidCoordinate(coord)).toBe(false);
        });

        test('should reject coordinates with Infinity longitude', () => {
            const coord: RouteCoordinate = { lat: 0, lng: Infinity, order: 0 };
            expect(isValidCoordinate(coord)).toBe(false);
        });

        test('should reject coordinates with -Infinity longitude', () => {
            const coord: RouteCoordinate = { lat: 0, lng: -Infinity, order: 0 };
            expect(isValidCoordinate(coord)).toBe(false);
        });

        test('should accept coordinates at exact boundary values', () => {
            const boundaries: RouteCoordinate[] = [
                { lat: -90, lng: -180, order: 0 },
                { lat: -90, lng: 180, order: 1 },
                { lat: 90, lng: -180, order: 2 },
                { lat: 90, lng: 180, order: 3 },
            ];

            boundaries.forEach((coord) => {
                expect(isValidCoordinate(coord)).toBe(true);
            });
        });

        test('should accept coordinates at zero', () => {
            const coord: RouteCoordinate = { lat: 0, lng: 0, order: 0 };
            expect(isValidCoordinate(coord)).toBe(true);
        });

        test('should accept typical valid coordinates', () => {
            const validCoords: RouteCoordinate[] = [
                { lat: 48.8566, lng: 2.3522, order: 0 }, // Paris
                { lat: 40.7128, lng: -74.0060, order: 1 }, // New York
                { lat: -33.8688, lng: 151.2093, order: 2 }, // Sydney
                { lat: 35.6762, lng: 139.6503, order: 3 }, // Tokyo
            ];

            validCoords.forEach((coord) => {
                expect(isValidCoordinate(coord)).toBe(true);
            });
        });
    });
});
