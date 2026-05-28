/**
 * Property-based tests for route utility functions
 * 
 * Tests universal properties of route coordinate processing and validation.
 * 
 * Feature: map-routes-and-notifications
 */

import * as fc from 'fast-check';
import { sortRouteCoordinates, isValidCoordinate, searchRoutes } from './routeUtils';
import type { RouteCoordinate, Route, RouteMetadata } from '@/types';

// ============================================================================
// Arbitraries (Generators) - Reused from api.property.test.ts
// ============================================================================

/**
 * Generator for RouteCoordinate objects
 */
export const routeCoordinateArbitrary = fc.record({
    lat: fc.float({ min: -90, max: 90, noNaN: true }),
    lng: fc.float({ min: -180, max: 180, noNaN: true }),
    order: fc.integer({ min: 0, max: 1000 }),
});

/**
 * Generator for RouteMetadata objects
 */
export const routeMetadataArbitrary = fc.record({
    roadType: fc.constantFrom('highway', 'street', 'boulevard', 'avenue', 'road'),
    maxSpeed: fc.integer({ min: 10, max: 130 }),
    width: fc.float({ min: 2, max: 20, noNaN: true }),
    surface: fc.constantFrom('asphalt', 'concrete', 'gravel', 'dirt'),
}) as fc.Arbitrary<RouteMetadata>;

/**
 * Generator for Route objects
 */
export const routeArbitrary = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0),
    coordinates: fc.array(routeCoordinateArbitrary, { minLength: 2, maxLength: 20 }),
    status: fc.constantFrom('active', 'inactive', 'maintenance'),
    metadata: routeMetadataArbitrary,
}) as fc.Arbitrary<Route>;

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: map-routes-and-notifications', () => {
    describe('Property 3: Coordinate Ordering', () => {
        /**
         * **Validates: Requirements 2.2, 8.1**
         * 
         * For any route with coordinates, the coordinate points should be sorted
         * by their order field in ascending order before rendering.
         */
        test('should sort coordinates by order field in ascending order', () => {
            fc.assert(
                fc.property(
                    fc.array(routeCoordinateArbitrary, { minLength: 2, maxLength: 20 }),
                    (coordinates) => {
                        const sorted = sortRouteCoordinates(coordinates);

                        // Verify the result is sorted by order field
                        for (let i = 0; i < sorted.length - 1; i++) {
                            const currentOrder = sorted[i].order ?? i;
                            const nextOrder = sorted[i + 1].order ?? i + 1;
                            expect(currentOrder).toBeLessThanOrEqual(nextOrder);
                        }

                        // Verify all original coordinates are present
                        expect(sorted.length).toBe(coordinates.length);

                        // Verify no coordinates were lost or added
                        coordinates.forEach((coord) => {
                            expect(sorted).toContainEqual(coord);
                        });
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should maintain original array order for duplicate order values', () => {
            fc.assert(
                fc.property(
                    fc.array(routeCoordinateArbitrary, { minLength: 2, maxLength: 10 }),
                    fc.integer({ min: 0, max: 100 }),
                    (coordinates, duplicateOrder) => {
                        // Create coordinates with duplicate order values
                        const coordsWithDuplicates = coordinates.map((coord, idx) => ({
                            ...coord,
                            order: idx < 2 ? duplicateOrder : coord.order,
                        }));

                        const sorted = sortRouteCoordinates(coordsWithDuplicates);

                        // Find coordinates with the duplicate order
                        const duplicates = coordsWithDuplicates.filter(c => c.order === duplicateOrder);
                        const sortedDuplicates = sorted.filter(c => c.order === duplicateOrder);

                        // Verify duplicates maintain their relative order
                        if (duplicates.length > 1) {
                            for (let i = 0; i < duplicates.length; i++) {
                                expect(sortedDuplicates[i]).toEqual(duplicates[i]);
                            }
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should not modify the original array', () => {
            fc.assert(
                fc.property(
                    fc.array(routeCoordinateArbitrary, { minLength: 2, maxLength: 20 }),
                    (coordinates) => {
                        const original = [...coordinates];
                        sortRouteCoordinates(coordinates);

                        // Verify original array is unchanged
                        expect(coordinates).toEqual(original);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should handle coordinates with sequential order values', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 2, max: 20 }),
                    (count) => {
                        // Create coordinates with sequential order values
                        const coordinates: RouteCoordinate[] = Array.from({ length: count }, (_, i) => ({
                            lat: (i - count / 2) * 10,
                            lng: (i - count / 2) * 10,
                            order: i,
                        }));

                        const sorted = sortRouteCoordinates(coordinates);

                        // Verify they remain in the same order
                        expect(sorted).toEqual(coordinates);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should handle coordinates with reverse order values', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 2, max: 20 }),
                    (count) => {
                        // Create coordinates with reverse order values
                        const coordinates: RouteCoordinate[] = Array.from({ length: count }, (_, i) => ({
                            lat: (i - count / 2) * 10,
                            lng: (i - count / 2) * 10,
                            order: count - i - 1,
                        }));

                        const sorted = sortRouteCoordinates(coordinates);

                        // Verify they are reversed
                        for (let i = 0; i < sorted.length; i++) {
                            expect(sorted[i].order).toBe(i);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should handle coordinates with random order values', () => {
            fc.assert(
                fc.property(
                    fc.array(routeCoordinateArbitrary, { minLength: 2, maxLength: 20 }),
                    (coordinates) => {
                        const sorted = sortRouteCoordinates(coordinates);

                        // Verify result is sorted
                        for (let i = 0; i < sorted.length - 1; i++) {
                            expect(sorted[i].order).toBeLessThanOrEqual(sorted[i + 1].order);
                        }

                        // Verify all coordinates are present
                        expect(sorted.length).toBe(coordinates.length);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should handle single coordinate', () => {
            fc.assert(
                fc.property(routeCoordinateArbitrary, (coordinate) => {
                    const sorted = sortRouteCoordinates([coordinate]);

                    // Single coordinate should remain unchanged
                    expect(sorted).toEqual([coordinate]);
                }),
                { numRuns: 100 }
            );
        });

        test('should handle two coordinates', () => {
            fc.assert(
                fc.property(
                    routeCoordinateArbitrary,
                    routeCoordinateArbitrary,
                    (coord1, coord2) => {
                        const sorted = sortRouteCoordinates([coord1, coord2]);

                        // Verify both coordinates are present
                        expect(sorted.length).toBe(2);

                        // Verify they are sorted
                        expect(sorted[0].order).toBeLessThanOrEqual(sorted[1].order);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('Property 6: Coordinate Validation', () => {
        /**
         * **Validates: Requirements 3.6**
         * 
         * For any coordinate point, if it has valid latitude (between -90 and 90)
         * and longitude (between -180 and 180), it should pass validation;
         * otherwise it should be filtered out.
         */
        test('should validate coordinates with valid lat/lng ranges', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        lat: fc.float({ min: -90, max: 90, noNaN: true }),
                        lng: fc.float({ min: -180, max: 180, noNaN: true }),
                        order: fc.integer(),
                    }),
                    (validCoord) => {
                        expect(isValidCoordinate(validCoord)).toBe(true);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should reject coordinates with invalid latitude (> 90)', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        lat: fc.float({ min: Math.fround(90.00001), max: 200, noNaN: true }),
                        lng: fc.float({ min: -180, max: 180, noNaN: true }),
                        order: fc.integer(),
                    }),
                    (invalidCoord) => {
                        expect(isValidCoordinate(invalidCoord)).toBe(false);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should reject coordinates with invalid latitude (< -90)', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        lat: fc.float({ min: -200, max: Math.fround(-90.00001), noNaN: true }),
                        lng: fc.float({ min: -180, max: 180, noNaN: true }),
                        order: fc.integer(),
                    }),
                    (invalidCoord) => {
                        expect(isValidCoordinate(invalidCoord)).toBe(false);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should reject coordinates with invalid longitude (> 180)', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        lat: fc.float({ min: -90, max: 90, noNaN: true }),
                        lng: fc.float({ min: Math.fround(180.00001), max: 360, noNaN: true }),
                        order: fc.integer(),
                    }),
                    (invalidCoord) => {
                        expect(isValidCoordinate(invalidCoord)).toBe(false);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should reject coordinates with invalid longitude (< -180)', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        lat: fc.float({ min: -90, max: 90, noNaN: true }),
                        lng: fc.float({ min: -360, max: Math.fround(-180.00001), noNaN: true }),
                        order: fc.integer(),
                    }),
                    (invalidCoord) => {
                        expect(isValidCoordinate(invalidCoord)).toBe(false);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should reject coordinates with NaN latitude', () => {
            const invalidCoord: RouteCoordinate = {
                lat: NaN,
                lng: 0,
                order: 0,
            };
            expect(isValidCoordinate(invalidCoord)).toBe(false);
        });

        test('should reject coordinates with NaN longitude', () => {
            const invalidCoord: RouteCoordinate = {
                lat: 0,
                lng: NaN,
                order: 0,
            };
            expect(isValidCoordinate(invalidCoord)).toBe(false);
        });

        test('should accept coordinates at boundary values', () => {
            // Test exact boundary values
            const boundaries = [
                { lat: -90, lng: -180, order: 0 },
                { lat: -90, lng: 180, order: 1 },
                { lat: 90, lng: -180, order: 2 },
                { lat: 90, lng: 180, order: 3 },
                { lat: 0, lng: 0, order: 4 },
            ];

            boundaries.forEach((coord) => {
                expect(isValidCoordinate(coord)).toBe(true);
            });
        });

        test('should reject coordinates just outside boundary values', () => {
            // Test values just outside boundaries
            const outsideBoundaries = [
                { lat: -90.00001, lng: 0, order: 0 },
                { lat: 90.00001, lng: 0, order: 1 },
                { lat: 0, lng: -180.00001, order: 2 },
                { lat: 0, lng: 180.00001, order: 3 },
            ];

            outsideBoundaries.forEach((coord) => {
                expect(isValidCoordinate(coord)).toBe(false);
            });
        });

        test('should validate that lat and lng are numbers', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        lat: fc.float({ min: -90, max: 90, noNaN: true }),
                        lng: fc.float({ min: -180, max: 180, noNaN: true }),
                        order: fc.integer(),
                    }),
                    (coord) => {
                        const result = isValidCoordinate(coord);
                        
                        // If validation passes, lat and lng must be numbers
                        if (result) {
                            expect(typeof coord.lat).toBe('number');
                            expect(typeof coord.lng).toBe('number');
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('Property 10: Route Search Filtering', () => {
        /**
         * **Validates: Requirements 5.1, 5.2**
         * 
         * For any search query and routes list, the filtered results should only
         * include routes whose name contains the query string (case-insensitive).
         */
        test('should filter routes by name containing query (case-insensitive)', () => {
            fc.assert(
                fc.property(
                    fc.array(routeArbitrary, { minLength: 1, maxLength: 20 }),
                    fc.string({ minLength: 1, maxLength: 10 }),
                    (routes, query) => {
                        const results = searchRoutes(routes, query);

                        // All results should contain the query in their name (case-insensitive)
                        results.forEach((route) => {
                            expect(route.name.toLowerCase()).toContain(query.toLowerCase().trim());
                        });

                        // All routes that contain the query should be in results
                        const expectedRoutes = routes.filter(route =>
                            route.name.toLowerCase().includes(query.toLowerCase().trim())
                        );
                        expect(results.length).toBe(expectedRoutes.length);

                        // Results should be a subset of original routes
                        results.forEach((route) => {
                            expect(routes).toContainEqual(route);
                        });
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should return all routes when query is empty', () => {
            fc.assert(
                fc.property(
                    fc.array(routeArbitrary, { minLength: 1, maxLength: 20 }),
                    (routes) => {
                        const emptyQueries = ['', '   ', '\t', '\n'];

                        emptyQueries.forEach((query) => {
                            const results = searchRoutes(routes, query);
                            expect(results).toEqual(routes);
                        });
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should perform case-insensitive matching', () => {
            fc.assert(
                fc.property(
                    fc.array(routeArbitrary, { minLength: 1, maxLength: 20 }),
                    fc.string({ minLength: 1, maxLength: 10 }),
                    (routes, query) => {
                        const lowerResults = searchRoutes(routes, query.toLowerCase());
                        const upperResults = searchRoutes(routes, query.toUpperCase());
                        const mixedResults = searchRoutes(routes, query);

                        // All three should return the same results
                        expect(lowerResults).toEqual(upperResults);
                        expect(lowerResults).toEqual(mixedResults);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should support partial matching (substring search)', () => {
            fc.assert(
                fc.property(
                    fc.array(routeArbitrary, { minLength: 1, maxLength: 20 }),
                    (routes) => {
                        // Pick a random route and extract a substring from its name
                        if (routes.length === 0) return;

                        const randomRoute = routes[Math.floor(Math.random() * routes.length)];
                        if (randomRoute.name.length < 2) return;

                        const startIdx = Math.floor(Math.random() * (randomRoute.name.length - 1));
                        const endIdx = startIdx + 1 + Math.floor(Math.random() * (randomRoute.name.length - startIdx - 1));
                        const substring = randomRoute.name.substring(startIdx, endIdx);

                        const results = searchRoutes(routes, substring);

                        // The route we extracted from should be in the results
                        expect(results).toContainEqual(randomRoute);

                        // All results should contain the substring
                        results.forEach((route) => {
                            expect(route.name.toLowerCase()).toContain(substring.toLowerCase());
                        });
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should trim whitespace from query', () => {
            fc.assert(
                fc.property(
                    fc.array(routeArbitrary, { minLength: 1, maxLength: 20 }),
                    fc.string({ minLength: 1, maxLength: 10 }),
                    (routes, query) => {
                        const trimmedResults = searchRoutes(routes, query);
                        const paddedResults = searchRoutes(routes, `  ${query}  `);
                        const tabPaddedResults = searchRoutes(routes, `\t${query}\t`);

                        // All should return the same results
                        expect(trimmedResults).toEqual(paddedResults);
                        expect(trimmedResults).toEqual(tabPaddedResults);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should return empty array when no routes match', () => {
            fc.assert(
                fc.property(
                    fc.array(routeArbitrary, { minLength: 1, maxLength: 20 }),
                    (routes) => {
                        // Use a query that is very unlikely to match any route name
                        const unmatchableQuery = '🚫🔍ZZZZZ_UNMATCHABLE_QUERY_12345🔍🚫';
                        const results = searchRoutes(routes, unmatchableQuery);

                        expect(results).toEqual([]);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should handle empty routes array', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 10 }),
                    (query) => {
                        const results = searchRoutes([], query);
                        expect(results).toEqual([]);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should not modify the original routes array', () => {
            fc.assert(
                fc.property(
                    fc.array(routeArbitrary, { minLength: 1, maxLength: 20 }),
                    fc.string({ minLength: 1, maxLength: 10 }),
                    (routes, query) => {
                        const original = [...routes];
                        searchRoutes(routes, query);

                        // Verify original array is unchanged
                        expect(routes).toEqual(original);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should match routes with query at start, middle, or end of name', () => {
            // Create specific test cases for different positions
            const testRoutes: Route[] = [
                {
                    id: '1',
                    name: 'Boulevard Maritime',
                    coordinates: [
                        { lat: 0, lng: 0, order: 0 },
                        { lat: 1, lng: 1, order: 1 },
                    ],
                    status: 'active',
                    metadata: {
                        roadType: 'boulevard',
                        maxSpeed: 50,
                        width: 10,
                        surface: 'asphalt',
                    },
                },
                {
                    id: '2',
                    name: 'Route Maritime Sud',
                    coordinates: [
                        { lat: 0, lng: 0, order: 0 },
                        { lat: 1, lng: 1, order: 1 },
                    ],
                    status: 'active',
                    metadata: {
                        roadType: 'route',
                        maxSpeed: 60,
                        width: 8,
                        surface: 'asphalt',
                    },
                },
                {
                    id: '3',
                    name: 'Avenue de la Maritime',
                    coordinates: [
                        { lat: 0, lng: 0, order: 0 },
                        { lat: 1, lng: 1, order: 1 },
                    ],
                    status: 'active',
                    metadata: {
                        roadType: 'avenue',
                        maxSpeed: 70,
                        width: 12,
                        surface: 'concrete',
                    },
                },
            ];

            // Query matches at start
            const startResults = searchRoutes(testRoutes, 'Boulevard');
            expect(startResults.length).toBe(1);
            expect(startResults[0].id).toBe('1');

            // Query matches in middle
            const middleResults = searchRoutes(testRoutes, 'Maritime');
            expect(middleResults.length).toBe(3);

            // Query matches at end
            const endResults = searchRoutes(testRoutes, 'Sud');
            expect(endResults.length).toBe(1);
            expect(endResults[0].id).toBe('2');
        });

        test('should handle special characters in route names', () => {
            const specialRoutes: Route[] = [
                {
                    id: '1',
                    name: 'Route N°5',
                    coordinates: [
                        { lat: 0, lng: 0, order: 0 },
                        { lat: 1, lng: 1, order: 1 },
                    ],
                    status: 'active',
                    metadata: {
                        roadType: 'route',
                        maxSpeed: 50,
                        width: 10,
                        surface: 'asphalt',
                    },
                },
                {
                    id: '2',
                    name: 'Avenue Jean-Paul',
                    coordinates: [
                        { lat: 0, lng: 0, order: 0 },
                        { lat: 1, lng: 1, order: 1 },
                    ],
                    status: 'active',
                    metadata: {
                        roadType: 'avenue',
                        maxSpeed: 60,
                        width: 8,
                        surface: 'asphalt',
                    },
                },
            ];

            const results1 = searchRoutes(specialRoutes, 'N°5');
            expect(results1.length).toBe(1);
            expect(results1[0].id).toBe('1');

            const results2 = searchRoutes(specialRoutes, 'Jean-Paul');
            expect(results2.length).toBe(1);
            expect(results2[0].id).toBe('2');
        });

        test('should handle accented characters in route names', () => {
            const accentedRoutes: Route[] = [
                {
                    id: '1',
                    name: 'Rue de la Liberté',
                    coordinates: [
                        { lat: 0, lng: 0, order: 0 },
                        { lat: 1, lng: 1, order: 1 },
                    ],
                    status: 'active',
                    metadata: {
                        roadType: 'street',
                        maxSpeed: 50,
                        width: 10,
                        surface: 'asphalt',
                    },
                },
                {
                    id: '2',
                    name: 'Avenue François',
                    coordinates: [
                        { lat: 0, lng: 0, order: 0 },
                        { lat: 1, lng: 1, order: 1 },
                    ],
                    status: 'active',
                    metadata: {
                        roadType: 'avenue',
                        maxSpeed: 60,
                        width: 8,
                        surface: 'asphalt',
                    },
                },
            ];

            const results1 = searchRoutes(accentedRoutes, 'Liberté');
            expect(results1.length).toBe(1);
            expect(results1[0].id).toBe('1');

            const results2 = searchRoutes(accentedRoutes, 'François');
            expect(results2.length).toBe(1);
            expect(results2[0].id).toBe('2');
        });
    });
});
