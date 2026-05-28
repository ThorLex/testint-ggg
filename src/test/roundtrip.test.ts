/**
 * Tests for round-trip transformation utilities
 * 
 * Verifies that data transformations are reversible and preserve information.
 * 
 * Feature: api-routes-complete-analysis
 * Validates: Requirements 15.1-15.5
 */

import * as fc from 'fast-check';
import {
    coordsToLatLong,
    latLongToCoords,
    normalizeCoordinates,
    parseISODate,
    serializeDate,
    roundTripDate,
    testRoundTrip,
    testLossyRoundTrip,
    latLngArbitrary,
    latitudeLongitudeArbitrary,
    coordinatesArbitrary,
    isoDateArbitrary,
    dateArbitrary,
    coordinatesEqual,
    datesEqual,
    isoStringsEqual,
    coordsApproxEqual,
    testCoordinatesRoundTrip,
    testDateRoundTrip,
    testNormalizeCoordinatesPreservesValues,
} from './roundtrip';

describe('Round-Trip Transformation Utilities', () => {
    // ========================================================================
    // Coordinate Transformation Tests
    // ========================================================================

    describe('Coordinate Transformations', () => {
        describe('coordsToLatLong', () => {
            test('should transform lat/lng to latitude/longitude', () => {
                const input = { lat: 48.8566, lng: 2.3522 };
                const result = coordsToLatLong(input);

                expect(result).toEqual({
                    latitude: 48.8566,
                    longitude: 2.3522,
                });
            });

            test('should handle negative coordinates', () => {
                const input = { lat: -33.8688, lng: 151.2093 };
                const result = coordsToLatLong(input);

                expect(result).toEqual({
                    latitude: -33.8688,
                    longitude: 151.2093,
                });
            });

            test('should handle boundary values', () => {
                const input = { lat: 90, lng: 180 };
                const result = coordsToLatLong(input);

                expect(result).toEqual({
                    latitude: 90,
                    longitude: 180,
                });
            });
        });

        describe('latLongToCoords', () => {
            test('should transform latitude/longitude to lat/lng', () => {
                const input = { latitude: 48.8566, longitude: 2.3522 };
                const result = latLongToCoords(input);

                expect(result).toEqual({
                    lat: 48.8566,
                    lng: 2.3522,
                });
            });

            test('should handle negative coordinates', () => {
                const input = { latitude: -33.8688, longitude: 151.2093 };
                const result = latLongToCoords(input);

                expect(result).toEqual({
                    lat: -33.8688,
                    lng: 151.2093,
                });
            });
        });

        describe('normalizeCoordinates', () => {
            test('should normalize lat/lng format', () => {
                const input = { lat: 48.8566, lng: 2.3522 };
                const result = normalizeCoordinates(input);

                expect(result).toEqual({
                    latitude: 48.8566,
                    longitude: 2.3522,
                    lat: 48.8566,
                    lng: 2.3522,
                });
            });

            test('should normalize latitude/longitude format', () => {
                const input = { latitude: 48.8566, longitude: 2.3522 };
                const result = normalizeCoordinates(input);

                expect(result).toEqual({
                    latitude: 48.8566,
                    longitude: 2.3522,
                    lat: 48.8566,
                    lng: 2.3522,
                });
            });

            test('should handle mixed format (prefer lat/lng)', () => {
                const input = {
                    lat: 48.8566,
                    lng: 2.3522,
                    latitude: 40.7128,
                    longitude: -74.006,
                };
                const result = normalizeCoordinates(input);

                // Should use lat/lng when both are present
                expect(result).toEqual({
                    latitude: 48.8566,
                    longitude: 2.3522,
                    lat: 48.8566,
                    lng: 2.3522,
                });
            });

            test('should throw error for invalid coordinates', () => {
                expect(() => normalizeCoordinates({})).toThrow(
                    'Invalid coordinates: missing lat/lng or latitude/longitude'
                );

                expect(() => normalizeCoordinates({ lat: 48.8566 })).toThrow(
                    'Invalid coordinates: missing lat/lng or latitude/longitude'
                );

                expect(() => normalizeCoordinates({ lng: 2.3522 })).toThrow(
                    'Invalid coordinates: missing lat/lng or latitude/longitude'
                );
            });
        });
    });

    // ========================================================================
    // Date Transformation Tests
    // ========================================================================

    describe('Date Transformations', () => {
        describe('parseISODate', () => {
            test('should parse valid ISO date string', () => {
                const isoString = '2024-01-15T10:30:00.000Z';
                const result = parseISODate(isoString);

                expect(result).toBeInstanceOf(Date);
                expect(result.toISOString()).toBe(isoString);
            });

            test('should parse distance correctly', () => {
                const isoString = '2024-01-15T10:30:00.000Z';
                const result = parseISODate(isoString);
                expect(result).toBeInstanceOf(Date);
                expect(result.getFullYear()).toBe(2024);
                expect(result.getMonth()).toBe(0); // January is 0
                expect(result.getDate()).toBe(15);
            });

            test('should handle invalid ISO strings', () => {
                expect(() => parseISODate('invalid-date')).toThrow();
                expect(() => parseISODate('')).toThrow();
            });
        });

        describe('serializeDate', () => {
            test('should serialize Date to ISO string', () => {
                const date = new Date('2024-01-15T10:30:00.000Z');
                const result = serializeDate(date);
                expect(result).toBe('2024-01-15T10:30:00.000Z');
            });
        });

        describe('roundTripDate', () => {
            test('should preserve date through round trip', () => {
                const originalDate = new Date('2024-01-15T10:30:00.000Z');
                const result = roundTripDate(originalDate);
                expect(result.getTime()).toBe(originalDate.getTime());
            });
        });
    });

    // ========================================================================
    // Property-Based Tests
    // ========================================================================

    describe('Property-Based Round-Trip Tests', () => {
        describe('Coordinate Round-Trip Properties', () => {
            test('coordinates round-trip preserves values', () => {
                fc.assert(
                    fc.property(latLngArbitrary, (coords) => {
                        return testCoordinatesRoundTrip(coords);
                    })
                );
            });

            test('normalization preserves coordinate values', () => {
                fc.assert(
                    fc.property(coordinatesArbitrary, (coords) => {
                        return testNormalizeCoordinatesPreservesValues(coords);
                    })
                );
            });
        });

        describe('Date Round-Trip Properties', () => {
            test('date round-trip preserves values', () => {
                fc.assert(
                    fc.property(dateArbitrary, (date) => {
                        return testDateRoundTrip(date);
                    })
                );
            });
        });
    });
});