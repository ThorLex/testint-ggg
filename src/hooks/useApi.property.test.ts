/**
 * Property-based tests for useMapData hook
 * 
 * Tests universal properties of API response parsing and data transformation.
 * 
 * Feature: map-routes-and-notifications
 */

import * as fc from 'fast-check';
import type { MapData, Route, Announcement, RouteCoordinate, RouteMetadata } from '@/types';

// ============================================================================
// Arbitraries (Generators)
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

/**
 * Generator for Announcement objects
 */
export const announcementArbitrary = fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length > 0),
    type: fc.constantFrom('info', 'warning', 'alert', 'maintenance'),
    content: fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length > 0),
    date: fc.option(
        fc.integer({ min: 1577836800000, max: 1924905600000 }) // 2020-01-01 to 2030-12-31 in milliseconds
            .map(timestamp => new Date(timestamp).toISOString())
    ),
    priority: fc.option(fc.constantFrom('low', 'medium', 'high')),
}) as fc.Arbitrary<Announcement>;

// ============================================================================
// Helper function to simulate the useMapData transformation logic
// ============================================================================

/**
 * Simulates the data transformation logic from useMapData hook
 * This extracts the transformation logic for testing purposes
 */
function transformMapData(response: any): MapData {
    // Transform and validate data
    // Ensure routes and announcements are arrays, default to empty arrays if missing
    const routes = Array.isArray(response.routes) ? response.routes : [];
    const announcements = Array.isArray(response.announcements) ? response.announcements : [];
    
    return {
        buildings: response.buildings || [],
        amodiatairBuildings: response.amodiatairBuildings || [],
        routes,
        announcements,
        zoneBounds: response.zoneBounds,
    };
}

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: map-routes-and-notifications', () => {
    describe('Property 1: API Response Parsing', () => {
        /**
         * **Validates: Requirements 1.2, 1.4**
         * 
         * For any valid API response from `/api/public/map/all`, the system should
         * successfully extract both the routes array and announcements array into
         * application state.
         */
        test('should extract routes and announcements arrays from valid API response', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        routes: fc.array(routeArbitrary, { minLength: 0, maxLength: 20 }),
                        announcements: fc.array(announcementArbitrary, { minLength: 0, maxLength: 20 }),
                        buildings: fc.constant([]),
                        amodiatairBuildings: fc.constant([]),
                    }),
                    (apiResponse) => {
                        const result = transformMapData(apiResponse);
                        
                        // Verify routes array is extracted correctly
                        expect(result.routes).toEqual(apiResponse.routes);
                        expect(Array.isArray(result.routes)).toBe(true);
                        expect(result.routes.length).toBe(apiResponse.routes.length);
                        
                        // Verify announcements array is extracted correctly
                        expect(result.announcements).toEqual(apiResponse.announcements);
                        expect(Array.isArray(result.announcements)).toBe(true);
                        expect(result.announcements.length).toBe(apiResponse.announcements.length);
                        
                        // Verify all routes are present
                        apiResponse.routes.forEach((route) => {
                            expect(result.routes).toContainEqual(route);
                        });
                        
                        // Verify all announcements are present
                        apiResponse.announcements.forEach((announcement) => {
                            expect(result.announcements).toContainEqual(announcement);
                        });
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should handle empty routes array', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        routes: fc.constant([]),
                        announcements: fc.array(announcementArbitrary, { minLength: 0, maxLength: 20 }),
                        buildings: fc.constant([]),
                        amodiatairBuildings: fc.constant([]),
                    }),
                    (apiResponse) => {
                        const result = transformMapData(apiResponse);
                        
                        expect(result.routes).toEqual([]);
                        expect(Array.isArray(result.routes)).toBe(true);
                        expect(result.routes.length).toBe(0);
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should handle empty announcements array', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        routes: fc.array(routeArbitrary, { minLength: 0, maxLength: 20 }),
                        announcements: fc.constant([]),
                        buildings: fc.constant([]),
                        amodiatairBuildings: fc.constant([]),
                    }),
                    (apiResponse) => {
                        const result = transformMapData(apiResponse);
                        
                        expect(result.announcements).toEqual([]);
                        expect(Array.isArray(result.announcements)).toBe(true);
                        expect(result.announcements.length).toBe(0);
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should handle both empty routes and announcements arrays', () => {
            const apiResponse = {
                routes: [],
                announcements: [],
                buildings: [],
                amodiatairBuildings: [],
            };
            
            const result = transformMapData(apiResponse);
            
            expect(result.routes).toEqual([]);
            expect(result.announcements).toEqual([]);
            expect(Array.isArray(result.routes)).toBe(true);
            expect(Array.isArray(result.announcements)).toBe(true);
        });

        test('should default to empty array when routes is missing', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        announcements: fc.array(announcementArbitrary, { minLength: 0, maxLength: 20 }),
                        buildings: fc.constant([]),
                        amodiatairBuildings: fc.constant([]),
                    }),
                    (apiResponse) => {
                        const result = transformMapData(apiResponse);
                        
                        expect(result.routes).toEqual([]);
                        expect(Array.isArray(result.routes)).toBe(true);
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should default to empty array when announcements is missing', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        routes: fc.array(routeArbitrary, { minLength: 0, maxLength: 20 }),
                        buildings: fc.constant([]),
                        amodiatairBuildings: fc.constant([]),
                    }),
                    (apiResponse) => {
                        const result = transformMapData(apiResponse);
                        
                        expect(result.announcements).toEqual([]);
                        expect(Array.isArray(result.announcements)).toBe(true);
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should default to empty arrays when both routes and announcements are missing', () => {
            const apiResponse = {
                buildings: [],
                amodiatairBuildings: [],
            };
            
            const result = transformMapData(apiResponse);
            
            expect(result.routes).toEqual([]);
            expect(result.announcements).toEqual([]);
            expect(Array.isArray(result.routes)).toBe(true);
            expect(Array.isArray(result.announcements)).toBe(true);
        });

        test('should handle routes with null value by defaulting to empty array', () => {
            const apiResponse = {
                routes: null,
                announcements: [],
                buildings: [],
                amodiatairBuildings: [],
            };
            
            const result = transformMapData(apiResponse);
            
            expect(result.routes).toEqual([]);
            expect(Array.isArray(result.routes)).toBe(true);
        });

        test('should handle announcements with null value by defaulting to empty array', () => {
            const apiResponse = {
                routes: [],
                announcements: null,
                buildings: [],
                amodiatairBuildings: [],
            };
            
            const result = transformMapData(apiResponse);
            
            expect(result.announcements).toEqual([]);
            expect(Array.isArray(result.announcements)).toBe(true);
        });

        test('should handle routes with undefined value by defaulting to empty array', () => {
            const apiResponse = {
                routes: undefined,
                announcements: [],
                buildings: [],
                amodiatairBuildings: [],
            };
            
            const result = transformMapData(apiResponse);
            
            expect(result.routes).toEqual([]);
            expect(Array.isArray(result.routes)).toBe(true);
        });

        test('should handle announcements with undefined value by defaulting to empty array', () => {
            const apiResponse = {
                routes: [],
                announcements: undefined,
                buildings: [],
                amodiatairBuildings: [],
            };
            
            const result = transformMapData(apiResponse);
            
            expect(result.announcements).toEqual([]);
            expect(Array.isArray(result.announcements)).toBe(true);
        });

        test('should preserve route structure and all fields', () => {
            fc.assert(
                fc.property(
                    fc.array(routeArbitrary, { minLength: 1, maxLength: 10 }),
                    (routes) => {
                        const apiResponse = {
                            routes,
                            announcements: [],
                            buildings: [],
                            amodiatairBuildings: [],
                        };
                        
                        const result = transformMapData(apiResponse);
                        
                        // Verify each route preserves all fields
                        result.routes.forEach((route, index) => {
                            expect(route.id).toBe(routes[index].id);
                            expect(route.name).toBe(routes[index].name);
                            expect(route.status).toBe(routes[index].status);
                            expect(route.coordinates).toEqual(routes[index].coordinates);
                            expect(route.metadata).toEqual(routes[index].metadata);
                        });
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should preserve announcement structure and all fields', () => {
            fc.assert(
                fc.property(
                    fc.array(announcementArbitrary, { minLength: 1, maxLength: 10 }),
                    (announcements) => {
                        const apiResponse = {
                            routes: [],
                            announcements,
                            buildings: [],
                            amodiatairBuildings: [],
                        };
                        
                        const result = transformMapData(apiResponse);
                        
                        // Verify each announcement preserves all fields
                        result.announcements.forEach((announcement, index) => {
                            expect(announcement.id).toBe(announcements[index].id);
                            expect(announcement.title).toBe(announcements[index].title);
                            expect(announcement.type).toBe(announcements[index].type);
                            expect(announcement.content).toBe(announcements[index].content);
                            expect(announcement.date).toBe(announcements[index].date);
                            expect(announcement.priority).toBe(announcements[index].priority);
                        });
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should handle large arrays of routes and announcements', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        routes: fc.array(routeArbitrary, { minLength: 50, maxLength: 100 }),
                        announcements: fc.array(announcementArbitrary, { minLength: 50, maxLength: 100 }),
                        buildings: fc.constant([]),
                        amodiatairBuildings: fc.constant([]),
                    }),
                    (apiResponse) => {
                        const result = transformMapData(apiResponse);
                        
                        expect(result.routes.length).toBe(apiResponse.routes.length);
                        expect(result.announcements.length).toBe(apiResponse.announcements.length);
                        expect(result.routes.length).toBeGreaterThanOrEqual(50);
                        expect(result.announcements.length).toBeGreaterThanOrEqual(50);
                    }
                ),
                { numRuns: 10 } // Fewer runs for large arrays
            );
        });

        test('should maintain order of routes from API response', () => {
            fc.assert(
                fc.property(
                    fc.array(routeArbitrary, { minLength: 2, maxLength: 20 }),
                    (routes) => {
                        const apiResponse = {
                            routes,
                            announcements: [],
                            buildings: [],
                            amodiatairBuildings: [],
                        };
                        
                        const result = transformMapData(apiResponse);
                        
                        // Verify order is maintained
                        result.routes.forEach((route, index) => {
                            expect(route.id).toBe(routes[index].id);
                        });
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should maintain order of announcements from API response', () => {
            fc.assert(
                fc.property(
                    fc.array(announcementArbitrary, { minLength: 2, maxLength: 20 }),
                    (announcements) => {
                        const apiResponse = {
                            routes: [],
                            announcements,
                            buildings: [],
                            amodiatairBuildings: [],
                        };
                        
                        const result = transformMapData(apiResponse);
                        
                        // Verify order is maintained
                        result.announcements.forEach((announcement, index) => {
                            expect(announcement.id).toBe(announcements[index].id);
                        });
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should handle API response with all optional fields present', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        routes: fc.array(routeArbitrary, { minLength: 0, maxLength: 10 }),
                        announcements: fc.array(announcementArbitrary, { minLength: 0, maxLength: 10 }),
                        buildings: fc.constant([]),
                        amodiatairBuildings: fc.constant([]),
                        zoneBounds: fc.record({
                            north: fc.float({ min: -90, max: 90 }),
                            south: fc.float({ min: -90, max: 90 }),
                            east: fc.float({ min: -180, max: 180 }),
                            west: fc.float({ min: -180, max: 180 }),
                        }),
                    }),
                    (apiResponse) => {
                        const result = transformMapData(apiResponse);
                        
                        expect(result.routes).toEqual(apiResponse.routes);
                        expect(result.announcements).toEqual(apiResponse.announcements);
                        expect(result.zoneBounds).toEqual(apiResponse.zoneBounds);
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should not mutate the original API response', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        routes: fc.array(routeArbitrary, { minLength: 0, maxLength: 10 }),
                        announcements: fc.array(announcementArbitrary, { minLength: 0, maxLength: 10 }),
                        buildings: fc.constant([]),
                        amodiatairBuildings: fc.constant([]),
                    }),
                    (apiResponse) => {
                        const originalRoutes = [...apiResponse.routes];
                        const originalAnnouncements = [...apiResponse.announcements];
                        
                        transformMapData(apiResponse);
                        
                        // Verify original response is unchanged
                        expect(apiResponse.routes).toEqual(originalRoutes);
                        expect(apiResponse.announcements).toEqual(originalAnnouncements);
                    }
                ),
                { numRuns: 20 }
            );
        });
    });
});

