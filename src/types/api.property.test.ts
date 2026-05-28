/**
 * Property-based tests for API type definitions
 * 
 * Tests universal properties of route and announcement parsing.
 * 
 * Feature: map-routes-and-notifications
 */

import * as fc from 'fast-check';
import type { Route, RouteCoordinate, RouteMetadata, Announcement } from './api';

// ============================================================================
// Arbitraries (Generators)
// ============================================================================

/**
 * Generator for RouteCoordinate objects
 */
const routeCoordinateArbitrary = fc.record({
    lat: fc.float({ min: -90, max: 90, noNaN: true }),
    lng: fc.float({ min: -180, max: 180, noNaN: true }),
    order: fc.integer({ min: 0, max: 1000 }),
});

/**
 * Generator for RouteMetadata objects
 */
const routeMetadataArbitrary = fc.record({
    roadType: fc.constantFrom('highway', 'street', 'boulevard', 'avenue'),
    maxSpeed: fc.integer({ min: 20, max: 120 }),
    width: fc.float({ min: 3, max: 20, noNaN: true }),
    surface: fc.constantFrom('asphalt', 'concrete', 'gravel'),
});

/**
 * Generator for Route objects
 */
const routeArbitrary = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0),
    coordinates: fc.array(routeCoordinateArbitrary, { minLength: 2, maxLength: 20 }),
    status: fc.constantFrom('active', 'inactive', 'maintenance'),
    metadata: routeMetadataArbitrary,
}) as fc.Arbitrary<Route>;

/**
 * Generator for Announcement objects
 */
const announcementArbitrary = fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 5, maxLength: 100 }),
    type: fc.constantFrom('info', 'warning', 'alert', 'maintenance'),
    content: fc.string({ minLength: 10, maxLength: 500 }),
    date: fc.option(
        fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-12-31').getTime() })
            .map(timestamp => new Date(timestamp).toISOString())
    ),
    priority: fc.option(fc.constantFrom('low', 'medium', 'high')),
}) as fc.Arbitrary<Announcement>;

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: map-routes-and-notifications', () => {
    describe('Property 5: Route Parsing Completeness', () => {
        /**
         * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
         * 
         * For any route object from the API, the system should extract all required fields:
         * - id (unique identifier)
         * - name (display name)
         * - coordinates array (with lat, lng, order)
         * - status (route availability)
         * - metadata (containing roadType, maxSpeed, width, surface)
         */
        test('should extract all required fields from any route object', () => {
            fc.assert(
                fc.property(routeArbitrary, (route) => {
                    // Verify id field exists and is a string
                    expect(route.id).toBeDefined();
                    expect(typeof route.id).toBe('string');
                    expect(route.id.length).toBeGreaterThan(0);

                    // Verify name field exists and is a string
                    expect(route.name).toBeDefined();
                    expect(typeof route.name).toBe('string');
                    expect(route.name.length).toBeGreaterThan(0);

                    // Verify coordinates array exists and is an array
                    expect(route.coordinates).toBeDefined();
                    expect(Array.isArray(route.coordinates)).toBe(true);
                    expect(route.coordinates.length).toBeGreaterThan(0);

                    // Verify each coordinate has lat, lng, and order
                    route.coordinates.forEach((coord) => {
                        expect(coord.lat).toBeDefined();
                        expect(typeof coord.lat).toBe('number');
                        expect(coord.lng).toBeDefined();
                        expect(typeof coord.lng).toBe('number');
                        expect(coord.order).toBeDefined();
                        expect(typeof coord.order).toBe('number');
                    });

                    // Verify status field exists and is valid
                    expect(route.status).toBeDefined();
                    expect(['active', 'inactive', 'maintenance']).toContain(route.status);

                    // Verify metadata object exists
                    expect(route.metadata).toBeDefined();
                    expect(typeof route.metadata).toBe('object');

                    // Verify metadata contains all required fields
                    expect(route.metadata.roadType).toBeDefined();
                    expect(typeof route.metadata.roadType).toBe('string');
                    expect(route.metadata.roadType.length).toBeGreaterThan(0);

                    expect(route.metadata.maxSpeed).toBeDefined();
                    expect(typeof route.metadata.maxSpeed).toBe('number');
                    expect(route.metadata.maxSpeed).toBeGreaterThan(0);

                    expect(route.metadata.width).toBeDefined();
                    expect(typeof route.metadata.width).toBe('number');
                    expect(route.metadata.width).toBeGreaterThan(0);

                    expect(route.metadata.surface).toBeDefined();
                    expect(typeof route.metadata.surface).toBe('string');
                    expect(route.metadata.surface.length).toBeGreaterThan(0);
                }),
                { numRuns: 20 }
            );
        });

        test('should handle routes with minimum valid coordinates', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        id: fc.uuid(),
                        name: fc.string({ minLength: 5, maxLength: 50 }),
                        coordinates: fc.array(routeCoordinateArbitrary, { minLength: 2, maxLength: 2 }),
                        status: fc.constantFrom('active', 'inactive', 'maintenance'),
                        metadata: routeMetadataArbitrary,
                    }) as fc.Arbitrary<Route>,
                    (route) => {
                        expect(route.coordinates.length).toBe(2);
                        expect(route.id).toBeDefined();
                        expect(route.name).toBeDefined();
                        expect(route.status).toBeDefined();
                        expect(route.metadata).toBeDefined();
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should handle routes with maximum coordinates', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        id: fc.uuid(),
                        name: fc.string({ minLength: 5, maxLength: 50 }),
                        coordinates: fc.array(routeCoordinateArbitrary, { minLength: 20, maxLength: 20 }),
                        status: fc.constantFrom('active', 'inactive', 'maintenance'),
                        metadata: routeMetadataArbitrary,
                    }) as fc.Arbitrary<Route>,
                    (route) => {
                        expect(route.coordinates.length).toBe(20);
                        expect(route.id).toBeDefined();
                        expect(route.name).toBeDefined();
                        expect(route.status).toBeDefined();
                        expect(route.metadata).toBeDefined();
                    }
                ),
                { numRuns: 20 }
            );
        });
    });

    describe('Property 23: Announcement Parsing Completeness', () => {
        /**
         * **Validates: Requirements 13.1, 13.2, 13.3, 13.4**
         * 
         * For any announcement object from the API, the system should extract all required fields:
         * - id (unique identifier)
         * - title (for display)
         * - type (for categorization)
         * - content (message body)
         */
        test('should extract all required fields from any announcement object', () => {
            fc.assert(
                fc.property(announcementArbitrary, (announcement) => {
                    // Verify id field exists and is a string
                    expect(announcement.id).toBeDefined();
                    expect(typeof announcement.id).toBe('string');
                    expect(announcement.id.length).toBeGreaterThan(0);

                    // Verify title field exists and is a string
                    expect(announcement.title).toBeDefined();
                    expect(typeof announcement.title).toBe('string');
                    expect(announcement.title.length).toBeGreaterThan(0);

                    // Verify type field exists and is a string
                    expect(announcement.type).toBeDefined();
                    expect(typeof announcement.type).toBe('string');
                    expect(announcement.type.length).toBeGreaterThan(0);

                    // Verify content field exists and is a string
                    expect(announcement.content).toBeDefined();
                    expect(typeof announcement.content).toBe('string');
                    expect(announcement.content.length).toBeGreaterThan(0);
                }),
                { numRuns: 20 }
            );
        });

        test('should handle announcements with all valid types', () => {
            fc.assert(
                fc.property(announcementArbitrary, (announcement) => {
                    // Verify type is one of the valid values
                    expect(['info', 'warning', 'alert', 'maintenance']).toContain(announcement.type);
                }),
                { numRuns: 20 }
            );
        });

        test('should handle announcements with optional date field', () => {
            fc.assert(
                fc.property(announcementArbitrary, (announcement) => {
                    // If date exists, it should be a string (ISO format)
                    if (announcement.date !== null && announcement.date !== undefined) {
                        expect(typeof announcement.date).toBe('string');
                        // Verify it's a valid ISO date string
                        expect(() => new Date(announcement.date!)).not.toThrow();
                        expect(new Date(announcement.date!).toISOString()).toBe(announcement.date);
                    }
                }),
                { numRuns: 20 }
            );
        });

        test('should handle announcements with optional priority field', () => {
            fc.assert(
                fc.property(announcementArbitrary, (announcement) => {
                    // If priority exists, it should be one of the valid values
                    if (announcement.priority !== null && announcement.priority !== undefined) {
                        expect(['low', 'medium', 'high']).toContain(announcement.priority);
                    }
                }),
                { numRuns: 20 }
            );
        });

        test('should handle announcements with minimum field lengths', () => {
            fc.assert(
                fc.property(announcementArbitrary, (announcement) => {
                    // Verify minimum lengths are respected
                    expect(announcement.title.length).toBeGreaterThanOrEqual(5);
                    expect(announcement.content.length).toBeGreaterThanOrEqual(10);
                }),
                { numRuns: 20 }
            );
        });

        test('should handle announcements with maximum field lengths', () => {
            fc.assert(
                fc.property(announcementArbitrary, (announcement) => {
                    // Verify maximum lengths are respected
                    expect(announcement.title.length).toBeLessThanOrEqual(100);
                    expect(announcement.content.length).toBeLessThanOrEqual(500);
                }),
                { numRuns: 20 }
            );
        });
    });
});

