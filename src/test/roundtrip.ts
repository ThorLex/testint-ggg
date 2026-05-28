/**
 * Round-trip test utilities for data transformations
 * 
 * This module provides utilities for testing that data transformations
 * are reversible and don't lose information (parse ∘ serialize = identity).
 * 
 * Feature: api-routes-complete-analysis
 * Validates: Requirements 15.1-15.5
 * 
 * @module test/roundtrip
 */

import * as fc from 'fast-check';
import type { Coordinates } from '@/types';

// ============================================================================
// Coordinate Transformation Utilities
// ============================================================================

/**
 * Transform coordinates from lat/lng format to latitude/longitude format
 * 
 * @param coords - Coordinates with lat/lng properties
 * @returns Coordinates with latitude/longitude properties
 */
export function coordsToLatLong(coords: { lat: number; lng: number }): {
    latitude: number;
    longitude: number;
} {
    return {
        latitude: coords.lat,
        longitude: coords.lng,
    };
}

/**
 * Transform coordinates from latitude/longitude format to lat/lng format
 * 
 * @param coords - Coordinates with latitude/longitude properties
 * @returns Coordinates with lat/lng properties
 */
export function latLongToCoords(coords: {
    latitude: number;
    longitude: number;
}): { lat: number; lng: number } {
    return {
        lat: coords.latitude,
        lng: coords.longitude,
    };
}

/**
 * Normalize Coordinates object to have both formats
 * 
 * @param coords - Coordinates in any format
 * @returns Coordinates with both lat/lng and latitude/longitude
 */
export function normalizeCoordinates(
    coords: Partial<Coordinates>
): Coordinates {
    const lat = coords.lat ?? coords.latitude;
    const lng = coords.lng ?? coords.longitude;

    if (lat === undefined || lng === undefined) {
        throw new Error('Invalid coordinates: missing lat/lng or latitude/longitude');
    }

    return {
        latitude: lat,
        longitude: lng,
        lat,
        lng,
    };
}

// ============================================================================
// Date Transformation Utilities
// ============================================================================

/**
 * Parse ISO date string to Date object
 * 
 * @param isoString - ISO 8601 date string
 * @returns Date object
 */
export function parseISODate(isoString: string): Date {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
        throw new Error(`Invalid ISO date string: ${isoString}`);
    }
    return date;
}

/**
 * Serialize Date object to ISO string
 * 
 * @param date - Date object
 * @returns ISO 8601 date string
 */
export function serializeDate(date: Date): string {
    return date.toISOString();
}

/**
 * Round-trip date transformation: string → Date → string
 * 
 * @param isoString - ISO date string
 * @returns ISO date string (should be equivalent to input)
 */
export function roundTripDate(isoString: string): string {
    return serializeDate(parseISODate(isoString));
}

// ============================================================================
// Generic Round-Trip Test Framework
// ============================================================================

/**
 * Test that a transformation is reversible (round-trip property)
 * 
 * @param arbitrary - fast-check arbitrary for generating test data
 * @param serialize - Function to serialize data
 * @param parse - Function to parse serialized data
 * @param equals - Function to compare original and round-tripped data
 * @param options - fast-check options (default: 100 runs)
 * @returns Test result
 */
export function testRoundTrip<T, S>(
    arbitrary: fc.Arbitrary<T>,
    serialize: (data: T) => S,
    parse: (serialized: S) => T,
    equals: (a: T, b: T) => boolean,
    options: fc.Parameters<[T]> = { numRuns: 100 }
): void {
    fc.assert(
        fc.property(arbitrary, (original) => {
            const serialized = serialize(original);
            const roundTripped = parse(serialized);
            return equals(original, roundTripped);
        }),
        options
    );
}

/**
 * Test that a transformation preserves data (lossy round-trip)
 * 
 * Some transformations may normalize data (e.g., removing redundant fields)
 * but should preserve the essential information.
 * 
 * @param arbitrary - fast-check arbitrary for generating test data
 * @param serialize - Function to serialize data
 * @param parse - Function to parse serialized data
 * @param validate - Function to validate that essential data is preserved
 * @param options - fast-check options (default: 100 runs)
 */
export function testLossyRoundTrip<T, S>(
    arbitrary: fc.Arbitrary<T>,
    serialize: (data: T) => S,
    parse: (serialized: S) => T,
    validate: (original: T, roundTripped: T) => boolean,
    options: fc.Parameters<[T]> = { numRuns: 100 }
): void {
    fc.assert(
        fc.property(arbitrary, (original) => {
            const serialized = serialize(original);
            const roundTripped = parse(serialized);
            return validate(original, roundTripped);
        }),
        options
    );
}

// ============================================================================
// Coordinate Round-Trip Test Helpers
// ============================================================================

/**
 * Arbitrary for coordinates in lat/lng format
 */
export const latLngArbitrary = fc.record({
    lat: fc.double({ min: -90, max: 90, noNaN: true }),
    lng: fc.double({ min: -180, max: 180, noNaN: true }),
});

/**
 * Arbitrary for coordinates in latitude/longitude format
 */
export const latitudeLongitudeArbitrary = fc.record({
    latitude: fc.double({ min: -90, max: 90, noNaN: true }),
    longitude: fc.double({ min: -180, max: 180, noNaN: true }),
});

/**
 * Arbitrary for full Coordinates object (both formats)
 */
export const coordinatesArbitrary = fc
    .record({
        lat: fc.double({ min: -90, max: 90, noNaN: true }),
        lng: fc.double({ min: -180, max: 180, noNaN: true }),
    })
    .map((coords) => ({
        latitude: coords.lat,
        longitude: coords.lng,
        lat: coords.lat,
        lng: coords.lng,
    })) as fc.Arbitrary<Coordinates>;

/**
 * Compare two coordinate values with tolerance for floating-point precision
 * 
 * @param a - First coordinate value
 * @param b - Second coordinate value
 * @param epsilon - Tolerance (default: 1e-10)
 * @returns True if values are approximately equal
 */
export function coordsApproxEqual(
    a: number,
    b: number,
    epsilon: number = 1e-10
): boolean {
    return Math.abs(a - b) < epsilon;
}

/**
 * Compare two coordinate objects for approximate equality
 * 
 * @param a - First coordinates
 * @param b - Second coordinates
 * @param epsilon - Tolerance (default: 1e-10)
 * @returns True if coordinates are approximately equal
 */
export function coordinatesEqual(
    a: { lat: number; lng: number },
    b: { lat: number; lng: number },
    epsilon: number = 1e-10
): boolean {
    return (
        coordsApproxEqual(a.lat, b.lat, epsilon) &&
        coordsApproxEqual(a.lng, b.lng, epsilon)
    );
}

// ============================================================================
// Date Round-Trip Test Helpers
// ============================================================================

/**
 * Arbitrary for ISO date strings
 * Generates dates between 2000-01-01 and 2050-12-31
 */
export const isoDateArbitrary = fc
    .integer({
        min: new Date('2000-01-01').getTime(),
        max: new Date('2050-12-31').getTime(),
    })
    .map((timestamp) => new Date(timestamp).toISOString());

/**
 * Arbitrary for Date objects
 * Generates dates between 2000-01-01 and 2050-12-31
 */
export const dateArbitrary = fc
    .integer({
        min: new Date('2000-01-01').getTime(),
        max: new Date('2050-12-31').getTime(),
    })
    .map((timestamp) => new Date(timestamp));

/**
 * Compare two dates for equality
 * 
 * @param a - First date
 * @param b - Second date
 * @returns True if dates represent the same instant
 */
export function datesEqual(a: Date, b: Date): boolean {
    return a.getTime() === b.getTime();
}

/**
 * Compare two ISO date strings for equality
 * 
 * @param a - First ISO date string
 * @param b - Second ISO date string
 * @returns True if dates represent the same instant
 */
export function isoStringsEqual(a: string, b: string): boolean {
    return parseISODate(a).getTime() === parseISODate(b).getTime();
}

// ============================================================================
// Pre-configured Round-Trip Tests
// ============================================================================

/**
 * Test coordinates round-trip: lat/lng → latitude/longitude → lat/lng
 */
export function testCoordinatesRoundTrip(
    options: fc.Parameters<[{ lat: number; lng: number }]> = { numRuns: 100 }
): void {
    testRoundTrip(
        latLngArbitrary,
        coordsToLatLong,
        latLongToCoords,
        coordinatesEqual,
        options
    );
}

/**
 * Test date round-trip: ISO string → Date → ISO string
 */
export function testDateRoundTrip(
    options: fc.Parameters<[string]> = { numRuns: 100 }
): void {
    testRoundTrip(
        isoDateArbitrary,
        parseISODate,
        serializeDate,
        isoStringsEqual,
        options
    );
}

/**
 * Test that normalizeCoordinates preserves coordinate values
 */
export function testNormalizeCoordinatesPreservesValues(
    options: fc.Parameters<[Partial<Coordinates>]> = { numRuns: 100 }
): void {
    fc.assert(
        fc.property(
            fc.oneof(
                // Test with lat/lng only
                latLngArbitrary,
                // Test with latitude/longitude only
                latitudeLongitudeArbitrary,
                // Test with both formats
                coordinatesArbitrary
            ),
            (coords) => {
                const normalized = normalizeCoordinates(coords);
                const originalLat = coords.lat ?? coords.latitude;
                const originalLng = coords.lng ?? coords.longitude;

                return (
                    coordsApproxEqual(normalized.lat, originalLat!) &&
                    coordsApproxEqual(normalized.lng, originalLng!) &&
                    coordsApproxEqual(normalized.latitude, originalLat!) &&
                    coordsApproxEqual(normalized.longitude, originalLng!)
                );
            }
        ),
        options
    );
}
